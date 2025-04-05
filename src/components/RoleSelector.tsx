import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRole } from '../context/RoleContext';
import './RoleSelector.css';

const RoleSelector: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('PROFESSIONALS'); // Default role
  const { signOut } = useAuthenticator();
  const { setUserRole } = useRole();
  const navigate = useNavigate();

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(e.target.value);
  };

  const handleContinue = () => {
    // Update role in context (which also updates localStorage)
    setUserRole(selectedRole);
    // Navigate to the main app
    navigate('/app');
  };

  return (
    <div className="role-selector">
      <h2>Select Your Role</h2>
      <p>Choose which role you want to use for this session:</p>
      
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="role"
            value="PROFESSIONALS"
            checked={selectedRole === 'PROFESSIONALS'}
            onChange={handleRoleChange}
          />
          <span className="radio-text">Compliance Professional</span>
        </label>
        
        <label className="radio-label">
          <input
            type="radio"
            name="role"
            value="DIRECTORS"
            checked={selectedRole === 'DIRECTORS'}
            onChange={handleRoleChange}
          />
          <span className="radio-text">Director</span>
        </label>
      </div>
      
      <div className="button-group">
        <button 
          type="button" 
          className="continue-button"
          onClick={handleContinue}
        >
          Continue
        </button>
        
        <button 
          type="button" 
          className="sign-out-button"
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;