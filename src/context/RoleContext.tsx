import React, { createContext, useContext, useState, ReactNode } from 'react';

type RoleContextType = {
  userRole: string | null;
  setUserRole: (role: string) => void;
  clearUserRole: () => void;
  isDirector: boolean;
  isProfessional: boolean;
};

const RoleContext = createContext<RoleContextType>({
  userRole: null,
  setUserRole: () => {},
  clearUserRole: () => {},
  isDirector: false,
  isProfessional: false,
});

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<string | null>(() => {
    // Initialize from localStorage for persistence across browser sessions
    return localStorage.getItem('userRole');
  });

  // Function to set user role and save to storage
  const setUserRole = (role: string) => {
    // Ensure the role is one of the valid roles
    if (role !== 'DIRECTORS' && role !== 'PROFESSIONALS') {
      console.error('Invalid role selected');
      return;
    }
    
    // Store in localStorage 
    localStorage.setItem('userRole', role);
    setUserRoleState(role);
  };

  // Function to clear user role
  const clearUserRole = () => {
    // Remove from localStorage
    localStorage.removeItem('userRole');
    setUserRoleState(null);
  };

  // Derived state
  const isDirector = userRole === 'DIRECTORS';
  const isProfessional = userRole === 'PROFESSIONALS';

  return (
    <RoleContext.Provider value={{ 
      userRole, 
      setUserRole, 
      clearUserRole, 
      isDirector, 
      isProfessional 
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};