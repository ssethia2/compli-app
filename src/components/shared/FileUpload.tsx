import React, { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './FileUpload.css';

const client = generateClient<Schema>();

interface FileUploadProps {
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  serviceRequestId?: string;
  documentType: 'IDENTITY' | 'ADDRESS_PROOF' | 'BOARD_RESOLUTION' | 'FINANCIAL_STATEMENT' | 'COMPLIANCE_CERTIFICATE' | 'OTHER';
  onUploadComplete?: (document: any) => void;
  onRefresh?: () => void;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  isMultiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  entityId,
  entityType,
  serviceRequestId,
  documentType,
  onUploadComplete,
  onRefresh,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  isMultiple = false
}) => {
  const { user } = useAuthenticator();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`;
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }
    
    return null;
  };

  const generateS3Key = (fileName: string): string => {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (serviceRequestId) {
      return `service-requests/${serviceRequestId}/${timestamp}_${sanitizedName}`;
    } else if (entityId && entityType) {
      return `entities/${entityId}/${timestamp}_${sanitizedName}`;
    } else {
      // For user documents, use public path since we're using authenticated access
      return `public/users/${user?.username}/${timestamp}_${sanitizedName}`;
    }
  };

  const uploadFile = async (file: File): Promise<any> => {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const fileKey = generateS3Key(file.name);
    
    try {
      // Upload to S3
      await uploadData({
        key: fileKey,
        data: file,
        options: {
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const progress = Math.round((transferredBytes / totalBytes) * 100);
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            }
          },
        },
      }).result;

      // Create document record in database
      const documentData = {
        fileName: file.name,
        fileKey: fileKey,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user?.username || '',
        uploadedAt: new Date().toISOString(),
        documentType,
        entityId,
        entityType,
        serviceRequestId,
        isPublic: false
      };

      const documentResult = await client.models.Document.create(documentData);
      
      return documentResult.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    const filesToUpload = isMultiple ? Array.from(files) : [files[0]];
    
    try {
      const uploadPromises = filesToUpload.map(file => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(document => {
        if (onUploadComplete) {
          onUploadComplete(document);
        }
      });
      
      if (onRefresh) {
        onRefresh();
      }
      
      // Clear progress
      setUploadProgress({});
    } catch (error) {
      alert(`Upload failed: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple={isMultiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        <div className="upload-content">
          {uploading ? (
            <div className="upload-progress">
              <div className="upload-spinner"></div>
              <p>Uploading...</p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="progress-item">
                  <span className="file-name">{fileName}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{progress}%</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                {dragOver ? 'Drop files here' : 'Click or drag files to upload'}
              </p>
              <p className="upload-hint">
                Accepted: {acceptedFileTypes.join(', ')} • Max {(maxFileSize / 1024 / 1024).toFixed(1)}MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;