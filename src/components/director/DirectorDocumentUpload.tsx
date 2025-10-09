import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './DirectorDocumentUpload.css';

const client = generateClient<Schema>();

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
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {

    setLoading(true);
    try {
      // Complete the director's task
      await client.models.Task.update({
        id: taskId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Get the assigned professional from task metadata and create service request
      const task = await client.models.Task.get({ id: taskId });
      if (task.data?.metadata) {
        try {
          const taskMetadata = JSON.parse(task.data.metadata);
          const assignedProfessionalId = taskMetadata.assignedProfessionalId;

          if (assignedProfessionalId) {
            // Create service request for director appointment
            await client.models.ServiceRequest.create({
              directorId: user?.username || '',
              serviceType: 'DIRECTOR_APPOINTMENT',
              requestData: JSON.stringify({
                // Director details
                directorName: appointmentData?.directorName || 'Director Name Not Available',
                directorDIN: appointmentData?.din,
                directorUserId: user?.username,
                din: appointmentData?.din, // For compatibility with existing parsing
                
                // Entity details  
                entityId: appointmentData?.entityId,
                entityType: appointmentData?.entityType,
                companyName: appointmentData?.companyName,
                entityName: appointmentData?.companyName,
                cinNumber: appointmentData?.cinNumber || appointmentData?.entityIdentifier,
                
                // Appointment details
                designation: appointmentData?.designation,
                appointmentDate: appointmentData?.appointmentDate,
                category: appointmentData?.category,
                isNewAppointment: true,
                changeType: 'New Appointment',
                
                // Workflow details
                requiredForms: ['DIR-2', 'DIR-8', 'MBP-1'],
                documentsUploaded: true,
                assignedProfessionalId: assignedProfessionalId,
                
                // Full appointment data for reference
                appointmentData: appointmentData
              }),
              status: 'PENDING',
              priority: 'HIGH',
              processedBy: assignedProfessionalId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              comments: `Director has uploaded PAN and Aadhar documents for appointment at ${appointmentData?.companyName || 'Company'}`
            });

            // Create simple task for professional
            await client.models.Task.create({
              assignedTo: assignedProfessionalId,
              assignedBy: user?.username,
              taskType: 'FORM_COMPLETION',
              title: 'Complete Director Appointment Request',
              description: `New director appointment service request requires your attention. Please review in Service Requests tab.`,
              priority: 'HIGH',
              status: 'PENDING',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
              relatedEntityId: appointmentData?.entityId,
              relatedEntityType: appointmentData?.entityType,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: JSON.stringify({
                taskType: 'director-appointment-service-request',
                serviceType: 'DIRECTOR_APPOINTMENT'
              })
            });
          }
        } catch (error) {
          console.error('Error parsing task metadata:', error);
        }
      }

      alert('Task completed successfully! A service request has been created for your director appointment. The professional can now process your request through their Service Requests tab.');
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
            <p><strong>Director Appointment:</strong> {appointmentData?.companyName}</p>
            <p><strong>DIN:</strong> {appointmentData?.din}</p>
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