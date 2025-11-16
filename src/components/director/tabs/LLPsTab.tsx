import React from 'react';

interface LLPsTabProps {
  llps: any[];
  associations: any[];
}

const LLPsTab: React.FC<LLPsTabProps> = ({ llps, associations }) => {
  return (
    <div>
      <h2>Associated LLPs</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>LLPIN</th>
            <th>LLP Name</th>
            <th>Status</th>
            <th>Partners</th>
            <th>My Role</th>
            <th>Incorporation Date</th>
          </tr>
        </thead>
        <tbody>
          {llps.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">No associated LLPs found.</td>
            </tr>
          ) : (
            llps.map(llp => {
              const myAssociation = associations.find(
                a => a.entityId === llp.id && a.entityType === 'LLP'
              );
              return (
                <tr key={llp.id}>
                  <td>{llp.llpIN}</td>
                  <td>{llp.llpName}</td>
                  <td>{llp.llpStatus}</td>
                  <td>
                    {llp.numberOfPartners} ({llp.numberOfDesignatedPartners} designated)
                  </td>
                  <td>{myAssociation?.associationType || '-'}</td>
                  <td>
                    {llp.dateOfIncorporation
                      ? new Date(llp.dateOfIncorporation).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LLPsTab;
