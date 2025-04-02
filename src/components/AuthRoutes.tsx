import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import App from '../App';
import RoleSelector from './RoleSelector';
import { useRole } from '../context/RoleContext';

const AuthRoutes: React.FC = () => {
  const { user, signOut } = useAuthenticator();
  const { userRole, setUserRole } = useRole();
  
  // Clear role when user signs out
  useEffect(() => {
    if (!user) {
      // User signed out, clear their role
      setUserRole('');
    }
  }, [user, setUserRole]);

  // If not authenticated, render nothing (Authenticator will handle this)
  if (!user) {
    return null;
  }

  return (
    <Routes>
      {/* Role Selection Route */}
      <Route path="/select-role" element={<RoleSelector />} />
      
      {/* Main App Route - Requires role selection */}
      <Route 
        path="/app" 
        element={
          userRole ? <App /> : <Navigate to="/select-role" replace />
        } 
      />
      
      {/* Default redirect to role selection if no role, otherwise to app */}
      <Route 
        path="*" 
        element={
          userRole ? <Navigate to="/app" replace /> : <Navigate to="/select-role" replace />
        } 
      />
    </Routes>
  );
};

export default AuthRoutes;
