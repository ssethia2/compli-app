// src/components/professional/ProfessionalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import CompanyForm from './CompanyForm';
import LLPForm from './LLPForm';
import AssociateDirectorForm from './AssociateDirectorForm';
import ServiceModal from './ServiceModal';
import PendingTasks from '../shared/PendingTasks';
import './ProfessionalDashboard.css';

const client = generateClient<Schema>();

// Service Requests Tab Component
const ServiceRequestsTab: React.FC = () => {
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const result = await client.models.ServiceRequest.list();
      // Sort by creation date (newest first)
      const sortedRequests = result.data.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      setServiceRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string, comments?: string) => {
    try {
      await client.models.ServiceRequest.update({
        id: requestId,
        status: newStatus as any,
        updatedAt: new Date().toISOString(),
        comments: comments || undefined
      });
      fetchServiceRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Error updating request status');
    }
  };

  const formatServiceType = (serviceType: string) => {
    return serviceType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'APPROVED': return 'status-completed';
      case 'REJECTED': return 'status-rejected';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const showRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  if (loading) {
    return <div className="loading">Loading service requests...</div>;
  }

  return (
    <>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Service Type</th>
              <th>Director ID</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">No service requests found.</td>
              </tr>
            ) : (
              serviceRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.id?.slice(-8) || 'N/A'}</td>
                  <td>{formatServiceType(request.serviceType)}</td>
                  <td>{request.directorId}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${request.priority?.toLowerCase()}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button 
                      className="action-button"
                      onClick={() => showRequestDetails(request)}
                    >
                      View
                    </button>
                    {request.status === 'PENDING' && (
                      <>
                        <button 
                          className="action-button"
                          onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}
                        >
                          Start
                        </button>
                        <button 
                          className="action-button"
                          onClick={() => updateRequestStatus(request.id, 'APPROVED')}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-button delete-button"
                          onClick={() => updateRequestStatus(request.id, 'REJECTED', 'Request rejected by professional')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'IN_PROGRESS' && (
                      <button 
                        className="action-button"
                        onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="service-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-modal-header">
              <h2>{formatServiceType(selectedRequest.serviceType)} Request</h2>
              <button className="close-button" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="service-modal-content">
              <div className="request-details">
                <h3>Request Information</h3>
                <div className="detail-row">
                  <strong>Request ID:</strong> {selectedRequest.id}
                </div>
                <div className="detail-row">
                  <strong>Director ID:</strong> {selectedRequest.directorId}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Priority:</strong> {selectedRequest.priority}
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                </div>
                {selectedRequest.comments && (
                  <div className="detail-row">
                    <strong>Comments:</strong> {selectedRequest.comments}
                  </div>
                )}
                
                <h3>Request Data</h3>
                <div className="request-data">
                  <pre>{JSON.stringify(JSON.parse(selectedRequest.requestData || '{}'), null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
          Company Master Dashboard ({companies.length})
        </button>
        <button 
          className={activeTab === 'llps' ? 'active' : ''} 
          onClick={() => { setActiveTab('llps'); setShowAddForm(false); }}
        >
          LLP Master Dashboard ({llps.length})
        </button>
        <button 
          className={activeTab === 'associations' ? 'active' : ''} 
          onClick={() => { setActiveTab('associations'); setShowAddForm(false); }}
        >
          Director Dashboard
        </button>
        <button 
          className={activeTab === 'service-requests' ? 'active' : ''} 
          onClick={() => { setActiveTab('service-requests'); setShowAddForm(false); }}
        >
          Service Requests
        </button>
        <button 
          className={activeTab === 'pending-tasks' ? 'active' : ''} 
          onClick={() => { setActiveTab('pending-tasks'); setShowAddForm(false); }}
        >
          Pending Tasks
        </button>
      </nav>
      
      <div className="dashboard-content">
        <div className="content-header">
          <h2>
            {activeTab === 'companies' && 'Company Master Dashboard'}
            {activeTab === 'llps' && 'LLP Master Dashboard'}
            {activeTab === 'associations' && 'Director Dashboard'}
            {activeTab === 'service-requests' && 'Service Requests'}
            {activeTab === 'pending-tasks' && 'Pending Tasks'}
          </h2>
          
          {activeTab !== 'pending-tasks' && (
            <button 
              className="add-button"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : `Add ${activeTab === 'companies' ? 'Company' : activeTab === 'llps' ? 'LLP' : activeTab === 'associations' ? 'Association' : activeTab === 'service-requests' ? 'Service Request' : 'Item'}`}
            </button>
          )}
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
                    <th>Company Name</th>
                    <th>CIN</th>
                    <th>Type</th>
                    <th>Registered Office</th>
                    <th>Email</th>
                    <th>Incorporation Date</th>
                    <th>Directors</th>
                    <th>Capital (Auth/Paid)</th>
                    <th>Status</th>
                    <th>Last Filing</th>
                    <th>FY</th>
                    <th>AGM</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="no-data">No companies assigned to you. Create one to get started.</td>
                    </tr>
                  ) : (
                    companies.map(company => {
                      const directors = getDirectorsForEntity(company.id, 'COMPANY');
                      return (
                        <tr key={company.cinNumber}>
                          <td>{company.companyName}</td>
                          <td>{company.cinNumber}</td>
                          <td>{company.companyType === 'ONE_PERSON' ? 'OPC' : company.companyType}</td>
                          <td>{company.registeredAddress || '-'}</td>
                          <td>{company.emailId || '-'}</td>
                          <td>{company.dateOfIncorporation ? new Date(company.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          <td>{directors.length} directors</td>
                          <td>
                            {company.authorizedCapital || company.paidUpCapital ? (
                              <div>
                                <div>₹{(company.authorizedCapital || 0).toLocaleString()}</div>
                                <small>₹{(company.paidUpCapital || 0).toLocaleString()}</small>
                              </div>
                            ) : '-'}
                          </td>
                          <td>{company.companyStatus === 'UNDER_PROCESS' ? 'In Progress' : company.companyStatus}</td>
                          <td>{company.lastAnnualFilingDate ? new Date(company.lastAnnualFilingDate).toLocaleDateString() : '-'}</td>
                          <td>{company.financialYear || '-'}</td>
                          <td>{company.agmDate ? new Date(company.agmDate).toLocaleDateString() : '-'}</td>
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
                    <th>LLP Name</th>
                    <th>LLPIN</th>
                    <th>Registered Office</th>
                    <th>Email</th>
                    <th>Incorporation Date</th>
                    <th>Partners/Designated</th>
                    <th>Contribution</th>
                    <th>Status</th>
                    <th>Last Filing</th>
                    <th>FY</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {llps.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="no-data">No LLPs assigned to you. Create one to get started.</td>
                    </tr>
                  ) : (
                    llps.map(llp => {
                      return (
                        <tr key={llp.llpIN}>
                          <td>{llp.llpName}</td>
                          <td>{llp.llpIN}</td>
                          <td>{llp.registeredAddress || '-'}</td>
                          <td>{llp.emailId || '-'}</td>
                          <td>{llp.dateOfIncorporation ? new Date(llp.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          <td>
                            {llp.numberOfPartners}/{llp.numberOfDesignatedPartners}
                            <br />
                            <small>Partners/Designated</small>
                          </td>
                          <td>₹{(llp.totalObligationOfContribution || 0).toLocaleString()}</td>
                          <td>{llp.llpStatus === 'UNDER_PROCESS' ? 'In Progress' : llp.llpStatus}</td>
                          <td>{llp.lastAnnualFilingDate ? new Date(llp.lastAnnualFilingDate).toLocaleDateString() : '-'}</td>
                          <td>{llp.financialYear || '-'}</td>
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
                    <th>Director Name</th>
                    <th>Email</th>
                    <th>DIN</th>
                    <th>Co/LLP Name</th>
                    <th>Type</th>
                    <th>Association Type</th>
                    <th>Original Appointment</th>
                    <th>Current Designation Date</th>
                    <th>Cessation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="no-data">No director associations found for your entities.</td>
                    </tr>
                  ) : (
                    associations.map(assoc => {
                      const director = directorLookup.get(assoc.userId);
                      const entity = entityLookup.get(assoc.entityId);
                      
                      return (
                        <tr key={`${assoc.userId}-${assoc.entityId}`}>
                          <td>
                            {director ? (
                              director.displayName || director.email.split('@')[0]
                            ) : (
                              'Loading...'
                            )}
                          </td>
                          <td>
                            {director ? director.email : 'Loading...'}
                          </td>
                          <td>{assoc.din || '-'}</td>
                          <td>
                            {entity ? entity.name : 'Loading...'}
                          </td>
                          <td>
                            {entity ? (
                              <div>
                                <div>{entity.type === 'COMPANY' ? 'Company' : 'LLP'}</div>
                                <small style={{ color: '#666' }}>
                                  {entity.type === 'COMPANY' ? 'CIN' : 'LLPIN'}: {entity.identifier}
                                </small>
                              </div>
                            ) : (
                              'Loading...'
                            )}
                          </td>
                          <td>{assoc.associationType === 'DIRECTOR' ? 'Director' : assoc.associationType === 'DESIGNATED_PARTNER' ? 'Designated Partner' : 'Partner'}</td>
                          <td>{assoc.originalAppointmentDate ? new Date(assoc.originalAppointmentDate).toLocaleDateString() : '-'}</td>
                          <td>{assoc.appointmentDate ? new Date(assoc.appointmentDate).toLocaleDateString() : '-'}</td>
                          <td>{assoc.cessationDate ? new Date(assoc.cessationDate).toLocaleDateString() : (assoc.isActive ? '-' : 'N/A')}</td>
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
            
            {activeTab === 'service-requests' && (
              <div>
                <h2>Service Requests</h2>
                <ServiceRequestsTab />
              </div>
            )}
            
            {activeTab === 'pending-tasks' && (
              <PendingTasks 
                userId={user?.username || ''}
                userRole="PROFESSIONALS"
              />
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