import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import PendingTasks from '../../shared/PendingTasks';

interface PendingTasksTabProps {
  onDirectorInfoTask?: (taskData: any) => void;
}

const PendingTasksTab: React.FC<PendingTasksTabProps> = ({ onDirectorInfoTask }) => {
  const { user } = useAuthenticator();

  return (
    <PendingTasks
      userId={user?.username || ''}
      userRole="DIRECTORS"
      onDirectorInfoTask={onDirectorInfoTask}
    />
  );
};

export default PendingTasksTab;
