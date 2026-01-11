import { fetchAuthSession } from 'aws-amplify/auth';

const API_ENDPOINT = import.meta.env.VITE_API_HANDLER_URL || '';
const HEAVY_OPS_ENDPOINT = import.meta.env.VITE_HEAVY_OPERATIONS_URL || '';

/**
 * Generic Lambda API caller for fast CRUD operations
 */
async function callLambda(operation: string, data: any) {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        operation,
        data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Full error response for ${operation}:`, errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }
}

/**
 * Lambda API caller for heavy/slow operations (PDF generation, OCR, etc.)
 */
async function callHeavyLambda(operation: string, data: any) {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const response = await fetch(HEAVY_OPS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        operation,
        data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in heavy operation ${operation}:`, error);
    throw error;
  }
}

// ============================================================================
// DIRECTOR OPERATIONS
// ============================================================================

export async function submitDirectorAppointment(data: {
  din: string;
  appointmentDate: string;
  designation: string;
  category: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  entityName: string;
  entityIdentifier: string;
  authorizerUserId: string;
  authorizerDIN?: string;
  authorizerName?: string;
  authorizerEmail?: string;
}) {
  return callLambda('submitDirectorAppointment', data);
}

export async function completeDirectorDocumentUpload(data: {
  taskId: string;
  appointmentData: any;
  directorUserId: string;
}) {
  return callLambda('completeDirectorDocumentUpload', data);
}

export async function submitDirectorResignation(data: {
  din: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  resignationDate: string;
  reason: string;
  directorUserId: string;
}) {
  return callLambda('submitDirectorResignation', data);
}

// ============================================================================
// PROFESSIONAL OPERATIONS
// ============================================================================

export async function processServiceRequest(data: {
  serviceRequestId: string;
  action: 'approve' | 'reject' | 'complete';
  professionalUserId: string;
  notes?: string;
}) {
  return callLambda('processServiceRequest', data);
}

export async function associateDINEmail(data: {
  din: string;
  email: string;
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  professionalUserId: string;
  directorName?: string;
  requestContext?: any;
}) {
  return callLambda('associateDINEmail', data);
}

export async function generateDirectorForms(data: {
  directorDIN: string;
  entityId: string;
  serviceRequestId?: string;
}) {
  return callHeavyLambda('generateDirectorForms', data);
}

// ============================================================================
// SHARED OPERATIONS
// ============================================================================

export async function completeTask(data: {
  taskId: string;
  userId: string;
}) {
  return callLambda('completeTask', data);
}

// ============================================================================
// TASK WORKFLOW OPERATIONS
// ============================================================================

export async function submitDirectorInfoByProfessional(data: {
  taskId: string;
  directorInfo: any;
  companiesForDisclosure: Array<{ id: string; name: string; cin: string }>;
  professionalUserId: string;
}) {
  return callLambda('submitDirectorInfoByProfessional', data);
}

export async function submitInterestDisclosureByAppointee(data: {
  taskId: string;
  interestDisclosure: {
    companies: Array<{
      id: string;
      name: string;
      cin: string;
      natureOfInterest?: string;
      shareholdingPercentage?: number;
      dateOfInterest?: string;
    }>;
  };
  appointeeUserId: string;
}) {
  return callLambda('submitInterestDisclosureByAppointee', data);
}

export async function generateDirectorAppointmentForms(data: {
  taskId: string;
  professionalUserId: string;
  generatedFormIds?: string[];
}) {
  return callLambda('generateDirectorAppointmentForms', data);
}

// ============================================================================
// SECURITY OPERATIONS (PHASE 1)
// ============================================================================

export async function getDocuments(data: {
  userId: string;
  role: 'DIRECTORS' | 'PROFESSIONALS';
  serviceRequestId?: string;
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
}) {
  return callLambda('getDocuments', data);
}

export async function getSignatureUrl(data: {
  signatureKey: string;
  requestingUserId: string;
}) {
  return callLambda('getSignatureUrl', data);
}

export async function getTaskDetails(data: {
  taskId: string;
  userId: string;
}) {
  return callLambda('getTaskDetails', data);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export async function createCompany(data: {
  cinNumber: string;
  companyName: string;
  rocName?: string;
  dateOfIncorporation?: string;
  emailId?: string;
  registeredAddress?: string;
  authorizedCapital?: number;
  paidUpCapital?: number;
  numberOfDirectors?: number;
  companyStatus?: 'ACTIVE' | 'INACTIVE' | 'UNDER_PROCESS' | 'STRUCK_OFF' | 'AMALGAMATED';
  companyType?: 'PRIVATE' | 'PUBLIC' | 'ONE_PERSON' | 'SECTION_8' | 'GOVERNMENT' | 'NBFC' | 'NIDHI' | 'IFSC';
  lastAnnualFilingDate?: string;
  financialYear?: string;
  agmDate?: string;
}) {
  return callLambda('createCompany', data);
}

export async function createLLP(data: {
  llpIN: string;
  llpName: string;
  dateOfIncorporation?: string;
  emailId?: string;
  registeredAddress?: string;
  totalContribution?: number;
  numberOfPartners?: number;
  llpStatus?: 'ACTIVE' | 'INACTIVE' | 'UNDER_PROCESS' | 'STRUCK_OFF';
  lastAnnualFilingDate?: string;
  financialYear?: string;
}) {
  return callLambda('createLLP', data);
}

export async function getUserProfile(data: {
  userId?: string;
  email?: string;
  din?: string;
}) {
  return callLambda('getUserProfile', data);
}

export async function getCompany(data: {
  id: string;
}) {
  return callLambda('getCompany', data);
}

export async function getLLP(data: {
  id: string;
}) {
  return callLambda('getLLP', data);
}

export async function getServiceRequestsFromLambda(data: {
  directorId?: string;
  processedBy?: string;
  status?: string;
  serviceType?: string;
}) {
  return callLambda('getServiceRequests', data);
}

// ============================================================================
// DIRECTOR DASHBOARD OPERATIONS
// ============================================================================

export async function getDirectorDashboardData(data: {
  userId?: string;
  username?: string;
}) {
  return callLambda('getDirectorDashboardData', data);
}

export async function updateUserDIN(data: {
  userProfileId: string;
  din: string;
  dinStatus?: string;
}) {
  return callLambda('updateUserDIN', data);
}

export async function updateUserProfile(data: {
  userProfileId: string;
  updates: any;
}) {
  return callLambda('updateUserProfile', data);
}

export async function checkAndClaimPendingDIN(data: {
  email: string;
  userId: string;
  userProfileId: string;
}) {
  return callLambda('checkAndClaimPendingDIN', data);
}

export async function createDirectorKYCRequest(data: {
  directorUserId: string;
  kycData: any;
}) {
  return callLambda('createDirectorKYCRequest', data);
}

// ============================================================================
// PROFESSIONAL DASHBOARD OPERATIONS
// ============================================================================

export async function getProfessionalDashboardData(data: {
  professionalId: string;
}) {
  return callLambda('getProfessionalDashboardData', data);
}

export async function getServiceRequestWithDirectors(data: {
  serviceRequestId: string;
}) {
  return callLambda('getServiceRequestWithDirectors', data);
}

export async function updateServiceRequestStatus(data: {
  serviceRequestId: string;
  status: string;
  comments?: string;
}) {
  return callLambda('updateServiceRequestStatus', data);
}

export async function getDirectorSignatures(data: {
  directorUserIds: string[];
}) {
  return callLambda('getDirectorSignatures', data);
}

export async function createProfessionalTask(data: {
  assignedTo: string;
  professionalId: string;
  taskType: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'COMPANY' | 'LLP';
  metadata?: any;
}) {
  return callLambda('createProfessionalTask', data);
}

export async function assignProfessionalToEntity(data: {
  professionalId: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  role?: string;
}) {
  return callLambda('assignProfessionalToEntity', data);
}

// ============================================================================
// FORM GENERATOR OPERATIONS
// ============================================================================

export async function getDirectorInfoDocument(data: {
  directorDIN: string;
}) {
  return callLambda('getDirectorInfoDocument', data);
}

export async function createGeneratedForm(data: {
  fileName: string;
  documentName?: string;
  fileKey: string;
  fileSize?: number;
  professionalUserId: string;
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
}) {
  return callLambda('createGeneratedForm', data);
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

export async function listAssetTemplates(data: {
  isActive?: boolean;
}) {
  return callLambda('listAssetTemplates', data);
}

export async function createAssetTemplate(data: {
  templateName: string;
  templateType: string;
  fileKey: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  version?: string;
  metadata?: any;
  createdBy?: string;
}) {
  return callLambda('createAssetTemplate', data);
}

export async function updateAssetTemplate(data: {
  id: string;
  updates: any;
}) {
  return callLambda('updateAssetTemplate', data);
}

export async function deleteAssetTemplate(data: {
  id: string;
}) {
  return callLambda('deleteAssetTemplate', data);
}

export async function adminLogin(data: {
  adminCode: string;
}) {
  return callLambda('adminLogin', data);
}

// ============================================================================
// ASSOCIATE DIRECTOR OPERATIONS
// ============================================================================

export async function findOrCreateDirectorByEmail(data: {
  email: string;
  din?: string;
  displayName?: string;
}) {
  return callLambda('findOrCreateDirectorByEmail', data);
}

export async function listEntitiesForAssociation() {
  return callLambda('listEntitiesForAssociation', {});
}

export async function createDirectorAssociation(data: {
  userId: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  associationType?: string;
  din?: string;
  originalAppointmentDate?: string;
  appointmentDate?: string;
  cessationDate?: string;
}) {
  return callLambda('createDirectorAssociation', data);
}

export async function checkExistingAssociation(data: {
  userId: string;
  entityId: string;
}) {
  return callLambda('checkExistingAssociation', data);
}

// ============================================================================
// DATA LIST OPERATIONS
// ============================================================================

export async function listCompanies(data?: {
  filter?: any;
}) {
  return callLambda('listCompanies', data || {});
}

export async function listLLPs(data?: {
  filter?: any;
}) {
  return callLambda('listLLPs', data || {});
}

export async function listDirectorAssociations(data?: {
  filter?: any;
}) {
  return callLambda('listDirectorAssociations', data || {});
}

export async function listProfessionalAssignments(data?: {
  filter?: any;
}) {
  return callLambda('listProfessionalAssignments', data || {});
}

export async function listTasks(data?: {
  filter?: any;
}) {
  return callLambda('listTasks', data || {});
}

export async function getPendingDirectors(data?: {
  email?: string;
  din?: string;
  status?: string;
}) {
  return callLambda('getPendingDirectors', data || {});
}

export async function updatePendingDirector(data: {
  id: string;
  updates: any;
}) {
  return callLambda('updatePendingDirector', data);
}
