// src/components/professional/ProfessionalDashboardRefactored.tsx
// REFACTORED VERSION - Cleaner with extracted tab components
import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getProfessionalEntities } from '../../api';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { CompaniesTab, LLPsTab, DocumentsTab, PendingTasksTab, ServiceRequestsTab } from './tabs';
import ServiceModal from './ServiceModal';
import DirectorInfoForm from '../director/DirectorInfoForm';
import CompanyForm from './CompanyForm';
import LLPForm from './LLPForm';
import './ProfessionalDashboard.css';

const client = generateClient<Schema>();

const ProfessionalDashboardRefactored: React.FC = () => {
  const { user } = useAuthenticator();

  // Tab state
  const [activeTab, setActiveTab] = useState('companies');
  const [showAddForm, setShowAddForm] = useState(false);

  // Data state
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formGenerationTasks, setFormGenerationTasks] = useState<any[]>([]);
  const [showDirectorInfoForm, setShowDirectorInfoForm] = useState(false);
  const [directorInfoFormData, setDirectorInfoFormData] = useState<any>(null);

  // Modal state
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    entity: any;
    mode: 'view' | 'edit';
  }>({ isOpen: false, entity: null, mode: 'view' });

  // Fetch all dashboard data
  const fetchData = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      // Fetch entities using API layer
      const entities = await getProfessionalEntities(user.username);
      setCompanies(entities.companies);
      setLlps(entities.llps);

      // Fetch all director associations
      const associationsResult = await client.models.DirectorAssociation.list();
      setAssociations(associationsResult.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.username]);

  // Handlers
  const handleViewEntity = (entity: any, entityType: 'COMPANY' | 'LLP') => {
    setServiceModal({
      isOpen: true,
      entity: {
        id: entity.id,
        name: entityType === 'COMPANY' ? entity.companyName : entity.llpName,
        type: entityType,
        identifier: entityType === 'COMPANY' ? entity.cinNumber : entity.llpIN
      },
      mode: 'view'
    });
  };

  const handleEditEntity = (entity: any, entityType: 'COMPANY' | 'LLP') => {
    setServiceModal({
      isOpen: true,
      entity: {
        id: entity.id,
        name: entityType === 'COMPANY' ? entity.companyName : entity.llpName,
        type: entityType,
        identifier: entityType === 'COMPANY' ? entity.cinNumber : entity.llpIN
      },
      mode: 'edit'
    });
  };

  const handleFormGeneration = (taskData: any) => {
    setFormGenerationTasks(prev => [...prev, taskData]);
    setActiveTab('documents');
  };

  const handleDirectorInfoFormTask = (taskData: any) => {
    setDirectorInfoFormData({
      ...taskData.appointmentData,
      taskId: taskData.taskId || taskData.id
    });
    setShowDirectorInfoForm(true);
  };

  const handleTaskRemove = (index: number) => {
    setFormGenerationTasks(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'companies':
        return 'Company Master Dashboard';
      case 'llps':
        return 'LLP Master Dashboard';
      case 'associations':
        return 'Director Dashboard';
      case 'service-requests':
        return 'Service Requests';
      case 'pending-tasks':
        return 'Pending Tasks';
      case 'documents':
        return 'Documents & Forms';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="professional-dashboard">
      <div className="dashboard-header">
        <h1>Professional Dashboard</h1>
        <p>
          Welcome, {user?.signInDetails?.loginId || 'Professional'}!
        </p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'companies' ? 'active' : ''}
          onClick={() => {
            setActiveTab('companies');
            setShowAddForm(false);
          }}
        >
          Companies ({companies.length})
        </button>
        <button
          className={activeTab === 'llps' ? 'active' : ''}
          onClick={() => {
            setActiveTab('llps');
            setShowAddForm(false);
          }}
        >
          LLPs ({llps.length})
        </button>
        <button
          className={activeTab === 'service-requests' ? 'active' : ''}
          onClick={() => {
            setActiveTab('service-requests');
            setShowAddForm(false);
          }}
        >
          Service Requests
        </button>
        <button
          className={activeTab === 'pending-tasks' ? 'active' : ''}
          onClick={() => {
            setActiveTab('pending-tasks');
            setShowAddForm(false);
          }}
        >
          Pending Tasks
        </button>
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => {
            setActiveTab('documents');
            setShowAddForm(false);
          }}
        >
          Documents & Forms
        </button>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h2>{getTabTitle()}</h2>
          {activeTab !== 'pending-tasks' && activeTab !== 'documents' && (
            <button
              className="add-button"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm
                ? 'Cancel'
                : `Add ${activeTab === 'companies' ? 'Company' : activeTab === 'llps' ? 'LLP' : 'Item'}`}
            </button>
          )}
        </div>

        <div className="content-body">
          {showAddForm && (
            <div className="add-form-container">
              {activeTab === 'companies' && (
                <CompanyForm onSuccess={() => {
                  setShowAddForm(false);
                  fetchData();
                }} />
              )}
              {activeTab === 'llps' && (
                <LLPForm onSuccess={() => {
                  setShowAddForm(false);
                  fetchData();
                }} />
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <CompaniesTab
              companies={companies}
              associations={associations}
              onViewEntity={handleViewEntity}
              onEditEntity={handleEditEntity}
            />
          )}

          {activeTab === 'llps' && (
            <LLPsTab
              llps={llps}
              onViewEntity={handleViewEntity}
              onEditEntity={handleEditEntity}
            />
          )}

          {activeTab === 'service-requests' && (
            <ServiceRequestsTab
              onDirectorInfoFormOpen={(_taskId, appointmentData) => {
                setDirectorInfoFormData(appointmentData);
                setShowDirectorInfoForm(true);
              }}
            />
          )}

          {activeTab === 'pending-tasks' && (
            <PendingTasksTab
              userId={user?.username || ''}
              onFormGeneration={handleFormGeneration}
              onDirectorInfoFormTask={handleDirectorInfoFormTask}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab
              formGenerationTasks={formGenerationTasks}
              associations={associations}
              currentUserId={user?.username || ''}
              onTaskRemove={handleTaskRemove}
            />
          )}
        </div>
      </div>

      {/* Service Modal */}
      {serviceModal.isOpen && serviceModal.entity && (
        <ServiceModal
          isOpen={serviceModal.isOpen}
          entity={serviceModal.entity}
          mode={serviceModal.mode}
          onClose={() => setServiceModal({ isOpen: false, entity: null, mode: 'view' })}
        />
      )}

      {/* Director Info Form Modal */}
      {showDirectorInfoForm && (
        <DirectorInfoForm
          isOpen={showDirectorInfoForm}
          appointmentData={directorInfoFormData}
          onClose={() => {
            setShowDirectorInfoForm(false);
            setDirectorInfoFormData(null);
          }}
          onSubmit={async (directorInfo) => {
            try {
              const { submitDirectorInfoByProfessional } = await import('../../api/lambda');
              await submitDirectorInfoByProfessional({
                taskId: directorInfoFormData?.taskId || '',
                directorInfo,
                companiesForDisclosure: directorInfo.companiesForDisclosure || [],
                professionalUserId: user?.username || ''
              });
              alert('Director information submitted successfully!');
              setShowDirectorInfoForm(false);
              setDirectorInfoFormData(null);
              window.location.reload(); // Refresh to see updated tasks
            } catch (error) {
              console.error('Error submitting director info:', error);
              alert('Failed to submit director information');
            }
          }}
          mode="professional"
        />
      )}
    </div>
  );
};

export default ProfessionalDashboardRefactored;
