// src/components/CustomAuthenticator.tsx
import React, { useState } from 'react';
import { 
  Authenticator, 
  useAuthenticator,
  View,
  Heading,
  Text,
  Radio,
  RadioGroupField,
  Button 
} from '@aws-amplify/ui-react';
import { useRole } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';

const CustomAuthFooter = () => {
  const { route } = useAuthenticator();
  const [selectedRole, setSelectedRole] = useState<string>('PROFESSIONALS');
  const { setUserRole } = useRole();
  const navigate = useNavigate();
  
  // Only show the role selection on the signed-in route
  if (route !== 'authenticated') {
    return null;
  }
  
  const handleContinue = () => {
    // Set role in context and localStorage
    setUserRole(selectedRole);
    localStorage.setItem('userRole', selectedRole);
    
    // Navigate to the main app
    navigate('/app');
  };
  
  return (
    <View padding="1rem" backgroundColor="white" borderRadius="0.5rem" boxShadow="0px 2px 4px rgba(0, 0, 0, 0.1)">
      <Heading level={3}>Select Your Role</Heading>
      <Text>Choose which role you want to use for this session:</Text>
      
      <RadioGroupField 
        label="Role" 
        name="role"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <Radio value="PROFESSIONALS">Compliance Professional</Radio>
        <Radio value="DIRECTORS">Director</Radio>
      </RadioGroupField>
      
      <Button 
        variation="primary" 
        onClick={handleContinue}
        width="100%"
        marginTop="1rem"
      >
        Continue
      </Button>
    </View>
  );
};

const CustomAuthenticator: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <Authenticator
      components={{
        Footer: CustomAuthFooter,
      }}
    >
      {children}
    </Authenticator>
  );
};

export default CustomAuthenticator;