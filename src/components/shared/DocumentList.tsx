import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import './DocumentList.css';

const client = generateClient<Schema>();

interface DocumentListProps {
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  serviceRequestId?: string;
  showUploader?: boolean;
  allowDelete?: boolean;
  onDocumentDeleted?: (documentId: string) => void;
  onRefresh?: () => void;
  groupByUser?: boolean; // New prop for grouping by user
}

const DocumentList: React.FC<DocumentListProps> = ({
  entityId,
  entityType,
  serviceRequestId,
  showUploader = false,
  allowDelete = false,
  onDocumentDeleted,
  onRefresh,
  groupByUser = false
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchDocuments();
  }, [entityId, entityType, serviceRequestId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let filter: any = {};
      
      if (serviceRequestId) {
        filter.serviceRequestId = { eq: serviceRequestId };
      } else if (entityId && entityType) {
        filter.and = [
          { entityId: { eq: entityId } },
          { entityType: { eq: entityType } }
        ];
      }

      const result = await client.models.Document.list({ filter });
      
      // Sort by upload date (newest first)
      const sortedDocs = result.data.sort((a, b) => 
        new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
      );
      
      setDocuments(sortedDocs);

      // Fetch user profiles for uploaders if showing uploader info or grouping by user
      if ((showUploader || groupByUser) && sortedDocs.length > 0) {
        const uniqueUploaders = [...new Set(sortedDocs.map(doc => doc.uploadedBy).filter(Boolean))];
        const profilePromises = uniqueUploaders.map(async (uploadedBy) => {
          try {
            const profiles = await client.models.UserProfile.list({
              filter: { userId: { eq: uploadedBy } }
            });
            const profile = profiles.data.length > 0 ? profiles.data[0] : null;
            return { userId: uploadedBy, profile };
          } catch (error) {
            console.error(`Error fetching profile for ${uploadedBy}:`, error);
            return { userId: uploadedBy, profile: null };
          }
        });

        const profileResults = await Promise.all(profilePromises);
        const profileMap = new Map();
        profileResults.forEach(({ userId, profile }) => {
          profileMap.set(userId, profile);
        });
        setUserProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: any) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(document.id));
      
      const signedUrl = await getUrl({
        key: document.fileKey,
        options: {
          expiresIn: 3600, // 1 hour
          validateObjectExistence: false // Don't validate object existence for download
        }
      });

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = signedUrl.url.toString();
      link.download = document.fileName;
      link.target = '_blank'; // Open in new tab if direct download fails
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Try opening the URL directly as fallback
      try {
        const fallbackUrl = await getUrl({
          key: document.fileKey,
          options: { expiresIn: 3600 }
        });
        window.open(fallbackUrl.url.toString(), '_blank');
      } catch (fallbackError) {
        alert('Failed to download document. Please try again.');
      }
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const deleteDocument = async (document: any) => {
    if (!window.confirm(`Are you sure you want to delete "${document.fileName}"?`)) {
      return;
    }

    try {
      await client.models.Document.delete({ id: document.id });
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      if (onDocumentDeleted) {
        onDocumentDeleted(document.id);
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'xlsx':
      case 'xls': return '📊';
      default: return '📎';
    }
  };

  const formatDocumentType = (type: string | null | undefined): string => {
    if (!type) return 'Unknown';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatUploaderInfo = (uploadedBy: string): string => {
    const profile = userProfiles.get(uploadedBy);
    if (!profile) return uploadedBy;

    const parts = [];
    if (profile.displayName) parts.push(profile.displayName);
    if (profile.email) parts.push(profile.email);
    if (profile.din) parts.push(`DIN: ${profile.din}`);
    
    return parts.length > 0 ? parts.join(' • ') : uploadedBy;
  };

  const groupDocumentsByUser = () => {
    const grouped = new Map<string, any[]>();
    
    documents.forEach(doc => {
      const uploadedBy = doc.uploadedBy;
      if (!grouped.has(uploadedBy)) {
        grouped.set(uploadedBy, []);
      }
      grouped.get(uploadedBy)?.push(doc);
    });

    return Array.from(grouped.entries()).map(([userId, userDocs]) => ({
      userId,
      profile: userProfiles.get(userId),
      documents: userDocs
    }));
  };

  if (loading) {
    return <div className="document-list-loading">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="document-list-empty">
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  const renderDocumentItem = (document: any, showUploaderInMeta = true) => (
    <div key={document.id} className="document-item">
      <div className="document-icon">
        {getFileIcon(document.fileName)}
      </div>
      
      <div className="document-info">
        <div className="document-name">{document.documentName || document.fileName}</div>
        {document.documentName && document.documentName !== document.fileName && (
          <div className="original-filename">File: {document.fileName}</div>
        )}
        <div className="document-meta">
          <span className="document-type">
            {formatDocumentType(document.documentType)}
          </span>
          <span className="document-size">
            {formatFileSize(document.fileSize || 0)}
          </span>
          <span className="document-date">
            {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown date'}
          </span>
          {showUploader && showUploaderInMeta && (
            <span className="document-uploader">
              by {formatUploaderInfo(document.uploadedBy)}
            </span>
          )}
        </div>
      </div>
      
      <div className="document-actions">
        <button
          className="action-button download-button"
          onClick={() => downloadDocument(document)}
          disabled={downloadingIds.has(document.id)}
        >
          {downloadingIds.has(document.id) ? '⏳' : '⬇️'} Download
        </button>
        
        {allowDelete && (
          <button
            className="action-button delete-button"
            onClick={() => deleteDocument(document)}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );

  if (groupByUser) {
    const groupedData = groupDocumentsByUser();
    
    return (
      <div className="document-list">
        <div className="document-list-header">
          <h3>Documents ({documents.length})</h3>
        </div>
        
        {groupedData.map(({ userId, documents: userDocs }) => (
          <div key={userId} className="user-document-group">
            <div className="user-group-header">
              <h4>{formatUploaderInfo(userId)}</h4>
              <span className="document-count">({userDocs.length} documents)</span>
            </div>
            <div className="document-items">
              {userDocs.map(document => renderDocumentItem(document, false))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h3>Documents ({documents.length})</h3>
      </div>
      
      <div className="document-items">
        {documents.map(document => renderDocumentItem(document))}
      </div>
    </div>
  );
};

export default DocumentList;