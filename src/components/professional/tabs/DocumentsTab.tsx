import React from 'react';
import FormGenerator from '../FormGenerator';
import DocumentList from '../../shared/DocumentList';

interface DirectorESignaturesProps {
  professionalId: string;
  associations: any[];
}

// Placeholder for DirectorESignatures component
const DirectorESignatures: React.FC<DirectorESignaturesProps> = () => {
  return <div>Director E-Signatures (Component to be implemented)</div>;
};

interface DocumentsTabProps {
  formGenerationTasks: any[];
  associations: any[];
  currentUserId: string;
  onTaskRemove: (index: number) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  formGenerationTasks,
  associations,
  currentUserId,
  onTaskRemove
}) => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Form Generation & Document Management</h3>
        <p>
          Generate DIR-2, DIR-8, and MBP-1 forms from collected director information, and
          manage all compliance documents.
        </p>
      </div>

      {/* Form Generation Tasks */}
      {formGenerationTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4>Pending Form Generation Tasks</h4>
          {formGenerationTasks.map((task, index) => (
            <FormGenerator
              key={index}
              directorDIN={task.directorDIN}
              directorName={task.directorName}
              entityName={task.entityName}
              directorInfoDocument={task.directorInfoDocument}
              requiredForms={task.requiredForms || ['DIR-2', 'DIR-8', 'MBP-1']}
              professionalUserId={currentUserId}
              onFormsGenerated={() => onTaskRemove(index)}
            />
          ))}
        </div>
      )}

      {/* Director E-Signatures Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Director E-Signatures</h3>
        <p>View and download e-signatures from your associated directors</p>
        <DirectorESignatures
          professionalId={currentUserId}
          associations={associations}
        />
      </div>

      <DocumentList
        showUploader={true}
        allowDelete={true}
        groupByUser={true}
        onRefresh={() => {}}
        currentUserId={currentUserId}
        currentUserRole="PROFESSIONALS"
      />
    </div>
  );
};

export default DocumentsTab;
