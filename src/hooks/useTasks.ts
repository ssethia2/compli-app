import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  getPendingTasks,
  createTask,
  completeTask,
  updateTaskStatus,
  type TaskFilter,
  type CreateTaskParams
} from '../api';

/**
 * Hook to fetch tasks with filters
 */
export function useTasks(filter: TaskFilter) {
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => getTasks(filter),
    enabled: !!filter.assignedTo,
    staleTime: 2 * 60 * 1000, // Tasks are fresh for 2 minutes
  });
}

/**
 * Hook to fetch pending tasks for a user
 */
export function usePendingTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', 'pending', userId],
    queryFn: () => getPendingTasks(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // Pending tasks stay fresh for 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateTaskParams) => createTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Hook to complete a task with immediate cache update
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onSuccess: (_data, taskId) => {
      // Get all task queries and update them by removing the completed task
      const queries = queryClient.getQueriesData<any>({ queryKey: ['tasks'] });

      // Update each query by filtering out the completed task
      queries.forEach(([queryKey, data]) => {
        if (data?.data) {
          const filtered = data.data.filter((task: any) => task.id !== taskId);

          queryClient.setQueryData(queryKey, {
            ...data,
            data: filtered
          });
        }
      });
    },
  });
}

/**
 * Hook to update task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
