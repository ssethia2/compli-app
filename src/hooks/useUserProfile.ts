import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProfileByUserId,
  createUserProfile,
  updateUserProfile,
  type CreateUserProfileParams,
  type UpdateUserProfileParams
} from '../api';

/**
 * Hook to fetch user profile by userId with automatic caching
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfileByUserId(userId!),
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 10 * 60 * 1000, // Profile data is fresh for 10 minutes
  });
}

/**
 * Hook to create a user profile
 */
export function useCreateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateUserProfileParams) => createUserProfile(params),
    onSuccess: (data) => {
      // Invalidate and refetch user profile queries
      if (data.data?.userId) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', data.data.userId] });
      }
    },
  });
}

/**
 * Hook to update user profile with optimistic updates
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateUserProfileParams) => updateUserProfile(params),
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userProfile'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['userProfile']);

      // Optimistically update to the new value
      queryClient.setQueryData(['userProfile'], (old: any) => ({
        ...old,
        ...newProfile
      }));

      return { previousProfile };
    },
    onError: (_err, _newProfile, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile'], context.previousProfile);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
