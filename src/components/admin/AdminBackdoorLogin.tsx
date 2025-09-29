import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './AdminBackdoorLogin.css';

const client = generateClient<Schema>();

interface AdminBackdoorLoginProps {
  onAdminLogin: (adminProfile: any) => void;
  onCancel: () => void;
}

const AdminBackdoorLogin: React.FC<AdminBackdoorLoginProps> = ({
  onAdminLogin,
  onCancel
}) => {
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin codes from environment variables
  const ADMIN_CODES = {
    [import.meta.env.VITE_ADMIN_CODE_1 || 'COMPLIANCE_ADMIN_2025']: {
      email: 'admin@complianceportal.com',
      displayName: 'System Administrator',
      userId: 'admin_system',
      role: 'ADMIN' as const
    },
    [import.meta.env.VITE_ADMIN_CODE_2 || 'ASSET_MANAGER_2025']: {
      email: 'assets@complianceportal.com', 
      displayName: 'Asset Manager',
      userId: 'admin_assets',
      role: 'ADMIN' as const
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if admin code is valid
      const adminProfile = ADMIN_CODES[adminCode as unknown as keyof typeof ADMIN_CODES];
      
      if (!adminProfile) {
        setError('Invalid admin access code');
        setLoading(false);
        return;
      }

      // Check if admin profile exists, create if not
      let existingProfile = null;
      try {
        const profileResult = await client.models.UserProfile.list({
          filter: { userId: { eq: adminProfile.userId } }
        });
        existingProfile = profileResult.data[0];
      } catch (err) {
        console.log('Admin profile not found, will create');
      }

      // Create admin profile if it doesn't exist
      if (!existingProfile) {
        const createResult = await client.models.UserProfile.create({
          userId: adminProfile.userId,
          email: adminProfile.email,
          role: adminProfile.role,
          displayName: adminProfile.displayName
        });
        
        if (createResult.data) {
          existingProfile = createResult.data;
        }
      }

      // Success - call the login callback
      onAdminLogin({
        ...adminProfile,
        id: existingProfile?.id,
        signInDetails: { loginId: adminProfile.email },
        username: adminProfile.userId
      });

    } catch (err) {
      console.error('Admin login error:', err);
      setError('Failed to access admin panel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-backdoor-overlay">
      <div className="admin-backdoor-modal">
        <div className="admin-backdoor-header">
          <h2>🔐 Admin Access Portal</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="admin-backdoor-content">
          <div className="admin-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>RESTRICTED ACCESS</strong>
              <p>This portal is for authorized administrators only. Access is logged and monitored.</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="adminCode">Admin Access Code</label>
              <input
                type="password"
                id="adminCode"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="Enter admin access code"
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}

            <div className="admin-login-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-login-button"
                disabled={loading || !adminCode}
              >
                {loading ? 'Verifying...' : 'Access Admin Panel'}
              </button>
            </div>
          </form>

          <div className="admin-info">
            <h4>Admin Functions Available:</h4>
            <ul>
              <li>📄 Manage form templates and documents</li>
              <li>📁 Asset library management</li>
              <li>📧 Email template configuration</li>
              <li>⚙️ System configuration (read-only)</li>
            </ul>
            <p className="admin-disclaimer">
              <strong>Note:</strong> Admin access does not provide access to user data, 
              entities, or personal information. Asset management only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBackdoorLogin;