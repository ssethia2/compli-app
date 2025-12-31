import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Get all companies
 */
export const getAllCompanies = async () => {
  const result = await client.models.Company.list();
  return { data: result.data, errors: result.errors };
};

/**
 * Get company by CIN
 */
export const getCompanyByCIN = async (cinNumber: string) => {
  const result = await client.models.Company.list({
    filter: { cinNumber: { eq: cinNumber } }
  });

  return result.data.length > 0 ? result.data[0] : null;
};

/**
 * Get company by ID
 */
export const getCompanyById = async (id: string) => {
  const result = await client.models.Company.get({ id });
  return result.data;
};

/**
 * Create a new company
 */
export const createCompany = async (companyData: any) => {
  return await client.models.Company.create(companyData);
};

/**
 * Update company
 */
export const updateCompany = async (id: string, updates: any) => {
  return await client.models.Company.update({ id, ...updates });
};

/**
 * Delete company
 */
export const deleteCompany = async (id: string) => {
  return await client.models.Company.delete({ id });
};

/**
 * Get all LLPs
 */
export const getAllLLPs = async () => {
  const result = await client.models.LLP.list();
  return { data: result.data, errors: result.errors };
};

/**
 * Get LLP by LLPIN
 */
export const getLLPByLLPIN = async (llpIN: string) => {
  const result = await client.models.LLP.list({
    filter: { llpIN: { eq: llpIN } }
  });

  return result.data.length > 0 ? result.data[0] : null;
};

/**
 * Get LLP by ID
 */
export const getLLPById = async (id: string) => {
  const result = await client.models.LLP.get({ id });
  return result.data;
};

/**
 * Create a new LLP
 */
export const createLLP = async (llpData: any) => {
  return await client.models.LLP.create(llpData);
};

/**
 * Update LLP
 */
export const updateLLP = async (id: string, updates: any) => {
  return await client.models.LLP.update({ id, ...updates });
};

/**
 * Delete LLP
 */
export const deleteLLP = async (id: string) => {
  return await client.models.LLP.delete({ id });
};

/**
 * Get entities (companies and LLPs) for a professional
 */
export const getProfessionalEntities = async (professionalId: string) => {
  const assignments = await client.models.ProfessionalAssignment.list({
    filter: {
      and: [
        { professionalId: { eq: professionalId } },
        { isActive: { eq: true } }
      ]
    }
  });

  const entities = {
    companies: [] as any[],
    llps: [] as any[]
  };

  for (const assignment of assignments.data) {
    if (assignment.entityType === 'COMPANY' && assignment.entityId) {
      const company = await getCompanyById(assignment.entityId);
      if (company) {
        entities.companies.push(company);
      }
    } else if (assignment.entityType === 'LLP' && assignment.entityId) {
      const llp = await getLLPById(assignment.entityId);
      if (llp) {
        entities.llps.push(llp);
      }
    }
  }

  return entities;
};

/**
 * Get entities (companies and LLPs) for a director
 */
export const getDirectorEntities = async (userId: string) => {
  const associations = await client.models.DirectorAssociation.list({
    filter: {
      and: [
        { userId: { eq: userId } },
        { isActive: { eq: true } }
      ]
    }
  });

  const entities = {
    companies: [] as any[],
    llps: [] as any[],
    associations: associations.data
  };

  for (const association of associations.data) {
    if (association.entityType === 'COMPANY' && association.entityId) {
      const company = await getCompanyById(association.entityId);
      if (company) {
        entities.companies.push(company);
      }
    } else if (association.entityType === 'LLP' && association.entityId) {
      const llp = await getLLPById(association.entityId);
      if (llp) {
        entities.llps.push(llp);
      }
    }
  }

  return entities;
};

/**
 * Assign professional to entity
 */
export const assignProfessionalToEntity = async (
  professionalId: string,
  entityId: string,
  entityType: 'COMPANY' | 'LLP',
  role: 'PRIMARY' | 'SECONDARY' | 'REVIEWER' = 'PRIMARY'
) => {
  return await client.models.ProfessionalAssignment.create({
    professionalId,
    entityId,
    entityType,
    role,
    isActive: true,
    assignedDate: new Date().toISOString()
  });
};

/**
 * Associate director to entity
 */
export const associateDirectorToEntity = async (
  userId: string,
  entityId: string,
  entityType: 'COMPANY' | 'LLP',
  associationType: 'DIRECTOR' | 'DESIGNATED_PARTNER' | 'PARTNER',
  din?: string,
  appointmentDate?: string
) => {
  return await client.models.DirectorAssociation.create({
    userId,
    entityId,
    entityType,
    associationType,
    din,
    appointmentDate: appointmentDate || new Date().toISOString(),
    isActive: true
  });
};

/**
 * Get directors for an entity
 */
export const getEntityDirectors = async (entityId: string, entityType: 'COMPANY' | 'LLP') => {
  const associations = await client.models.DirectorAssociation.list({
    filter: {
      and: [
        { entityId: { eq: entityId } },
        { entityType: { eq: entityType } },
        { isActive: { eq: true } }
      ]
    }
  });

  return associations.data;
};

/**
 * Get professionals for an entity
 */
export const getEntityProfessionals = async (entityId: string, entityType: 'COMPANY' | 'LLP') => {
  const assignments = await client.models.ProfessionalAssignment.list({
    filter: {
      and: [
        { entityId: { eq: entityId } },
        { entityType: { eq: entityType } },
        { isActive: { eq: true } }
      ]
    }
  });

  return assignments.data;
};

/**
 * Get all documents for entities managed by a professional
 * This includes documents from all directors associated with the professional's entities
 *
 * OPTIMIZED: Uses AppSync directly instead of Lambda for faster queries
 */
export const getProfessionalDocuments = async (professionalUserId: string) => {
  try {
    // 1. Get entities assigned to professional
    const assignments = await client.models.ProfessionalAssignment.list({
      filter: {
        and: [
          { professionalId: { eq: professionalUserId } },
          { isActive: { eq: true } }
        ]
      }
    });

    const entityIds = assignments.data.map(a => a.entityId).filter(Boolean) as string[];

    if (entityIds.length === 0) {
      return { documents: [], totalCount: 0 };
    }

    // 2. Get all directors associated with these entities (in parallel)
    const directorQueries = entityIds.map(entityId =>
      client.models.DirectorAssociation.list({
        filter: { entityId: { eq: entityId } }
      })
    );

    const directorResults = await Promise.all(directorQueries);
    const directorUserIds = directorResults
      .flatMap(result => result.data)
      .map(item => item.userId)
      .filter(Boolean) as string[];

    if (directorUserIds.length === 0) {
      return { documents: [], totalCount: 0 };
    }

    // 3. Get documents for all directors (in parallel)
    const documentQueries = directorUserIds.map(userId =>
      client.models.Document.list({
        filter: { uploadedBy: { eq: userId } }
      })
    );

    const documentResults = await Promise.all(documentQueries);
    const documents = documentResults.flatMap(result => result.data);

    return {
      documents,
      totalCount: documents.length
    };

  } catch (error) {
    console.error('Error fetching professional documents:', error);
    throw error;
  }
};

/**
 * Get all documents for a specific user
 */
export const getUserDocuments = async (userId: string) => {
  const result = await client.models.Document.list({
    filter: { uploadedBy: { eq: userId } }
  });

  return result.data;
};

/**
 * Get all tasks for a user
 */
export const getUserTasks = async (userId: string, status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
  const filter = status
    ? {
        and: [
          { assignedTo: { eq: userId } },
          { status: { eq: status } }
        ]
      }
    : { assignedTo: { eq: userId } };

  const result = await client.models.Task.list({ filter });
  return result.data;
};

/**
 * Get all service requests for a user (director or professional)
 */
export const getUserServiceRequests = async (
  userId: string,
  role: 'director' | 'professional',
  status?: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
) => {
  const filterKey = role === 'director' ? 'directorId' : 'processedBy';

  const filter = status
    ? {
        and: [
          { [filterKey]: { eq: userId } },
          { status: { eq: status } }
        ]
      }
    : { [filterKey]: { eq: userId } };

  const result = await client.models.ServiceRequest.list({ filter });
  return result.data;
};
