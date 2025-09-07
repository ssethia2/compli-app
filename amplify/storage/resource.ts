import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'compliAppDocuments',
  access: (allow) => ({
    // Public access for company logos, etc.
    'public/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read'])
    ],
    // User-specific documents (directors can access their own docs)
    'users/{identity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    // Professional access to entity documents they manage
    'entities/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Service request attachments
    'service-requests/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});