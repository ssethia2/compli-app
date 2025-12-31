import { defineFunction } from '@aws-amplify/backend';

export const apiHandler = defineFunction({
  name: 'api-handler',
  entry: './handler.ts',
  timeoutSeconds: 15, // Fast CRUD operations only
  memoryMB: 512 // Reduced memory for lightweight operations
});
