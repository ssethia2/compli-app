import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FileUpload from '../../shared/FileUpload';
import DocumentList from '../../shared/DocumentList';

const MyDocumentsTab: React.FC = () => {
  const { user } = useAuthenticator();

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
            maxFileSize={15 * 1024 * 1024} // 15MB for director documents
            acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
            isMultiple={true}
          />
        </div>

        <div className="documents-list-section">
          <DocumentList
            showUploader={false}
            allowDelete={true}
            currentUserId={user?.username}
            currentUserRole="DIRECTORS"
          />
        </div>
      </div>
    </div>
  );
};

export default MyDocumentsTab;
