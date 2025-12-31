// src/components/director/DirectorDashboardRefactored.tsx
// REFACTORED VERSION - Much cleaner with extracted tab components
import React, { useState, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDirectorEntities } from '../../hooks/useEntities';
import {
  DirectorProfileTab,
  MyDocumentsTab,
  PendingTasksTab,
  CompaniesTab,
  LLPsTab
} from './tabs';
import ESignatureModal from '../shared/ESignatureModal';
import './DirectorDashboard.css';

const DirectorDashboardRefactored: React.FC = () => {
  const { user } = useAuthenticator();

  // Use React Query hooks for data
  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile(user?.username);
  const { data: entitiesData, isLoading: entitiesLoading } = useDirectorEntities(user?.username);

  const companies = entitiesData?.companies || [];
  const llps = entitiesData?.llps || [];

  // Active tab state
  const [activeTab, setActiveTab] = useState('director-profile');

  // UI state
  const [showESignModal, setShowESignModal] = useState(false);

  const handleSignatureSaved = useCallback(async (_signatureUrl: string) => {
    await refetchProfile();
    alert('E-signature saved successfully!');
  }, [refetchProfile]);

  const handleDirectorDocumentTask = (taskData: any) => {
    // Handle director document task if needed
    console.log('Director document task:', taskData);
  };

  if (profileLoading || entitiesLoading) {
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
            onOpenESignModal={() => setShowESignModal(true)}
          />
        )}

        {activeTab === 'documents' && <MyDocumentsTab />}

        {activeTab === 'tasks' && (
          <PendingTasksTab onDirectorInfoTask={handleDirectorDocumentTask} />
        )}

        {activeTab === 'companies' && <CompaniesTab />}

        {activeTab === 'llps' && <LLPsTab />}
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
