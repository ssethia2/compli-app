// src/components/director/DirectorDashboardRefactored.tsx
// REFACTORED VERSION - Much cleaner with extracted tab components
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getUserProfileByUserId, getDirectorEntities } from '../../api';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import {
  DirectorProfileTab,
  MyDocumentsTab,
  PendingTasksTab,
  CompaniesTab,
  LLPsTab
} from './tabs';
import ESignatureModal from '../shared/ESignatureModal';
import './DirectorDashboard.css';

const client = generateClient<Schema>();

const DirectorDashboardRefactored: React.FC = () => {
  const { user } = useAuthenticator();

  // Active tab state
  const [activeTab, setActiveTab] = useState('director-profile');

  // Data state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [associations, setAssociations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [professionalAssignments, setProfessionalAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showESignModal, setShowESignModal] = useState(false);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // Refresh callbacks
  const refreshProfile = useCallback(() => {
    setProfileRefreshTrigger(prev => prev + 1);
    fetchUserProfile();
  }, []);

  const handleSignatureSaved = useCallback((_signatureUrl: string) => {
    refreshProfile();
    alert('E-signature saved successfully!');
  }, [refreshProfile]);

  const handleDirectorDocumentTask = (taskData: any) => {
    // Handle director document task if needed
    console.log('Director document task:', taskData);
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!user?.username) return;

    try {
      const profile = await getUserProfileByUserId(user.username);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      // Fetch user profile
      await fetchUserProfile();

      // Fetch director associations
      const associationsResult = await client.models.DirectorAssociation.list({
        filter: {
          userId: { eq: user.username }
        }
      });
      setAssociations(associationsResult.data);

      // Fetch entities using API
      const entities = await getDirectorEntities(user.username);
      setCompanies(entities.companies);
      setLlps(entities.llps);

      // Fetch professional assignments
      const profAssignments = await client.models.ProfessionalAssignment.list();
      setProfessionalAssignments(profAssignments.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [user?.username]);

  // Refresh profile when trigger changes
  useEffect(() => {
    if (profileRefreshTrigger > 0) {
      fetchUserProfile();
    }
  }, [profileRefreshTrigger]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="director-dashboard">
      <div className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Welcome, {userProfile?.displayName || user?.signInDetails?.loginId || 'Director'}!</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'director-profile' ? 'active' : ''}
          onClick={() => setActiveTab('director-profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          My Documents
        </button>
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Pending Tasks
        </button>
        <button
          className={activeTab === 'companies' ? 'active' : ''}
          onClick={() => setActiveTab('companies')}
        >
          Companies ({companies.length})
        </button>
        <button
          className={activeTab === 'llps' ? 'active' : ''}
          onClick={() => setActiveTab('llps')}
        >
          LLPs ({llps.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'director-profile' && (
          <DirectorProfileTab
            userProfile={userProfile}
            profileRefreshTrigger={profileRefreshTrigger}
            onOpenESignModal={() => setShowESignModal(true)}
            onProfileUpdate={refreshProfile}
          />
        )}

        {activeTab === 'documents' && <MyDocumentsTab />}

        {activeTab === 'tasks' && (
          <PendingTasksTab onDirectorInfoTask={handleDirectorDocumentTask} />
        )}

        {activeTab === 'companies' && (
          <CompaniesTab companies={companies} associations={associations} />
        )}

        {activeTab === 'llps' && (
          <LLPsTab llps={llps} associations={associations} />
        )}
      </div>

      <ESignatureModal
        isOpen={showESignModal}
        onClose={() => setShowESignModal(false)}
        onSignatureSaved={handleSignatureSaved}
      />
    </div>
  );
};

export default DirectorDashboardRefactored;
