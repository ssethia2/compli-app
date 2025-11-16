import React from 'react';

interface CompaniesTabProps {
  companies: any[];
  associations: any[];
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({ companies, associations }) => {
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
            companies.map(company => {
              const myAssociation = associations.find(
                a => a.entityId === company.id && a.entityType === 'COMPANY'
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
