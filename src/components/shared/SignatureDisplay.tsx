import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import './SignatureDisplay.css';

interface SignatureDisplayProps {
  signatureKey?: string;
  width?: string;
  height?: string;
  showBorder?: boolean;
  showLabel?: boolean;
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signatureKey,
  width = '200px',
  height = '80px',
  showBorder = true,
  showLabel = true
}) => {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (signatureKey) {
      fetchSignatureUrl();
    }
  }, [signatureKey]);

  const fetchSignatureUrl = async () => {
    if (!signatureKey) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const result = await getUrl({
        key: signatureKey,
        options: {
          expiresIn: 3600 // 1 hour
        }
      });
      
      setSignatureUrl(result.url.toString());
    } catch (err) {
      console.error('Error fetching signature URL:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!signatureKey) {
    return (
      <div className={`signature-display empty ${showBorder ? 'bordered' : ''}`} style={{ width, height }}>
        <div className="signature-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>
          <span>No e-signature</span>
        </div>
        {showLabel && <div className="signature-label">E-signature</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`signature-display loading ${showBorder ? 'bordered' : ''}`} style={{ width, height }}>
        <div className="signature-loading">
          <div className="loading-spinner"></div>
          <span>Loading signature...</span>
        </div>
        {showLabel && <div className="signature-label">E-signature</div>}
      </div>
    );
  }

  if (error || !signatureUrl) {
    return (
      <div className={`signature-display error ${showBorder ? 'bordered' : ''}`} style={{ width, height }}>
        <div className="signature-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          <span>Error loading signature</span>
        </div>
        {showLabel && <div className="signature-label">E-signature</div>}
      </div>
    );
  }

  return (
    <div className={`signature-display ${showBorder ? 'bordered' : ''}`} style={{ width, height }}>
      <img 
        src={signatureUrl} 
        alt="E-signature" 
        className="signature-image"
        onError={() => setError(true)}
      />
      {showLabel && <div className="signature-label">E-signature</div>}
    </div>
  );
};

export default SignatureDisplay;