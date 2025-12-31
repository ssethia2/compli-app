import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useQueryClient } from '@tanstack/react-query';
import { completeDirectorDocumentUpload } from '../../api/lambda';
import './DirectorDocumentUpload.css';

interface DirectorDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  taskId: string;
  appointmentData?: any;
}

const DirectorDocumentUpload: React.FC<DirectorDocumentUploadProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  taskId,
  appointmentData
}) => {
  const { user } = useAuthenticator();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);

    try {
      const result = await completeDirectorDocumentUpload({
        taskId,
        appointmentData,
        directorUserId: user?.username || ''
      });

      alert(result.message);

      // Remove the completed task from cache
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((task: any) => task.id !== taskId)
        };
      });

      onUploadComplete();
    } catch (error) {
      console.error('Error completing document upload:', error);
      alert('Error completing upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="director-document-modal-overlay" onClick={onClose}>
      <div className="director-document-modal" onClick={(e) => e.stopPropagation()}>
        <div className="director-document-header">
          <h3>Upload Required Documents</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="director-document-content">
          <div className="context-info">
            <p><strong>Director Appointment:</strong> {appointmentData?.entityName || appointmentData?.companyName || 'N/A'}</p>
            <p><strong>DIN:</strong> {appointmentData?.appointeeDIN || appointmentData?.directorDIN || appointmentData?.din || 'N/A'}</p>
          </div>
          
          <div className="document-upload-section">
            <h4>📄 Required Documents</h4>
            <p>Please upload your PAN Card and Aadhar Card in the <strong>My Documents</strong> tab before completing this task.</p>
            <p>The assigned professional will download these documents to complete your director information form and generate the required appointment forms.</p>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleComplete}
              disabled={loading}
              style={{
                background: '#10b981',
                color: 'white'
              }}
            >
              {loading ? 'Completing...' : 'Complete Task'}
            </button>
          </div>
          
          <div className="info-section">
            <h4>Next Steps:</h4>
            <ul>
              <li>Upload PAN and Aadhar documents in the My Documents tab</li>
              <li>Click "Complete Task" above</li>
              <li>The assigned professional will receive a task to download your documents and complete your director information form</li>
              <li>The professional will generate DIR-2, DIR-8, and MBP-1 forms</li>
              <li>You will be notified once the forms are ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDocumentUpload;