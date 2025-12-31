// Standardized TypeScript interfaces for ServiceRequest.requestData

/**
 * Common fields present in all service requests
 */
interface BaseRequestData {
  directorName: string;
  directorDIN: string;
  directorUserId?: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  entityName: string;
  entityIdentifier: string; // CIN or LLPIN
}

/**
 * Director Appointment Request Data
 */
export interface DirectorAppointmentRequestData extends BaseRequestData {
  appointmentDate: string;
  designation: string;
  category: string;
  authorizerDIN?: string;
  authorizerName?: string;
  authorizerEmail?: string;
  authorizerUserId?: string;
}

/**
 * Director Resignation Request Data
 */
export interface DirectorResignationRequestData extends BaseRequestData {
  resignationDate: string;
  reason: string;
}

/**
 * Director KYC Request Data
 */
export interface DirectorKYCRequestData extends BaseRequestData {
  kycType: string;
  status?: string;
  expiryDate?: string;
}

/**
 * Union type for all service request data
 */
export type ServiceRequestData =
  | DirectorAppointmentRequestData
  | DirectorResignationRequestData
  | DirectorKYCRequestData;

/**
 * Type guard to check if data is DirectorAppointmentRequestData
 */
export function isDirectorAppointment(data: ServiceRequestData): data is DirectorAppointmentRequestData {
  return 'appointmentDate' in data && 'designation' in data;
}

/**
 * Type guard to check if data is DirectorResignationRequestData
 */
export function isDirectorResignation(data: ServiceRequestData): data is DirectorResignationRequestData {
  return 'resignationDate' in data && 'reason' in data;
}

/**
 * Type guard to check if data is DirectorKYCRequestData
 */
export function isDirectorKYC(data: ServiceRequestData): data is DirectorKYCRequestData {
  return 'kycType' in data;
}
