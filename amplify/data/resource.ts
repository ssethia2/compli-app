// amplify/data/resource.ts - Simplified version
// TODO: CLEANUP SPRINT - Fix authorization properly before release:
// 1. Implement Lambda trigger for automatic Cognito group assignment (see auto-group-assignment artifacts)
// 2. Restore proper group-based authorization instead of allow.authenticated()
// 3. Test role-based permissions thoroughly
// 4. Consider implementing API-level role checks as additional security layer
// 5. Remove this temporary simplified auth and use proper Cognito groups
// amplify/data/resource.ts - Many-to-Many Professional-Entity Relationships
// TODO: CLEANUP SPRINT - Fix authorization properly before release (see previous TODOs)
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // User Profile model
  UserProfile: a.model({
    userId: a.string().required(),
    email: a.string().required(),
    role: a.enum(['DIRECTORS', 'PROFESSIONALS']),
    displayName: a.string(),
    // Director-specific fields
    din: a.string(),
    dinStatus: a.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']),
    dscStatus: a.enum(['ACTIVE', 'EXPIRED', 'REVOKED', 'NOT_AVAILABLE']),
    pan: a.string(),
    eSignImageUrl: a.string(), // URL to e-sign image
    
    // RELATIONSHIPS
    // For professionals - their entity assignments
    professionalAssignments: a.hasMany('ProfessionalAssignment', 'professionalId'),
    // For directors - their entity associations  
    directorAssociations: a.hasMany('DirectorAssociation', 'userId'),
    // Change requests made by this user
    changeRequests: a.hasMany('ChangeRequest', 'directorId')
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // Company model - simplified relationships  
  Company: a.model({
    cinNumber: a.string().required(),
    companyName: a.string().required(),
    rocName: a.string(),
    dateOfIncorporation: a.date(),
    emailId: a.string(),
    registeredAddress: a.string(),
    authorizedCapital: a.float(),
    paidUpCapital: a.float(),
    numberOfDirectors: a.integer(),
    companyStatus: a.enum(['ACTIVE', 'INACTIVE', 'UNDER_PROCESS', 'STRUCK_OFF', 'AMALGAMATED']),
    companyType: a.enum(['PRIVATE', 'PUBLIC', 'ONE_PERSON', 'SECTION_8', 'GOVERNMENT', 'NBFC', 'NIDHI', 'IFSC']),
    lastAnnualFilingDate: a.date(),
    financialYear: a.string(),
    agmDate: a.date()
    
    // Note: We'll handle relationships via queries rather than direct hasMany
    // This avoids the polymorphic relationship complexity
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // LLP model - simplified relationships
  LLP: a.model({
    llpIN: a.string().required(),
    llpName: a.string().required(),
    rocName: a.string(),
    dateOfIncorporation: a.date(),
    emailId: a.string(),
    numberOfPartners: a.integer(),
    numberOfDesignatedPartners: a.integer(),
    registeredAddress: a.string(),
    totalObligationOfContribution: a.float(),
    llpStatus: a.enum(['ACTIVE', 'INACTIVE', 'UNDER_PROCESS', 'STRUCK_OFF', 'AMALGAMATED']),
    lastAnnualFilingDate: a.date(),
    financialYear: a.string()
    
    // Note: We'll handle relationships via queries rather than direct hasMany
    // This avoids the polymorphic relationship complexity
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // JUNCTION TABLE: Professional-Entity Assignment (Many-to-Many)
  ProfessionalAssignment: a.model({
    professionalId: a.string().required(),
    entityId: a.string().required(),
    entityType: a.enum(['LLP', 'COMPANY']),
    assignedDate: a.date(),
    isActive: a.boolean().default(true),
    role: a.enum(['PRIMARY', 'SECONDARY', 'REVIEWER']), // Different professional roles
    
    // RELATIONSHIPS - only to UserProfile
    professional: a.belongsTo('UserProfile', 'professionalId')
    // We'll handle Company/LLP relationships via queries using entityId + entityType
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // JUNCTION TABLE: Director-Entity Association (Many-to-Many)
  DirectorAssociation: a.model({
    userId: a.string().required(),
    entityId: a.string().required(),
    entityType: a.enum(['LLP', 'COMPANY']),
    associationType: a.enum(['DIRECTOR', 'DESIGNATED_PARTNER', 'PARTNER']),
    din: a.string(), // Director Identification Number
    originalAppointmentDate: a.date(), // Original date of appointment
    appointmentDate: a.date(), // Date of appointment at current designation
    cessationDate: a.date(), // Date of cessation (if applicable)
    isActive: a.boolean().default(true),
    
    // RELATIONSHIPS - only to UserProfile
    director: a.belongsTo('UserProfile', 'userId')
    // We'll handle Company/LLP relationships via queries using entityId + entityType
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // Change Request model
  ChangeRequest: a.model({
    requestId: a.id(),
    directorId: a.string().required(),
    entityId: a.string().required(),
    entityType: a.enum(['LLP', 'COMPANY']),
    changeType: a.enum(['UPDATE_INFO', 'ADD_DIRECTOR', 'REMOVE_DIRECTOR', 'STATUS_CHANGE', 'OTHER']),
    requestDetails: a.string().required(),
    status: a.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    processedBy: a.string(), // Professional who processed it
    comments: a.string(),
    
    // RELATIONSHIPS
    requestor: a.belongsTo('UserProfile', 'directorId')
  }).authorization(
    allow => [
      allow.authenticated().to(['read', 'create', 'update', 'delete']) // Simplified for now
    ]
  )
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});


/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
