// src/components/professional/ProfessionalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import CompanyForm from './CompanyForm';
import LLPForm from './LLPForm';
import AssociateDirectorForm from './AssociateDirectorForm';
import ServiceModal from './ServiceModal';
import './ProfessionalDashboard.css';

const client = generateClient<Schema>();

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Service modal state
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    entity: any;
    mode: 'view' | 'edit';
  }>({ isOpen: false, entity: null, mode: 'view' });
  
  // Store director and entity lookup maps for associations display
  const [directorLookup, setDirectorLookup] = useState<Map<string, any>>(new Map());
  const [entityLookup, setEntityLookup] = useState<Map<string, any>>(new Map());
  
  // Function to build lookup maps for display
  const buildLookupMaps = async (associationsData: any[], entities: any[]) => {
    const directorMap = new Map();
    const entityMap = new Map();
    
    // Build entity lookup map
    entities.forEach(entity => {
      if (entity.cinNumber) {
        // Company
        entityMap.set(entity.id, {
          name: entity.companyName,
          identifier: entity.cinNumber,
          type: 'COMPANY'
        });
      } else if (entity.llpIN) {
        // LLP
        entityMap.set(entity.id, {
          name: entity.llpName,
          identifier: entity.llpIN,
          type: 'LLP'
        });
      }
    });
    
    // Build director lookup map
    const uniqueDirectorIds = [...new Set(associationsData.map(assoc => assoc.userId))];
    console.log('Unique director IDs to fetch:', uniqueDirectorIds);
    
    for (const userId of uniqueDirectorIds) {
      try {
        console.log(`Fetching director profile for userId: ${userId}`);
        // Try to find UserProfile by userId field
        const directorResult = await client.models.UserProfile.list({
          filter: { userId: { eq: userId } }
        });
        console.log(`Director fetch result for ${userId}:`, directorResult);
        
        if (directorResult.data && directorResult.data.length > 0) {
          const director = directorResult.data[0];
          directorMap.set(userId, {
            email: director.email,
            displayName: director.displayName,
            userId: director.userId
          });
          console.log(`Added director to lookup:`, director);
        } else {
          console.warn(`No data returned for director ${userId}`);
          directorMap.set(userId, { email: 'No profile found', displayName: null, userId });
        }
      } catch (error) {
        console.warn(`Could not fetch director ${userId}:`, error);
        directorMap.set(userId, { email: 'Error loading', displayName: null, userId });
      }
    }
    
    console.log('Final director lookup map:', directorMap);
    
    setDirectorLookup(directorMap);
    setEntityLookup(entityMap);
  };
  
  // Fetch data based on professional assignments
  const fetchData = async () => {
    if (!user?.username) return;
    
    setLoading(true);
    try {
      // 1. Get this professional's assignments
      const assignmentsResult = await client.models.ProfessionalAssignment.list({
        filter: {
          and: [
            { professionalId: { eq: user.username } },
            { isActive: { eq: true } }
          ]
        }
      });

      const assignments = assignmentsResult.data;
      console.log('Professional assignments:', assignments);
      console.log('Number of assignments found:', assignments.length);

      // 2. Separate company and LLP assignments
      const companyIds = assignments
        .filter(a => a.entityType === 'COMPANY')
        .map(a => a.entityId);
      
      const llpIds = assignments
        .filter(a => a.entityType === 'LLP')
        .map(a => a.entityId);
        
      console.log('Company IDs to fetch:', companyIds);
      console.log('LLP IDs to fetch:', llpIds);

      // 3. Fetch assigned companies
      const assignedCompanies = [];
      for (const cinNumber of companyIds) {
        try {
          console.log(`Fetching company with CIN: ${cinNumber}`);
          const companyResult = await client.models.Company.get({ id: cinNumber });
          console.log(`Company fetch result for ${cinNumber}:`, companyResult);
          if (companyResult.data) {
            console.log(`Found company data:`, companyResult.data);
            assignedCompanies.push(companyResult.data);
          } else {
            console.warn(`No company data found for CIN: ${cinNumber}`);
          }
        } catch (error) {
          console.warn(`Could not fetch company ${cinNumber}:`, error);
        }
      }

      // 4. Fetch assigned LLPs
      const assignedLLPs = [];
      for (const llpIN of llpIds) {
        try {
          const llpResult = await client.models.LLP.get({ id: llpIN });
          if (llpResult.data) {
            assignedLLPs.push(llpResult.data);
          }
        } catch (error) {
          console.warn(`Could not fetch LLP ${llpIN}:`, error);
        }
      }

      // 5. Fetch all director associations for assigned entities
      const allEntityIds = [...companyIds, ...llpIds];
      const associationsResult = await client.models.DirectorAssociation.list({
        filter: {
          or: allEntityIds.map(entityId => ({ entityId: { eq: entityId } }))
        }
      });

      console.log('Final assigned companies:', assignedCompanies);
      console.log('Final assigned LLPs:', assignedLLPs);
      
      // 6. Build lookup maps for associations display
      await buildLookupMaps(associationsResult.data, [...assignedCompanies, ...assignedLLPs]);
      
      setCompanies(assignedCompanies);
      setLlps(assignedLLPs);
      setAssociations(associationsResult.data);

    } catch (err) {
      console.error('Error fetching professional data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, [user?.username]);

  // Function to get directors for a specific entity
  const getDirectorsForEntity = (entityId: string, entityType: 'COMPANY' | 'LLP') => {
    return associations.filter(assoc => 
      assoc.entityId === entityId && 
      assoc.entityType === entityType &&
      assoc.isActive
    );
  };

  // Function to assign current professional to an entity
  const assignProfessionalToEntity = async (entityId: string, entityType: 'COMPANY' | 'LLP') => {
    if (!user?.username) {
      console.error('No user found for assignment');
      return;
    }
    
    try {
      console.log(`Assigning professional ${user.username} to ${entityType} ${entityId}`);
      
      const assignmentData = {
        professionalId: user.username,
        entityId: entityId,
        entityType: entityType,
        assignedDate: new Date().toISOString().split('T')[0], // Date string format
        isActive: true,
        role: 'PRIMARY' as const
      };
      
      console.log('Assignment data:', assignmentData);
      
      const result = await client.models.ProfessionalAssignment.create(assignmentData);
      
      console.log('Assignment created successfully:', result);
      
    } catch (error) {
      console.error('Error assigning professional:', error);
      alert('Warning: Company created but assignment failed. Please contact support.');
    }
  };

  // Custom success handler that also assigns the professional
  const handleEntityCreated = async (entityId: string, entityType: 'COMPANY' | 'LLP') => {
    console.log(`Handling entity created: ${entityType} with ID: ${entityId}`);
    setShowAddForm(false);
    
    // Assign the creating professional to this entity
    await assignProfessionalToEntity(entityId, entityType);
    
    // Refresh data
    fetchData();
  };
  
  // Handle service modal actions
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
  
  const closeServiceModal = () => {
    setServiceModal({ isOpen: false, entity: null, mode: 'view' });
  };
  
  // Render the appropriate form based on active tab
  const renderAddForm = () => {
    if (!showAddForm) return null;
    
    switch(activeTab) {
      case 'companies':
        return <CompanyForm onSuccess={(companyId) => handleEntityCreated(companyId, 'COMPANY')} />;
      case 'llps':
        return <LLPForm onSuccess={(llpId: string) => handleEntityCreated(llpId, 'LLP')} />;
      case 'associations':
        return <AssociateDirectorForm onSuccess={() => { setShowAddForm(false); fetchData(); }} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="professional-dashboard">
      <header className="dashboard-header">
        <h1>Professional Dashboard</h1>
        <p>Welcome, {user?.signInDetails?.loginId}</p>
        <p>Managing {companies.length} companies and {llps.length} LLPs</p>
      </header>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'companies' ? 'active' : ''} 
          onClick={() => { setActiveTab('companies'); setShowAddForm(false); }}
        >
          My Companies ({companies.length})
        </button>
        <button 
          className={activeTab === 'llps' ? 'active' : ''} 
          onClick={() => { setActiveTab('llps'); setShowAddForm(false); }}
        >
          My LLPs ({llps.length})
        </button>
        <button 
          className={activeTab === 'associations' ? 'active' : ''} 
          onClick={() => { setActiveTab('associations'); setShowAddForm(false); }}
        >
          Director Associations
        </button>
      </nav>
      
      <div className="dashboard-content">
        <div className="content-header">
          <h2>
            {activeTab === 'companies' && 'My Assigned Companies'}
            {activeTab === 'llps' && 'My Assigned LLPs'}
            {activeTab === 'associations' && 'Director Associations'}
          </h2>
          
          <button 
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : `Add ${activeTab === 'companies' ? 'Company' : activeTab === 'llps' ? 'LLP' : 'Association'}`}
          </button>
        </div>
        
        {renderAddForm()}
        
        {loading ? (
          <div className="loading">Loading your assigned entities...</div>
        ) : (
          <div className="data-table-container">
            {activeTab === 'companies' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CIN</th>
                    <th>Company Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Directors</th>
                    <th>Incorporation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">No companies assigned to you. Create one to get started.</td>
                    </tr>
                  ) : (
                    companies.map(company => {
                      const directors = getDirectorsForEntity(company.id, 'COMPANY');
                      return (
                        <tr key={company.cinNumber}>
                          <td>{company.cinNumber}</td>
                          <td>{company.companyName}</td>
                          <td>{company.companyType}</td>
                          <td>{company.companyStatus}</td>
                          <td>{directors.length} directors</td>
                          <td>{company.dateOfIncorporation ? new Date(company.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          <td>
                            <button 
                              className="action-button"
                              onClick={() => handleViewEntity(company, 'COMPANY')}
                            >
                              View
                            </button>
                            <button 
                              className="action-button"
                              onClick={() => handleEditEntity(company, 'COMPANY')}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
            
            {activeTab === 'llps' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>LLPIN</th>
                    <th>LLP Name</th>
                    <th>Status</th>
                    <th>Partners</th>
                    <th>Directors</th>
                    <th>Incorporation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {llps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">No LLPs assigned to you. Create one to get started.</td>
                    </tr>
                  ) : (
                    llps.map(llp => {
                      const directors = getDirectorsForEntity(llp.id, 'LLP');
                      return (
                        <tr key={llp.llpIN}>
                          <td>{llp.llpIN}</td>
                          <td>{llp.llpName}</td>
                          <td>{llp.llpStatus}</td>
                          <td>{llp.numberOfPartners} ({llp.numberOfDesignatedPartners} designated)</td>
                          <td>{directors.length} associated</td>
                          <td>{llp.dateOfIncorporation ? new Date(llp.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          <td>
                            <button 
                              className="action-button"
                              onClick={() => handleViewEntity(llp, 'LLP')}
                            >
                              View
                            </button>
                            <button 
                              className="action-button"
                              onClick={() => handleEditEntity(llp, 'LLP')}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
            
            {activeTab === 'associations' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Director</th>
                    <th>Entity</th>
                    <th>Entity Type</th>
                    <th>Association Type</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">No director associations found for your entities.</td>
                    </tr>
                  ) : (
                    associations.map(assoc => {
                      const director = directorLookup.get(assoc.userId);
                      const entity = entityLookup.get(assoc.entityId);
                      
                      return (
                        <tr key={`${assoc.userId}-${assoc.entityId}`}>
                          <td>
                            {director ? (
                              <div>
                                <div>{director.email}</div>
                                {director.displayName && (
                                  <small style={{ color: '#666' }}>{director.displayName}</small>
                                )}
                              </div>
                            ) : (
                              'Loading...'
                            )}
                          </td>
                          <td>
                            {entity ? (
                              <div>
                                <div>{entity.name}</div>
                                <small style={{ color: '#666' }}>
                                  {entity.type === 'COMPANY' ? 'CIN' : 'LLPIN'}: {entity.identifier}
                                </small>
                              </div>
                            ) : (
                              'Loading...'
                            )}
                          </td>
                          <td>{assoc.entityType}</td>
                          <td>{assoc.associationType}</td>
                          <td>{assoc.appointmentDate ? new Date(assoc.appointmentDate).toLocaleDateString() : '-'}</td>
                          <td>{assoc.isActive ? 'Active' : 'Inactive'}</td>
                          <td>
                            <button className="action-button">View</button>
                            <button className="action-button delete-button">Remove</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        <ServiceModal
          isOpen={serviceModal.isOpen}
          onClose={closeServiceModal}
          entity={serviceModal.entity}
          mode={serviceModal.mode}
        />
      </div>
    </div>
  );
};

export default ProfessionalDashboard;