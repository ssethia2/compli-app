import React from 'react';
import SignatureDisplay from '../../shared/SignatureDisplay';
import { updateUserProfile } from '../../../api';

interface DirectorProfileTabProps {
  userProfile: any;
  profileRefreshTrigger: number;
  onOpenESignModal: () => void;
  onProfileUpdate: () => void;
}

const DirectorProfileTab: React.FC<DirectorProfileTabProps> = ({
  userProfile,
  profileRefreshTrigger,
  onOpenESignModal,
  onProfileUpdate
}) => {
  const handleUpdateDIN = async () => {
    const din = prompt('Please enter your DIN (8 digits):');

    if (!din) return;

    if (din.length !== 8 || !/^\d+$/.test(din)) {
      alert('Please enter a valid 8-digit DIN');
      return;
    }

    try {
      if (!userProfile?.id) {
        alert('Unable to update DIN - profile not found');
        return;
      }

      await updateUserProfile({
        id: userProfile.id,
        din: din,
        dinStatus: 'ACTIVE'
      });

      alert('DIN updated successfully!');
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating DIN:', error);
      alert('Failed to update DIN. Please try again.');
    }
  };

  return (
    <div>
      <h2>Director Dashboard</h2>
      <div className="director-profile-card">
        <div className="profile-header">
          <h3>Director Profile Information</h3>
        </div>
        <div className="profile-details">
          <div className="profile-row">
            <div className="profile-field">
              <label>Name:</label>
              <span>
                {userProfile?.displayName ||
                 userProfile?.email?.split('@')[0] ||
                 'Not specified'}
              </span>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>{userProfile?.email || 'Not specified'}</span>
            </div>
          </div>
          <div className="profile-row">
            <div className="profile-field">
              <label>DIN:</label>
              <span>
                {userProfile?.din || 'Not specified'}
                {!userProfile?.din && (
                  <button
                    onClick={handleUpdateDIN}
                    style={{
                      marginLeft: '1rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add DIN
                  </button>
                )}
              </span>
            </div>
            <div className="profile-field">
              <label>DIN Status:</label>
              <span
                className={`status-badge ${userProfile?.dinStatus?.toLowerCase() || 'unknown'}`}
              >
                {userProfile?.dinStatus || 'Not specified'}
              </span>
            </div>
          </div>
          <div className="profile-row">
            <div className="profile-field">
              <label>DSC Status:</label>
              <span
                className={`status-badge ${userProfile?.dscStatus?.toLowerCase() || 'unknown'}`}
              >
                {userProfile?.dscStatus || 'Not specified'}
              </span>
            </div>
            <div className="profile-field">
              <label>PAN:</label>
              <span>{userProfile?.pan || 'Not specified'}</span>
            </div>
          </div>
          <div className="profile-row">
            <div className="profile-field full-width">
              <label>E-signature:</label>
              <SignatureDisplay
                key={profileRefreshTrigger}
                signatureKey={userProfile?.eSignImageUrl}
                width="250px"
                height="100px"
                showBorder={true}
                showLabel={false}
              />
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="edit-profile-btn">Edit Profile</button>
          <button className="upload-esign-btn" onClick={onOpenESignModal}>
            {userProfile?.eSignImageUrl ? 'Update E-signature' : 'Add E-signature'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectorProfileTab;
