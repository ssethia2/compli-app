// src/components/director/DirectorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import NameReservationForm from './NameReservationForm';
import './DirectorDashboard.css';

const client = generateClient<Schema>();

const DirectorDashboard: React.FC = () => {
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('associations');
  const [associations, setAssociations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempEntities, setTempEntities] = useState<any[]>([]);
  const [professionalAssignments, setProfessionalAssignments] = useState<any[]>([]);
  const [showNameReservation, setShowNameReservation] = useState<{
    show: boolean;
    entityType: 'COMPANY' | 'LLP' | null;
  }>({ show: false, entityType: null });
  
  // Store professional lookup map for associations display
  const [professionalLookup, setProfessionalLookup] = useState<Map<string, any>>(new Map());
  
  // Fetch director's associations and related entities
  const fetchDirectorData = async () => {
    if (!user?.username) return;
    
    setLoading(true);
    try {
      console.log('Fetching director associations for:', user.username);
      
      // 1. Get director's UserProfile to find their userId
      const userProfileResult = await client.models.UserProfile.list({
        filter: {
          or: [
            { userId: { eq: user.username } },
            { email: { eq: user.signInDetails?.loginId || user.username } }
          ]
        }
      });
      
      if (userProfileResult.data.length === 0) {
        console.warn('No UserProfile found for director');
        setLoading(false);
        return;
      }
      
      const directorProfile = userProfileResult.data[0];
      console.log('Director profile:', directorProfile);
      
      // 2. Get all associations for this director
      const associationsResult = await client.models.DirectorAssociation.list({
        filter: {
          and: [
            { userId: { eq: directorProfile.userId } },
            { isActive: { eq: true } }
          ]
        }
      });
      
      const directorAssociations = associationsResult.data;
      console.log('Director associations:', directorAssociations);
      
      // 3. Separate company and LLP associations
      const companyIds = directorAssociations
        .filter(a => a.entityType === 'COMPANY')
        .map(a => a.entityId);
      
      const llpIds = directorAssociations
        .filter(a => a.entityType === 'LLP')
        .map(a => a.entityId);
      
      console.log('Company IDs:', companyIds);
      console.log('LLP IDs:', llpIds);
      
      // 4. Fetch associated companies
      const associatedCompanies = [];
      for (const companyId of companyIds) {
        try {
          const companyResult = await client.models.Company.get({ id: companyId });
          if (companyResult.data) {
            associatedCompanies.push(companyResult.data);
          }
        } catch (error) {
          console.warn(`Could not fetch company ${companyId}:`, error);
        }
      }
      
      // 5. Fetch associated LLPs
      const associatedLLPs = [];
      for (const llpId of llpIds) {
        try {
          const llpResult = await client.models.LLP.get({ id: llpId });
          if (llpResult.data) {
            associatedLLPs.push(llpResult.data);
          }
        } catch (error) {
          console.warn(`Could not fetch LLP ${llpId}:`, error);
        }
      }
      
      console.log('Associated companies:', associatedCompanies);
      console.log('Associated LLPs:', associatedLLPs);
      
      // 6. Fetch professional assignments for director's entities
      await fetchProfessionalAssignments([...companyIds, ...llpIds]);
      
      setAssociations(directorAssociations);
      setCompanies(associatedCompanies);
      setLlps(associatedLLPs);
      
    } catch (err) {
      console.error('Error fetching director data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch professional assignments for the director's entities
  const fetchProfessionalAssignments = async (entityIds: string[]) => {
    if (entityIds.length === 0) return;
    
    try {
      console.log('Fetching professional assignments for entities:', entityIds);
      
      // Get all professional assignments for these entities
      const assignmentsResult = await client.models.ProfessionalAssignment.list({
        filter: {
          and: [
            {
              or: entityIds.map(entityId => ({ entityId: { eq: entityId } }))
            },
            { isActive: { eq: true } }
          ]
        }
      });
      
      const assignments = assignmentsResult.data;
      console.log('Professional assignments found:', assignments);
      
      // Build professional lookup map
      const professionalMap = new Map();
      const uniqueProfessionalIds = [...new Set(assignments.map(assign => assign.professionalId))];
      
      for (const professionalId of uniqueProfessionalIds) {
        try {
          const professionalResult = await client.models.UserProfile.list({
            filter: { userId: { eq: professionalId } }
          });
          
          if (professionalResult.data && professionalResult.data.length > 0) {
            const professional = professionalResult.data[0];
            professionalMap.set(professionalId, {
              email: professional.email,
              displayName: professional.displayName,
              userId: professional.userId
            });
          } else {
            professionalMap.set(professionalId, { 
              email: 'Professional profile not found', 
              displayName: null, 
              userId: professionalId 
            });
          }
        } catch (error) {
          console.warn(`Could not fetch professional ${professionalId}:`, error);
          professionalMap.set(professionalId, { 
            email: 'Error loading professional', 
            displayName: null, 
            userId: professionalId 
          });
        }
      }
      
      setProfessionalLookup(professionalMap);
      setProfessionalAssignments(assignments);
      
    } catch (error) {
      console.error('Error fetching professional assignments:', error);
    }
  };
  
  // Fetch temporary entities in progress
  const fetchTempEntities = async () => {
    if (!user?.username) return;
    
    try {
      // TODO: Implement actual fetch from TempEntity model when created
      // For now, use localStorage to persist temp entities
      const storageKey = `tempEntities_${user.username}`;
      const storedEntities = localStorage.getItem(storageKey);
      if (storedEntities) {
        setTempEntities(JSON.parse(storedEntities));
      } else {
        setTempEntities([]);
      }
      console.log('Fetching temp entities for:', user.username);
    } catch (error) {
      console.error('Error fetching temp entities:', error);
    }
  };
  
  // Handle name reservation success
  const handleNameReservationSuccess = (tempEntityData: any) => {
    console.log('Name reservation successful:', tempEntityData);
    
    // Store in localStorage (until we have proper database)
    const storageKey = `tempEntities_${user?.username}`;
    const existingEntities = localStorage.getItem(storageKey);
    const entities = existingEntities ? JSON.parse(existingEntities) : [];
    
    const newEntity = {
      id: `temp_${tempEntityData.entityType.toLowerCase()}_${Date.now()}`,
      ...tempEntityData,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    entities.push(newEntity);
    localStorage.setItem(storageKey, JSON.stringify(entities));
    
    // Update state
    setTempEntities(entities);
    setShowNameReservation({ show: false, entityType: null });
    
    // Show success message
    alert('Name reservation submitted successfully! A compliance professional will review your request.');
  };
  
  // Handle entity creation buttons
  const handleCreateEntity = (entityType: 'COMPANY' | 'LLP') => {
    setShowNameReservation({ show: true, entityType });
  };
  
  // Initial data load
  useEffect(() => {
    fetchDirectorData();
    fetchTempEntities();
  }, [user?.username]);
  
  return (
    <div className="director-dashboard">
      <header className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Welcome, {user?.signInDetails?.loginId}</p>
        <p>Managing {associations.length} associations across {companies.length} companies and {llps.length} LLPs</p>
      </header>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'associations' ? 'active' : ''} 
          onClick={() => setActiveTab('associations')}
        >
          My Associations ({associations.length})
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
        <button 
          className={activeTab === 'professional-associations' ? 'active' : ''} 
          onClick={() => setActiveTab('professional-associations')}
        >
          Professional Associations ({professionalAssignments.length})
        </button>
        <button 
          className={activeTab === 'entities-in-progress' ? 'active' : ''} 
          onClick={() => setActiveTab('entities-in-progress')}
        >
          Entities in Progress ({tempEntities.length})
        </button>
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >
          Change Requests
        </button>
      </nav>
      
      <div className="dashboard-content">
        {showNameReservation.show ? (
          <div>
            <div className="content-header">
              <h2>Create New {showNameReservation.entityType === 'COMPANY' ? 'Company' : 'LLP'}</h2>
              <button 
                className="cancel-button"
                onClick={() => setShowNameReservation({ show: false, entityType: null })}
              >
                Cancel
              </button>
            </div>
            <NameReservationForm 
              entityType={showNameReservation.entityType!}
              onSuccess={handleNameReservationSuccess}
            />
          </div>
        ) : loading ? (
          <div className="loading">Loading your associations...</div>
        ) : (
          <>
            {activeTab === 'associations' && (
              <div>
                <h2>My Director Associations</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Entity Type</th>
                      <th>Association Type</th>
                      <th>Appointment Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data">No associations found. Contact a compliance professional to be added to entities.</td>
                      </tr>
                    ) : (
                      associations.map(assoc => {
                        // Find the entity details
                        const entity = assoc.entityType === 'COMPANY' 
                          ? companies.find(c => c.id === assoc.entityId)
                          : llps.find(l => l.id === assoc.entityId);
                        
                        return (
                          <tr key={`${assoc.userId}-${assoc.entityId}`}>
                            <td>
                              {entity ? (
                                <div>
                                  <div>{assoc.entityType === 'COMPANY' ? entity.companyName : entity.llpName}</div>
                                  <small style={{ color: '#666' }}>
                                    {assoc.entityType === 'COMPANY' ? 'CIN' : 'LLPIN'}: {assoc.entityType === 'COMPANY' ? entity.cinNumber : entity.llpIN}
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
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'companies' && (
              <div>
                <h2>Associated Companies</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>CIN</th>
                      <th>Company Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>My Role</th>
                      <th>Incorporation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="no-data">No associated companies found.</td>
                      </tr>
                    ) : (
                      companies.map(company => {
                        const myAssociation = associations.find(a => a.entityId === company.id && a.entityType === 'COMPANY');
                        return (
                          <tr key={company.id}>
                            <td>{company.cinNumber}</td>
                            <td>{company.companyName}</td>
                            <td>{company.companyType}</td>
                            <td>{company.companyStatus}</td>
                            <td>{myAssociation?.associationType || '-'}</td>
                            <td>{company.dateOfIncorporation ? new Date(company.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'llps' && (
              <div>
                <h2>Associated LLPs</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>LLPIN</th>
                      <th>LLP Name</th>
                      <th>Status</th>
                      <th>Partners</th>
                      <th>My Role</th>
                      <th>Incorporation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {llps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="no-data">No associated LLPs found.</td>
                      </tr>
                    ) : (
                      llps.map(llp => {
                        const myAssociation = associations.find(a => a.entityId === llp.id && a.entityType === 'LLP');
                        return (
                          <tr key={llp.id}>
                            <td>{llp.llpIN}</td>
                            <td>{llp.llpName}</td>
                            <td>{llp.llpStatus}</td>
                            <td>{llp.numberOfPartners} ({llp.numberOfDesignatedPartners} designated)</td>
                            <td>{myAssociation?.associationType || '-'}</td>
                            <td>{llp.dateOfIncorporation ? new Date(llp.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'professional-associations' && (
              <div>
                <h2>Professional Associations</h2>
                <p className="tab-description">
                  View compliance professionals assigned to manage your entities.
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Professional</th>
                      <th>Entity</th>
                      <th>Entity Type</th>
                      <th>Assignment Role</th>
                      <th>Assigned Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionalAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="no-data">
                          No professional associations found. Contact support to assign a compliance professional to your entities.
                        </td>
                      </tr>
                    ) : (
                      professionalAssignments.map(assignment => {
                        const professional = professionalLookup.get(assignment.professionalId);
                        const entity = assignment.entityType === 'COMPANY' 
                          ? companies.find(c => c.id === assignment.entityId)
                          : llps.find(l => l.id === assignment.entityId);
                        
                        return (
                          <tr key={`${assignment.professionalId}-${assignment.entityId}`}>
                            <td>
                              {professional ? (
                                <div>
                                  <div>{professional.email}</div>
                                  {professional.displayName && (
                                    <small style={{ color: '#666' }}>{professional.displayName}</small>
                                  )}
                                </div>
                              ) : (
                                'Loading...'
                              )}
                            </td>
                            <td>
                              {entity ? (
                                <div>
                                  <div>{assignment.entityType === 'COMPANY' ? entity.companyName : entity.llpName}</div>
                                  <small style={{ color: '#666' }}>
                                    {assignment.entityType === 'COMPANY' ? 'CIN' : 'LLPIN'}: {assignment.entityType === 'COMPANY' ? entity.cinNumber : entity.llpIN}
                                  </small>
                                </div>
                              ) : (
                                'Loading...'
                              )}
                            </td>
                            <td>{assignment.entityType}</td>
                            <td>{assignment.role || 'PRIMARY'}</td>
                            <td>{assignment.assignedDate ? new Date(assignment.assignedDate).toLocaleDateString() : '-'}</td>
                            <td>
                              <span className={`status-badge status-${assignment.isActive ? 'active' : 'inactive'}`}>
                                {assignment.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'entities-in-progress' && (
              <div>
                <div className="content-header">
                  <h2>Entities in Progress</h2>
                  <div className="entity-creation-buttons">
                    <button 
                      className="create-button"
                      onClick={() => handleCreateEntity('COMPANY')}
                    >
                      Create Company
                    </button>
                    <button 
                      className="create-button"
                      onClick={() => handleCreateEntity('LLP')}
                    >
                      Create LLP
                    </button>
                  </div>
                </div>
                
                {tempEntities.length === 0 ? (
                  <div className="no-data-message">
                    <p>No entities currently in progress.</p>
                    <p>Click "Create Company" or "Create LLP" to start the incorporation process.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Entity Type</th>
                        <th>Proposed Name</th>
                        <th>Current Step</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempEntities.map(entity => (
                        <tr key={entity.id}>
                          <td>{entity.entityType}</td>
                          <td>{entity.nameReservationData?.firstProposedName || '-'}</td>
                          <td>{entity.currentStep.replace(/_/g, ' ')}</td>
                          <td>
                            <span className={`status-badge status-${entity.status.toLowerCase().replace('_', '-')}`}>
                              {entity.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>{new Date(entity.createdDate).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="action-button"
                              onClick={() => alert(`Viewing details for ${entity.nameReservationData?.firstProposedName}`)}
                            >
                              View
                            </button>
                            <button 
                              className="action-button"
                              onClick={() => alert('Continue to next step (coming soon)')}
                            >
                              Continue
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {activeTab === 'requests' && (
              <div>
                <h2>Change Requests</h2>
                <p>Change request functionality coming soon...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;