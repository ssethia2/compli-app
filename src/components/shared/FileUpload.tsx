import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUploadDocument } from '../../hooks/useDocuments';
import './FileUpload.css';

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
  defaultDocumentName?: string;
  hideDocumentNameInput?: boolean;
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
  isMultiple = false,
  defaultDocumentName = '',
  hideDocumentNameInput = false
}) => {
  const { user } = useAuthenticator();
  const uploadDocumentMutation = useUploadDocument();

  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [documentName, setDocumentName] = useState(defaultDocumentName);

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

  const uploadFile = async (file: File): Promise<any> => {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      // Set initial progress
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      // Use React Query mutation
      const result = await uploadDocumentMutation.mutateAsync({
        file,
        documentName: documentName.trim() || defaultDocumentName || file.name,
        documentType,
        uploadedBy: user?.username || '',
        entityId,
        entityType,
        serviceRequestId
      });

      // Simulate progress completion (since API doesn't expose progress yet)
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      return result.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;

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
      // React Query automatically invalidates cache and refetches

      // Clear progress and document name
      setUploadProgress({});
      setDocumentName('');
    } catch (error) {
      alert(`Upload failed: ${(error as Error).message}`);
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
      {!hideDocumentNameInput && (
        <div className="document-name-input">
          <label htmlFor="document-name">Document Name (optional)</label>
          <input
            id="document-name"
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Enter a custom name for this document"
            disabled={uploadDocumentMutation.isPending}
          />
        </div>
      )}

      <div
        className={`file-upload-area ${dragOver ? 'drag-over' : ''} ${uploadDocumentMutation.isPending ? 'uploading' : ''}`}
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
          disabled={uploadDocumentMutation.isPending}
        />

        <div className="upload-content">
          {uploadDocumentMutation.isPending ? (
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