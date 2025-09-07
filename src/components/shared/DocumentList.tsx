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
}

const DocumentList: React.FC<DocumentListProps> = ({
  entityId,
  entityType,
  serviceRequestId,
  showUploader = false,
  allowDelete = false,
  onDocumentDeleted
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

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
          expiresIn: 3600 // 1 hour
        }
      });

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = signedUrl.url.toString();
      link.download = document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
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

  const formatDocumentType = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h3>Documents ({documents.length})</h3>
      </div>
      
      <div className="document-items">
        {documents.map(document => (
          <div key={document.id} className="document-item">
            <div className="document-icon">
              {getFileIcon(document.fileName)}
            </div>
            
            <div className="document-info">
              <div className="document-name">{document.fileName}</div>
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
                {showUploader && (
                  <span className="document-uploader">
                    by {document.uploadedBy}
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
        ))}
      </div>
    </div>
  );
};

export default DocumentList;