import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRole } from "./context/RoleContext";
import "./App.css";

function App() {
  const { user, signOut } = useAuthenticator();
  const { userRole, isDirector, isProfessional } = useRole();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If no role selected, redirect to role selection
    if (!userRole) {
      navigate('/select-role');
      return;
    }
  }, [userRole, navigate]);

  return (
    <main>
      <div className="header">
        <h1>{user?.signInDetails?.loginId}'s Dashboard</h1>
        <div className="user-controls">
          <span className="role-badge">
            {isDirector ? 'Director' : 'Compliance Professional'}
          </span>
          <button onClick={signOut} className="sign-out-btn">
            Sign out
          </button>
        </div>
      </div>
      
      <div className="info-box">
        <p>You are currently signed in as a <strong>{isDirector ? 'Director' : 'Compliance Professional'}</strong>.</p>
        <p>This determines what actions you can perform in the application.</p>
      </div>
    </main>
  );
}

export default App;
