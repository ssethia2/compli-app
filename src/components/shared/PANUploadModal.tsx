import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import FileUpload from './FileUpload';
import './PANUploadModal.css';

const client = generateClient<Schema>();

interface PANUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPANUploaded: (panUrl: string) => void;
}

const PANUploadModal: React.FC<PANUploadModalProps> = ({
  isOpen,
  onClose,
  onPANUploaded
}) => {
  const { user } = useAuthenticator();
  const [panNumber, setPanNumber] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (document: any) => {
    if (!document || !user?.username) {
      console.error('Missing document or user information');
      return;
    }

    setUploading(true);

    try {
      console.log('PAN document uploaded to S3:', document);
      console.log('Updating user profile with fileKey:', document.fileKey);

      // Update user profile with PAN document URL
      const userProfiles = await client.models.UserProfile.list({
        filter: { userId: { eq: user.username } }
      });

      if (userProfiles.data.length > 0) {
        const profileId = userProfiles.data[0].id;

        await client.models.UserProfile.update({
          id: profileId,
          panDocumentUrl: document.fileKey,
          pan: panNumber || userProfiles.data[0].pan // Update PAN number if provided
        });

        console.log('User profile updated with PAN document');
      } else {
        console.error('No user profile found for user:', user.username);
        alert('User profile not found. Please contact support.');
        setUploading(false);
        return;
      }

      // Call success callback (this is async but we don't await it)
      console.log('Calling onPANUploaded callback');
      onPANUploaded(document.fileKey);

      // Close modal after a short delay to ensure state updates
      setTimeout(() => {
        console.log('Closing PAN upload modal');
        handleClose();
      }, 100);

    } catch (error) {
      console.error('Error updating profile with PAN document:', error);
      alert('Failed to update profile. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPanNumber('');
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pan-upload-modal-overlay" onClick={handleClose}>
      <div className="pan-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pan-upload-header">
          <h3>Upload PAN Document</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="pan-upload-content">
          <div className="pan-form-group">
            <label htmlFor="panNumber">PAN Number (Optional)</label>
            <input
              type="text"
              id="panNumber"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              title="PAN should be in format: ABCDE1234F"
              maxLength={10}
            />
            <small>Enter your PAN number to update your profile</small>
          </div>
          
          <div className="pan-upload-section">
            <h4>Upload PAN Document</h4>
            <p>Please upload a clear image or PDF of your PAN card</p>

            {uploading && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#3b82f6' }}>
                <p>Updating profile...</p>
              </div>
            )}

            <FileUpload
              documentType="IDENTITY"
              onUploadComplete={handleFileUpload}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxFileSize={5 * 1024 * 1024} // 5MB
              isMultiple={false}
              defaultDocumentName="PAN Card"
              hideDocumentNameInput={true}
            />
          </div>
          
          <div className="pan-upload-info">
            <h4>Requirements:</h4>
            <ul>
              <li>File formats: PDF, JPG, PNG</li>
              <li>Maximum file size: 5MB</li>
              <li>Document should be clear and readable</li>
              <li>All details on the PAN card should be visible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PANUploadModal;