// src/components/professional/AssociateDirectorForm.tsx
import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './Forms.css';

// Initialize the data client
const client = generateClient<Schema>();

interface AssociateDirectorFormProps {
  onSuccess?: () => void;
}

interface EntityOption {
  id: string;
  name: string;
  type: 'COMPANY' | 'LLP';
}

interface UserOption {
  userId: string;
  displayName: string;
}

const AssociateDirectorForm: React.FC<AssociateDirectorFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    userId: '',
    entityId: '',
    entityType: 'COMPANY',
    associationType: 'DIRECTOR',
    appointmentDate: '',
  });
  
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [directors, setDirectors] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch entities and directors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching companies and LLPs...');
        
        // Fetch companies
        const companiesResult = await client.models.Company.list();
        console.log('Companies fetched:', companiesResult.data);
        
        const companyOptions = companiesResult.data.map(company => ({
          id: company.cinNumber,
          name: company.companyName,
          type: 'COMPANY' as const
        }));
        
        // Fetch LLPs
        const llpsResult = await client.models.LLP.list();
        console.log('LLPs fetched:', llpsResult.data);
        
        const llpOptions = llpsResult.data.map(llp => ({
          id: llp.llpIN,
          name: llp.llpName,
          type: 'LLP' as const
        }));
        
        // Combine entities
        setEntities([...companyOptions, ...llpOptions]);
        
        // Fetch users with DIRECTORS role
        const usersResult = await client.models.UserProfile.list({
          filter: {
            role: {
              eq: 'DIRECTORS'
            }
          }
        });
        console.log('Directors fetched:', usersResult.data);
        
        setDirectors(usersResult.data);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'entityId') {
      // Find the selected entity to set its type
      const selectedEntity = entities.find(entity => entity.id === value);
      if (selectedEntity) {
        setFormData({
          ...formData,
          entityId: value,
          entityType: selectedEntity.type
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Creating director association with data:', formData);
      
      // Check if association already exists
      const existingAssociations = await client.models.DirectorAssociation.list({
        filter: {
          and: [
            { userId: { eq: formData.userId } },
            { entityId: { eq: formData.entityId } }
          ]
        }
      });
      
      if (existingAssociations.data.length > 0) {
        setError('This director is already associated with this entity.');
        setLoading(false);
        return;
      }
      
      // Create the association
      const result = await client.models.DirectorAssociation.create({
        userId: formData.userId,
        entityId: formData.entityId,
        entityType: formData.entityType,
        associationType: formData.associationType,
        appointmentDate: formData.appointmentDate ? new Date(formData.appointmentDate).toISOString() : new Date().toISOString()
      });
      
      console.log('Director association created successfully:', result);
      
      // Reset form
      setFormData({
        userId: '',
        entityId: '',
        entityType: 'COMPANY',
        associationType: 'DIRECTOR',
        appointmentDate: '',
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Director association created successfully!');
    } catch (err) {
      console.error('Error creating association:', err);
      setError(`Failed to create association: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h2>Associate Director with Company/LLP</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">Director *</label>
          <select
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
          >
            <option value="">Select a Director</option>
            {directors.map(director => (
              <option key={director.userId} value={director.userId}>
                {director.displayName || director.userId}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="entityId">Company/LLP *</label>
          <select
            id="entityId"
            name="entityId"
            value={formData.entityId}
            onChange={handleChange}
            required
          >
            <option value="">Select an Entity</option>
            <optgroup label="Companies">
              {entities
                .filter(entity => entity.type === 'COMPANY')
                .map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="LLPs">
              {entities
                .filter(entity => entity.type === 'LLP')
                .map(llp => (
                  <option key={llp.id} value={llp.id}>
                    {llp.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="associationType">Association Type</label>
          <select
            id="associationType"
            name="associationType"
            value={formData.associationType}
            onChange={handleChange}
          >
            <option value="DIRECTOR">Director</option>
            <option value="DESIGNATED_PARTNER">Designated Partner</option>
            <option value="PARTNER">Partner</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="appointmentDate">Appointment Date</label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Associate Director'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssociateDirectorForm;