import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface TaskFilter {
  assignedTo?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  taskType?: 'DOCUMENT_UPLOAD' | 'FORM_COMPLETION' | 'APPROVAL_REQUIRED' | 'REVIEW_NEEDED' | 'SIGNATURE_REQUIRED' | 'INFORMATION_UPDATE';
}

export interface CreateTaskParams {
  assignedTo: string;
  assignedBy?: string;
  taskType: 'DOCUMENT_UPLOAD' | 'FORM_COMPLETION' | 'APPROVAL_REQUIRED' | 'REVIEW_NEEDED' | 'SIGNATURE_REQUIRED' | 'INFORMATION_UPDATE';
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'SERVICE_REQUEST' | 'COMPANY' | 'LLP' | 'DOCUMENT' | 'DIRECTOR_ASSOCIATION';
  metadata?: string;
}

/**
 * Get tasks for a user with optional filters
 */
export const getTasks = async (filter: TaskFilter) => {
  let queryFilter: any = {};

  if (filter.assignedTo) {
    queryFilter.assignedTo = { eq: filter.assignedTo };
  }

  if (filter.status) {
    queryFilter.status = { eq: filter.status };
  }

  if (filter.taskType) {
    queryFilter.taskType = { eq: filter.taskType };
  }

  // Combine filters if multiple exist
  if (Object.keys(queryFilter).length > 1) {
    const conditions = Object.entries(queryFilter).map(([key, value]) => ({ [key]: value }));
    queryFilter = { and: conditions };
  }

  const result = await client.models.Task.list({ filter: queryFilter });

  // Sort by priority and creation date
  const sortedData = result.data.sort((a, b) => {
    // Priority order: URGENT > HIGH > MEDIUM > LOW
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort by creation date (newest first)
    return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
  });

  return { data: sortedData, errors: result.errors };
};

/**
 * Get pending tasks for a user
 */
export const getPendingTasks = async (userId: string) => {
  return getTasks({ assignedTo: userId, status: 'PENDING' });
};

/**
 * Create a new task
 */
export const createTask = async (params: CreateTaskParams) => {
  const taskData = {
    ...params,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await client.models.Task.create(taskData);
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
  const updateData: any = {
    id: taskId,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date().toISOString();
  }

  return await client.models.Task.update(updateData);
};

/**
 * Complete a task
 */
export const completeTask = async (taskId: string) => {
  return updateTaskStatus(taskId, 'COMPLETED');
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string) => {
  return await client.models.Task.delete({ id: taskId });
};

/**
 * Get task counts by status for a user
 */
export const getTaskCounts = async (userId: string) => {
  const result = await client.models.Task.list({
    filter: { assignedTo: { eq: userId } }
  });

  const counts = {
    total: result.data.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  };

  result.data.forEach(task => {
    switch (task.status) {
      case 'PENDING':
        counts.pending++;
        break;
      case 'IN_PROGRESS':
        counts.inProgress++;
        break;
      case 'COMPLETED':
        counts.completed++;
        break;
      case 'CANCELLED':
        counts.cancelled++;
        break;
    }
  });

  return counts;
};
