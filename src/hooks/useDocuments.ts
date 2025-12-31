import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  uploadDocument,
  deleteDocument as deleteDocumentApi,
  type DocumentFilter,
  type DocumentUploadParams
} from '../api';

/**
 * Hook to fetch documents with automatic caching
 */
export function useDocuments(filter: DocumentFilter) {
  return useQuery({
    queryKey: ['documents', filter],
    queryFn: () => getDocuments(filter),
    enabled: !!(filter.userId || filter.entityId || filter.serviceRequestId), // Only fetch if we have a filter
  });
}

/**
 * Hook to upload a document with automatic cache invalidation
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DocumentUploadParams) => uploadDocument(params),
    onSuccess: () => {
      // Invalidate all document queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/**
 * Hook to delete a document with automatic cache invalidation
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocumentApi(documentId),
    onSuccess: () => {
      // Invalidate all document queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/**
 * Hook to fetch documents for a director (only their own)
 */
export function useDirectorDocuments(userId: string | undefined) {
  return useDocuments({
    userId,
    role: 'DIRECTORS'
  });
}

/**
 * Hook to fetch documents for a professional (from associated directors)
 */
export function useProfessionalDocuments(userId: string | undefined) {
  return useDocuments({
    userId,
    role: 'PROFESSIONALS'
  });
}
