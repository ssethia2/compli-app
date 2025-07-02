// src/App.tsx
import React, { useState, useEffect } from "react";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import "./App.css";

// Import dashboard components
import ProfessionalDashboard from "./components/professional/ProfessionalDashboard";
import DirectorDashboard from "./components/director/DirectorDashboard";

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
          
          const userEmail = user.signInDetails?.loginId || user.username;
          
          // Check if profile exists by userId (Cognito login)
          const existingByUserId = await client.models.UserProfile.list({
            filter: {
              userId: { eq: user.username }
            }
          });
          
          // Check if profile exists by email (created by professional)
          const existingByEmail = await client.models.UserProfile.list({
            filter: {
              email: { eq: userEmail }
            }
          });
          
          console.log('Existing profiles by userId:', existingByUserId.data);
          console.log('Existing profiles by email:', existingByEmail.data);
          
          if (existingByUserId.data.length > 0) {
            // User already has a Cognito-based profile
            const profile = existingByUserId.data[0];
            if (profile.role !== role) {
              await client.models.UserProfile.update({
                id: profile.id,
                role: role as 'DIRECTORS' | 'PROFESSIONALS'
              });
              console.log('Updated existing Cognito profile role:', role);
            }
          } else if (existingByEmail.data.length > 0) {
            // User has email-based profile created by professional - merge it
            const emailProfile = existingByEmail.data[0];
            console.log('Found email-based profile, merging with Cognito userId:', emailProfile);
            
            // Update the email-based profile with Cognito userId
            await client.models.UserProfile.update({
              id: emailProfile.id,
              userId: user.username,
              role: role as 'DIRECTORS' | 'PROFESSIONALS',
              displayName: userEmail
            });
            console.log('Merged email-based profile with Cognito userId');
            
            // Update all DirectorAssociations to use the Cognito userId
            const associations = await client.models.DirectorAssociation.list({
              filter: {
                userId: { eq: emailProfile.userId }
              }
            });
            
            console.log('Updating', associations.data.length, 'associations with new userId');
            for (const assoc of associations.data) {
              await client.models.DirectorAssociation.update({
                id: assoc.id,
                userId: user.username
              });
            }
            console.log('Updated all associations with Cognito userId');
            
          } else {
            // No profile exists, create new one
            await client.models.UserProfile.create({
              userId: user.username,
              email: userEmail,
              role: role as 'DIRECTORS' | 'PROFESSIONALS',
              displayName: userEmail
            });
            console.log('Created new user profile with role:', role);
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
          <ProfessionalDashboard />
        ) : (
          <DirectorDashboard />
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Corporate Compliance Portal</p>
      </footer>
    </div>
  );
}

export default App;