// src/components/SignOutButton.tsx
import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

const SignOutButton: React.FC = () => {
  const { signOut } = useAuthenticator();
  
  const handleSignOut = () => {
    // 1. Clear any stored role first
    localStorage.removeItem('userRole');
    console.log('Role cleared from localStorage');
    
    // 2. Perform the sign out
    signOut();
    console.log('Sign out triggered');
    
    // 3. Force a page reload after a brief delay to reset all React state
    setTimeout(() => {
      console.log('Reloading page to reset state');
      window.location.href = '/';
    }, 100);
  };
  
  return (
    <button 
      onClick={handleSignOut} 
      className="sign-out-btn"
    >
      Sign out
    </button>
  );
};

export default SignOutButton;