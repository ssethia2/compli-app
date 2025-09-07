// src/components/director/DirectorDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import NameReservationForm from './NameReservationForm';
import FileUpload from '../shared/FileUpload';
import DocumentList from '../shared/DocumentList';
import ESignatureModal from '../shared/ESignatureModal';
import SignatureDisplay from '../shared/SignatureDisplay';
import './DirectorDashboard.css';

const client = generateClient<Schema>();

const DirectorDashboard: React.FC = () => {
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('director-profile');
  const [associations, setAssociations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempEntities, setTempEntities] = useState<any[]>([]);
  const [professionalAssignments, setProfessionalAssignments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showNameReservation, setShowNameReservation] = useState<{
    show: boolean;
    entityType: 'COMPANY' | 'LLP' | null;
  }>({ show: false, entityType: null });
  const [directorAppointmentData, setDirectorAppointmentData] = useState({
    din: '',
    email: '',
    pan: '',
    appointmentDate: '',
    category: 'PROMOTER',
    designation: 'CHAIRMAN',
    authorizedSignatoryDin: ''
  });
  const [directorResignationData, setDirectorResignationData] = useState({
    din: '',
    resignationDate: '',
    reason: '',
    authorizedSignatoryDin: ''
  });
  const [directorKycData, setDirectorKycData] = useState({
    din: '',
    aadhar: '',
    pan: '',
    email: '',
    mobile: ''
  });
  
  // Selective refresh triggers
  const [documentsRefreshTrigger, setDocumentsRefreshTrigger] = useState(0);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const [associationsRefreshTrigger, setAssociationsRefreshTrigger] = useState(0);
  
  // E-signature modal state
  const [showESignModal, setShowESignModal] = useState(false);
  
  // Selective refresh functions (memoized to prevent unnecessary re-renders)
  const refreshDocuments = useCallback(() => {
    setDocumentsRefreshTrigger(prev => prev + 1);
  }, []);
  
  const refreshProfile = useCallback(() => {
    setProfileRefreshTrigger(prev => prev + 1);
  }, []);
  
  const refreshAssociations = useCallback(() => {
    setAssociationsRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Fetch only user profile data (for e-signature updates)
  const fetchUserProfileOnly = async () => {
    if (!user?.username) return;
    
    try {
      const userProfileResult = await client.models.UserProfile.list({
        filter: {
          or: [
            { userId: { eq: user.username } },
            { email: { eq: user.signInDetails?.loginId || user.username } }
          ]
        }
      });
      
      if (userProfileResult.data.length > 0) {
        setUserProfile(userProfileResult.data[0]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const handleSignatureSaved = useCallback((signatureUrl: string) => {
    // Trigger profile refresh (effect will handle the actual fetching)
    refreshProfile();
    alert('E-signature saved successfully!');
  }, [refreshProfile]);
  
  // Store professional lookup map for associations display
  const [professionalLookup, setProfessionalLookup] = useState<Map<string, any>>(new Map());
  
  // Function to get valid designations based on category
  const getValidDesignations = (category: string): string[] => {
    switch (category) {
      case 'PROMOTER':
        return ['CHAIRMAN', 'EXECUTIVE'];
      case 'PROFESSIONAL':
        return ['CHAIRMAN', 'EXECUTIVE', 'NON_EXECUTIVE'];
      case 'INDEPENDENT':
        return ['NON_EXECUTIVE'];
      case 'SMALL_SHAREHOLDER':
        return ['NON_EXECUTIVE'];
      default:
        return ['NON_EXECUTIVE'];
    }
  };
  
  // Function to handle category change and update designation accordingly
  const handleCategoryChange = (newCategory: string) => {
    const validDesignations = getValidDesignations(newCategory);
    setDirectorAppointmentData({
      ...directorAppointmentData,
      category: newCategory,
      designation: validDesignations[0] // Set to first valid designation
    });
  };
  
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
      setUserProfile(directorProfile);
      
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
  
  // Profile refresh effect
  useEffect(() => {
    if (profileRefreshTrigger > 0) {
      fetchUserProfileOnly();
    }
  }, [profileRefreshTrigger]);
  
  // Associations refresh effect  
  useEffect(() => {
    if (associationsRefreshTrigger > 0) {
      fetchDirectorData();
    }
  }, [associationsRefreshTrigger]);
  
  return (
    <div className="director-dashboard">
      <header className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Welcome, {user?.signInDetails?.loginId}</p>
        <p>Managing {associations.length} associations across {companies.length} companies and {llps.length} LLPs</p>
      </header>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'director-profile' ? 'active' : ''} 
          onClick={() => setActiveTab('director-profile')}
        >
          Director Dashboard
        </button>
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
          className={activeTab === 'services' ? 'active' : ''} 
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''} 
          onClick={() => setActiveTab('documents')}
        >
          My Documents
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
            {activeTab === 'director-profile' && (
              <div>
                <h2>Director Dashboard</h2>
                <div className="director-profile-card">
                  <div className="profile-header">
                    <h3>Director Profile Information</h3>
                  </div>
                  <div className="profile-details">
                    <div className="profile-row">
                      <div className="profile-field">
                        <label>Name:</label>
                        <span>{userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Not specified'}</span>
                      </div>
                      <div className="profile-field">
                        <label>Email:</label>
                        <span>{userProfile?.email || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="profile-row">
                      <div className="profile-field">
                        <label>DIN:</label>
                        <span>{userProfile?.din || 'Not specified'}</span>
                      </div>
                      <div className="profile-field">
                        <label>DIN Status:</label>
                        <span className={`status-badge ${userProfile?.dinStatus?.toLowerCase() || 'unknown'}`}>
                          {userProfile?.dinStatus || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="profile-row">
                      <div className="profile-field">
                        <label>DSC Status:</label>
                        <span className={`status-badge ${userProfile?.dscStatus?.toLowerCase() || 'unknown'}`}>
                          {userProfile?.dscStatus || 'Not specified'}
                        </span>
                      </div>
                      <div className="profile-field">
                        <label>PAN:</label>
                        <span>{userProfile?.pan || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="profile-row">
                      <div className="profile-field full-width">
                        <label>E-signature:</label>
                        <SignatureDisplay
                          key={profileRefreshTrigger} // Force re-render when profile refreshes
                          signatureKey={userProfile?.eSignImageUrl}
                          width="250px"
                          height="100px"
                          showBorder={true}
                          showLabel={false}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button className="edit-profile-btn">Edit Profile</button>
                    <button 
                      className="upload-esign-btn"
                      onClick={() => setShowESignModal(true)}
                    >
                      {userProfile?.eSignImageUrl ? 'Update E-signature' : 'Add E-signature'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'associations' && (
              <div key={associationsRefreshTrigger}>
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
            
            {activeTab === 'services' && (
              <div>
                <h2>Services</h2>
                <p className="tab-description">Request various compliance and corporate services for your entities and director profile.</p>
                
                <div className="services-grid">
                  <div className="service-category">
                    <h3>Company Services</h3>
                    <div className="service-items">
                      <button className="service-item">
                        <div className="service-icon">🏢</div>
                        <div className="service-details">
                          <span className="service-name">Annual Filing</span>
                          <span className="service-desc">Submit annual returns and compliance filings</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">📋</div>
                        <div className="service-details">
                          <span className="service-name">Board Resolution</span>
                          <span className="service-desc">Draft and file board resolutions</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">📝</div>
                        <div className="service-details">
                          <span className="service-name">Amendment Services</span>
                          <span className="service-desc">MOA/AOA amendments and updates</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="service-category">
                    <h3>LLP Services</h3>
                    <div className="service-items">
                      <button className="service-item">
                        <div className="service-icon">🏛️</div>
                        <div className="service-details">
                          <span className="service-name">Annual Filing</span>
                          <span className="service-desc">LLP annual returns and compliance</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">🤝</div>
                        <div className="service-details">
                          <span className="service-name">Partner Changes</span>
                          <span className="service-desc">Add/remove partners and designated partners</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">📄</div>
                        <div className="service-details">
                          <span className="service-name">Agreement Amendment</span>
                          <span className="service-desc">Update partnership agreements</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="service-category">
                    <h3>Director Services</h3>
                    <div className="service-items">
                      <button className="service-item" onClick={() => setActiveTab('director-appointment-form')}>
                        <div className="service-icon">👤</div>
                        <div className="service-details">
                          <span className="service-name">Appointment/Change in Designation of Director</span>
                          <span className="service-desc">Request appointment or change in designation of director</span>
                        </div>
                      </button>
                      <button className="service-item" onClick={() => setActiveTab('director-resignation-form')}>
                        <div className="service-icon">🔄</div>
                        <div className="service-details">
                          <span className="service-name">Director Resignation</span>
                          <span className="service-desc">Process director resignation</span>
                        </div>
                      </button>
                      <button className="service-item" onClick={() => setActiveTab('director-kyc-form')}>
                        <div className="service-icon">📋</div>
                        <div className="service-details">
                          <span className="service-name">KYC of Director</span>
                          <span className="service-desc">Submit KYC details for director verification</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="service-category">
                    <h3>Minutes</h3>
                    <div className="service-items">
                      <button className="service-item">
                        <div className="service-icon">📝</div>
                        <div className="service-details">
                          <span className="service-name">Board Meeting Minutes</span>
                          <span className="service-desc">Prepare and file board meeting minutes</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">🏛️</div>
                        <div className="service-details">
                          <span className="service-name">AGM Minutes</span>
                          <span className="service-desc">Annual general meeting documentation</span>
                        </div>
                      </button>
                      <button className="service-item">
                        <div className="service-icon">🎯</div>
                        <div className="service-details">
                          <span className="service-name">EGM Minutes</span>
                          <span className="service-desc">Extraordinary general meeting minutes</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'director-appointment-form' && (
              <div>
                <div className="content-header">
                  <h2>Appointment/Change in Designation of Director</h2>
                  <button 
                    className="cancel-button"
                    onClick={() => setActiveTab('services')}
                  >
                    Back to Services
                  </button>
                </div>
                
                <div className="director-appointment-form">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const result = await client.models.ServiceRequest.create({
                        directorId: user?.username || '',
                        serviceType: 'DIRECTOR_APPOINTMENT',
                        requestData: JSON.stringify(directorAppointmentData),
                        status: 'PENDING',
                        priority: 'MEDIUM',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      console.log('Director appointment request created:', result);
                      alert('Director appointment request submitted successfully!');
                      // Reset form
                      setDirectorAppointmentData({
                        din: '',
                        email: '',
                        pan: '',
                        appointmentDate: '',
                        category: 'PROMOTER',
                        designation: 'NON_EXECUTIVE',
                        authorizedSignatoryDin: ''
                      });
                      setActiveTab('services');
                    } catch (error) {
                      console.error('Error submitting appointment request:', error);
                      alert('Error submitting request. Please try again.');
                    }
                  }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="din">DIN of Director *</label>
                        <input
                          type="text"
                          id="din"
                          name="din"
                          value={directorAppointmentData.din}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            din: e.target.value
                          })}
                          required
                          placeholder="Enter DIN number"
                          pattern="[0-9]{8}"
                          title="DIN should be 8 digits"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="email">Email ID *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={directorAppointmentData.email}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            email: e.target.value
                          })}
                          required
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="pan">PAN of Director *</label>
                        <input
                          type="text"
                          id="pan"
                          name="pan"
                          value={directorAppointmentData.pan}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            pan: e.target.value.toUpperCase()
                          })}
                          required
                          placeholder="Enter PAN number"
                          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                          title="PAN should be in format: ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="appointmentDate">Date of Appointment/Change in Designation *</label>
                        <input
                          type="date"
                          id="appointmentDate"
                          name="appointmentDate"
                          value={directorAppointmentData.appointmentDate}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            appointmentDate: e.target.value
                          })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select
                          id="category"
                          name="category"
                          value={directorAppointmentData.category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          required
                        >
                          <option value="PROMOTER">Promoter</option>
                          <option value="PROFESSIONAL">Professional</option>
                          <option value="INDEPENDENT">Independent</option>
                          <option value="SMALL_SHAREHOLDER">Small Shareholder's Director</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="designation">Director Designation *</label>
                        <select
                          id="designation"
                          name="designation"
                          value={directorAppointmentData.designation}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            designation: e.target.value
                          })}
                          required
                        >
                          {getValidDesignations(directorAppointmentData.category).map(designation => (
                            <option key={designation} value={designation}>
                              {designation === 'CHAIRMAN' ? 'Chairman' : 
                               designation === 'EXECUTIVE' ? 'Executive Director' : 
                               'Non-Executive Director'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      
                      <div className="form-group">
                        <label htmlFor="authorizedSignatoryDin">DIN of Director Authorized to Sign *</label>
                        <input
                          type="text"
                          id="authorizedSignatoryDin"
                          name="authorizedSignatoryDin"
                          value={directorAppointmentData.authorizedSignatoryDin}
                          onChange={(e) => setDirectorAppointmentData({
                            ...directorAppointmentData,
                            authorizedSignatoryDin: e.target.value
                          })}
                          required
                          placeholder="Enter authorizing director's DIN"
                          pattern="[0-9]{8}"
                          title="DIN should be 8 digits"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-button" onClick={() => setActiveTab('services')}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'director-resignation-form' && (
              <div>
                <div className="content-header">
                  <h2>Director Resignation</h2>
                  <button 
                    className="cancel-button"
                    onClick={() => setActiveTab('services')}
                  >
                    Back to Services
                  </button>
                </div>
                
                <div className="director-resignation-form">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const result = await client.models.ServiceRequest.create({
                        directorId: user?.username || '',
                        serviceType: 'DIRECTOR_RESIGNATION',
                        requestData: JSON.stringify(directorResignationData),
                        status: 'PENDING',
                        priority: 'HIGH',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      console.log('Director resignation request created:', result);
                      alert('Director resignation request submitted successfully!');
                      // Reset form
                      setDirectorResignationData({
                        din: '',
                        resignationDate: '',
                        reason: '',
                        authorizedSignatoryDin: ''
                      });
                      setActiveTab('services');
                    } catch (error) {
                      console.error('Error submitting resignation request:', error);
                      alert('Error submitting request. Please try again.');
                    }
                  }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="resignationDin">DIN of Resigning Director *</label>
                        <input
                          type="text"
                          id="resignationDin"
                          name="resignationDin"
                          value={directorResignationData.din}
                          onChange={(e) => setDirectorResignationData({
                            ...directorResignationData,
                            din: e.target.value
                          })}
                          required
                          placeholder="Enter DIN number"
                          pattern="[0-9]{8}"
                          title="DIN should be 8 digits"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="resignationDate">Date of Resignation *</label>
                        <input
                          type="date"
                          id="resignationDate"
                          name="resignationDate"
                          value={directorResignationData.resignationDate}
                          onChange={(e) => setDirectorResignationData({
                            ...directorResignationData,
                            resignationDate: e.target.value
                          })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="reason">Reason for Resignation *</label>
                        <textarea
                          id="reason"
                          name="reason"
                          value={directorResignationData.reason}
                          onChange={(e) => setDirectorResignationData({
                            ...directorResignationData,
                            reason: e.target.value
                          })}
                          required
                          rows={4}
                          placeholder="Please provide the reason for resignation"
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="resignationAuthorizedSignatoryDin">DIN of Director Authorized to Sign *</label>
                        <input
                          type="text"
                          id="resignationAuthorizedSignatoryDin"
                          name="resignationAuthorizedSignatoryDin"
                          value={directorResignationData.authorizedSignatoryDin}
                          onChange={(e) => setDirectorResignationData({
                            ...directorResignationData,
                            authorizedSignatoryDin: e.target.value
                          })}
                          required
                          placeholder="Enter authorizing director's DIN"
                          pattern="[0-9]{8}"
                          title="DIN should be 8 digits"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-button" onClick={() => setActiveTab('services')}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        Submit Resignation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'director-kyc-form' && (
              <div>
                <div className="content-header">
                  <h2>KYC of Director</h2>
                  <button 
                    className="cancel-button"
                    onClick={() => setActiveTab('services')}
                  >
                    Back to Services
                  </button>
                </div>
                
                <div className="director-kyc-form">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const result = await client.models.ServiceRequest.create({
                        directorId: user?.username || '',
                        serviceType: 'DIRECTOR_KYC',
                        requestData: JSON.stringify(directorKycData),
                        status: 'PENDING',
                        priority: 'MEDIUM',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      console.log('Director KYC request created:', result);
                      alert('Director KYC details submitted successfully!');
                      // Reset form
                      setDirectorKycData({
                        din: '',
                        aadhar: '',
                        pan: '',
                        email: '',
                        mobile: ''
                      });
                      setActiveTab('services');
                    } catch (error) {
                      console.error('Error submitting KYC request:', error);
                      alert('Error submitting request. Please try again.');
                    }
                  }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="kycDin">DIN of Director *</label>
                        <input
                          type="text"
                          id="kycDin"
                          name="kycDin"
                          value={directorKycData.din}
                          onChange={(e) => setDirectorKycData({
                            ...directorKycData,
                            din: e.target.value
                          })}
                          required
                          placeholder="Enter DIN number"
                          pattern="[0-9]{8}"
                          title="DIN should be 8 digits"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="kycPan">PAN of Director *</label>
                        <input
                          type="text"
                          id="kycPan"
                          name="kycPan"
                          value={directorKycData.pan}
                          onChange={(e) => setDirectorKycData({
                            ...directorKycData,
                            pan: e.target.value.toUpperCase()
                          })}
                          required
                          placeholder="Enter PAN number"
                          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                          title="PAN should be in format: ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="kycAadhar">Aadhar Number *</label>
                        <input
                          type="text"
                          id="kycAadhar"
                          name="kycAadhar"
                          value={directorKycData.aadhar}
                          onChange={(e) => {
                            // Remove all non-digits and limit to 12 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setDirectorKycData({
                              ...directorKycData,
                              aadhar: value
                            });
                          }}
                          required
                          placeholder="Enter 12-digit Aadhar number"
                          pattern="[0-9]{12}"
                          title="Aadhar should be 12 digits"
                          maxLength={12}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="kycEmail">Email ID *</label>
                        <input
                          type="email"
                          id="kycEmail"
                          name="kycEmail"
                          value={directorKycData.email}
                          onChange={(e) => setDirectorKycData({
                            ...directorKycData,
                            email: e.target.value
                          })}
                          required
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="kycMobile">Mobile Number *</label>
                        <input
                          type="tel"
                          id="kycMobile"
                          name="kycMobile"
                          value={directorKycData.mobile}
                          onChange={(e) => {
                            // Remove all non-digits and limit to 10 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setDirectorKycData({
                              ...directorKycData,
                              mobile: value
                            });
                          }}
                          required
                          placeholder="Enter 10-digit mobile number"
                          pattern="[0-9]{10}"
                          title="Mobile number should be 10 digits"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="cancel-button" onClick={() => setActiveTab('services')}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        Submit KYC Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div>
                <h2>My Documents</h2>
                <p className="tab-description">
                  Upload and manage your personal compliance documents. These documents are private to your account.
                </p>
                
                <div className="documents-section">
                  <div className="upload-section">
                    <h3>Upload Documents</h3>
                    <FileUpload
                      documentType="IDENTITY"
                      onRefresh={refreshDocuments}
                      maxFileSize={15 * 1024 * 1024} // 15MB for director documents
                      acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
                      isMultiple={true}
                    />
                  </div>
                  
                  <div className="documents-list-section">
                    <DocumentList
                      key={documentsRefreshTrigger} // Force re-render when refresh trigger changes
                      showUploader={false}
                      allowDelete={true}
                      onRefresh={refreshDocuments}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
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

export default DirectorDashboard;