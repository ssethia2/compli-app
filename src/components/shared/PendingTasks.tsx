import React, { useState, useEffect } from 'react';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import { usePendingTasks, useCompleteTask } from '../../hooks/useTasks';
import DINEmailAssociationModal from './DINEmailAssociationModal';
import './PendingTasks.css';

interface PendingTasksProps {
  userId: string;
  userRole: 'DIRECTORS' | 'PROFESSIONALS';
  onDirectorInfoTask?: (taskData: any) => void;
  onDirectorFormGeneration?: (taskData: any) => void;
  onDirectorInfoFormTask?: (taskData: any) => void;
}

const PendingTasks: React.FC<PendingTasksProps> = ({ userId, userRole: _userRole, onDirectorInfoTask, onDirectorFormGeneration, onDirectorInfoFormTask }) => {
  // Use React Query hooks for tasks
  const { data: tasksData, isLoading: tasksLoading } = usePendingTasks(userId);
  const completeTaskMutation = useCompleteTask();

  const tasks = tasksData?.data || [];

  // Keep manual state for notifications (no hook yet)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications'>('tasks');
  const [showDINModal, setShowDINModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const notificationsData = await getUserNotifications(userId);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync(taskId);
      // React Query automatically updates cache and removes the task
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const loading = tasksLoading || notificationsLoading;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDINAssociationTask = (task: any) => {
    setSelectedTask(task);
    setShowDINModal(true);
  };

  const handleDirectorInfoCompletionTask = (task: any) => {
    if (onDirectorInfoTask && task.metadata) {
      try {
        const metadata = JSON.parse(task.metadata);

        // Support both old and new metadata structures
        const appointmentData = metadata.appointmentRequest || metadata.appointmentData;

        const taskData = {
          taskId: task.id,
          serviceRequestId: metadata.serviceRequestId, // For backward compatibility
          appointmentData: appointmentData
        };
        onDirectorInfoTask(taskData);
      } catch (error) {
        console.error('Error parsing task metadata:', error);
        alert('Error loading task data. Please refresh and try again.');
      }
    }
  };

  const handleDirectorFormGenerationTask = (task: any) => {
    if (onDirectorFormGeneration && task.metadata) {
      try {
        const metadata = JSON.parse(task.metadata);
        const taskData = {
          taskId: task.id,
          directorDIN: metadata.directorDIN,
          directorName: metadata.directorName,
          entityName: metadata.entityName,
          directorInfoDocument: metadata.directorInfoDocument,
          requiredForms: metadata.requiredForms
        };
        onDirectorFormGeneration(taskData);
      } catch (error) {
        console.error('Error parsing task metadata:', error);
        alert('Error loading task data. Please refresh and try again.');
      }
    }
  };

  const handleAssociationCreated = async (_association: any) => {
    // Complete the task when association is created
    if (selectedTask) {
      await handleCompleteTask(selectedTask.id);
    }
    setShowDINModal(false);
    setSelectedTask(null);
  };

  const getDINModalInitialData = () => {
    if (!selectedTask?.metadata) return {};
    
    try {
      const metadata = JSON.parse(selectedTask.metadata);
      return {
        din: metadata.directorDIN,
        entityId: metadata.entityId || selectedTask.relatedEntityId,
        entityType: metadata.entityType || selectedTask.relatedEntityType,
        entityName: metadata.entityName,
        requestContext: metadata.appointmentData
      };
    } catch (error) {
      console.error('Error parsing task metadata:', error);
      return {};
    }
  };

  const getPriorityColor = (priority: string | null): string => {
    switch (priority) {
      case 'URGENT': return '#ff4444';
      case 'HIGH': return '#ff6b35';
      case 'MEDIUM': return '#ffa500';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityIcon = (priority: string | null): string => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '🔥';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '📝';
      default: return '📋';
    }
  };

  const getTaskTypeIcon = (taskType: string | null): string => {
    switch (taskType) {
      case 'DOCUMENT_UPLOAD': return '📄';
      case 'FORM_COMPLETION': return '📝';
      case 'APPROVAL_REQUIRED': return '✅';
      case 'REVIEW_NEEDED': return '👀';
      case 'SIGNATURE_REQUIRED': return '✍️';
      case 'INFORMATION_UPDATE': return '📊';
      default: return '📋';
    }
  };

  const getNotificationIcon = (notificationType: string): string => {
    switch (notificationType) {
      case 'TASK_ASSIGNMENT': return '📋';
      case 'SERVICE_REQUEST': return '🔧';
      case 'DOCUMENT_REQUIRED': return '📄';
      case 'APPROVAL_NEEDED': return '✅';
      case 'DEADLINE_REMINDER': return '⏰';
      case 'STATUS_UPDATE': return '📊';
      default: return '💬';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTaskType = (taskType: string | null): string => {
    if (!taskType) return 'Unknown';
    return taskType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatNotificationType = (notificationType: string): string => {
    return notificationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="pending-tasks">
        <div className="pending-tasks-loading">
          <div className="loading-spinner"></div>
          <p>Loading tasks and notifications...</p>
        </div>
      </div>
    );
  }

  const totalPending = tasks.length + notifications.length;

  return (
    <div className="pending-tasks">
      <div className="pending-tasks-header">
        <h2>Pending Items ({totalPending})</h2>
        <p>Tasks and notifications requiring your attention</p>
      </div>

      <div className="pending-tasks-tabs">
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Tasks ({tasks.length})
        </button>
        <button
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          💬 Notifications ({notifications.length})
        </button>
      </div>

      <div className="pending-tasks-content">
        {activeTab === 'tasks' && (
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="no-items">
                <p>🎉 No pending tasks!</p>
                <p>You're all caught up.</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <div className="task-icon-priority">
                      <span className="task-icon">{getTaskTypeIcon(task.taskType)}</span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </div>
                    <div className="task-actions">
                      {task.metadata && task.title.includes('Associate DIN with Email') ? (
                        <button
                          className="din-association-btn"
                          onClick={() => handleDINAssociationTask(task)}
                        >
                          🔗 Associate DIN & Email
                        </button>
                      ) : task.title.includes('Upload Documents for Director') ? (
                        <button
                          className="director-info-btn"
                          onClick={() => handleDirectorInfoCompletionTask(task)}
                        >
                          📝 Complete Document Task
                        </button>
                      ) : task.title.includes('Complete Director Information Form') ? (
                        <button
                          className="director-info-btn"
                          onClick={() => {
                            if (onDirectorInfoFormTask && task.metadata) {
                              try {
                                const metadata = JSON.parse(task.metadata);
                                const taskData = {
                                  taskId: task.id,
                                  appointmentData: metadata.appointmentData
                                };
                                onDirectorInfoFormTask(taskData);
                              } catch (error) {
                                console.error('Error parsing task metadata:', error);
                                alert('Error loading task data. Please refresh and try again.');
                              }
                            }
                          }}
                        >
                          📝 Complete Director Form
                        </button>
                      ) : task.title.includes('Disclose Interest in Other Companies') ? (
                        <button
                          className="director-info-btn"
                          onClick={() => {
                            if (onDirectorInfoTask && task.metadata) {
                              try {
                                const metadata = JSON.parse(task.metadata);
                                const taskData = {
                                  taskId: task.id,
                                  preselectedCompanies: metadata.directorInfo?.companiesForDisclosure || [],
                                  metadata: metadata
                                };
                                onDirectorInfoTask(taskData);
                              } catch (error) {
                                console.error('Error parsing task metadata:', error);
                                alert('Error loading task data. Please refresh and try again.');
                              }
                            }
                          }}
                        >
                          📝 Disclose Interest in Companies
                        </button>
                      ) : task.title.includes('Generate Director Appointment Forms') ? (
                        <button
                          className="form-generation-btn"
                          onClick={() => handleDirectorFormGenerationTask(task)}
                        >
                          📄 Generate Forms
                        </button>
                      ) : task.title.includes('Complete Director Appointment Request') ? (
                        <button
                          className="complete-task-btn"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          ✅ Complete Task
                        </button>
                      ) : (
                        <button
                          className="complete-task-btn"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          ✅ Complete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="task-content">
                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-type">{formatTaskType(task.taskType)}</p>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                  </div>

                  <div className="task-meta">
                    {task.dueDate && (
                      <span className={`due-date ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                        📅 {formatDate(task.dueDate)}
                      </span>
                    )}
                    <span className="created-date">
                      Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-items">
                <p>📬 No new notifications!</p>
                <p>All caught up with updates.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-header">
                    <div className="notification-icon-priority">
                      <span className="notification-icon">
                        {getNotificationIcon(notification.notificationType)}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(notification.priority) }}
                      >
                        {getPriorityIcon(notification.priority)} {notification.priority}
                      </span>
                    </div>
                    <div className="notification-actions">
                      <button
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        ✓ Mark as Read
                      </button>
                    </div>
                  </div>

                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-type">
                      {formatNotificationType(notification.notificationType)}
                    </p>
                    <p className="notification-message">{notification.message}</p>
                  </div>

                  <div className="notification-meta">
                    <span className="created-date">
                      📅 {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <DINEmailAssociationModal
        isOpen={showDINModal}
        onClose={() => setShowDINModal(false)}
        onAssociationCreated={handleAssociationCreated}
        initialData={getDINModalInitialData()}
      />
    </div>
  );
};

export default PendingTasks;