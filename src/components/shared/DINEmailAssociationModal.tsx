import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { associateDINEmail } from '../../api/lambda';
import './DINEmailAssociationModal.css';

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
      const result = await associateDINEmail({
        din: formData.din,
        email: formData.email,
        entityId: initialData?.entityId,
        entityType: initialData?.entityType as 'COMPANY' | 'LLP' | undefined,
        professionalUserId: user?.username || '',
        directorName: formData.directorName,
        requestContext: initialData?.requestContext
      });

      if (!result.success) {
        setError(result.message || 'Failed to create association');
        if (result.errors && Array.isArray(result.errors)) {
          setError(result.errors.join(', '));
        }
        return;
      }

      onAssociationCreated(result.data);
      alert(result.message);
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