// Task workflow stages and metadata structures for director appointment

/**
 * Director Appointment Task Workflow Stages
 */
export enum DirectorAppointmentStage {
  ASSOCIATE_DIN_EMAIL = 'ASSOCIATE_DIN_EMAIL',           // Professional associates DIN with email
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',                 // Appointee uploads documents
  FILL_DIRECTOR_INFO = 'FILL_DIRECTOR_INFO',             // Professional fills form + selects companies
  FILL_INTEREST_DISCLOSURE = 'FILL_INTEREST_DISCLOSURE', // Appointee fills interest details
  GENERATE_FORMS = 'GENERATE_FORMS'                      // Professional generates forms
}

/**
 * Company for interest disclosure
 */
export interface CompanyForDisclosure {
  id: string;
  name: string;
  cin: string;
  // Filled by appointee:
  natureOfInterest?: string;
  shareholdingPercentage?: number;
  dateOfInterest?: string;
}

/**
 * Director appointment request data (from requesting director)
 */
export interface DirectorAppointmentRequestData {
  // Requesting director info
  authorizerUserId: string;
  authorizerDIN?: string;
  authorizerName?: string;
  authorizerEmail?: string;

  // Appointee basic info
  appointeeDIN: string;
  appointeeEmail?: string; // Set by professional during DIN association
  appointeeUserId?: string; // Set when appointee logs in

  // Appointment details
  appointmentDate: string;
  designation: string;
  category: string;

  // Entity info
  entityId: string;
  entityType: 'COMPANY' | 'LLP';
  entityName: string;
  entityIdentifier: string;
}

/**
 * Director info filled by professional
 */
export interface DirectorInfoProfessionalData {
  // Personal details
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  nationality: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  // Identification
  din: string;
  pan: string;
  aadhar: string;
  passport?: string;

  // Contact
  email: string;
  mobileNumber: string;

  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Professional details
  occupation: string;
  professionalMembership?: string;

  // Appointment details
  appointmentDate: string;
  designation: string;
  category: string;

  // Entity details
  companyName: string;
  cin: string;
  entityId: string;
  entityType: 'COMPANY' | 'LLP';

  // Companies selected for interest disclosure
  companiesForDisclosure: Array<{
    id: string;
    name: string;
    cin: string;
  }>;
}

/**
 * Interest disclosure data filled by appointee
 */
export interface InterestDisclosureData {
  companies: CompanyForDisclosure[];
}

/**
 * Complete task metadata for director appointment workflow
 */
export interface DirectorAppointmentTaskMetadata {
  taskType: 'director-appointment';
  currentStage: DirectorAppointmentStage;

  // Initial request data
  appointmentRequest: DirectorAppointmentRequestData;

  // Professional-filled data (stage: FILL_DIRECTOR_INFO)
  directorInfo?: DirectorInfoProfessionalData;

  // Appointee-filled data (stage: FILL_INTEREST_DISCLOSURE)
  interestDisclosure?: InterestDisclosureData;

  // Document upload tracking
  documentsUploaded?: boolean;
  uploadedDocuments?: string[]; // S3 keys or document IDs

  // Professional assignment
  assignedProfessionalId?: string;

  // Forms generated
  formsGenerated?: boolean;
  generatedFormIds?: string[];

  // Stage completion timestamps
  stageCompletedAt?: {
    [key in DirectorAppointmentStage]?: string;
  };
}

/**
 * Type guard to check if task is director appointment
 */
export function isDirectorAppointmentTask(metadata: any): metadata is DirectorAppointmentTaskMetadata {
  return metadata?.taskType === 'director-appointment';
}

/**
 * Helper to create initial task metadata
 */
export function createDirectorAppointmentTaskMetadata(
  appointmentRequest: DirectorAppointmentRequestData,
  initialStage: DirectorAppointmentStage,
  assignedProfessionalId?: string
): DirectorAppointmentTaskMetadata {
  return {
    taskType: 'director-appointment',
    currentStage: initialStage,
    appointmentRequest,
    assignedProfessionalId,
    stageCompletedAt: {}
  };
}

/**
 * Get next stage in workflow
 */
export function getNextStage(currentStage: DirectorAppointmentStage): DirectorAppointmentStage | null {
  const stageOrder = [
    DirectorAppointmentStage.ASSOCIATE_DIN_EMAIL,
    DirectorAppointmentStage.UPLOAD_DOCUMENTS,
    DirectorAppointmentStage.FILL_DIRECTOR_INFO,
    DirectorAppointmentStage.FILL_INTEREST_DISCLOSURE,
    DirectorAppointmentStage.GENERATE_FORMS
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null; // Invalid stage or last stage
  }

  return stageOrder[currentIndex + 1];
}

/**
 * Get task title for stage
 */
export function getTaskTitleForStage(stage: DirectorAppointmentStage): string {
  switch (stage) {
    case DirectorAppointmentStage.ASSOCIATE_DIN_EMAIL:
      return 'Associate DIN with Email for New Director';
    case DirectorAppointmentStage.UPLOAD_DOCUMENTS:
      return 'Upload Documents for Director Appointment';
    case DirectorAppointmentStage.FILL_DIRECTOR_INFO:
      return 'Complete Director Information Form';
    case DirectorAppointmentStage.FILL_INTEREST_DISCLOSURE:
      return 'Disclose Interest in Other Companies';
    case DirectorAppointmentStage.GENERATE_FORMS:
      return 'Generate Director Appointment Forms';
  }
}

/**
 * Get task description for stage
 */
export function getTaskDescriptionForStage(
  stage: DirectorAppointmentStage,
  appointmentRequest: DirectorAppointmentRequestData
): string {
  switch (stage) {
    case DirectorAppointmentStage.ASSOCIATE_DIN_EMAIL:
      return `A director appointment request has been submitted for DIN ${appointmentRequest.appointeeDIN} at ${appointmentRequest.entityName}. Please associate this DIN with the director's email address.`;
    case DirectorAppointmentStage.UPLOAD_DOCUMENTS:
      return `You have been appointed as a director at ${appointmentRequest.entityName}. Please upload PAN, Aadhar, and passport (if foreign national), then complete this task.`;
    case DirectorAppointmentStage.FILL_DIRECTOR_INFO:
      return `Please complete the director information form and select companies for interest disclosure.`;
    case DirectorAppointmentStage.FILL_INTEREST_DISCLOSURE:
      return `Please provide details about your interest in the following companies.`;
    case DirectorAppointmentStage.GENERATE_FORMS:
      return `All information has been collected. Please generate the required forms (DIR-2, DIR-8, MBP-1).`;
  }
}

/**
 * Determine who should be assigned the task at each stage
 */
export function getAssigneeForStage(
  stage: DirectorAppointmentStage,
  metadata: DirectorAppointmentTaskMetadata
): string {
  switch (stage) {
    case DirectorAppointmentStage.ASSOCIATE_DIN_EMAIL:
    case DirectorAppointmentStage.FILL_DIRECTOR_INFO:
    case DirectorAppointmentStage.GENERATE_FORMS:
      return metadata.assignedProfessionalId || '';
    case DirectorAppointmentStage.UPLOAD_DOCUMENTS:
    case DirectorAppointmentStage.FILL_INTEREST_DISCLOSURE:
      return metadata.appointmentRequest.appointeeUserId || '';
  }
}
