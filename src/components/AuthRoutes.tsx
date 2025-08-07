// src/components/AuthRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import App from '../App';

const AuthRoutes: React.FC = () => {
  const { user } = useAuthenticator();
  
  // If not authenticated, render nothing (Authenticator will handle this)
  if (!user) {
    return null;
  }

  return (
    <Routes>
      {/* Main App Route */}
      <Route path="/app" element={<App signOut={() => {}} user={{}} />} />
      
      {/* Default redirect to app */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};

export default AuthRoutes;