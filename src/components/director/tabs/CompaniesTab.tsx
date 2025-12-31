import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useDirectorEntities } from '../../../hooks/useEntities';

const CompaniesTab: React.FC = () => {
  const { user } = useAuthenticator();
  const { data: entitiesData, isLoading, error } = useDirectorEntities(user?.username);

  if (isLoading) {
    return <div className="loading-state">Loading companies...</div>;
  }

  if (error) {
    return <div className="error-state">Error loading companies. Please try again.</div>;
  }

  const companies = entitiesData?.companies || [];
  const associations = entitiesData?.associations || [];

  return (
    <div>
      <h2>Associated Companies</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>CIN</th>
            <th>Company Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>My Role</th>
            <th>Incorporation Date</th>
          </tr>
        </thead>
        <tbody>
          {companies.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">No associated companies found.</td>
            </tr>
          ) : (
            companies.map((company: any) => {
              const myAssociation = associations.find(
                (a: any) => a.entityId === company.id && a.entityType === 'COMPANY'
              );
              return (
                <tr key={company.id}>
                  <td>{company.cinNumber}</td>
                  <td>{company.companyName}</td>
                  <td>{company.companyType}</td>
                  <td>{company.companyStatus}</td>
                  <td>{myAssociation?.associationType || '-'}</td>
                  <td>
                    {company.dateOfIncorporation
                      ? new Date(company.dateOfIncorporation).toLocaleDateString()
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

export default CompaniesTab;
