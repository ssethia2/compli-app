import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDirectorEntities,
  getProfessionalEntities,
  getAllCompanies,
  getAllLLPs,
  createCompany,
  createLLP,
  updateCompany,
  updateLLP
} from '../api';

/**
 * Hook to fetch entities for a director
 */
export function useDirectorEntities(userId: string | undefined) {
  return useQuery({
    queryKey: ['directorEntities', userId],
    queryFn: () => getDirectorEntities(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch entities for a professional
 */
export function useProfessionalEntities(userId: string | undefined) {
  return useQuery({
    queryKey: ['professionalEntities', userId],
    queryFn: () => getProfessionalEntities(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all companies
 */
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: getAllCompanies,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all LLPs
 */
export function useLLPs() {
  return useQuery({
    queryKey: ['llps'],
    queryFn: getAllLLPs,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyData: any) => createCompany(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['professionalEntities'] });
      queryClient.invalidateQueries({ queryKey: ['directorEntities'] });
    },
  });
}

/**
 * Hook to create an LLP
 */
export function useCreateLLP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (llpData: any) => createLLP(llpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llps'] });
      queryClient.invalidateQueries({ queryKey: ['professionalEntities'] });
      queryClient.invalidateQueries({ queryKey: ['directorEntities'] });
    },
  });
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateCompany(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['professionalEntities'] });
    },
  });
}

/**
 * Hook to update an LLP
 */
export function useUpdateLLP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateLLP(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llps'] });
      queryClient.invalidateQueries({ queryKey: ['professionalEntities'] });
    },
  });
}
