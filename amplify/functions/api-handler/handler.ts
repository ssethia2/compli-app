import { v4 as uuidv4 } from 'uuid';
import { graphqlRequest } from './graphql-client.js';

// ============================================================================
// ROUTER - Routes request to appropriate handler based on operation
// ============================================================================

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const operation = body.operation;

    // Route to appropriate handler
    switch (operation) {
      case 'submitDirectorAppointment':
        return await handleSubmitDirectorAppointment(body.data);

      case 'completeTask':
        return await handleCompleteTask(body.data);

      case 'completeDirectorDocumentUpload':
        return await handleCompleteDirectorDocumentUpload(body.data);

      case 'associateDINEmail':
        return await handleAssociateDINEmail(body.data);

      case 'submitDirectorResignation':
        return await handleSubmitDirectorResignation(body.data);

      case 'processServiceRequest':
        return await handleProcessServiceRequest(body.data);

      case 'submitDirectorInfoByProfessional':
        return await handleSubmitDirectorInfoByProfessional(body.data);

      case 'submitInterestDisclosureByAppointee':
        return await handleSubmitInterestDisclosureByAppointee(body.data);

      case 'generateDirectorAppointmentForms':
        return await handleGenerateDirectorAppointmentForms(body.data);

      case 'getDocuments':
        return await handleGetDocuments(body.data);

      case 'getSignatureUrl':
        return await handleGetSignatureUrl(body.data);

      case 'getTaskDetails':
        return await handleGetTaskDetails(body.data);

      case 'createCompany':
        return await handleCreateCompany(body.data);

      case 'createLLP':
        return await handleCreateLLP(body.data);

      case 'getUserProfile':
        return await handleGetUserProfile(body.data);

      case 'getServiceRequests':
        return await handleGetServiceRequests(body.data);

      case 'getCompany':
        return await handleGetCompany(body.data);

      case 'getLLP':
        return await handleGetLLP(body.data);

      // Director Dashboard Operations
      case 'getDirectorDashboardData':
        return await handleGetDirectorDashboardData(body.data);

      case 'updateUserDIN':
        return await handleUpdateUserDIN(body.data);

      case 'updateUserProfile':
        return await handleUpdateUserProfile(body.data);

      case 'checkAndClaimPendingDIN':
        return await handleCheckAndClaimPendingDIN(body.data);

      case 'createDirectorKYCRequest':
        return await handleCreateDirectorKYCRequest(body.data);

      // Professional Dashboard Operations
      case 'getProfessionalDashboardData':
        return await handleGetProfessionalDashboardData(body.data);

      case 'getServiceRequestWithDirectors':
        return await handleGetServiceRequestWithDirectors(body.data);

      case 'updateServiceRequestStatus':
        return await handleUpdateServiceRequestStatus(body.data);

      case 'getDirectorSignatures':
        return await handleGetDirectorSignatures(body.data);

      case 'createProfessionalTask':
        return await handleCreateProfessionalTask(body.data);

      case 'assignProfessionalToEntity':
        return await handleAssignProfessionalToEntity(body.data);

      // Form Generator Operations
      case 'getDirectorInfoDocument':
        return await handleGetDirectorInfoDocument(body.data);

      case 'createGeneratedForm':
        return await handleCreateGeneratedForm(body.data);

      // Admin Operations
      case 'listAssetTemplates':
        return await handleListAssetTemplates(body.data);

      case 'createAssetTemplate':
        return await handleCreateAssetTemplate(body.data);

      case 'updateAssetTemplate':
        return await handleUpdateAssetTemplate(body.data);

      case 'deleteAssetTemplate':
        return await handleDeleteAssetTemplate(body.data);

      case 'adminLogin':
        return await handleAdminLogin(body.data);

      // Associate Director Operations
      case 'findOrCreateDirectorByEmail':
        return await handleFindOrCreateDirectorByEmail(body.data);

      case 'listEntitiesForAssociation':
        return await handleListEntitiesForAssociation(body.data);

      case 'createDirectorAssociation':
        return await handleCreateDirectorAssociation(body.data);

      case 'checkExistingAssociation':
        return await handleCheckExistingAssociation(body.data);

      // Data Operations
      case 'listCompanies':
        return await handleListCompanies(body.data);

      case 'listLLPs':
        return await handleListLLPs(body.data);

      case 'listDirectorAssociations':
        return await handleListDirectorAssociations(body.data);

      case 'listProfessionalAssignments':
        return await handleListProfessionalAssignments(body.data);

      case 'listTasks':
        return await handleListTasks(body.data);

      case 'getPendingDirectors':
        return await handleGetPendingDirectors(body.data);

      case 'updatePendingDirector':
        return await handleUpdatePendingDirector(body.data);

      default:
        return createResponse(400, {
          success: false,
          message: `Unknown operation: ${operation}`
        });
    }
  } catch (error) {
    console.error('Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return createResponse(500, {
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
      // CORS headers removed - handled by Lambda Function URL configuration
    },
    body: JSON.stringify(body)
  };
}

// ============================================================================
// OPERATION HANDLERS
// ============================================================================

async function handleSubmitDirectorAppointment(data: any) {
  const { din, appointmentDate, designation, category, entityId, entityType,
          entityName, entityIdentifier, authorizerUserId, authorizerDIN,
          authorizerName, authorizerEmail } = data;

  // 1. Check if director exists by DIN
  const listDirectorsQuery = `
    query ListUserProfilesByDIN($din: String!) {
      listUserProfiles(filter: { din: { eq: $din } }) {
        items {
          id
          userId
          displayName
          din
        }
      }
    }
  `;

  const directorResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    listDirectorsQuery,
    { din }
  );

  const director = directorResult.listUserProfiles.items[0];

  // 2. Find professional assigned to entity
  const listProfessionalsQuery = `
    query ListProfessionalAssignments($entityId: String!) {
      listProfessionalAssignments(filter: {
        entityId: { eq: $entityId }
        isActive: { eq: true }
      }) {
        items {
          professionalId
        }
      }
    }
  `;

  const profResult = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
    listProfessionalsQuery,
    { entityId }
  );

  const assignedProfessionalId = profResult.listProfessionalAssignments.items[0]?.professionalId;

  // 3. If director doesn't exist, create DIN association task
  if (!director) {
    if (assignedProfessionalId) {
      const createTaskMutation = `
        mutation CreateTask($input: CreateTaskInput!) {
          createTask(input: $input) {
            id
          }
        }
      `;

      await graphqlRequest(createTaskMutation, {
        input: {
          assignedTo: assignedProfessionalId,
          assignedBy: authorizerUserId,
          taskType: 'INFORMATION_UPDATE',
          title: 'Associate DIN with Email for New Director',
          description: `A director appointment request has been submitted for DIN ${din} at ${entityName}. Please associate this DIN with the director's email address.`,
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          relatedEntityId: entityId,
          relatedEntityType: entityType,
          metadata: JSON.stringify({
            directorDIN: din,
            entityName,
            entityIdentifier,
            requestType: 'din-email-association',
            appointmentData: data
          })
        }
      });
    }

    return createResponse(200, {
      success: true,
      message: 'Director appointment request submitted! A task has been created for professionals to associate this DIN.',
      directorExists: false
    });
  }

  // 4. Director exists - create document upload task
  const createTaskMutation = `
    mutation CreateTask($input: CreateTaskInput!) {
      createTask(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createTaskMutation, {
    input: {
      assignedTo: director.userId,
      assignedBy: authorizerUserId,
      taskType: 'DOCUMENT_UPLOAD',
      title: 'Upload Documents for Director Appointment',
      description: `You have been appointed as a director at ${entityName}. Please upload PAN, Aadhar, and passport (if foreign national), then complete this task.`,
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      relatedEntityId: entityId,
      relatedEntityType: entityType,
      metadata: JSON.stringify({
        appointmentData: {
          directorName: director.displayName || 'Name Not Available',
          directorDIN: din,
          din,
          directorUserId: director.userId,
          authorizerDIN,
          authorizerName,
          authorizerEmail,
          authorizerUserId,
          appointmentDate,
          designation,
          category,
          companyName: entityName,
          cin: entityIdentifier,
          cinNumber: entityIdentifier,
          entityId,
          entityType
        },
        taskType: 'director-document-upload',
        din,
        requiredForms: ['DIR-2', 'DIR-8', 'MBP-1'],
        assignedProfessionalId
      })
    }
  });

  // 5. Create DirectorAssociation
  const createDirectorAssociationMutation = `
    mutation CreateDirectorAssociation($input: CreateDirectorAssociationInput!) {
      createDirectorAssociation(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createDirectorAssociationMutation, {
    input: {
      userId: director.userId,
      entityId,
      entityType,
      associationType: 'DIRECTOR',
      din,
      appointmentDate,
      isActive: false
    }
  });

  return createResponse(200, {
    success: true,
    message: `Director appointment request submitted! ${director.displayName || 'The director'} has been notified.`,
    directorExists: true
  });
}

async function handleCompleteTask(data: any) {
  const { taskId, userId } = data;

  // Update task status to COMPLETED
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
        status
      }
    }
  `;

  await graphqlRequest(updateTaskMutation, {
    input: {
      id: taskId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Task completed successfully'
  });
}

async function handleCompleteDirectorDocumentUpload(data: any) {
  const { taskId, directorUserId } = data;

  // 1. Get the task to access metadata
  const getTaskQuery = `
    query GetTask($id: ID!) {
      getTask(id: $id) {
        id
        metadata
        assignedTo
      }
    }
  `;

  const taskResult = await graphqlRequest<{ getTask: any }>(getTaskQuery, { id: taskId });
  const task = taskResult.getTask;

  if (!task) {
    return createResponse(404, {
      success: false,
      message: 'Task not found'
    });
  }

  const metadata = JSON.parse(task.metadata || '{}');

  // 2. Update metadata to mark documents as uploaded and transition to next stage
  metadata.documentsUploaded = true;
  metadata.currentStage = 'FILL_DIRECTOR_INFO'; // Next stage: Professional fills form
  metadata.stageCompletedAt = metadata.stageCompletedAt || {};
  metadata.stageCompletedAt['UPLOAD_DOCUMENTS'] = new Date().toISOString();

  // 3. Update task: Reassign to professional, update title/description, keep status PENDING
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
      }
    }
  `;

  const professionalId = metadata.assignedProfessionalId;

  await graphqlRequest(updateTaskMutation, {
    input: {
      id: taskId,
      assignedTo: professionalId,
      title: 'Complete Director Information Form',
      description: 'Please complete the director information form and select companies for interest disclosure.',
      status: 'PENDING', // Keep as PENDING, not COMPLETED
      metadata: JSON.stringify(metadata)
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Documents uploaded successfully. The task has been sent to the professional to complete the director information form.'
  });
}

async function handleAssociateDINEmail(data: any) {
  const { din, email, entityId, entityType, professionalUserId, directorName, requestContext } = data;

  // Validation
  const validationErrors: string[] = [];

  if (!din || din.length !== 8 || !/^[0-9]{8}$/.test(din)) {
    validationErrors.push('DIN must be exactly 8 digits');
  }

  if (!email || !email.includes('@')) {
    validationErrors.push('Valid email address is required');
  }

  if (!professionalUserId) {
    validationErrors.push('Professional user ID is required');
  }

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if this DIN is already associated with an email
  const listPendingDirectorsQuery = `
    query ListPendingDirectors($din: String!, $status: PendingDirectorStatus!) {
      listPendingDirectors(filter: {
        and: [
          { din: { eq: $din } }
          { status: { eq: $status } }
        ]
      }) {
        items {
          id
          email
        }
      }
    }
  `;

  const existingAssociationsResult = await graphqlRequest<{ listPendingDirectors: { items: any[] } }>(
    listPendingDirectorsQuery,
    { din, status: 'PENDING' }
  );

  if (existingAssociationsResult.listPendingDirectors.items.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'This DIN is already associated with an email. Please check existing associations.',
      existingEmail: existingAssociationsResult.listPendingDirectors.items[0].email
    });
  }

  // 2. Check if someone already has an account with this email
  const listUserProfilesQuery = `
    query ListUserProfiles($email: String!) {
      listUserProfiles(filter: { email: { eq: $email } }) {
        items {
          id
          userId
          email
          displayName
        }
      }
    }
  `;

  const existingUserResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    listUserProfilesQuery,
    { email: normalizedEmail }
  );

  // If user exists, directly update their profile with the DIN
  if (existingUserResult.listUserProfiles.items.length > 0) {
    const existingUser = existingUserResult.listUserProfiles.items[0];

    const updateUserProfileMutation = `
      mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
        updateUserProfile(input: $input) {
          id
          din
          dinStatus
        }
      }
    `;

    await graphqlRequest(updateUserProfileMutation, {
      input: {
        id: existingUser.id,
        din,
        dinStatus: 'ACTIVE'
      }
    });

    // Complete matching tasks
    const listTasksQuery = `
      query ListTasks($assignedTo: String!, $status: String!, $taskType: String!) {
        listTasks(filter: {
          assignedTo: { eq: $assignedTo }
          status: { eq: $status }
          taskType: { eq: $taskType }
        }) {
          items {
            id
            metadata
          }
        }
      }
    `;

    const tasksResult = await graphqlRequest<{ listTasks: { items: any[] } }>(
      listTasksQuery,
      { assignedTo: professionalUserId, status: 'PENDING', taskType: 'INFORMATION_UPDATE' }
    );

    for (const task of tasksResult.listTasks.items) {
      const metadata = task.metadata ? JSON.parse(task.metadata) : {};
      if (metadata.directorDIN === din && metadata.requestType === 'din-email-association') {
        await handleCompleteTask({ taskId: task.id, userId: professionalUserId });
      }
    }

    return createResponse(200, {
      success: true,
      message: 'Director account found! Their profile has been updated with the DIN immediately.',
      status: 'CLAIMED',
      userFound: true,
      data: {
        din,
        email: normalizedEmail,
        status: 'CLAIMED'
      }
    });
  }

  // 3. Create the pending director association
  const createPendingDirectorMutation = `
    mutation CreatePendingDirector($input: CreatePendingDirectorInput!) {
      createPendingDirector(input: $input) {
        id
        din
        email
        directorName
        status
        createdAt
        expiresAt
      }
    }
  `;

  const createdAssociation = await graphqlRequest<{ createPendingDirector: any }>(
    createPendingDirectorMutation,
    {
      input: {
        din,
        email: normalizedEmail,
        directorName: directorName || undefined,
        associatedBy: professionalUserId,
        entityId: entityId || undefined,
        entityType: entityType as 'COMPANY' | 'LLP' | undefined,
        status: 'PENDING',
        requestContext: requestContext ? JSON.stringify(requestContext) : undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      }
    }
  );

  // 4. Find and complete matching tasks
  const listTasksQuery = `
    query ListTasks($assignedTo: String!, $status: String!, $taskType: String!) {
      listTasks(filter: {
        assignedTo: { eq: $assignedTo }
        status: { eq: $status }
        taskType: { eq: $taskType }
      }) {
        items {
          id
          metadata
        }
      }
    }
  `;

  const tasksResult = await graphqlRequest<{ listTasks: { items: any[] } }>(
    listTasksQuery,
    { assignedTo: professionalUserId, status: 'PENDING', taskType: 'INFORMATION_UPDATE' }
  );

  for (const task of tasksResult.listTasks.items) {
    const metadata = task.metadata ? JSON.parse(task.metadata) : {};
    if (metadata.directorDIN === din && metadata.requestType === 'din-email-association') {
      await handleCompleteTask({ taskId: task.id, userId: professionalUserId });
    }
  }

  return createResponse(200, {
    success: true,
    message: `DIN ${din} has been associated with ${normalizedEmail}. When someone creates an account with this email, their profile will automatically be populated with the DIN.`,
    status: 'PENDING',
    userFound: false,
    data: createdAssociation.createPendingDirector
  });
}

async function handleSubmitDirectorResignation(data: any) {
  const { din, entityId, entityType, resignationDate, reason, directorUserId } = data;

  // 1. Fetch director profile
  const listDirectorsQuery = `
    query ListUserProfilesByUserId($userId: String!) {
      listUserProfiles(filter: { userId: { eq: $userId } }) {
        items {
          id
          userId
          displayName
          din
        }
      }
    }
  `;

  const directorResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    listDirectorsQuery,
    { userId: directorUserId }
  );

  const director = directorResult.listUserProfiles.items[0];

  // 2. Fetch entity details
  let entityName = '';
  let entityIdentifier = '';

  if (entityType === 'COMPANY') {
    const getCompanyQuery = `
      query GetCompany($id: ID!) {
        getCompany(id: $id) {
          id
          companyName
          cinNumber
        }
      }
    `;
    const companyResult = await graphqlRequest<{ getCompany: any }>(getCompanyQuery, { id: entityId });
    entityName = companyResult.getCompany.companyName;
    entityIdentifier = companyResult.getCompany.cinNumber;
  } else {
    const getLLPQuery = `
      query GetLLP($id: ID!) {
        getLLP(id: $id) {
          id
          llpName
          llpIN
        }
      }
    `;
    const llpResult = await graphqlRequest<{ getLLP: any }>(getLLPQuery, { id: entityId });
    entityName = llpResult.getLLP.llpName;
    entityIdentifier = llpResult.getLLP.llpIN;
  }

  // 3. Find the DirectorAssociation
  const listDirectorAssociationsQuery = `
    query ListDirectorAssociations($userId: String!, $entityId: String!) {
      listDirectorAssociations(filter: {
        userId: { eq: $userId }
        entityId: { eq: $entityId }
        isActive: { eq: true }
      }) {
        items {
          id
        }
      }
    }
  `;

  const associationsResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
    listDirectorAssociationsQuery,
    { userId: directorUserId, entityId }
  );

  const association = associationsResult.listDirectorAssociations.items[0];

  if (association) {
    // 4. Update DirectorAssociation to inactive
    const updateDirectorAssociationMutation = `
      mutation UpdateDirectorAssociation($input: UpdateDirectorAssociationInput!) {
        updateDirectorAssociation(input: $input) {
          id
        }
      }
    `;

    await graphqlRequest(updateDirectorAssociationMutation, {
      input: {
        id: association.id,
        isActive: false,
        cessationDate: resignationDate
      }
    });
  }

  // 5. Create a properly structured service request
  const createServiceRequestMutation = `
    mutation CreateServiceRequest($input: CreateServiceRequestInput!) {
      createServiceRequest(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createServiceRequestMutation, {
    input: {
      directorId: directorUserId,
      serviceType: 'DIRECTOR_RESIGNATION',
      requestData: JSON.stringify({
        directorName: director?.displayName || 'Unknown',
        directorDIN: din,
        directorUserId,
        entityId,
        entityType,
        entityName,
        entityIdentifier,
        resignationDate,
        reason
      }),
      status: 'PENDING',
      priority: 'HIGH'
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Resignation submitted successfully. Your request will be processed by professionals.'
  });
}

async function handleProcessServiceRequest(data: any) {
  const { serviceRequestId, action, professionalUserId, notes } = data;

  // Map action to status
  const statusMap: Record<string, string> = {
    'approve': 'APPROVED',
    'reject': 'REJECTED',
    'complete': 'COMPLETED'
  };

  const newStatus = statusMap[action];

  // Update service request
  const updateServiceRequestMutation = `
    mutation UpdateServiceRequest($input: UpdateServiceRequestInput!) {
      updateServiceRequest(input: $input) {
        id
        status
      }
    }
  `;

  await graphqlRequest(updateServiceRequestMutation, {
    input: {
      id: serviceRequestId,
      status: newStatus,
      processedBy: professionalUserId,
      comments: notes
    }
  });

  return createResponse(200, {
    success: true,
    message: `Service request ${action}d successfully`
  });
}

async function handleSubmitDirectorInfoByProfessional(data: any) {
  const { taskId, directorInfo, companiesForDisclosure, professionalUserId } = data;

  // 0. VALIDATE INPUT
  const requiredFields = [
    'fullName', 'fatherName', 'dateOfBirth', 'din', 'pan', 'email',
    'mobileNumber', 'residentialAddress', 'state', 'pincode',
    'appointmentDate', 'designation', 'occupation'
  ];

  const validationErrors: string[] = [];

  for (const field of requiredFields) {
    if (!directorInfo[field]) {
      validationErrors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  }

  if (!directorInfo.consentGiven) {
    validationErrors.push('Consent for appointment is required');
  }

  if (!directorInfo.notDisqualified) {
    validationErrors.push('Confirmation that director is not disqualified is required');
  }

  if (!directorInfo.noConflictOfInterest) {
    validationErrors.push('Confirmation of no conflict of interest is required');
  }

  if (!companiesForDisclosure || companiesForDisclosure.length === 0) {
    validationErrors.push('At least one company for interest disclosure is required');
  }

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // 1. Get the task
  const getTaskQuery = `
    query GetTask($id: ID!) {
      getTask(id: $id) {
        id
        metadata
      }
    }
  `;

  const taskResult = await graphqlRequest<{ getTask: any }>(getTaskQuery, { id: taskId });
  const task = taskResult.getTask;

  if (!task) {
    return createResponse(404, { success: false, message: 'Task not found' });
  }

  const metadata = JSON.parse(task.metadata || '{}');

  // 2. Look up appointee's userId from their DIN (fixed 2026-01-11)
  const getUserByDINQuery = `
    query ListUserProfiles($din: String!) {
      listUserProfiles(filter: { din: { eq: $din } }) {
        items {
          id
          userId
          email
          displayName
        }
      }
    }
  `;

  const userResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    getUserByDINQuery,
    { din: directorInfo.din }
  );

  const appointeeUser = userResult.listUserProfiles.items[0];

  if (!appointeeUser || !appointeeUser.userId) {
    return createResponse(400, {
      success: false,
      message: `No user found with DIN ${directorInfo.din}. The appointee needs to have an account first.`
    });
  }

  const appointeeUserId = appointeeUser.userId;

  // 3. Update metadata with director info and companies for disclosure
  metadata.directorInfo = directorInfo;
  metadata.directorInfo.companiesForDisclosure = companiesForDisclosure;
  metadata.appointeeUserId = appointeeUserId;
  metadata.appointeeEmail = appointeeUser.email;
  metadata.currentStage = 'FILL_INTEREST_DISCLOSURE';
  metadata.stageCompletedAt = metadata.stageCompletedAt || {};
  metadata.stageCompletedAt['FILL_DIRECTOR_INFO'] = new Date().toISOString();

  // 4. Update task: Reassign to appointee
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(updateTaskMutation, {
    input: {
      id: taskId,
      assignedTo: appointeeUserId,
      title: 'Disclose Interest in Other Companies',
      description: 'Please provide details about your interest in the following companies.',
      status: 'PENDING',
      metadata: JSON.stringify(metadata)
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Director information submitted. Task sent to appointee for interest disclosure.'
  });
}

async function handleSubmitInterestDisclosureByAppointee(data: any) {
  const { taskId, interestDisclosure, appointeeUserId } = data;

  // 0. VALIDATE INPUT
  const validationErrors: string[] = [];

  if (!interestDisclosure || !interestDisclosure.companies || interestDisclosure.companies.length === 0) {
    validationErrors.push('No companies to disclose interest for');
  } else {
    for (const company of interestDisclosure.companies) {
      if (!company.natureOfInterest) {
        validationErrors.push(`Nature of interest is required for ${company.name || 'company'}`);
      }
      if (!company.shareholdingPercentage && company.shareholdingPercentage !== 0) {
        validationErrors.push(`Shareholding percentage is required for ${company.name || 'company'}`);
      }
      if (!company.dateOfInterest) {
        validationErrors.push(`Date of interest is required for ${company.name || 'company'}`);
      }
    }
  }

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // 1. Get the task
  const getTaskQuery = `
    query GetTask($id: ID!) {
      getTask(id: $id) {
        id
        metadata
      }
    }
  `;

  const taskResult = await graphqlRequest<{ getTask: any }>(getTaskQuery, { id: taskId });
  const task = taskResult.getTask;

  if (!task) {
    return createResponse(404, { success: false, message: 'Task not found' });
  }

  const metadata = JSON.parse(task.metadata || '{}');

  // 2. Update metadata with interest disclosure
  metadata.interestDisclosure = interestDisclosure;
  metadata.currentStage = 'GENERATE_FORMS';
  metadata.stageCompletedAt = metadata.stageCompletedAt || {};
  metadata.stageCompletedAt['FILL_INTEREST_DISCLOSURE'] = new Date().toISOString();

  // 3. Update task: Reassign to professional for form generation
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
      }
    }
  `;

  const professionalId = metadata.assignedProfessionalId;

  await graphqlRequest(updateTaskMutation, {
    input: {
      id: taskId,
      assignedTo: professionalId,
      title: 'Generate Director Appointment Forms',
      description: 'All information has been collected. Please generate the required forms (DIR-2, DIR-8, MBP-1).',
      status: 'PENDING',
      metadata: JSON.stringify(metadata)
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Interest disclosure submitted. Task sent to professional for form generation.'
  });
}

async function handleGenerateDirectorAppointmentForms(data: any) {
  const { taskId, professionalUserId, generatedFormIds } = data;

  // 1. Get the task
  const getTaskQuery = `
    query GetTask($id: ID!) {
      getTask(id: $id) {
        id
        metadata
      }
    }
  `;

  const taskResult = await graphqlRequest<{ getTask: any }>(getTaskQuery, { id: taskId });
  const task = taskResult.getTask;

  if (!task) {
    return createResponse(404, { success: false, message: 'Task not found' });
  }

  const metadata = JSON.parse(task.metadata || '{}');

  // 2. Update metadata with generated form IDs
  metadata.formsGenerated = true;
  metadata.generatedFormIds = generatedFormIds || [];
  metadata.stageCompletedAt = metadata.stageCompletedAt || {};
  metadata.stageCompletedAt['GENERATE_FORMS'] = new Date().toISOString();

  // 3. Mark task as COMPLETED
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
        status
      }
    }
  `;

  await graphqlRequest(updateTaskMutation, {
    input: {
      id: taskId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      metadata: JSON.stringify(metadata)
    }
  });

  // 4. Update DirectorAssociation to active
  const appointeeUserId = metadata.appointmentRequest.appointeeUserId;
  const entityId = metadata.appointmentRequest.entityId;

  const listAssociationsQuery = `
    query ListDirectorAssociations($userId: String!, $entityId: String!) {
      listDirectorAssociations(filter: {
        userId: { eq: $userId }
        entityId: { eq: $entityId }
      }) {
        items {
          id
          isActive
        }
      }
    }
  `;

  const associationsResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
    listAssociationsQuery,
    { userId: appointeeUserId, entityId }
  );

  const association = associationsResult.listDirectorAssociations.items[0];

  if (association && !association.isActive) {
    const updateAssociationMutation = `
      mutation UpdateDirectorAssociation($input: UpdateDirectorAssociationInput!) {
        updateDirectorAssociation(input: $input) {
          id
        }
      }
    `;

    await graphqlRequest(updateAssociationMutation, {
      input: {
        id: association.id,
        isActive: true
      }
    });
  }

  return createResponse(200, {
    success: true,
    message: 'Forms generated successfully. Director appointment process completed.'
  });
}

async function handleGetDocuments(data: any) {
  const { userId, role, serviceRequestId, entityId, entityType } = data;

  let queryFilter: any = {};

  // Priority 1: Filter by service request
  if (serviceRequestId) {
    queryFilter.serviceRequestId = { eq: serviceRequestId };
  }
  // Priority 2: Filter by entity
  else if (entityId && entityType) {
    queryFilter.and = [
      { entityId: { eq: entityId } },
      { entityType: { eq: entityType } }
    ];
  }
  // Priority 3: Apply role-based filtering
  else if (userId && role) {
    if (role === 'DIRECTORS') {
      // Directors can only see their own documents
      queryFilter.uploadedBy = { eq: userId };
    } else if (role === 'PROFESSIONALS') {
      // Professionals can see documents from directors they're associated with
      const listProfessionalAssignmentsQuery = `
        query ListProfessionalAssignments($professionalId: String!) {
          listProfessionalAssignments(filter: { professionalId: { eq: $professionalId } }) {
            items {
              entityId
              entityType
            }
          }
        }
      `;

      const assignmentsResult = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
        listProfessionalAssignmentsQuery,
        { professionalId: userId }
      );

      if (assignmentsResult.listProfessionalAssignments.items.length === 0) {
        return createResponse(200, { success: true, data: [] });
      }

      // Find all directors associated with those entities
      const directorUserIds = new Set<string>();

      for (const assignment of assignmentsResult.listProfessionalAssignments.items) {
        if (!assignment.entityId || !assignment.entityType) continue;

        const listDirectorAssociationsQuery = `
          query ListDirectorAssociations($entityId: String!, $entityType: DirectorAssociationEntityType!) {
            listDirectorAssociations(filter: {
              and: [
                { entityId: { eq: $entityId } },
                { entityType: { eq: $entityType } }
              ]
            }) {
              items {
                userId
              }
            }
          }
        `;

        const directorsResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
          listDirectorAssociationsQuery,
          { entityId: assignment.entityId, entityType: assignment.entityType }
        );

        directorsResult.listDirectorAssociations.items.forEach((da: any) => {
          if (da.userId) {
            directorUserIds.add(da.userId);
          }
        });
      }

      // Build OR filter for:
      // 1. Documents uploaded by directors
      // 2. Documents uploaded by SYSTEM (generated forms)
      // 3. Documents uploaded by the professional themselves
      const uploaderFilters = Array.from(directorUserIds).map(userId => ({
        uploadedBy: { eq: userId }
      }));

      // Add SYSTEM as uploader (for backend-generated forms)
      uploaderFilters.push({ uploadedBy: { eq: 'SYSTEM' } });

      // Add the professional themselves as uploader (for frontend-generated forms)
      uploaderFilters.push({ uploadedBy: { eq: userId } });

      if (uploaderFilters.length === 1) {
        queryFilter = uploaderFilters[0];
      } else {
        queryFilter.or = uploaderFilters;
      }

      // Also filter by entityId if we have assignments - so we only see docs for entities we manage
      const entityFilters = assignmentsResult.listProfessionalAssignments.items
        .filter(a => a.entityId && a.entityType)
        .map(a => ({
          and: [
            { entityId: { eq: a.entityId } },
            { entityType: { eq: a.entityType } }
          ]
        }));

      // Combine uploader filter with entity filter
      if (entityFilters.length > 0) {
        queryFilter = {
          and: [
            { or: uploaderFilters },
            { or: entityFilters }
          ]
        };
      }
    }
  }

  // Query documents
  const listDocumentsQuery = `
    query ListDocuments($filter: ModelDocumentFilterInput) {
      listDocuments(filter: $filter) {
        items {
          id
          fileName
          documentName
          fileKey
          fileSize
          mimeType
          documentType
          uploadedBy
          uploadedAt
          serviceRequestId
          entityId
          entityType
          isPublic
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listDocuments: { items: any[] } }>(
    listDocumentsQuery,
    { filter: queryFilter }
  );

  // Sort by upload date (newest first)
  const sortedData = result.listDocuments.items.sort((a: any, b: any) =>
    new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
  );

  return createResponse(200, {
    success: true,
    data: sortedData
  });
}

async function handleGetSignatureUrl(data: any) {
  const { signatureKey, requestingUserId } = data;

  if (!signatureKey || !requestingUserId) {
    return createResponse(400, {
      success: false,
      message: 'Missing signatureKey or requestingUserId'
    });
  }

  // Extract userId from signature key
  // Format can be: public/signatures/{userId}/... or signatures/{userId}/...
  const keyParts = signatureKey.split('/');
  let signatureOwnerUserId: string;

  if (keyParts[0] === 'public' && keyParts[1] === 'signatures' && keyParts.length >= 3) {
    // Format: public/signatures/{userId}/...
    signatureOwnerUserId = keyParts[2];
  } else if (keyParts[0] === 'signatures' && keyParts.length >= 2) {
    // Format: signatures/{userId}/...
    signatureOwnerUserId = keyParts[1];
  } else {
    return createResponse(400, {
      success: false,
      message: 'Invalid signature key format. Expected: public/signatures/{userId}/... or signatures/{userId}/...'
    });
  }

  // Check if requesting user is the owner
  if (requestingUserId === signatureOwnerUserId) {
    // User is accessing their own signature - allow
    return createResponse(200, {
      success: true,
      signatureKey: signatureKey,
      allowed: true
    });
  }

  // Check if requesting user is a professional assigned to the signature owner
  const listProfessionalAssignmentsQuery = `
    query ListProfessionalAssignments($professionalId: String!) {
      listProfessionalAssignments(filter: {
        professionalId: { eq: $professionalId }
        isActive: { eq: true }
      }) {
        items {
          entityId
          entityType
        }
      }
    }
  `;

  const assignmentsResult = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
    listProfessionalAssignmentsQuery,
    { professionalId: requestingUserId }
  );

  if (assignmentsResult.listProfessionalAssignments.items.length > 0) {
    // Check if signature owner is associated with any of the professional's entities
    for (const assignment of assignmentsResult.listProfessionalAssignments.items) {
      const listDirectorAssociationsQuery = `
        query ListDirectorAssociations($userId: String!, $entityId: String!, $entityType: DirectorAssociationEntityType!) {
          listDirectorAssociations(filter: {
            and: [
              { userId: { eq: $userId } },
              { entityId: { eq: $entityId } },
              { entityType: { eq: $entityType } }
            ]
          }) {
            items {
              id
            }
          }
        }
      `;

      const directorResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
        listDirectorAssociationsQuery,
        {
          userId: signatureOwnerUserId,
          entityId: assignment.entityId,
          entityType: assignment.entityType
        }
      );

      if (directorResult.listDirectorAssociations.items.length > 0) {
        // Professional is assigned to an entity where signature owner is a director - allow
        return createResponse(200, {
          success: true,
          signatureKey: signatureKey,
          allowed: true
        });
      }
    }
  }

  // Access denied
  return createResponse(403, {
    success: false,
    message: 'Access denied: You do not have permission to view this signature',
    allowed: false
  });
}

async function handleGetTaskDetails(data: any) {
  const { taskId, userId } = data;

  if (!taskId || !userId) {
    return createResponse(400, {
      success: false,
      message: 'Missing taskId or userId'
    });
  }

  // 1. Get the task
  const getTaskQuery = `
    query GetTask($id: ID!) {
      getTask(id: $id) {
        id
        assignedTo
        assignedBy
        taskType
        title
        description
        priority
        status
        dueDate
        createdAt
        completedAt
        relatedEntityId
        relatedEntityType
        metadata
      }
    }
  `;

  const taskResult = await graphqlRequest<{ getTask: any }>(getTaskQuery, { id: taskId });
  const task = taskResult.getTask;

  if (!task) {
    return createResponse(404, {
      success: false,
      message: 'Task not found'
    });
  }

  // Verify user has access to this task
  if (task.assignedTo !== userId) {
    return createResponse(403, {
      success: false,
      message: 'Access denied: This task is not assigned to you'
    });
  }

  // 2. Parse metadata
  const metadata = task.metadata ? JSON.parse(task.metadata) : {};

  // 3. Fetch related data based on metadata
  let prepopulatedFormData: any = {};

  // Get appointment data from metadata
  const appointmentData = metadata.appointmentRequest || metadata.appointmentData || {};

  // Fetch director profile if directorUserId is present
  if (appointmentData.directorUserId) {
    const listUserProfilesQuery = `
      query ListUserProfiles($userId: String!) {
        listUserProfiles(filter: { userId: { eq: $userId } }) {
          items {
            id
            userId
            displayName
            email
            din
            pan
            phoneNumber
          }
        }
      }
    `;

    const profileResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
      listUserProfilesQuery,
      { userId: appointmentData.directorUserId }
    );

    if (profileResult.listUserProfiles.items.length > 0) {
      const profile = profileResult.listUserProfiles.items[0];
      prepopulatedFormData.fullName = profile.displayName || '';
      prepopulatedFormData.email = profile.email || '';
      prepopulatedFormData.din = profile.din || '';
      prepopulatedFormData.pan = profile.pan || '';
      prepopulatedFormData.mobileNumber = profile.phoneNumber || '';
    }
  }

  // Fetch entity data if entityId and entityType are present
  if (appointmentData.entityId && appointmentData.entityType) {
    if (appointmentData.entityType === 'COMPANY') {
      const getCompanyQuery = `
        query GetCompany($id: ID!) {
          getCompany(id: $id) {
            id
            companyName
            cinNumber
            authorizedCapital
            paidUpCapital
            registrationDate
          }
        }
      `;

      const companyResult = await graphqlRequest<{ getCompany: any }>(
        getCompanyQuery,
        { id: appointmentData.entityId }
      );

      if (companyResult.getCompany) {
        prepopulatedFormData.companyName = companyResult.getCompany.companyName || '';
        prepopulatedFormData.cin = companyResult.getCompany.cinNumber || '';
        prepopulatedFormData.nominalCapital = companyResult.getCompany.authorizedCapital?.toString() || '';
        prepopulatedFormData.paidUpCapital = companyResult.getCompany.paidUpCapital?.toString() || '';
        prepopulatedFormData.companyRegistration = companyResult.getCompany.registrationDate || '';
      }
    } else if (appointmentData.entityType === 'LLP') {
      const getLLPQuery = `
        query GetLLP($id: ID!) {
          getLLP(id: $id) {
            id
            llpName
            llpIN
            totalObligationOfContribution
            registrationDate
          }
        }
      `;

      const llpResult = await graphqlRequest<{ getLLP: any }>(
        getLLPQuery,
        { id: appointmentData.entityId }
      );

      if (llpResult.getLLP) {
        prepopulatedFormData.companyName = llpResult.getLLP.llpName || '';
        prepopulatedFormData.cin = llpResult.getLLP.llpIN || '';
        prepopulatedFormData.nominalCapital = llpResult.getLLP.totalObligationOfContribution?.toString() || '';
        prepopulatedFormData.paidUpCapital = llpResult.getLLP.totalObligationOfContribution?.toString() || '';
        prepopulatedFormData.companyRegistration = llpResult.getLLP.registrationDate || '';
      }
    }
  }

  // Add appointment data from metadata
  prepopulatedFormData = {
    ...prepopulatedFormData,
    appointmentDate: appointmentData.appointmentDate || '',
    designation: appointmentData.designation || 'DIRECTOR',
    category: appointmentData.category || 'PROMOTER',
    entityId: appointmentData.entityId,
    entityType: appointmentData.entityType || 'COMPANY'
  };

  // 4. Determine available actions based on task type and workflow stage
  const availableActions: string[] = [];

  // Backend business logic for determining actions
  if (task.title.includes('Associate DIN with Email')) {
    availableActions.push('ASSOCIATE_DIN_EMAIL');
  } else if (task.title.includes('Upload Documents for Director')) {
    availableActions.push('COMPLETE_DOCUMENT_UPLOAD');
  } else if (task.title.includes('Complete Director Information Form')) {
    availableActions.push('FILL_DIRECTOR_INFO_FORM');
  } else if (task.title.includes('Disclose Interest in Other Companies')) {
    availableActions.push('FILL_INTEREST_DISCLOSURE');
  } else if (task.title.includes('Generate Director Appointment Forms')) {
    availableActions.push('GENERATE_FORMS');
  } else if (task.title.includes('Complete Director Appointment Request')) {
    availableActions.push('COMPLETE_TASK');
  } else {
    // Generic complete action for other tasks
    availableActions.push('COMPLETE_TASK');
  }

  // 5. Return task with prepopulated data and available actions
  return createResponse(200, {
    success: true,
    task: {
      id: task.id,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      relatedEntityId: task.relatedEntityId,
      relatedEntityType: task.relatedEntityType,
      metadata: metadata,
      availableActions: availableActions
    },
    prepopulatedFormData: prepopulatedFormData,
    appointmentData: appointmentData
  });
}

// ============================================================================
// CRUD OPERATIONS - COMPANY
// ============================================================================

async function handleCreateCompany(data: any) {
  const {
    cinNumber,
    companyName,
    rocName,
    dateOfIncorporation,
    emailId,
    registeredAddress,
    authorizedCapital,
    paidUpCapital,
    numberOfDirectors,
    companyStatus,
    companyType,
    lastAnnualFilingDate,
    financialYear,
    agmDate
  } = data;

  // Validation
  const validationErrors: string[] = [];

  if (!cinNumber) {
    validationErrors.push('CIN number is required');
  }

  if (!companyName) {
    validationErrors.push('Company name is required');
  }

  if (numberOfDirectors && numberOfDirectors < 2) {
    validationErrors.push('A company must have a minimum of 2 directors');
  }

  if (authorizedCapital > 0 && paidUpCapital > authorizedCapital) {
    validationErrors.push('Paid up capital cannot exceed authorized capital');
  }

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Create company
  const createCompanyMutation = `
    mutation CreateCompany($input: CreateCompanyInput!) {
      createCompany(input: $input) {
        id
        cinNumber
        companyName
        companyType
        companyStatus
      }
    }
  `;

  const result = await graphqlRequest<{ createCompany: any }>(
    createCompanyMutation,
    {
      input: {
        cinNumber,
        companyName,
        rocName: rocName || undefined,
        dateOfIncorporation: dateOfIncorporation || undefined,
        emailId: emailId || undefined,
        registeredAddress: registeredAddress || undefined,
        authorizedCapital: authorizedCapital || undefined,
        paidUpCapital: paidUpCapital || undefined,
        numberOfDirectors: numberOfDirectors || undefined,
        companyStatus: companyStatus || 'ACTIVE',
        companyType: companyType || 'PRIVATE',
        lastAnnualFilingDate: lastAnnualFilingDate || undefined,
        financialYear: financialYear || undefined,
        agmDate: agmDate || undefined
      }
    }
  );

  return createResponse(200, {
    success: true,
    message: 'Company created successfully',
    data: result.createCompany
  });
}

// ============================================================================
// CRUD OPERATIONS - LLP
// ============================================================================

async function handleCreateLLP(data: any) {
  const {
    llpIN,
    llpName,
    dateOfIncorporation,
    emailId,
    registeredAddress,
    totalContribution,
    numberOfPartners,
    llpStatus,
    lastAnnualFilingDate,
    financialYear
  } = data;

  // Validation
  const validationErrors: string[] = [];

  if (!llpIN) {
    validationErrors.push('LLPIN is required');
  }

  if (!llpName) {
    validationErrors.push('LLP name is required');
  }

  if (numberOfPartners && numberOfPartners < 2) {
    validationErrors.push('An LLP must have a minimum of 2 designated partners');
  }

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Create LLP
  const createLLPMutation = `
    mutation CreateLLP($input: CreateLLPInput!) {
      createLLP(input: $input) {
        id
        llpIN
        llpName
        llpStatus
      }
    }
  `;

  const result = await graphqlRequest<{ createLLP: any }>(
    createLLPMutation,
    {
      input: {
        llpIN,
        llpName,
        dateOfIncorporation: dateOfIncorporation || undefined,
        emailId: emailId || undefined,
        registeredAddress: registeredAddress || undefined,
        totalContribution: totalContribution || undefined,
        numberOfPartners: numberOfPartners || undefined,
        llpStatus: llpStatus || 'ACTIVE',
        lastAnnualFilingDate: lastAnnualFilingDate || undefined,
        financialYear: financialYear || undefined
      }
    }
  );

  return createResponse(200, {
    success: true,
    message: 'LLP created successfully',
    data: result.createLLP
  });
}

// ============================================================================
// DATA FETCHING OPERATIONS
// ============================================================================

async function handleGetUserProfile(data: any) {
  const { userId, email, din } = data;

  if (!userId && !email && !din) {
    return createResponse(400, {
      success: false,
      message: 'Either userId, email, or din is required'
    });
  }

  let query: string;
  let variables: any;

  if (userId) {
    query = `
      query ListUserProfiles($userId: String!) {
        listUserProfiles(filter: { userId: { eq: $userId } }) {
          items {
            id
            userId
            email
            displayName
            din
            dinStatus
            role
            phoneNumber
            panNumber
            aadhaarNumber
            dateOfBirth
            address
            city
            state
            pincode
            signatureKey
            createdAt
            updatedAt
          }
        }
      }
    `;
    variables = { userId };
  } else if (email) {
    query = `
      query ListUserProfiles($email: String!) {
        listUserProfiles(filter: { email: { eq: $email } }) {
          items {
            id
            userId
            email
            displayName
            din
            dinStatus
            role
            phoneNumber
            panNumber
            aadhaarNumber
            dateOfBirth
            address
            city
            state
            pincode
            signatureKey
            createdAt
            updatedAt
          }
        }
      }
    `;
    variables = { email };
  } else {
    query = `
      query ListUserProfiles($din: String!) {
        listUserProfiles(filter: { din: { eq: $din } }) {
          items {
            id
            userId
            email
            displayName
            din
            dinStatus
            role
            phoneNumber
            panNumber
            aadhaarNumber
            dateOfBirth
            address
            city
            state
            pincode
            signatureKey
            createdAt
            updatedAt
          }
        }
      }
    `;
    variables = { din };
  }

  const result = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    query,
    variables
  );

  const userProfile = result.listUserProfiles.items.length > 0
    ? result.listUserProfiles.items[0]
    : null;

  return createResponse(200, {
    success: true,
    data: userProfile
  });
}

async function handleGetServiceRequests(data: any) {
  const { directorId, processedBy, status, serviceType } = data;

  // Build filter conditions
  const filterConditions: any[] = [];

  if (directorId) {
    filterConditions.push({ directorId: { eq: directorId } });
  }

  if (processedBy) {
    filterConditions.push({ processedBy: { eq: processedBy } });
  }

  if (status) {
    filterConditions.push({ status: { eq: status } });
  }

  if (serviceType) {
    filterConditions.push({ serviceType: { eq: serviceType } });
  }

  // Build the filter
  let filter = {};
  if (filterConditions.length === 1) {
    filter = filterConditions[0];
  } else if (filterConditions.length > 1) {
    filter = { and: filterConditions };
  }

  const query = `
    query ListServiceRequests($filter: ModelServiceRequestFilterInput) {
      listServiceRequests(filter: $filter) {
        items {
          id
          serviceType
          requestData
          status
          directorId
          processedBy
          priority
          createdAt
          updatedAt
          completedAt
          comments
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listServiceRequests: { items: any[] } }>(
    query,
    { filter: Object.keys(filter).length > 0 ? filter : undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listServiceRequests.items
  });
}

async function handleGetCompany(data: any) {
  const { id } = data;

  if (!id) {
    return createResponse(400, {
      success: false,
      message: 'Company ID (CIN) is required'
    });
  }

  const query = `
    query GetCompany($id: ID!) {
      getCompany(id: $id) {
        id
        cinNumber
        companyName
        companyType
        companyStatus
        rocName
        dateOfIncorporation
        emailId
        registeredAddress
        authorizedCapital
        paidUpCapital
        numberOfDirectors
        lastAnnualFilingDate
        financialYear
        agmDate
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ getCompany: any }>(
    query,
    { id }
  );

  return createResponse(200, {
    success: true,
    data: result.getCompany
  });
}

async function handleGetLLP(data: any) {
  const { id } = data;

  if (!id) {
    return createResponse(400, {
      success: false,
      message: 'LLP ID (LLPIN) is required'
    });
  }

  const query = `
    query GetLLP($id: ID!) {
      getLLP(id: $id) {
        id
        llpIN
        llpName
        llpStatus
        dateOfIncorporation
        emailId
        registeredAddress
        totalContribution
        numberOfPartners
        lastAnnualFilingDate
        financialYear
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ getLLP: any }>(
    query,
    { id }
  );

  return createResponse(200, {
    success: true,
    data: result.getLLP
  });
}

// ============================================================================
// DIRECTOR DASHBOARD OPERATIONS
// ============================================================================

async function handleGetDirectorDashboardData(data: any) {
  const { userId, username } = data;

  if (!userId && !username) {
    return createResponse(400, {
      success: false,
      message: 'userId or username is required'
    });
  }

  // 1. Get director's UserProfile
  const listUserProfilesQuery = `
    query ListUserProfiles($userId: String!) {
      listUserProfiles(filter: { userId: { eq: $userId } }) {
        items {
          id
          userId
          email
          displayName
          din
          dinStatus
          dscStatus
          pan
          panDocumentUrl
          eSignImageUrl
          phoneNumber
          role
        }
      }
    }
  `;

  const profileResult = await graphqlRequest<{ listUserProfiles: { items: any[] } }>(
    listUserProfilesQuery,
    { userId: userId || username }
  );

  if (profileResult.listUserProfiles.items.length === 0) {
    return createResponse(404, {
      success: false,
      message: 'User profile not found'
    });
  }

  const userProfile = profileResult.listUserProfiles.items[0];

  // 2. Get director's associations
  const listAssociationsQuery = `
    query ListDirectorAssociations($userId: String!) {
      listDirectorAssociations(filter: {
        and: [
          { userId: { eq: $userId } }
          { isActive: { eq: true } }
        ]
      }) {
        items {
          id
          userId
          entityId
          entityType
          associationType
          din
          originalAppointmentDate
          appointmentDate
          cessationDate
          isActive
        }
      }
    }
  `;

  const associationsResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
    listAssociationsQuery,
    { userId: userProfile.userId }
  );

  const associations = associationsResult.listDirectorAssociations.items;

  // 3. Get companies and LLPs
  const companyIds = associations.filter(a => a.entityType === 'COMPANY').map(a => a.entityId);
  const llpIds = associations.filter(a => a.entityType === 'LLP').map(a => a.entityId);

  const companies = [];
  for (const companyId of companyIds) {
    try {
      const companyResult = await graphqlRequest<{ getCompany: any }>(
        `query GetCompany($id: ID!) {
          getCompany(id: $id) {
            id
            cinNumber
            companyName
            companyType
            companyStatus
            dateOfIncorporation
            authorizedCapital
            paidUpCapital
            numberOfDirectors
            registeredAddress
            emailId
            lastAnnualFilingDate
            financialYear
            agmDate
          }
        }`,
        { id: companyId }
      );
      if (companyResult.getCompany) {
        companies.push(companyResult.getCompany);
      }
    } catch (error) {
      console.warn(`Could not fetch company ${companyId}:`, error);
    }
  }

  const llps = [];
  for (const llpId of llpIds) {
    try {
      const llpResult = await graphqlRequest<{ getLLP: any }>(
        `query GetLLP($id: ID!) {
          getLLP(id: $id) {
            id
            llpIN
            llpName
            llpStatus
            dateOfIncorporation
            totalObligationOfContribution
            numberOfPartners
            numberOfDesignatedPartners
            registeredAddress
            emailId
            lastAnnualFilingDate
            financialYear
          }
        }`,
        { id: llpId }
      );
      if (llpResult.getLLP) {
        llps.push(llpResult.getLLP);
      }
    } catch (error) {
      console.warn(`Could not fetch LLP ${llpId}:`, error);
    }
  }

  // 4. Get professional assignments
  const allEntityIds = [...companyIds, ...llpIds];
  const professionalAssignments = [];

  if (allEntityIds.length > 0) {
    const listProfAssignmentsQuery = `
      query ListProfessionalAssignments($filter: ModelProfessionalAssignmentFilterInput) {
        listProfessionalAssignments(filter: $filter) {
          items {
            professionalId
            entityId
            entityType
            role
            assignedDate
            isActive
          }
        }
      }
    `;

    const orFilters = allEntityIds.map(entityId => ({ entityId: { eq: entityId } }));
    const filter = orFilters.length === 1 ? orFilters[0] : { or: orFilters };

    const profAssignmentsResult = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
      listProfAssignmentsQuery,
      { filter: { and: [filter, { isActive: { eq: true } }] } }
    );

    professionalAssignments.push(...profAssignmentsResult.listProfessionalAssignments.items);
  }

  return createResponse(200, {
    success: true,
    data: {
      userProfile,
      associations,
      companies,
      llps,
      professionalAssignments
    }
  });
}

async function handleUpdateUserDIN(data: any) {
  const { userProfileId, din, dinStatus } = data;

  const validationErrors: string[] = [];
  if (!userProfileId) validationErrors.push('userProfileId is required');
  if (!din || din.length !== 8) validationErrors.push('Valid 8-digit DIN is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const updateMutation = `
    mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
      updateUserProfile(input: $input) {
        id
        din
        dinStatus
      }
    }
  `;

  await graphqlRequest(updateMutation, {
    input: {
      id: userProfileId,
      din,
      dinStatus: dinStatus || 'ACTIVE'
    }
  });

  return createResponse(200, {
    success: true,
    message: 'DIN updated successfully'
  });
}

async function handleUpdateUserProfile(data: any) {
  const { userProfileId, updates } = data;

  if (!userProfileId) {
    return createResponse(400, {
      success: false,
      message: 'userProfileId is required'
    });
  }

  const updateMutation = `
    mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
      updateUserProfile(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(updateMutation, {
    input: {
      id: userProfileId,
      ...updates
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Profile updated successfully'
  });
}

async function handleCheckAndClaimPendingDIN(data: any) {
  const { email, userId, userProfileId } = data;

  if (!email || !userId || !userProfileId) {
    return createResponse(400, {
      success: false,
      message: 'email, userId, and userProfileId are required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check for pending DIN associations
  const listPendingDirectorsQuery = `
    query ListPendingDirectors($email: String!, $status: PendingDirectorStatus!) {
      listPendingDirectors(filter: {
        and: [
          { email: { eq: $email } }
          { status: { eq: $status } }
        ]
      }) {
        items {
          id
          din
          email
          entityId
          entityType
          requestContext
          associatedBy
        }
      }
    }
  `;

  const pendingResult = await graphqlRequest<{ listPendingDirectors: { items: any[] } }>(
    listPendingDirectorsQuery,
    { email: normalizedEmail, status: 'PENDING' }
  );

  if (pendingResult.listPendingDirectors.items.length === 0) {
    return createResponse(200, {
      success: true,
      claimed: false,
      message: 'No pending DIN associations found'
    });
  }

  const association = pendingResult.listPendingDirectors.items[0];

  // Update user profile with DIN
  await handleUpdateUserDIN({
    userProfileId,
    din: association.din,
    dinStatus: 'ACTIVE'
  });

  // Mark association as claimed
  const updatePendingDirectorMutation = `
    mutation UpdatePendingDirector($input: UpdatePendingDirectorInput!) {
      updatePendingDirector(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(updatePendingDirectorMutation, {
    input: {
      id: association.id,
      status: 'CLAIMED',
      claimedAt: new Date().toISOString()
    }
  });

  // Create DirectorAssociation if entity info available
  if (association.entityId && association.entityType) {
    const requestContext = association.requestContext ? JSON.parse(association.requestContext) : {};

    await graphqlRequest(
      `mutation CreateDirectorAssociation($input: CreateDirectorAssociationInput!) {
        createDirectorAssociation(input: $input) {
          id
        }
      }`,
      {
        input: {
          userId,
          entityId: association.entityId,
          entityType: association.entityType,
          associationType: 'DIRECTOR',
          din: association.din,
          appointmentDate: requestContext.appointmentDate || new Date().toISOString(),
          isActive: false
        }
      }
    );
  }

  return createResponse(200, {
    success: true,
    claimed: true,
    din: association.din,
    message: `DIN ${association.din} has been claimed and added to your profile`
  });
}

async function handleCreateDirectorKYCRequest(data: any) {
  const { directorUserId, kycData } = data;

  const validationErrors: string[] = [];
  if (!directorUserId) validationErrors.push('directorUserId is required');
  if (!kycData.din) validationErrors.push('DIN is required');
  if (!kycData.pan) validationErrors.push('PAN is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createServiceRequestMutation = `
    mutation CreateServiceRequest($input: CreateServiceRequestInput!) {
      createServiceRequest(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createServiceRequestMutation, {
    input: {
      directorId: directorUserId,
      serviceType: 'DIRECTOR_KYC',
      requestData: JSON.stringify(kycData),
      status: 'PENDING',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });

  return createResponse(200, {
    success: true,
    message: 'KYC request created successfully'
  });
}

// ============================================================================
// PROFESSIONAL DASHBOARD OPERATIONS
// ============================================================================

async function handleGetProfessionalDashboardData(data: any) {
  const { professionalId } = data;

  if (!professionalId) {
    return createResponse(400, {
      success: false,
      message: 'professionalId is required'
    });
  }

  // 1. Get professional's assignments
  const listAssignmentsQuery = `
    query ListProfessionalAssignments($professionalId: String!) {
      listProfessionalAssignments(filter: {
        and: [
          { professionalId: { eq: $professionalId } }
          { isActive: { eq: true } }
        ]
      }) {
        items {
          professionalId
          entityId
          entityType
          role
          assignedDate
          isActive
        }
      }
    }
  `;

  const assignmentsResult = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
    listAssignmentsQuery,
    { professionalId }
  );

  const assignments = assignmentsResult.listProfessionalAssignments.items;

  // 2. Fetch assigned companies and LLPs
  const companyIds = assignments.filter(a => a.entityType === 'COMPANY').map(a => a.entityId);
  const llpIds = assignments.filter(a => a.entityType === 'LLP').map(a => a.entityId);

  const companies = [];
  for (const companyId of companyIds) {
    try {
      const result = await handleGetCompany({ id: companyId });
      if (result.statusCode === 200) {
        const body = JSON.parse(result.body);
        companies.push(body.data);
      }
    } catch (error) {
      console.warn(`Could not fetch company ${companyId}:`, error);
    }
  }

  const llps = [];
  for (const llpId of llpIds) {
    try {
      const result = await handleGetLLP({ id: llpId });
      if (result.statusCode === 200) {
        const body = JSON.parse(result.body);
        llps.push(body.data);
      }
    } catch (error) {
      console.warn(`Could not fetch LLP ${llpId}:`, error);
    }
  }

  // 3. Get all director associations for these entities
  const allEntityIds = [...companyIds, ...llpIds];
  const associations = [];

  if (allEntityIds.length > 0) {
    const orFilters = allEntityIds.map(entityId => ({ entityId: { eq: entityId } }));
    const filter = orFilters.length === 1 ? orFilters[0] : { or: orFilters };

    const listAssociationsQuery = `
      query ListDirectorAssociations($filter: ModelDirectorAssociationFilterInput) {
        listDirectorAssociations(filter: $filter) {
          items {
            id
            userId
            entityId
            entityType
            associationType
            din
            originalAppointmentDate
            appointmentDate
            cessationDate
            isActive
          }
        }
      }
    `;

    const associationsResult = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
      listAssociationsQuery,
      { filter }
    );

    associations.push(...associationsResult.listDirectorAssociations.items);
  }

  return createResponse(200, {
    success: true,
    data: {
      assignments,
      companies,
      llps,
      associations
    }
  });
}

async function handleGetServiceRequestWithDirectors(data: any) {
  const { serviceRequestId } = data;

  if (!serviceRequestId) {
    return createResponse(400, {
      success: false,
      message: 'serviceRequestId is required'
    });
  }

  // Get service request
  const getServiceRequestQuery = `
    query GetServiceRequest($id: ID!) {
      getServiceRequest(id: $id) {
        id
        serviceType
        requestData
        status
        directorId
        processedBy
        priority
        createdAt
        updatedAt
        completedAt
        comments
      }
    }
  `;

  const serviceRequestResult = await graphqlRequest<{ getServiceRequest: any }>(
    getServiceRequestQuery,
    { id: serviceRequestId }
  );

  const serviceRequest = serviceRequestResult.getServiceRequest;

  if (!serviceRequest) {
    return createResponse(404, {
      success: false,
      message: 'Service request not found'
    });
  }

  // Get director profile
  let directorProfile = null;
  if (serviceRequest.directorId) {
    const profileResult = await handleGetUserProfile({ userId: serviceRequest.directorId });
    if (profileResult.statusCode === 200) {
      const body = JSON.parse(profileResult.body);
      directorProfile = body.data;
    }
  }

  return createResponse(200, {
    success: true,
    data: {
      serviceRequest,
      directorProfile
    }
  });
}

async function handleUpdateServiceRequestStatus(data: any) {
  const { serviceRequestId, status, comments } = data;

  const validationErrors: string[] = [];
  if (!serviceRequestId) validationErrors.push('serviceRequestId is required');
  if (!status) validationErrors.push('status is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const updateMutation = `
    mutation UpdateServiceRequest($input: UpdateServiceRequestInput!) {
      updateServiceRequest(input: $input) {
        id
        status
      }
    }
  `;

  await graphqlRequest(updateMutation, {
    input: {
      id: serviceRequestId,
      status,
      updatedAt: new Date().toISOString(),
      comments: comments || undefined
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Service request updated successfully'
  });
}

async function handleGetDirectorSignatures(data: any) {
  const { directorUserIds } = data;

  if (!directorUserIds || !Array.isArray(directorUserIds)) {
    return createResponse(400, {
      success: false,
      message: 'directorUserIds array is required'
    });
  }

  const signatures = [];

  for (const userId of directorUserIds) {
    try {
      const profileResult = await handleGetUserProfile({ userId });
      if (profileResult.statusCode === 200) {
        const body = JSON.parse(profileResult.body);
        const profile = body.data;
        if (profile && profile.eSignImageUrl) {
          signatures.push({
            userId: profile.userId,
            displayName: profile.displayName,
            email: profile.email,
            din: profile.din,
            eSignImageUrl: profile.eSignImageUrl
          });
        }
      }
    } catch (error) {
      console.warn(`Could not fetch signature for director ${userId}:`, error);
    }
  }

  return createResponse(200, {
    success: true,
    data: signatures
  });
}

async function handleCreateProfessionalTask(data: any) {
  const { assignedTo, professionalId, taskType, title, description, priority, dueDate, relatedEntityId, relatedEntityType, metadata } = data;

  const validationErrors: string[] = [];
  if (!assignedTo) validationErrors.push('assignedTo is required');
  if (!taskType) validationErrors.push('taskType is required');
  if (!title) validationErrors.push('title is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createTaskMutation = `
    mutation CreateTask($input: CreateTaskInput!) {
      createTask(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createTaskMutation, {
    input: {
      assignedTo,
      assignedBy: professionalId,
      taskType,
      title,
      description: description || undefined,
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      dueDate: dueDate || undefined,
      relatedEntityId: relatedEntityId || undefined,
      relatedEntityType: relatedEntityType || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Task created successfully'
  });
}

async function handleAssignProfessionalToEntity(data: any) {
  const { professionalId, entityId, entityType, role } = data;

  const validationErrors: string[] = [];
  if (!professionalId) validationErrors.push('professionalId is required');
  if (!entityId) validationErrors.push('entityId is required');
  if (!entityType) validationErrors.push('entityType is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createAssignmentMutation = `
    mutation CreateProfessionalAssignment($input: CreateProfessionalAssignmentInput!) {
      createProfessionalAssignment(input: $input) {
        professionalId
        entityId
      }
    }
  `;

  await graphqlRequest(createAssignmentMutation, {
    input: {
      professionalId,
      entityId,
      entityType,
      assignedDate: new Date().toISOString().split('T')[0],
      isActive: true,
      role: role || 'PRIMARY'
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Professional assigned to entity successfully'
  });
}

// ============================================================================
// FORM GENERATOR OPERATIONS
// ============================================================================

async function handleGetDirectorInfoDocument(data: any) {
  const { directorDIN } = data;

  if (!directorDIN) {
    return createResponse(400, {
      success: false,
      message: 'directorDIN is required'
    });
  }

  const listDocumentsQuery = `
    query ListDocuments($filter: ModelDocumentFilterInput) {
      listDocuments(filter: $filter) {
        items {
          id
          fileName
          fileKey
          documentType
          uploadedAt
          uploadedBy
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listDocuments: { items: any[] } }>(
    listDocumentsQuery,
    {
      filter: {
        and: [
          { fileName: { contains: 'DirectorInfo' } },
          { fileName: { contains: directorDIN } }
        ]
      }
    }
  );

  const documents = result.listDocuments.items.sort((a, b) =>
    new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
  );

  return createResponse(200, {
    success: true,
    data: documents.length > 0 ? documents[0] : null
  });
}

async function handleCreateGeneratedForm(data: any) {
  const { fileName, documentName, fileKey, fileSize, professionalUserId, entityId, entityType } = data;

  const validationErrors: string[] = [];
  if (!fileName) validationErrors.push('fileName is required');
  if (!fileKey) validationErrors.push('fileKey is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createDocumentMutation = `
    mutation CreateDocument($input: CreateDocumentInput!) {
      createDocument(input: $input) {
        id
        fileName
        fileKey
      }
    }
  `;

  await graphqlRequest(createDocumentMutation, {
    input: {
      fileName,
      documentName: documentName || fileName,
      fileKey,
      fileSize: fileSize || 0,
      mimeType: 'text/plain',
      uploadedBy: professionalUserId,
      uploadedAt: new Date().toISOString(),
      documentType: 'COMPLIANCE_CERTIFICATE',
      entityId: entityId || undefined,
      entityType: entityType || undefined,
      isPublic: false
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Form document created successfully'
  });
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

async function handleListAssetTemplates(data: any) {
  const { isActive } = data;

  const listQuery = `
    query ListAssetTemplates($filter: ModelAssetTemplateFilterInput) {
      listAssetTemplates(filter: $filter) {
        items {
          id
          templateName
          templateType
          fileKey
          fileName
          fileSize
          mimeType
          description
          version
          metadata
          createdBy
          createdAt
          updatedAt
          isActive
        }
      }
    }
  `;

  const filter = isActive !== undefined ? { isActive: { eq: isActive } } : {};

  const result = await graphqlRequest<{ listAssetTemplates: { items: any[] } }>(
    listQuery,
    { filter: Object.keys(filter).length > 0 ? filter : undefined }
  );

  const sortedTemplates = result.listAssetTemplates.items.sort((a, b) =>
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  return createResponse(200, {
    success: true,
    data: sortedTemplates
  });
}

async function handleCreateAssetTemplate(data: any) {
  const { templateName, templateType, fileKey, fileName, fileSize, mimeType, description, version, metadata, createdBy } = data;

  const validationErrors: string[] = [];
  if (!templateName) validationErrors.push('templateName is required');
  if (!templateType) validationErrors.push('templateType is required');
  if (!fileKey) validationErrors.push('fileKey is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createMutation = `
    mutation CreateAssetTemplate($input: CreateAssetTemplateInput!) {
      createAssetTemplate(input: $input) {
        id
        templateName
      }
    }
  `;

  await graphqlRequest(createMutation, {
    input: {
      templateName,
      templateType,
      fileKey,
      fileName: fileName || templateName,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/octet-stream',
      description: description || undefined,
      version: version || '1.0',
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      createdBy: createdBy || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Asset template created successfully'
  });
}

async function handleUpdateAssetTemplate(data: any) {
  const { id, updates } = data;

  if (!id) {
    return createResponse(400, {
      success: false,
      message: 'Template id is required'
    });
  }

  const updateMutation = `
    mutation UpdateAssetTemplate($input: UpdateAssetTemplateInput!) {
      updateAssetTemplate(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(updateMutation, {
    input: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Asset template updated successfully'
  });
}

async function handleDeleteAssetTemplate(data: any) {
  const { id } = data;

  if (!id) {
    return createResponse(400, {
      success: false,
      message: 'Template id is required'
    });
  }

  // Soft delete - set isActive to false
  return await handleUpdateAssetTemplate({
    id,
    updates: { isActive: false }
  });
}

async function handleAdminLogin(data: any) {
  const { adminCode } = data;

  // Admin codes would be validated here
  // For now, check if user profile exists

  const adminProfiles = {
    'admin_system': { email: 'admin@complianceportal.com', displayName: 'System Administrator', role: 'ADMIN' },
    'admin_assets': { email: 'assets@complianceportal.com', displayName: 'Asset Manager', role: 'ADMIN' }
  };

  const adminUserId = adminCode === 'COMPLIANCE_ADMIN_2025' ? 'admin_system' :
                      adminCode === 'ASSET_MANAGER_2025' ? 'admin_assets' : null;

  if (!adminUserId) {
    return createResponse(401, {
      success: false,
      message: 'Invalid admin code'
    });
  }

  const adminProfile = adminProfiles[adminUserId as keyof typeof adminProfiles];

  // Check if profile exists
  const profileResult = await handleGetUserProfile({ userId: adminUserId });
  let profile = null;

  if (profileResult.statusCode === 200) {
    const body = JSON.parse(profileResult.body);
    profile = body.data;
  }

  // Create if doesn't exist
  if (!profile) {
    const createMutation = `
      mutation CreateUserProfile($input: CreateUserProfileInput!) {
        createUserProfile(input: $input) {
          id
          userId
          email
          displayName
          role
        }
      }
    `;

    const result = await graphqlRequest<{ createUserProfile: any }>(
      createMutation,
      {
        input: {
          userId: adminUserId,
          email: adminProfile.email,
          role: adminProfile.role,
          displayName: adminProfile.displayName
        }
      }
    );

    profile = result.createUserProfile;
  }

  return createResponse(200, {
    success: true,
    data: profile
  });
}

// ============================================================================
// ASSOCIATE DIRECTOR OPERATIONS
// ============================================================================

async function handleFindOrCreateDirectorByEmail(data: any) {
  const { email, din, displayName } = data;

  if (!email) {
    return createResponse(400, {
      success: false,
      message: 'email is required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Try to find existing user
  const profileResult = await handleGetUserProfile({ email: normalizedEmail });

  if (profileResult.statusCode === 200) {
    const body = JSON.parse(profileResult.body);
    if (body.data) {
      return createResponse(200, {
        success: true,
        exists: true,
        data: body.data
      });
    }
  }

  // Create new profile
  const createMutation = `
    mutation CreateUserProfile($input: CreateUserProfileInput!) {
      createUserProfile(input: $input) {
        id
        userId
        email
        displayName
        din
        dinStatus
        role
      }
    }
  `;

  const userId = `director-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const result = await graphqlRequest<{ createUserProfile: any }>(
    createMutation,
    {
      input: {
        userId,
        email: normalizedEmail,
        role: 'DIRECTORS',
        displayName: displayName || normalizedEmail.split('@')[0],
        din: din || undefined,
        dinStatus: din ? 'ACTIVE' : undefined
      }
    }
  );

  return createResponse(200, {
    success: true,
    exists: false,
    data: result.createUserProfile
  });
}

async function handleListEntitiesForAssociation(data: any) {
  // List all companies
  const listCompaniesQuery = `
    query ListCompanies {
      listCompanies {
        items {
          id
          cinNumber
          companyName
        }
      }
    }
  `;

  const companiesResult = await graphqlRequest<{ listCompanies: { items: any[] } }>(
    listCompaniesQuery,
    {}
  );

  // List all LLPs
  const listLLPsQuery = `
    query ListLLPs {
      listLLPs {
        items {
          id
          llpIN
          llpName
        }
      }
    }
  `;

  const llpsResult = await graphqlRequest<{ listLLPs: { items: any[] } }>(
    listLLPsQuery,
    {}
  );

  return createResponse(200, {
    success: true,
    data: {
      companies: companiesResult.listCompanies.items,
      llps: llpsResult.listLLPs.items
    }
  });
}

async function handleCreateDirectorAssociation(data: any) {
  const { userId, entityId, entityType, associationType, din, originalAppointmentDate, appointmentDate, cessationDate } = data;

  const validationErrors: string[] = [];
  if (!userId) validationErrors.push('userId is required');
  if (!entityId) validationErrors.push('entityId is required');
  if (!entityType) validationErrors.push('entityType is required');

  if (validationErrors.length > 0) {
    return createResponse(400, {
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  const createMutation = `
    mutation CreateDirectorAssociation($input: CreateDirectorAssociationInput!) {
      createDirectorAssociation(input: $input) {
        id
        userId
        entityId
      }
    }
  `;

  await graphqlRequest(createMutation, {
    input: {
      userId,
      entityId,
      entityType,
      associationType: associationType || 'DIRECTOR',
      din: din || undefined,
      originalAppointmentDate: originalAppointmentDate || undefined,
      appointmentDate: appointmentDate || undefined,
      cessationDate: cessationDate || undefined,
      isActive: cessationDate ? false : true
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Director association created successfully'
  });
}

async function handleCheckExistingAssociation(data: any) {
  const { userId, entityId } = data;

  if (!userId || !entityId) {
    return createResponse(400, {
      success: false,
      message: 'userId and entityId are required'
    });
  }

  const listQuery = `
    query ListDirectorAssociations($filter: ModelDirectorAssociationFilterInput) {
      listDirectorAssociations(filter: $filter) {
        items {
          id
          isActive
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
    listQuery,
    {
      filter: {
        and: [
          { userId: { eq: userId } },
          { entityId: { eq: entityId } }
        ]
      }
    }
  );

  return createResponse(200, {
    success: true,
    exists: result.listDirectorAssociations.items.length > 0,
    data: result.listDirectorAssociations.items
  });
}

// ============================================================================
// DATA LIST OPERATIONS
// ============================================================================

async function handleListCompanies(data: any) {
  const { filter } = data;

  const listQuery = `
    query ListCompanies($filter: ModelCompanyFilterInput) {
      listCompanies(filter: $filter) {
        items {
          id
          cinNumber
          companyName
          companyType
          companyStatus
          dateOfIncorporation
          registeredAddress
          emailId
          authorizedCapital
          paidUpCapital
          numberOfDirectors
          lastAnnualFilingDate
          financialYear
          agmDate
          rocName
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listCompanies: { items: any[] } }>(
    listQuery,
    { filter: filter || undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listCompanies.items
  });
}

async function handleListLLPs(data: any) {
  const { filter } = data;

  const listQuery = `
    query ListLLPs($filter: ModelLLPFilterInput) {
      listLLPs(filter: $filter) {
        items {
          id
          llpIN
          llpName
          llpStatus
          dateOfIncorporation
          registeredAddress
          emailId
          totalObligationOfContribution
          numberOfPartners
          numberOfDesignatedPartners
          lastAnnualFilingDate
          financialYear
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listLLPs: { items: any[] } }>(
    listQuery,
    { filter: filter || undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listLLPs.items
  });
}

async function handleListDirectorAssociations(data: any) {
  const { filter } = data;

  const listQuery = `
    query ListDirectorAssociations($filter: ModelDirectorAssociationFilterInput) {
      listDirectorAssociations(filter: $filter) {
        items {
          id
          userId
          entityId
          entityType
          associationType
          din
          originalAppointmentDate
          appointmentDate
          cessationDate
          isActive
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listDirectorAssociations: { items: any[] } }>(
    listQuery,
    { filter: filter || undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listDirectorAssociations.items
  });
}

async function handleListProfessionalAssignments(data: any) {
  const { filter } = data;

  const listQuery = `
    query ListProfessionalAssignments($filter: ModelProfessionalAssignmentFilterInput) {
      listProfessionalAssignments(filter: $filter) {
        items {
          professionalId
          entityId
          entityType
          role
          assignedDate
          isActive
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listProfessionalAssignments: { items: any[] } }>(
    listQuery,
    { filter: filter || undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listProfessionalAssignments.items
  });
}

async function handleListTasks(data: any) {
  const { filter } = data;

  const listQuery = `
    query ListTasks($filter: ModelTaskFilterInput) {
      listTasks(filter: $filter) {
        items {
          id
          assignedTo
          assignedBy
          taskType
          title
          description
          priority
          status
          dueDate
          createdAt
          completedAt
          updatedAt
          relatedEntityId
          relatedEntityType
          metadata
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listTasks: { items: any[] } }>(
    listQuery,
    { filter: filter || undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listTasks.items
  });
}

async function handleGetPendingDirectors(data: any) {
  const { email, din, status } = data;

  const filterConditions: any[] = [];

  if (email) {
    filterConditions.push({ email: { eq: email.toLowerCase().trim() } });
  }

  if (din) {
    filterConditions.push({ din: { eq: din } });
  }

  if (status) {
    filterConditions.push({ status: { eq: status } });
  }

  let filter = {};
  if (filterConditions.length === 1) {
    filter = filterConditions[0];
  } else if (filterConditions.length > 1) {
    filter = { and: filterConditions };
  }

  const listQuery = `
    query ListPendingDirectors($filter: ModelPendingDirectorFilterInput) {
      listPendingDirectors(filter: $filter) {
        items {
          id
          din
          email
          directorName
          status
          entityId
          entityType
          requestContext
          associatedBy
          createdAt
          expiresAt
          claimedAt
        }
      }
    }
  `;

  const result = await graphqlRequest<{ listPendingDirectors: { items: any[] } }>(
    listQuery,
    { filter: Object.keys(filter).length > 0 ? filter : undefined }
  );

  return createResponse(200, {
    success: true,
    data: result.listPendingDirectors.items
  });
}

async function handleUpdatePendingDirector(data: any) {
  const { id, updates } = data;

  if (!id) {
    return createResponse(400, {
      success: false,
      message: 'id is required'
    });
  }

  const updateMutation = `
    mutation UpdatePendingDirector($input: UpdatePendingDirectorInput!) {
      updatePendingDirector(input: $input) {
        id
        status
      }
    }
  `;

  await graphqlRequest(updateMutation, {
    input: {
      id,
      ...updates
    }
  });

  return createResponse(200, {
    success: true,
    message: 'Pending director updated successfully'
  });
}
