import React, { useState, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FileUpload from '../../shared/FileUpload';
import DocumentList from '../../shared/DocumentList';

const MyDocumentsTab: React.FC = () => {
  const { user } = useAuthenticator();
  const [documentsRefreshTrigger, setDocumentsRefreshTrigger] = useState(0);

  const refreshDocuments = useCallback(() => {
    setDocumentsRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div>
      <h2>My Documents</h2>
      <p className="tab-description">
        Upload and manage your personal compliance documents. These documents are private to your account.
      </p>

      <div className="documents-section">
        <div className="upload-section">
          <h3>Upload Documents</h3>
          <FileUpload
            documentType="IDENTITY"
            onRefresh={refreshDocuments}
            maxFileSize={15 * 1024 * 1024} // 15MB for director documents
            acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
            isMultiple={true}
          />
        </div>

        <div className="documents-list-section">
          <DocumentList
            key={documentsRefreshTrigger}
            showUploader={false}
            allowDelete={true}
            onRefresh={refreshDocuments}
            currentUserId={user?.username}
            currentUserRole="DIRECTORS"
          />
        </div>
      </div>
    </div>
  );
};

export default MyDocumentsTab;
