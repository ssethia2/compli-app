import { defineFunction } from '@aws-amplify/backend';

export const heavyOperations = defineFunction({
  name: 'heavy-operations',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for heavy operations like PDF generation
  memoryMB: 2048 // More memory for compute-intensive tasks
});
