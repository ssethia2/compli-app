import React, { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
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

  const handleFileUpload = async (files: File[]) => {
    if (!files.length || !user?.username) return;
    
    const file = files[0];
    
    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid PAN document (PDF, JPG, or PNG)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    
    try {
      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileKey = `pan-documents/${user.username}/pan-${timestamp}.${fileExtension}`;
      
      // Upload to S3
      console.log('Uploading PAN document to S3...');
      const result = await uploadData({
        key: fileKey,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            panNumber: panNumber,
            uploadedBy: user.username,
            uploadType: 'pan-document'
          }
        }
      }).result;
      
      console.log('PAN document uploaded successfully:', result);
      
      // Update user profile with PAN document URL
      const userProfiles = await client.models.UserProfile.list({
        filter: { userId: { eq: user.username } }
      });
      
      if (userProfiles.data.length > 0) {
        const profileId = userProfiles.data[0].id;
        
        await client.models.UserProfile.update({
          id: profileId,
          panDocumentUrl: result.key,
          pan: panNumber || userProfiles.data[0].pan // Update PAN number if provided
        });
        
        console.log('User profile updated with PAN document');
      }
      
      // Call success callback
      onPANUploaded(result.key);
      onClose();
      alert('PAN document uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading PAN document:', error);
      alert('Failed to upload PAN document. Please try again.');
    }
  };

  const handleClose = () => {
    setPanNumber('');
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
            
            <FileUpload
              documentType="IDENTITY"
              onUploadComplete={handleFileUpload}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxFileSize={5 * 1024 * 1024} // 5MB
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