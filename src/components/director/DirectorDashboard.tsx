// src/components/director/DirectorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './DirectorDashboard.css';

const client = generateClient<Schema>();

const DirectorDashboard: React.FC = () => {
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('associations');
  const [associations, setAssociations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [llps, setLlps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch director's associations and related entities
  const fetchDirectorData = async () => {
    if (!user?.username) return;
    
    setLoading(true);
    try {
      console.log('Fetching director associations for:', user.username);
      
      // 1. Get director's UserProfile to find their userId
      const userProfileResult = await client.models.UserProfile.list({
        filter: {
          or: [
            { userId: { eq: user.username } },
            { email: { eq: user.signInDetails?.loginId || user.username } }
          ]
        }
      });
      
      if (userProfileResult.data.length === 0) {
        console.warn('No UserProfile found for director');
        setLoading(false);
        return;
      }
      
      const directorProfile = userProfileResult.data[0];
      console.log('Director profile:', directorProfile);
      
      // 2. Get all associations for this director
      const associationsResult = await client.models.DirectorAssociation.list({
        filter: {
          and: [
            { userId: { eq: directorProfile.userId } },
            { isActive: { eq: true } }
          ]
        }
      });
      
      const directorAssociations = associationsResult.data;
      console.log('Director associations:', directorAssociations);
      
      // 3. Separate company and LLP associations
      const companyIds = directorAssociations
        .filter(a => a.entityType === 'COMPANY')
        .map(a => a.entityId);
      
      const llpIds = directorAssociations
        .filter(a => a.entityType === 'LLP')
        .map(a => a.entityId);
      
      console.log('Company IDs:', companyIds);
      console.log('LLP IDs:', llpIds);
      
      // 4. Fetch associated companies
      const associatedCompanies = [];
      for (const companyId of companyIds) {
        try {
          const companyResult = await client.models.Company.get({ id: companyId });
          if (companyResult.data) {
            associatedCompanies.push(companyResult.data);
          }
        } catch (error) {
          console.warn(`Could not fetch company ${companyId}:`, error);
        }
      }
      
      // 5. Fetch associated LLPs
      const associatedLLPs = [];
      for (const llpId of llpIds) {
        try {
          const llpResult = await client.models.LLP.get({ id: llpId });
          if (llpResult.data) {
            associatedLLPs.push(llpResult.data);
          }
        } catch (error) {
          console.warn(`Could not fetch LLP ${llpId}:`, error);
        }
      }
      
      console.log('Associated companies:', associatedCompanies);
      console.log('Associated LLPs:', associatedLLPs);
      
      setAssociations(directorAssociations);
      setCompanies(associatedCompanies);
      setLlps(associatedLLPs);
      
    } catch (err) {
      console.error('Error fetching director data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchDirectorData();
  }, [user?.username]);
  
  return (
    <div className="director-dashboard">
      <header className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Welcome, {user?.signInDetails?.loginId}</p>
        <p>Managing {associations.length} associations across {companies.length} companies and {llps.length} LLPs</p>
      </header>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'associations' ? 'active' : ''} 
          onClick={() => setActiveTab('associations')}
        >
          My Associations ({associations.length})
        </button>
        <button 
          className={activeTab === 'companies' ? 'active' : ''} 
          onClick={() => setActiveTab('companies')}
        >
          Companies ({companies.length})
        </button>
        <button 
          className={activeTab === 'llps' ? 'active' : ''} 
          onClick={() => setActiveTab('llps')}
        >
          LLPs ({llps.length})
        </button>
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >
          Change Requests
        </button>
      </nav>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading your associations...</div>
        ) : (
          <>
            {activeTab === 'associations' && (
              <div>
                <h2>My Director Associations</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Entity Type</th>
                      <th>Association Type</th>
                      <th>Appointment Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data">No associations found. Contact a compliance professional to be added to entities.</td>
                      </tr>
                    ) : (
                      associations.map(assoc => {
                        // Find the entity details
                        const entity = assoc.entityType === 'COMPANY' 
                          ? companies.find(c => c.id === assoc.entityId)
                          : llps.find(l => l.id === assoc.entityId);
                        
                        return (
                          <tr key={`${assoc.userId}-${assoc.entityId}`}>
                            <td>
                              {entity ? (
                                <div>
                                  <div>{assoc.entityType === 'COMPANY' ? entity.companyName : entity.llpName}</div>
                                  <small style={{ color: '#666' }}>
                                    {assoc.entityType === 'COMPANY' ? 'CIN' : 'LLPIN'}: {assoc.entityType === 'COMPANY' ? entity.cinNumber : entity.llpIN}
                                  </small>
                                </div>
                              ) : (
                                'Loading...'
                              )}
                            </td>
                            <td>{assoc.entityType}</td>
                            <td>{assoc.associationType}</td>
                            <td>{assoc.appointmentDate ? new Date(assoc.appointmentDate).toLocaleDateString() : '-'}</td>
                            <td>{assoc.isActive ? 'Active' : 'Inactive'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'companies' && (
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
                        const myAssociation = associations.find(a => a.entityId === company.id && a.entityType === 'COMPANY');
                        return (
                          <tr key={company.id}>
                            <td>{company.cinNumber}</td>
                            <td>{company.companyName}</td>
                            <td>{company.companyType}</td>
                            <td>{company.companyStatus}</td>
                            <td>{myAssociation?.associationType || '-'}</td>
                            <td>{company.dateOfIncorporation ? new Date(company.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'llps' && (
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
                        const myAssociation = associations.find(a => a.entityId === llp.id && a.entityType === 'LLP');
                        return (
                          <tr key={llp.id}>
                            <td>{llp.llpIN}</td>
                            <td>{llp.llpName}</td>
                            <td>{llp.llpStatus}</td>
                            <td>{llp.numberOfPartners} ({llp.numberOfDesignatedPartners} designated)</td>
                            <td>{myAssociation?.associationType || '-'}</td>
                            <td>{llp.dateOfIncorporation ? new Date(llp.dateOfIncorporation).toLocaleDateString() : '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'requests' && (
              <div>
                <h2>Change Requests</h2>
                <p>Change request functionality coming soon...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;