import React, { useState, useEffect } from 'react';
import { getServiceRequests, updateServiceRequestStatus, getUserProfileByUserId } from '../../../api';
import { getCompany, getLLP, getUserProfile } from '../../../api/lambda';

interface ServiceRequestsTabProps {
  onDirectorInfoFormOpen?: (taskId: string, appointmentData: any) => void;
}

const ServiceRequestsTab: React.FC<ServiceRequestsTabProps> = ({ onDirectorInfoFormOpen }) => {
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
      // Use API layer to get service requests
      const result = await getServiceRequests({});
      setServiceRequests(result.data);

      // Load director information for all unique director IDs
      const uniqueDirectorIds = [...new Set(result.data.map(req => req.directorId))];
      const directorMap = new Map();

      for (const directorId of uniqueDirectorIds) {
        try {
          const director = await getUserProfileByUserId(directorId);

          if (director) {
            directorMap.set(directorId, {
              displayName: director.displayName,
              email: director.email,
              din: director.din
            });
          } else {
            directorMap.set(directorId, {
              displayName: 'Unknown Director',
              email: 'N/A',
              din: 'N/A'
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
      await updateServiceRequestStatus(
        requestId,
        newStatus as any,
        undefined,
        comments
      );
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
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'APPROVED':
        return 'status-completed';
      case 'REJECTED':
        return 'status-rejected';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const parseRequestData = (requestData: string, serviceType: string, requestId: string) => {
    try {
      const data = JSON.parse(requestData || '{}');

      // Get the enhanced details if available
      const enhancedDetails = requestDetails.get(requestId) || {};

      switch (serviceType) {
        case 'DIRECTOR_APPOINTMENT':
          return {
            'Director Name':
              enhancedDetails.directorName ||
              data.directorName ||
              data.selectedDirector?.name ||
              data.newDirector?.name ||
              'Not specified',
            DIN:
              enhancedDetails.directorDIN ||
              data.din ||
              data.selectedDirector?.din ||
              data.newDirector?.din ||
              'Not specified',
            'Director Category':
              data.directorCategory ||
              data.category ||
              (data.designation ? 'Based on designation' : 'Not specified'),
            Designation: data.designation || data.newDesignation || 'Not specified',
            'Appointment Date':
              data.appointmentDate || data.effectiveDate
                ? new Date(data.appointmentDate || data.effectiveDate).toLocaleDateString()
                : 'Not specified',
            'Company/Entity':
              enhancedDetails.entityName ||
              data.companyName ||
              data.entityName ||
              data.selectedEntity?.name ||
              'Not specified',
            'CIN/LLPIN':
              enhancedDetails.entityIdentifier ||
              data.cinNumber ||
              data.llpIN ||
              data.selectedEntity?.identifier ||
              'Not specified',
            'Previous Designation': data.previousDesignation || 'N/A',
            'Change Type': data.isNewAppointment ? 'New Appointment' : 'Designation Change',
            Reason: data.reason || data.changeReason || 'Not provided'
          };

        case 'DIRECTOR_RESIGNATION':
          return {
            'Director Name':
              enhancedDetails.directorName ||
              data.directorName ||
              data.selectedDirector?.name ||
              'Not specified',
            DIN:
              enhancedDetails.directorDIN ||
              data.din ||
              data.selectedDirector?.din ||
              'Not specified',
            'Resignation Date':
              data.resignationDate || data.effectiveDate
                ? new Date(data.resignationDate || data.effectiveDate).toLocaleDateString()
                : 'Not specified',
            'Company/Entity':
              enhancedDetails.entityName ||
              data.companyName ||
              data.entityName ||
              data.selectedEntity?.name ||
              'Not specified',
            'CIN/LLPIN':
              enhancedDetails.entityIdentifier ||
              data.cinNumber ||
              data.llpIN ||
              data.selectedEntity?.identifier ||
              'Not specified',
            Reason: data.reason || data.resignationReason || 'Not provided',
            'Current Designation': data.currentDesignation || 'Not specified'
          };

        case 'DIRECTOR_KYC':
          return {
            'Director Name':
              enhancedDetails.directorName ||
              data.directorName ||
              data.selectedDirector?.name ||
              'Not specified',
            DIN:
              enhancedDetails.directorDIN ||
              data.din ||
              data.selectedDirector?.din ||
              'Not specified',
            'KYC Type': data.kycType || data.documentType || 'Not specified',
            'Company/Entity':
              enhancedDetails.entityName ||
              data.companyName ||
              data.entityName ||
              data.selectedEntity?.name ||
              'Not specified',
            Status: data.status || data.kycStatus || 'Pending',
            'Expiry Date': data.expiryDate
              ? new Date(data.expiryDate).toLocaleDateString()
              : 'Not specified'
          };

        default:
          // For other service types, display key-value pairs nicely
          const displayData: any = {};
          Object.keys(data).forEach(key => {
            // Skip internal fields
            if (['id', 'createdAt', 'updatedAt', '__typename'].includes(key)) {
              return;
            }

            const value = data[key];
            let formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());

            // Handle nested objects
            if (typeof value === 'object' && value !== null) {
              if (value.name) {
                displayData[formattedKey] =
                  value.name + (value.identifier ? ` (${value.identifier})` : '');
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
      return { Error: 'Unable to parse request data - please check console for details' };
    }
  };

  const fetchRequestDetails = async (request: any) => {
    try {
      const data = JSON.parse(request.requestData || '{}');
      const details: any = {};

      // Try to get company/LLP details
      const cinNumber = data.cinNumber || data.selectedEntity?.identifier;
      const llpIN = data.llpIN || data.selectedEntity?.identifier;

      if (cinNumber) {
        try {
          const companyResult = await getCompany({ id: cinNumber });
          if (companyResult.success && companyResult.data) {
            details.entityName = companyResult.data.companyName;
            details.entityType = 'Company';
            details.entityIdentifier = companyResult.data.cinNumber;
          }
        } catch (error) {
          console.warn('Could not fetch company:', error);
        }
      } else if (llpIN) {
        try {
          const llpResult = await getLLP({ id: llpIN });
          if (llpResult.success && llpResult.data) {
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
          const directorResult = await getUserProfile({ din });

          if (directorResult.success && directorResult.data) {
            const director = directorResult.data;
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
                <td colSpan={6} className="no-data">
                  No service requests found.
                </td>
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
                            {requestingDirector.din
                              ? `DIN: ${requestingDirector.din}`
                              : requestingDirector.email}
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
                      <span
                        className={`priority-badge priority-${request.priority?.toLowerCase()}`}
                      >
                        {request.priority}
                      </span>
                    </td>
                    <td>
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
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
                            onClick={() =>
                              updateRequestStatus(
                                request.id,
                                'REJECTED',
                                'Request rejected by professional'
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <>
                          {request.serviceType === 'DIRECTOR_APPOINTMENT' && (
                            <button
                              className="action-button director-info-btn"
                              onClick={() => {
                                try {
                                  const requestData = JSON.parse(request.requestData || '{}');
                                  if (onDirectorInfoFormOpen) {
                                    onDirectorInfoFormOpen(
                                      `service-request-${request.id}`,
                                      requestData.appointmentData || requestData
                                    );
                                  }
                                } catch (error) {
                                  console.error('Error parsing service request data:', error);
                                  alert('Error loading appointment data');
                                }
                              }}
                            >
                              📝 Complete Director Form
                            </button>
                          )}
                          <button
                            className="action-button"
                            onClick={() => updateRequestStatus(request.id, 'COMPLETED')}
                          >
                            Complete
                          </button>
                        </>
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
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="service-modal-header">
              <h2>{formatServiceType(selectedRequest.serviceType)} Request</h2>
              <button className="close-button" onClick={() => setShowDetails(false)}>
                ×
              </button>
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
                        {requestingDirector.din && (
                          <small> (DIN: {requestingDirector.din})</small>
                        )}
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
                  <strong>Created:</strong>{' '}
                  {selectedRequest.createdAt
                    ? new Date(selectedRequest.createdAt).toLocaleString()
                    : 'N/A'}
                </div>
                {selectedRequest.comments && (
                  <div className="detail-row">
                    <strong>Comments:</strong> {selectedRequest.comments}
                  </div>
                )}

                <h3>Request Details</h3>
                <div className="request-data">
                  {(() => {
                    const parsedData = parseRequestData(
                      selectedRequest.requestData,
                      selectedRequest.serviceType,
                      selectedRequest.id
                    );
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

export default ServiceRequestsTab;
