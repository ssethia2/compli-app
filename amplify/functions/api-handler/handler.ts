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
  const { din, email, entityId, professionalUserId } = data;

  // 1. Create or update PendingDirector record
  const createPendingDirectorMutation = `
    mutation CreatePendingDirector($input: CreatePendingDirectorInput!) {
      createPendingDirector(input: $input) {
        id
      }
    }
  `;

  await graphqlRequest(createPendingDirectorMutation, {
    input: {
      din,
      email,
      associatedBy: professionalUserId,
      entityId,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }
  });

  // 2. Find and update the task that requested this association
  const listTasksQuery = `
    query ListTasks($assignedTo: String!) {
      listTasks(filter: {
        assignedTo: { eq: $assignedTo }
        status: { eq: "PENDING" }
        taskType: { eq: "INFORMATION_UPDATE" }
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
    { assignedTo: professionalUserId }
  );

  // Complete matching tasks
  for (const task of tasksResult.listTasks.items) {
    const metadata = task.metadata ? JSON.parse(task.metadata) : {};
    if (metadata.directorDIN === din && metadata.requestType === 'din-email-association') {
      await handleCompleteTask({ taskId: task.id, userId: professionalUserId });
    }
  }

  return createResponse(200, {
    success: true,
    message: `DIN ${din} has been associated with email ${email}`
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

  // 2. Update metadata with director info and companies for disclosure
  metadata.directorInfo = directorInfo;
  metadata.directorInfo.companiesForDisclosure = companiesForDisclosure;
  metadata.currentStage = 'FILL_INTEREST_DISCLOSURE';
  metadata.stageCompletedAt = metadata.stageCompletedAt || {};
  metadata.stageCompletedAt['FILL_DIRECTOR_INFO'] = new Date().toISOString();

  // 3. Update task: Reassign to appointee
  const updateTaskMutation = `
    mutation UpdateTask($input: UpdateTaskInput!) {
      updateTask(input: $input) {
        id
      }
    }
  `;

  const appointeeUserId = metadata.appointmentRequest.appointeeUserId;

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
          query ListDirectorAssociations($entityId: String!, $entityType: String!) {
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

      if (directorUserIds.size === 0) {
        return createResponse(200, { success: true, data: [] });
      }

      // Build OR filter for all director userIds
      const uploaderFilters = Array.from(directorUserIds).map(userId => ({
        uploadedBy: { eq: userId }
      }));

      if (uploaderFilters.length === 1) {
        queryFilter = uploaderFilters[0];
      } else {
        queryFilter.or = uploaderFilters;
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
          fileKey
          fileType
          fileSize
          documentType
          uploadedBy
          uploadedAt
          serviceRequestId
          entityId
          entityType
          metadata
          tags
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

  // Extract userId from signature key (assuming format: signatures/{userId}/...)
  const keyParts = signatureKey.split('/');
  if (keyParts.length < 2 || keyParts[0] !== 'signatures') {
    return createResponse(400, {
      success: false,
      message: 'Invalid signature key format'
    });
  }

  const signatureOwnerUserId = keyParts[1];

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
        query ListDirectorAssociations($userId: String!, $entityId: String!, $entityType: String!) {
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
