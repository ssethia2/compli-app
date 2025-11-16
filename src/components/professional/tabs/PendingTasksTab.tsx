import React from 'react';
import PendingTasks from '../../shared/PendingTasks';

interface PendingTasksTabProps {
  userId: string;
  onFormGeneration: (taskData: any) => void;
  onDirectorInfoFormTask: (taskData: any) => void;
}

const PendingTasksTab: React.FC<PendingTasksTabProps> = ({
  userId,
  onFormGeneration,
  onDirectorInfoFormTask
}) => {
  return (
    <PendingTasks
      userId={userId}
      userRole="PROFESSIONALS"
      onDirectorFormGeneration={onFormGeneration}
      onDirectorInfoFormTask={onDirectorInfoFormTask}
    />
  );
};

export default PendingTasksTab;
