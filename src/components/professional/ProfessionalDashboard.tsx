// src/components/professional/ProfessionalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import CompanyForm from './CompanyForm';
import LLPForm from './LLPForm';
import AssociateDirectorForm from './AssociateDirectorForm';
import './ProfessionalDashboard.css';

const client = generateClient<Schema>();

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const companiesResult = await client.models.Company.list();
      setCompanies(companiesResult.data);
      
      // Fetch LLPs
      const llpsResult = await client.models.LLP.list();
      setLlps(llpsResult.data);
      
      // Fetch associations
      const associationsResult = await client.models.DirectorAssociation.list();
      setAssociations(associationsResult.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Render the appropriate form based on active tab
  const renderAddForm = () => {
    if (!showAddForm) return null;
    
    switch(activeTab) {
      case 'companies':
        return <CompanyForm onSuccess={() => { setShowAddForm(false); fetchData(); }} />;
      case 'llps':
        return <LLPForm onSuccess={() => { setShowAddForm(false); fetchData(); }} />;
      case 'associations':
        return <AssociateDirectorForm onSuccess={() => { setShowAddForm(false); fetchData(); }} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="professional-dashboard">
      <header className="dashboard-header">
        <h1>Professional Dashboard</h1>
        <p>Welcome, {user?.signInDetails?.loginId}</p>
      </header>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'companies' ? 'active' : ''} 
          onClick={() => { setActiveTab('companies'); setShowAddForm(false); }}
        >
          Companies
        </button>
        <button 
          className={activeTab === 'llps' ? 'active' : ''} 
          onClick={() => { setActiveTab('llps'); setShowAddForm(false); }}
        >
          LLPs
        </button>
        <button 
          className={activeTab === 'associations' ? 'active' : ''} 
          onClick={() => { setActiveTab('associations'); setShowAddForm(false); }}
        >
          Director Associations
        </button>
      </nav>
      
      <div className="dashboard-content">
        <div className="content-header">
          <h2>
            {activeTab === 'companies' && 'Companies'}
            {activeTab === 'llps' && 'Limited Liability Partnerships'}
            {activeTab === 'associations' && 'Director Associations'}
          </h2>
          
          <button 
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : `Add ${activeTab === 'companies' ? 'Company' : activeTab === 'llps' ? 'LLP' : 'Association'}`}
          </button>
        </div>
        
        {renderAddForm()}
        
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <div className="data-table-container">
            {activeTab === 'companies' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CIN</th>
                    <th>Company Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Incorporation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">No companies found. Create one to get started.</td>
                    </tr>
                  ) : (
                    companies.map(company => (
                      <tr key={company.cinNumber}>
                        <td>{company.cinNumber}</td>
                        <td>{company.companyName}</td>
                        <td>{company.companyType}</td>
                        <td>{company.companyStatus}</td>
                        <td>{company.dateOfIncorporation ? new Date(company.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                        <td>
                          <button className="action-button">View</button>
                          <button className="action-button">Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            
            {activeTab === 'llps' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>LLPIN</th>
                    <th>LLP Name</th>
                    <th>Status</th>
                    <th>Partners</th>
                    <th>Incorporation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {llps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">No LLPs found. Create one to get started.</td>
                    </tr>
                  ) : (
                    llps.map(llp => (
                      <tr key={llp.llpIN}>
                        <td>{llp.llpIN}</td>
                        <td>{llp.llpName}</td>
                        <td>{llp.llpStatus}</td>
                        <td>{llp.numberOfPartners} ({llp.numberOfDesignatedPartners} designated)</td>
                        <td>{llp.dateOfIncorporation ? new Date(llp.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                        <td>
                          <button className="action-button">View</button>
                          <button className="action-button">Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            
            {activeTab === 'associations' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Director ID</th>
                    <th>Entity ID</th>
                    <th>Entity Type</th>
                    <th>Association Type</th>
                    <th>Appointment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">No associations found. Create one to get started.</td>
                    </tr>
                  ) : (
                    associations.map(assoc => (
                      <tr key={`${assoc.userId}-${assoc.entityId}`}>
                        <td>{assoc.userId}</td>
                        <td>{assoc.entityId}</td>
                        <td>{assoc.entityType}</td>
                        <td>{assoc.associationType}</td>
                        <td>{assoc.appointmentDate ? new Date(assoc.appointmentDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <button className="action-button">View</button>
                          <button className="action-button delete-button">Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;