import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import './PANDisplay.css';

interface PANDisplayProps {
  panDocumentUrl?: string;
  width?: string;
  height?: string;
  showBorder?: boolean;
  showStatus?: boolean;
}

const PANDisplay: React.FC<PANDisplayProps> = ({
  panDocumentUrl,
  width = '200px',
  height = '120px',
  showBorder = true,
  showStatus = true
}) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);

  useEffect(() => {
    if (panDocumentUrl) {
      fetchDocumentUrl();
    } else {
      setDocumentUrl(null);
      setError(null);
      setFileType(null);
    }
  }, [panDocumentUrl]);

  const fetchDocumentUrl = async () => {
    if (!panDocumentUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching PAN document URL for key:', panDocumentUrl);
      const result = await getUrl({
        key: panDocumentUrl,
        options: {
          expiresIn: 3600 // 1 hour
        }
      });
      
      setDocumentUrl(result.url.toString());
      
      // Determine file type from the key
      const extension = panDocumentUrl.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        setFileType('pdf');
      } else if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
        setFileType('image');
      }
      
      console.log('PAN document URL fetched successfully');
    } catch (err) {
      console.error('Error fetching PAN document URL:', err);
      setError('Failed to load PAN document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `pan-document.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="pan-loading">
          <div className="pan-spinner"></div>
          <span>Loading PAN document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pan-error">
          <span>⚠️ {error}</span>
        </div>
      );
    }

    if (!panDocumentUrl) {
      return (
        <div className="pan-placeholder">
          <div className="pan-placeholder-icon">📄</div>
          <span>No PAN document uploaded</span>
          {showStatus && <div className="pan-status pending">Upload Required</div>}
        </div>
      );
    }

    if (documentUrl) {
      return (
        <div className="pan-document-preview">
          {fileType === 'pdf' ? (
            <div className="pan-pdf-preview">
              <div className="pan-pdf-icon">📄</div>
              <span>PAN Document (PDF)</span>
              <button className="pan-download-btn" onClick={handleDownload}>
                📥 Download
              </button>
            </div>
          ) : (
            <div className="pan-image-preview">
              <img 
                src={documentUrl} 
                alt="PAN Document" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setError('Failed to load image')}
              />
              <button className="pan-download-btn" onClick={handleDownload}>
                📥 Download
              </button>
            </div>
          )}
          {showStatus && <div className="pan-status uploaded">✅ Uploaded</div>}
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className={`pan-display ${showBorder ? 'with-border' : ''}`}
      style={{ width, height }}
    >
      {renderContent()}
    </div>
  );
};

export default PANDisplay;