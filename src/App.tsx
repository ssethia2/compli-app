// src/App.tsx
import React, { useState, useEffect } from "react";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import "./App.css";

// Import dashboard components
import ProfessionalDashboard from "./components/professional/ProfessionalDashboard";

// Initialize the data client
const client = generateClient<Schema>();

function App({ signOut, user } : {signOut:any, user: any} ) {
  const [role, setRole] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('userRole') || null;
  });

  const [loading, setLoading] = useState(false);

  // Clear role when component unmounts (which happens on sign out)
  useEffect(() => {
    return () => {
      localStorage.removeItem('userRole');
    };
  }, []);

  // Handle sign out with role clearing
  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    setRole(null);
    signOut();
  };

  // Initialize user profile when role is selected
  useEffect(() => {
    if (role && user) {
      const createUserProfile = async () => {
        try {
          setLoading(true);
          
          // Check if profile exists
          const existingProfiles = await client.models.UserProfile.list({
            filter: {
              userId: {
                eq: user.username
              }
            }
          });
          
          // If no profile exists, create one
          if (existingProfiles.data.length === 0) {
            await client.models.UserProfile.create({
              userId: user.username,
              role: role,
              displayName: user.signInDetails?.loginId || user.username
            });
            console.log('User profile created with role:', role);
          } else if (existingProfiles.data[0].role !== role) {
            // If profile exists but role changed, update it
            await client.models.UserProfile.update({
              userId: user.username,
              role: role
            });
            console.log('User profile updated with new role:', role);
          }
        } catch (error) {
          console.error('Error managing user profile:', error);
        } finally {
          setLoading(false);
        }
      };
      
      createUserProfile();
    }
  }, [role, user]);

  // If no role is selected, show role selection
  if (!role) {
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
              onChange={() => {
                setRole('PROFESSIONALS');
                localStorage.setItem('userRole', 'PROFESSIONALS');
              }}
            />
            <span className="radio-text">Compliance Professional</span>
          </label>
          
          <label className="radio-label">
            <input
              type="radio"
              name="role"
              value="DIRECTORS"
              onChange={() => {
                setRole('DIRECTORS');
                localStorage.setItem('userRole', 'DIRECTORS');
              }}
            />
            <span className="radio-text">Director</span>
          </label>
        </div>
        
        <div className="button-group">
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Render appropriate dashboard based on role
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title">
          <h1>Corporate Compliance Portal</h1>
        </div>
        <div className="user-controls">
          <span className="user-info">
            {user?.signInDetails?.loginId || user?.username}
          </span>
          <span className="role-badge">
            {role === 'DIRECTORS' ? 'Director' : 'Compliance Professional'}
          </span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign out
          </button>
        </div>
      </header>
      
      <main className="app-main">
        {role === 'PROFESSIONALS' ? (
          <ProfessionalDashboard user={user} />
        ) : (
          // <DirectorDashboard user={user} />
          <p>director not implemented</p>
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Corporate Compliance Portal</p>
      </footer>
    </div>
  );
}

export default App;