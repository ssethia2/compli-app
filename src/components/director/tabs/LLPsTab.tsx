import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useDirectorEntities } from '../../../hooks/useEntities';

const LLPsTab: React.FC = () => {
  const { user } = useAuthenticator();
  const { data: entitiesData, isLoading, error } = useDirectorEntities(user?.username);

  if (isLoading) {
    return <div className="loading-state">Loading LLPs...</div>;
  }

  if (error) {
    return <div className="error-state">Error loading LLPs. Please try again.</div>;
  }

  const llps = entitiesData?.llps || [];
  const associations = entitiesData?.associations || [];

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
            llps.map((llp: any) => {
              const myAssociation = associations.find(
                (a: any) => a.entityId === llp.id && a.entityType === 'LLP'
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
