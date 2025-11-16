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
    llps: [] as any[]
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
