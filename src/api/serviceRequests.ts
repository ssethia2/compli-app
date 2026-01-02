import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface ServiceRequestFilter {
  directorId?: string;
  processedBy?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  serviceType?: 'DIRECTOR_APPOINTMENT' | 'DIRECTOR_RESIGNATION' | 'DIRECTOR_KYC' | 'COMPANY_ANNUAL_FILING' | 'LLP_ANNUAL_FILING' | 'BOARD_RESOLUTION' | 'BOARD_MEETING_MINUTES' | 'AGM_MINUTES' | 'EGM_MINUTES';
}

export interface CreateServiceRequestParams {
  directorId: string;
  serviceType: 'DIRECTOR_APPOINTMENT' | 'DIRECTOR_RESIGNATION' | 'DIRECTOR_KYC' | 'COMPANY_ANNUAL_FILING' | 'LLP_ANNUAL_FILING' | 'BOARD_RESOLUTION' | 'BOARD_MEETING_MINUTES' | 'AGM_MINUTES' | 'EGM_MINUTES';
  requestData: string; // JSON string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  comments?: string;
}

/**
 * Get service requests with optional filters
 */
export const getServiceRequests = async (filter: ServiceRequestFilter) => {
  const { getServiceRequestsFromLambda } = await import('./lambda');

  const result = await getServiceRequestsFromLambda({
    directorId: filter.directorId,
    processedBy: filter.processedBy,
    status: filter.status,
    serviceType: filter.serviceType
  });

  if (!result.success) {
    return { data: [], errors: [result.message || 'Failed to fetch service requests'] };
  }

  const data = result.data;

  // Sort by creation date (newest first) and priority
  const sortedData = data.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  return { data: sortedData, errors: result.errors };
};

/**
 * Get service requests for a director
 */
export const getDirectorServiceRequests = async (directorId: string) => {
  return getServiceRequests({ directorId });
};

/**
 * Get service requests for a professional (that they're processing or assigned to)
 */
export const getProfessionalServiceRequests = async (professionalId: string) => {
  // Get all service requests
  const allRequests = await client.models.ServiceRequest.list();

  // Get all entities assigned to this professional
  const assignments = await client.models.ProfessionalAssignment.list({
    filter: { professionalId: { eq: professionalId } }
  });

  const assignedEntityIds = new Set(assignments.data.map(a => a.entityId));

  // Filter service requests where:
  // 1. Processed by this professional, OR
  // 2. Director is associated with an entity this professional manages
  const relevantRequests = [];

  for (const request of allRequests.data) {
    // Include if processed by this professional
    if (request.processedBy === professionalId) {
      relevantRequests.push(request);
      continue;
    }

    // Include if director is on an entity this professional manages
    const directorAssociations = await client.models.DirectorAssociation.list({
      filter: { userId: { eq: request.directorId } }
    });

    const hasAssociatedEntity = directorAssociations.data.some(
      da => assignedEntityIds.has(da.entityId)
    );

    if (hasAssociatedEntity) {
      relevantRequests.push(request);
    }
  }

  // Sort by priority and date
  relevantRequests.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  return { data: relevantRequests, errors: [] };
};

/**
 * Create a new service request
 */
export const createServiceRequest = async (params: CreateServiceRequestParams) => {
  const serviceRequestData = {
    ...params,
    status: 'PENDING' as const,
    priority: params.priority || 'MEDIUM' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await client.models.ServiceRequest.create(serviceRequestData);
};

/**
 * Update service request status
 */
export const updateServiceRequestStatus = async (
  requestId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
  processedBy?: string,
  comments?: string
) => {
  const updateData: any = {
    id: requestId,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (processedBy) {
    updateData.processedBy = processedBy;
  }

  if (comments) {
    updateData.comments = comments;
  }

  return await client.models.ServiceRequest.update(updateData);
};

/**
 * Start processing a service request
 */
export const startServiceRequest = async (requestId: string, professionalId: string) => {
  return updateServiceRequestStatus(requestId, 'IN_PROGRESS', professionalId);
};

/**
 * Complete a service request
 */
export const completeServiceRequest = async (requestId: string, comments?: string) => {
  return updateServiceRequestStatus(requestId, 'COMPLETED', undefined, comments);
};

/**
 * Reject a service request
 */
export const rejectServiceRequest = async (requestId: string, comments: string) => {
  return updateServiceRequestStatus(requestId, 'REJECTED', undefined, comments);
};

/**
 * Delete a service request
 */
export const deleteServiceRequest = async (requestId: string) => {
  return await client.models.ServiceRequest.delete({ id: requestId });
};

/**
 * Get service request counts by status
 */
export const getServiceRequestCounts = async (filter: ServiceRequestFilter) => {
  const result = await getServiceRequests(filter);

  const counts = {
    total: result.data.length,
    pending: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  };

  result.data.forEach(request => {
    switch (request.status) {
      case 'PENDING':
        counts.pending++;
        break;
      case 'IN_PROGRESS':
        counts.inProgress++;
        break;
      case 'APPROVED':
        counts.approved++;
        break;
      case 'REJECTED':
        counts.rejected++;
        break;
      case 'COMPLETED':
        counts.completed++;
        break;
    }
  });

  return counts;
};
