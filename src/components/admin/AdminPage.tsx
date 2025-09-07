import React, { useState } from 'react';
import AdminBackdoorLogin from './AdminBackdoorLogin';
import AdminDashboard from './AdminDashboard';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);

  const handleAdminLogin = (adminProfile: any) => {
    setAdminUser(adminProfile);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
  };

  if (adminUser) {
    return <AdminDashboard adminUser={adminUser} onLogout={handleAdminLogout} />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-background">
        <div className="admin-page-content">
          <div className="admin-page-header">
            <h1>🔐 Administrator Access</h1>
            <p>Restricted access portal for system administrators</p>
          </div>
          
          <AdminBackdoorLogin
            onAdminLogin={handleAdminLogin}
            onCancel={() => window.location.href = '/'}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;