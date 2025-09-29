import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './DINEmailAssociationModal.css';

const client = generateClient<Schema>();

interface DINEmailAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssociationCreated: (association: any) => void;
  initialData?: {
    din?: string;
    directorName?: string;
    entityId?: string;
    entityType?: string;
    entityName?: string;
    requestContext?: any;
  };
}

const DINEmailAssociationModal: React.FC<DINEmailAssociationModalProps> = ({
  isOpen,
  onClose,
  onAssociationCreated,
  initialData
}) => {
  const { user } = useAuthenticator();
  const [formData, setFormData] = useState({
    din: initialData?.din || '',
    email: '',
    directorName: initialData?.directorName || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when initialData changes (when modal opens with new task data)
  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        din: initialData.din || '',
        email: '',
        directorName: initialData.directorName || '',
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email format
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }

      // Check if this DIN is already associated with an email
      let existingAssociation: any = { data: [] };
      try {
        if (client.models.PendingDirector) {
          existingAssociation = await client.models.PendingDirector.list({
            filter: {
              and: [
                { din: { eq: formData.din } },
                { status: { eq: 'PENDING' } }
              ]
            }
          });
        }
      } catch (err) {
        console.warn('PendingDirector model not available, skipping duplicate check:', err);
      }

      if (existingAssociation.data.length > 0) {
        setError('This DIN is already associated with an email. Please check existing associations.');
        setLoading(false);
        return;
      }

      // Check if someone already has an account with this email
      const existingUser = await client.models.UserProfile.list({
        filter: { email: { eq: formData.email.toLowerCase().trim() } }
      });

      if (existingUser.data.length > 0) {
        // If user exists, directly update their profile with the DIN
        await client.models.UserProfile.update({
          id: existingUser.data[0].id,
          din: formData.din,
          dinStatus: 'ACTIVE'
        });

        alert('Director account found! Their profile has been updated with the DIN immediately.');
        onAssociationCreated({
          din: formData.din,
          email: formData.email,
          status: 'CLAIMED'
        });
        handleClose();
        return;
      }

      // Create the pending director association
      let association = null;
      try {
        if (client.models.PendingDirector) {
          association = await client.models.PendingDirector.create({
            din: formData.din,
            email: formData.email.toLowerCase().trim(),
            directorName: formData.directorName || undefined,
            associatedBy: user?.username || '',
            entityId: initialData?.entityId,
            entityType: initialData?.entityType as 'COMPANY' | 'LLP' | undefined,
            status: 'PENDING',
            requestContext: initialData?.requestContext ? JSON.stringify(initialData.requestContext) : undefined,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          });
          console.log('DIN-Email association created:', association);
        } else {
          // Fallback: create a simple association object
          association = {
            data: {
              din: formData.din,
              email: formData.email.toLowerCase().trim(),
              status: 'PENDING',
              createdAt: new Date().toISOString()
            }
          };
          console.log('PendingDirector model not available, created fallback association:', association);
        }
      } catch (err) {
        console.error('Error creating PendingDirector association:', err);
        setError('Failed to create association. The data model may not be deployed yet.');
        setLoading(false);
        return;
      }

      onAssociationCreated(association.data);
      
      alert(`DIN ${formData.din} has been associated with ${formData.email}. ${client.models.PendingDirector ? 'When someone creates an account with this email, their profile will automatically be populated with the DIN.' : 'Note: Full association features require schema deployment.'}`);
      handleClose();

    } catch (error) {
      console.error('Error creating DIN-Email association:', error);
      setError(`Failed to create association: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      din: initialData?.din || '',
      email: '',
      directorName: initialData?.directorName || '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="din-email-modal-overlay" onClick={handleClose}>
      <div className="din-email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="din-email-header">
          <h3>Associate DIN with Email</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="din-email-content">
          {initialData?.entityName && (
            <div className="context-info">
              <p><strong>Context:</strong> Director appointment request for {initialData.entityName}</p>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="din">Director Identification Number (DIN) *</label>
              <input
                type="text"
                id="din"
                value={formData.din}
                onChange={(e) => setFormData({ ...formData, din: e.target.value })}
                required
                placeholder="Enter 8-digit DIN"
                pattern="[0-9]{8}"
                title="DIN should be 8 digits"
                maxLength={8}
                readOnly={!!initialData?.din}
                style={initialData?.din ? { backgroundColor: '#f9fafb', cursor: 'not-allowed' } : {}}
              />
              {initialData?.din && (
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  DIN pre-filled from appointment request
                </small>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Director's Email Address *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="director@example.com"
              />
              <small>When someone creates an account with this email, their DIN will be automatically populated.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="directorName">Director Name (Optional)</label>
              <input
                type="text"
                id="directorName"
                value={formData.directorName}
                onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                placeholder="Enter director's full name"
              />
            </div>
            
            <div className="form-buttons">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating Association...' : 'Associate DIN & Email'}
              </button>
            </div>
          </form>
          
          <div className="info-section">
            <h4>How it works:</h4>
            <ul>
              <li>Associate the director's DIN with their email address</li>
              <li>When they create an account with this email, their DIN will be automatically populated</li>
              <li>The director can then complete their profile and participate in appointments</li>
              <li>Association expires in 90 days if unclaimed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DINEmailAssociationModal;