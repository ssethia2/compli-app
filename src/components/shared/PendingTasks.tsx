import React, { useState, useEffect } from 'react';
import { getUserTasks, completeTask, getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import './PendingTasks.css';

interface PendingTasksProps {
  userId: string;
  userRole: 'DIRECTORS' | 'PROFESSIONALS';
}

const PendingTasks: React.FC<PendingTasksProps> = ({ userId, userRole }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications'>('tasks');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, notificationsData] = await Promise.all([
        getUserTasks(userId),
        getUserNotifications(userId)
      ]);
      
      setTasks(tasksData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching tasks and notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'URGENT': return '#ff4444';
      case 'HIGH': return '#ff6b35';
      case 'MEDIUM': return '#ffa500';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '🔥';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '📝';
      default: return '📋';
    }
  };

  const getTaskTypeIcon = (taskType: string): string => {
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

  const formatTaskType = (taskType: string): string => {
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
                      <button
                        className="complete-task-btn"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        ✅ Complete
                      </button>
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
    </div>
  );
};

export default PendingTasks;