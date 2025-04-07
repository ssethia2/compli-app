import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // User Profile model
  UserProfile: a.model({
    userId: a.string().required(),
    role: a.enum(['DIRECTORS', 'PROFESSIONALS']),
    displayName: a.string()
  }).authorization(
    allow => [
      allow.owner(),
      allow.groups(['DIRECTORS']).to(['read']), 
      allow.groups(['PROFESSIONALS']).to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // LLP model
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
    llpStatus: a.enum(['ACTIVE', 'INACTIVE', 'UNDER_PROCESS'])
  }).authorization(
    allow => [
      allow.groups(['DIRECTORS']).to(['read']),
      allow.groups(['PROFESSIONALS']).to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // Company model 
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
    companyStatus: a.enum(['ACTIVE', 'INACTIVE', 'UNDER_PROCESS']),
    companyType: a.enum(['PRIVATE', 'PUBLIC', 'ONE_PERSON', 'SECTION_8'])
  }).authorization(
    allow => [
      allow.groups(['DIRECTORS']).to(['read']),
      allow.groups(['PROFESSIONALS']).to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // Mapping table for User-Company/LLP relationships
  DirectorAssociation: a.model({
    userId: a.string().required(),
    entityId: a.string().required(),
    entityType: a.enum(['LLP', 'COMPANY']),
    associationType: a.enum(['DIRECTOR', 'DESIGNATED_PARTNER', 'PARTNER', 'PROFESSIONAL']),
    appointmentDate: a.date()
  }).authorization(
    allow => [
      allow.owner(),
      allow.groups(['DIRECTORS']).to(['read']),
      allow.groups(['PROFESSIONALS']).to(['read', 'create', 'update', 'delete'])
    ]
  ),

  // New model for Director-initiated change requests
  ChangeRequest: a.model({
    requestId: a.id(),
    directorId: a.string().required(),
    entityId: a.string().required(),
    entityType: a.enum(['LLP', 'COMPANY']),
    changeType: a.enum(['UPDATE_INFO', 'ADD_DIRECTOR', 'REMOVE_DIRECTOR', 'STATUS_CHANGE', 'OTHER']),
    requestDetails: a.string().required(),
    status: a.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']).default('PENDING'),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    processedBy: a.string(), // ID of professional who processed the request
    comments: a.string()
  }).authorization(
    allow => [
      allow.owner(),
      allow.groups(['DIRECTORS']).to(['read', 'create']), // Directors can create and read requests
      allow.groups(['PROFESSIONALS']).to(['read', 'create', 'update', 'delete']) // Professionals can do everything
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
