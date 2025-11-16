import React from 'react';

interface CompaniesTabProps {
  companies: any[];
  associations: any[];
  onViewEntity: (entity: any, entityType: 'COMPANY' | 'LLP') => void;
  onEditEntity: (entity: any, entityType: 'COMPANY' | 'LLP') => void;
}

const CompaniesTab: React.FC<CompaniesTabProps> = ({
  companies,
  associations,
  onViewEntity,
  onEditEntity
}) => {
  const getDirectorsForEntity = (entityId: string, entityType: 'COMPANY' | 'LLP') => {
    return associations.filter(
      assoc =>
        assoc.entityId === entityId &&
        assoc.entityType === entityType &&
        assoc.isActive
    );
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Company Name</th>
          <th>CIN</th>
          <th>Type</th>
          <th>Registered Office</th>
          <th>Email</th>
          <th>Incorporation Date</th>
          <th>Directors</th>
          <th>Capital (Auth/Paid)</th>
          <th>Status</th>
          <th>Last Filing</th>
          <th>FY</th>
          <th>AGM</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {companies.length === 0 ? (
          <tr>
            <td colSpan={13} className="no-data">
              No companies assigned to you. Create one to get started.
            </td>
          </tr>
        ) : (
          companies.map(company => {
            const directors = getDirectorsForEntity(company.id, 'COMPANY');
            return (
              <tr key={company.cinNumber}>
                <td>{company.companyName}</td>
                <td>{company.cinNumber}</td>
                <td>
                  {company.companyType === 'ONE_PERSON' ? 'OPC' : company.companyType}
                </td>
                <td>{company.registeredAddress || '-'}</td>
                <td>{company.emailId || '-'}</td>
                <td>
                  {company.dateOfIncorporation
                    ? new Date(company.dateOfIncorporation).toLocaleDateString()
                    : '-'}
                </td>
                <td>{directors.length} directors</td>
                <td>
                  {company.authorizedCapital || company.paidUpCapital ? (
                    <div>
                      <div>₹{(company.authorizedCapital || 0).toLocaleString()}</div>
                      <small>₹{(company.paidUpCapital || 0).toLocaleString()}</small>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {company.companyStatus === 'UNDER_PROCESS'
                    ? 'In Progress'
                    : company.companyStatus}
                </td>
                <td>
                  {company.lastAnnualFilingDate
                    ? new Date(company.lastAnnualFilingDate).toLocaleDateString()
                    : '-'}
                </td>
                <td>{company.financialYear || '-'}</td>
                <td>
                  {company.agmDate
                    ? new Date(company.agmDate).toLocaleDateString()
                    : '-'}
                </td>
                <td>
                  <button
                    className="action-button"
                    onClick={() => onViewEntity(company, 'COMPANY')}
                  >
                    View
                  </button>
                  <button
                    className="action-button"
                    onClick={() => onEditEntity(company, 'COMPANY')}
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

export default CompaniesTab;
