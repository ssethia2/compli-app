import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface NotificationPayload {
  recipientId: string;
  recipientEmail: string;
  recipientRole: 'DIRECTORS' | 'PROFESSIONALS';
  notificationType: 'TASK_ASSIGNMENT' | 'SERVICE_REQUEST' | 'DOCUMENT_REQUIRED' | 'APPROVAL_NEEDED' | 'DEADLINE_REMINDER' | 'STATUS_UPDATE';
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: 'SERVICE_REQUEST' | 'COMPANY' | 'LLP' | 'DOCUMENT' | 'DIRECTOR_ASSOCIATION';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  metadata?: any;
}

export interface TaskPayload {
  assignedTo: string;
  assignedBy?: string;
  taskType: 'DOCUMENT_UPLOAD' | 'FORM_COMPLETION' | 'APPROVAL_REQUIRED' | 'REVIEW_NEEDED' | 'SIGNATURE_REQUIRED' | 'INFORMATION_UPDATE';
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  relatedEntityId?: string;
  relatedEntityType?: 'SERVICE_REQUEST' | 'COMPANY' | 'LLP' | 'DOCUMENT' | 'DIRECTOR_ASSOCIATION';
  metadata?: any;
}

/**
 * Create a notification record in the database
 */
export const createNotification = async (payload: NotificationPayload) => {
  try {
    const notification = await client.models.Notification.create({
      recipientId: payload.recipientId,
      recipientEmail: payload.recipientEmail,
      recipientRole: payload.recipientRole,
      notificationType: payload.notificationType,
      title: payload.title,
      message: payload.message,
      relatedEntityId: payload.relatedEntityId,
      relatedEntityType: payload.relatedEntityType,
      priority: payload.priority || 'MEDIUM',
      status: 'PENDING',
      scheduledAt: payload.scheduledAt?.toISOString(),
      createdAt: new Date().toISOString(),
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null
    });

    return notification.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a task for a user
 */
export const createTask = async (payload: TaskPayload) => {
  try {
    const task = await client.models.Task.create({
      assignedTo: payload.assignedTo,
      assignedBy: payload.assignedBy,
      taskType: payload.taskType,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'MEDIUM',
      status: 'PENDING',
      dueDate: payload.dueDate?.toISOString(),
      relatedEntityId: payload.relatedEntityId,
      relatedEntityType: payload.relatedEntityType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null
    });

    return task.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Send notification and create task (combined workflow)
 */
export const notifyAndCreateTask = async (
  notificationPayload: NotificationPayload,
  taskPayload: TaskPayload
) => {
  try {
    // Create both notification and task
    const [notification, task] = await Promise.all([
      createNotification(notificationPayload),
      createTask(taskPayload)
    ]);

    // In a real implementation, you'd also trigger email sending here
    // For now, we'll just log that an email should be sent
    console.log('📧 Email notification should be sent:', {
      to: notificationPayload.recipientEmail,
      subject: notificationPayload.title,
      body: notificationPayload.message
    });

    return { notification, task };
  } catch (error) {
    console.error('Error in notifyAndCreateTask:', error);
    throw error;
  }
};

/**
 * Get pending tasks for a user
 */
export const getUserTasks = async (userId: string) => {
  try {
    const tasks = await client.models.Task.list({
      filter: {
        and: [
          { assignedTo: { eq: userId } },
          { status: { ne: 'COMPLETED' } }
        ]
      }
    });

    return tasks.data.sort((a, b) => {
      // Sort by priority and due date
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Then sort by due date
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    });
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw error;
  }
};

/**
 * Mark task as completed
 */
export const completeTask = async (taskId: string) => {
  try {
    const updatedTask = await client.models.Task.update({
      id: taskId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return updatedTask.data;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

/**
 * Get unread notifications for a user
 */
export const getUserNotifications = async (userId: string) => {
  try {
    const notifications = await client.models.Notification.list({
      filter: {
        and: [
          { recipientId: { eq: userId } },
          { status: { ne: 'READ' } }
        ]
      }
    });

    return notifications.data.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const updatedNotification = await client.models.Notification.update({
      id: notificationId,
      status: 'READ',
      readAt: new Date().toISOString()
    });

    return updatedNotification.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Pre-built notification templates
export const NotificationTemplates = {
  serviceRequestSubmitted: (directorName: string, serviceType: string): Partial<NotificationPayload> => ({
    notificationType: 'SERVICE_REQUEST',
    title: 'New Service Request Submitted',
    message: `${directorName} has submitted a new ${serviceType} request that requires your attention.`,
    priority: 'MEDIUM'
  }),

  documentRequired: (entityName: string, documentType: string): Partial<NotificationPayload> => ({
    notificationType: 'DOCUMENT_REQUIRED',
    title: 'Document Required',
    message: `Please upload the required ${documentType} for ${entityName}.`,
    priority: 'HIGH'
  }),

  approvalNeeded: (itemName: string): Partial<NotificationPayload> => ({
    notificationType: 'APPROVAL_NEEDED',
    title: 'Approval Required',
    message: `${itemName} is pending your approval. Please review and approve.`,
    priority: 'HIGH'
  }),

  deadlineReminder: (taskName: string, dueDate: Date): Partial<NotificationPayload> => ({
    notificationType: 'DEADLINE_REMINDER',
    title: 'Deadline Approaching',
    message: `Reminder: ${taskName} is due on ${dueDate.toLocaleDateString()}. Please complete it soon.`,
    priority: 'HIGH'
  }),

  taskAssigned: (taskName: string, assignedBy: string): Partial<NotificationPayload> => ({
    notificationType: 'TASK_ASSIGNMENT',
    title: 'New Task Assigned',
    message: `${assignedBy} has assigned you a new task: ${taskName}`,
    priority: 'MEDIUM'
  })
};