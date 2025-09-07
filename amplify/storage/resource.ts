import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'compliAppDocuments',
  access: (allow) => ({
    // Public access for company logos, etc.
    'public/*': [
      allow.authenticated.to(['read']),
      allow.guest.to(['read'])
    ],
    // User-specific documents (directors can access their own docs)
    'users/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
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