/**
 * Centralized API layer for the application
 *
 * This module exports all API functions for interacting with the backend.
 * All Amplify client calls should go through these functions to maintain
 * consistency and make the codebase more maintainable.
 */

// Documents API
export {
  getDocuments,
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  getDocumentUploaderProfiles,
  type DocumentFilter,
  type DocumentUploadParams
} from './documents';

// Tasks API
export {
  getTasks,
  getPendingTasks,
  createTask,
  updateTaskStatus,
  completeTask,
  deleteTask,
  getTaskCounts,
  type TaskFilter,
  type CreateTaskParams
} from './tasks';

// Service Requests API
export {
  getServiceRequests,
  getDirectorServiceRequests,
  getProfessionalServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
  startServiceRequest,
  completeServiceRequest,
  rejectServiceRequest,
  deleteServiceRequest,
  getServiceRequestCounts,
  type ServiceRequestFilter,
  type CreateServiceRequestParams
} from './serviceRequests';

// User Profiles API
export {
  getUserProfileByUserId,
  getUserProfileByEmail,
  getUserProfileByDIN,
  getUserProfileById,
  createUserProfile,
  updateUserProfile,
  updateUserSignature,
  updateUserPAN,
  getUserProfilesByRole,
  getAllDirectors,
  getAllProfessionals,
  checkProfileExists,
  mergeProfileWithCognitoUser,
  type CreateUserProfileParams,
  type UpdateUserProfileParams
} from './userProfiles';

// Entities API (Companies and LLPs)
export {
  getAllCompanies,
  getCompanyByCIN,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getAllLLPs,
  getLLPByLLPIN,
  getLLPById,
  createLLP,
  updateLLP,
  deleteLLP,
  getProfessionalEntities,
  getDirectorEntities,
  assignProfessionalToEntity,
  associateDirectorToEntity,
  getEntityDirectors,
  getEntityProfessionals
} from './entities';
