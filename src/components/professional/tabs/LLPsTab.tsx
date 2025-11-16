import React from 'react';

interface LLPsTabProps {
  llps: any[];
  onViewEntity: (entity: any, entityType: 'COMPANY' | 'LLP') => void;
  onEditEntity: (entity: any, entityType: 'COMPANY' | 'LLP') => void;
}

const LLPsTab: React.FC<LLPsTabProps> = ({ llps, onViewEntity, onEditEntity }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>LLP Name</th>
          <th>LLPIN</th>
          <th>Registered Office</th>
          <th>Email</th>
          <th>Incorporation Date</th>
          <th>Partners/Designated</th>
          <th>Contribution</th>
          <th>Status</th>
          <th>Last Filing</th>
          <th>FY</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {llps.length === 0 ? (
          <tr>
            <td colSpan={11} className="no-data">
              No LLPs assigned to you. Create one to get started.
            </td>
          </tr>
        ) : (
          llps.map(llp => {
            return (
              <tr key={llp.llpIN}>
                <td>{llp.llpName}</td>
                <td>{llp.llpIN}</td>
                <td>{llp.registeredAddress || '-'}</td>
                <td>{llp.emailId || '-'}</td>
                <td>
                  {llp.dateOfIncorporation
                    ? new Date(llp.dateOfIncorporation).toLocaleDateString()
                    : '-'}
                </td>
                <td>
                  {llp.numberOfPartners}/{llp.numberOfDesignatedPartners}
                  <br />
                  <small>Partners/Designated</small>
                </td>
                <td>₹{(llp.totalObligationOfContribution || 0).toLocaleString()}</td>
                <td>
                  {llp.llpStatus === 'UNDER_PROCESS' ? 'In Progress' : llp.llpStatus}
                </td>
                <td>
                  {llp.lastAnnualFilingDate
                    ? new Date(llp.lastAnnualFilingDate).toLocaleDateString()
                    : '-'}
                </td>
                <td>{llp.financialYear || '-'}</td>
                <td>
                  <button
                    className="action-button"
                    onClick={() => onViewEntity(llp, 'LLP')}
                  >
                    View
                  </button>
                  <button
                    className="action-button"
                    onClick={() => onEditEntity(llp, 'LLP')}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export default LLPsTab;
