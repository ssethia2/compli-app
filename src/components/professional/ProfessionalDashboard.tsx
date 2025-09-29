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
import DocumentList from '../shared/DocumentList';
import FormGenerator from './FormGenerator';
import './ProfessionalDashboard.css';

const client = generateClient<Schema>();

// Service Requests Tab Component
const ServiceRequestsTab: React.FC = () => {
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [directorInfo, setDirectorInfo] = useState<Map<string, any>>(new Map());
  const [requestDetails, setRequestDetails] = useState<Map<string, any>>(new Map());

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
      
      // Load director information for all unique director IDs
      const uniqueDirectorIds = [...new Set(sortedRequests.map(req => req.directorId))];
      const directorMap = new Map();
      
      for (const directorId of uniqueDirectorIds) {
        try {
          const directorResult = await client.models.UserProfile.list({
            filter: { userId: { eq: directorId } }
          });
          
          if (directorResult.data && directorResult.data.length > 0) {
            const director = directorResult.data[0];
            directorMap.set(directorId, {
              displayName: director.displayName,
              email: director.email,
              din: director.din
            });
          }
        } catch (error) {
          console.warn(`Could not fetch director ${directorId}:`, error);
          directorMap.set(directorId, {
            displayName: 'Unknown Director',
            email: 'N/A',
            din: 'N/A'
          });
        }
      }
      
      setDirectorInfo(directorMap);
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

  const parseRequestData = (requestData: string, serviceType: string, requestId: string) => {
    try {
      const data = JSON.parse(requestData || '{}');
      console.log('Parsing request data:', data, 'Service type:', serviceType);
      
      // Get the enhanced details if available
      const enhancedDetails = requestDetails.get(requestId) || {};
      
      switch (serviceType) {
        case 'DIRECTOR_APPOINTMENT':
          return {
            'Director Name': enhancedDetails.directorName || data.directorName || data.selectedDirector?.name || data.newDirector?.name || 'Not specified',
            'DIN': enhancedDetails.directorDIN || data.din || data.selectedDirector?.din || data.newDirector?.din || 'Not specified', 
            'Director Category': data.directorCategory || data.category || (data.designation ? 'Based on designation' : 'Not specified'),
            'Designation': data.designation || data.newDesignation || 'Not specified',
            'Appointment Date': data.appointmentDate || data.effectiveDate ? 
              new Date(data.appointmentDate || data.effectiveDate).toLocaleDateString() : 'Not specified',
            'Company/Entity': enhancedDetails.entityName || data.companyName || data.entityName || data.selectedEntity?.name || 'Not specified',
            'CIN/LLPIN': enhancedDetails.entityIdentifier || data.cinNumber || data.llpIN || data.selectedEntity?.identifier || 'Not specified',
            'Previous Designation': data.previousDesignation || 'N/A',
            'Change Type': data.isNewAppointment ? 'New Appointment' : 'Designation Change',
            'Reason': data.reason || data.changeReason || 'Not provided'
          };
        
        case 'DIRECTOR_RESIGNATION':
          return {
            'Director Name': enhancedDetails.directorName || data.directorName || data.selectedDirector?.name || 'Not specified',
            'DIN': enhancedDetails.directorDIN || data.din || data.selectedDirector?.din || 'Not specified',
            'Resignation Date': data.resignationDate || data.effectiveDate ? 
              new Date(data.resignationDate || data.effectiveDate).toLocaleDateString() : 'Not specified',
            'Company/Entity': enhancedDetails.entityName || data.companyName || data.entityName || data.selectedEntity?.name || 'Not specified',
            'CIN/LLPIN': enhancedDetails.entityIdentifier || data.cinNumber || data.llpIN || data.selectedEntity?.identifier || 'Not specified',
            'Reason': data.reason || data.resignationReason || 'Not provided',
            'Current Designation': data.currentDesignation || 'Not specified'
          };
          
        case 'DIRECTOR_KYC':
          return {
            'Director Name': enhancedDetails.directorName || data.directorName || data.selectedDirector?.name || 'Not specified',
            'DIN': enhancedDetails.directorDIN || data.din || data.selectedDirector?.din || 'Not specified',
            'KYC Type': data.kycType || data.documentType || 'Not specified',
            'Company/Entity': enhancedDetails.entityName || data.companyName || data.entityName || data.selectedEntity?.name || 'Not specified',
            'Status': data.status || data.kycStatus || 'Pending',
            'Expiry Date': data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : 'Not specified'
          };
          
        default:
          // For other service types, just display key-value pairs nicely
          const displayData: any = {};
          Object.keys(data).forEach(key => {
            // Skip internal fields that aren't user-friendly
            if (['id', 'createdAt', 'updatedAt', '__typename'].includes(key)) {
              return;
            }
            
            const value = data[key];
            let formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            // Handle nested objects
            if (typeof value === 'object' && value !== null) {
              if (value.name) {
                displayData[formattedKey] = value.name + (value.identifier ? ` (${value.identifier})` : '');
              } else {
                displayData[formattedKey] = JSON.stringify(value);
              }
            } else if (key.toLowerCase().includes('date') && value) {
              displayData[formattedKey] = new Date(value).toLocaleDateString();
            } else {
              displayData[formattedKey] = value || 'Not specified';
            }
          });
          return displayData;
      }
    } catch (error) {
      console.error('Error parsing request data:', error);
      return { 'Error': 'Unable to parse request data - please check console for details' };
    }
  };

  const fetchRequestDetails = async (request: any) => {
    try {
      const data = JSON.parse(request.requestData || '{}');
      const details: any = {};
      
      // Try to get company/LLP details by CIN/LLPIN
      const cinNumber = data.cinNumber || data.selectedEntity?.identifier;
      const llpIN = data.llpIN || data.selectedEntity?.identifier;
      
      if (cinNumber) {
        try {
          const companyResult = await client.models.Company.get({ id: cinNumber });
          if (companyResult.data) {
            details.entityName = companyResult.data.companyName;
            details.entityType = 'Company';
            details.entityIdentifier = companyResult.data.cinNumber;
          }
        } catch (error) {
          console.warn('Could not fetch company:', error);
        }
      } else if (llpIN) {
        try {
          const llpResult = await client.models.LLP.get({ id: llpIN });
          if (llpResult.data) {
            details.entityName = llpResult.data.llpName;
            details.entityType = 'LLP';
            details.entityIdentifier = llpResult.data.llpIN;
          }
        } catch (error) {
          console.warn('Could not fetch LLP:', error);
        }
      }
      
      // Try to get director details by DIN
      const din = data.din || data.selectedDirector?.din || data.newDirector?.din;
      if (din) {
        try {
          const directorResult = await client.models.UserProfile.list({
            filter: { din: { eq: din } }
          });
          
          if (directorResult.data && directorResult.data.length > 0) {
            const director = directorResult.data[0];
            details.directorName = director.displayName || director.email;
            details.directorEmail = director.email;
            details.directorDIN = director.din;
          }
        } catch (error) {
          console.warn('Could not fetch director by DIN:', error);
        }
      }
      
      return details;
    } catch (error) {
      console.error('Error fetching request details:', error);
      return {};
    }
  };

  const showRequestDetails = async (request: any) => {
    setSelectedRequest(request);
    setShowDetails(true);
    
    // Fetch detailed information
    const details = await fetchRequestDetails(request);
    setRequestDetails(prev => new Map(prev.set(request.id, details)));
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
              <th>Service Type</th>
              <th>Requesting Director</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">No service requests found.</td>
              </tr>
            ) : (
              serviceRequests.map(request => {
                const requestingDirector = directorInfo.get(request.directorId);
                return (
                  <tr key={request.id}>
                    <td>{formatServiceType(request.serviceType)}</td>
                    <td>
                      {requestingDirector ? (
                        <div>
                          <div>{requestingDirector.displayName || requestingDirector.email}</div>
                          <small style={{ color: '#666' }}>
                            {requestingDirector.din ? `DIN: ${requestingDirector.din}` : requestingDirector.email}
                          </small>
                        </div>
                      ) : (
                        'Loading...'
                      )}
                    </td>
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
                );
              })
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
                  <strong>Requesting Director:</strong> 
                  {(() => {
                    const requestingDirector = directorInfo.get(selectedRequest.directorId);
                    return requestingDirector ? (
                      <span>
                        {requestingDirector.displayName || requestingDirector.email}
                        {requestingDirector.din && <small> (DIN: {requestingDirector.din})</small>}
                        <br />
                        <small style={{ color: '#666' }}>{requestingDirector.email}</small>
                      </span>
                    ) : (
                      'Loading...'
                    );
                  })()}
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
                
                <h3>Request Details</h3>
                <div className="request-data">
                  {(() => {
                    const parsedData = parseRequestData(selectedRequest.requestData, selectedRequest.serviceType, selectedRequest.id);
                    return Object.entries(parsedData).map(([key, value]) => (
                      <div key={key} className="detail-row">
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ));
                  })()}
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
  const [formGenerationTasks, setFormGenerationTasks] = useState<any[]>([]);
  
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
        <button 
          className={activeTab === 'documents' ? 'active' : ''} 
          onClick={() => { setActiveTab('documents'); setShowAddForm(false); }}
        >
          Documents
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
            {activeTab === 'documents' && 'Documents & Forms'}
          </h2>
          
          {activeTab !== 'pending-tasks' && activeTab !== 'documents' && (
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
                onDirectorFormGeneration={(taskData) => {
                  // Add the task to our form generation tasks
                  setFormGenerationTasks(prev => [...prev, taskData]);
                  // Switch to documents tab 
                  setActiveTab('documents');
                }}
              />
            )}
            
            {activeTab === 'documents' && (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h3>Form Generation & Document Management</h3>
                  <p>Generate DIR-2, DIR-8, and MBP-1 forms from collected director information, and manage all compliance documents.</p>
                </div>
                
                {/* Form Generation Tasks */}
                {formGenerationTasks.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4>Pending Form Generation Tasks</h4>
                    {formGenerationTasks.map((task, index) => (
                      <FormGenerator
                        key={index}
                        directorDIN={task.directorDIN}
                        directorName={task.directorName}
                        entityName={task.entityName}
                        directorInfoDocument={task.directorInfoDocument}
                        requiredForms={task.requiredForms || ['DIR-2', 'DIR-8', 'MBP-1']}
                        onFormsGenerated={() => {
                          // Remove this task from the list
                          setFormGenerationTasks(prev => prev.filter((_, i) => i !== index));
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <DocumentList
                  showUploader={true}
                  allowDelete={true}
                  onRefresh={() => {}}
                />
              </div>
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