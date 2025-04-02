import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context type
type RoleContextType = {
  userRole: string | null;
  setUserRole: (role: string) => void;
  isDirector: boolean;
  isProfessional: boolean;
};

// Create context with default values
const RoleContext = createContext<RoleContextType>({
  userRole: null,
  setUserRole: () => {},
  isDirector: false,
  isProfessional: false,
});

// Provider component
export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<string | null>(() => {
    // Initialize from localStorage for persistence across browser sessions
    return localStorage.getItem('userRole');
  });

  // Function to set user role and save to session storage
  const setUserRole = (role: string) => {
    // Store in localStorage for persistence across browser sessions
    localStorage.setItem('userRole', role);
    setUserRoleState(role);
  };

  // Derived state
  const isDirector = userRole === 'DIRECTORS';
  const isProfessional = userRole === 'PROFESSIONALS';

  return (
    <RoleContext.Provider value={{ userRole, setUserRole, isDirector, isProfessional }}>
      {children}
    </RoleContext.Provider>
  );
};

// Custom hook to use the role context
export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
