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
  identifier: string; // CIN or LLPIN
  type: 'COMPANY' | 'LLP';
}


const AssociateDirectorForm: React.FC<AssociateDirectorFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    directorEmail: '',
    entityId: '',
    entityType: 'COMPANY',
    associationType: 'DIRECTOR',
    appointmentDate: '',
  });
  
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Function to find or create UserProfile by email
  const findOrCreateDirectorByEmail = async (email: string): Promise<string> => {
    try {
      // First, try to find existing UserProfile by email
      const existingUsers = await client.models.UserProfile.list({
        filter: {
          email: { eq: email.toLowerCase().trim() }
        }
      });
      
      if (existingUsers.data.length > 0) {
        console.log('Found existing director:', existingUsers.data[0]);
        return existingUsers.data[0].userId;
      }
      
      // If not found, create new UserProfile
      console.log('Creating new director profile for:', email);
      const newUser = await client.models.UserProfile.create({
        userId: `director-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Generate unique ID
        email: email.toLowerCase().trim(),
        role: 'DIRECTORS',
        displayName: email.split('@')[0] // Use email prefix as default display name
      });
      
      if (!newUser.data) {
        throw new Error('Failed to create user profile');
      }
      
      console.log('Created new director profile:', newUser.data);
      return newUser.data.userId;
      
    } catch (error) {
      console.error('Error finding/creating director:', error);
      throw new Error(`Failed to process director email: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Fetch entities and directors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching companies and LLPs...');
        
        // Fetch companies
        const companiesResult = await client.models.Company.list();
        console.log('Companies fetched:', companiesResult.data);
        
        const companyOptions = companiesResult.data.map(company => ({
          id: company.id,
          name: company.companyName,
          identifier: company.cinNumber,
          type: 'COMPANY' as const
        }));
        
        // Fetch LLPs
        const llpsResult = await client.models.LLP.list();
        console.log('LLPs fetched:', llpsResult.data);
        
        const llpOptions = llpsResult.data.map(llp => ({
          id: llp.id,
          name: llp.llpName,
          identifier: llp.llpIN,
          type: 'LLP' as const
        }));
        
        // Combine entities
        setEntities([...companyOptions, ...llpOptions]);
        
        // Note: We no longer pre-fetch directors since we'll use email lookup
        
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
      
      // Validate email
      if (!formData.directorEmail || !formData.directorEmail.includes('@')) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      
      // Find or create director UserProfile
      const directorUserId = await findOrCreateDirectorByEmail(formData.directorEmail);
      
      // Check if association already exists
      const existingAssociations = await client.models.DirectorAssociation.list({
        filter: {
          and: [
            { userId: { eq: directorUserId } },
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
        userId: directorUserId,
        entityId: formData.entityId,
        entityType: formData.entityType as 'COMPANY' | 'LLP',
        associationType: formData.associationType as 'DIRECTOR' | 'DESIGNATED_PARTNER' | 'PARTNER',
        appointmentDate: formData.appointmentDate ? formData.appointmentDate : new Date().toISOString().split('T')[0],
        isActive: true
      });
      
      console.log('Director association created successfully:', result);
      
      // Reset form
      setFormData({
        directorEmail: '',
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
          <label htmlFor="directorEmail">Director Email *</label>
          <input
            type="email"
            id="directorEmail"
            name="directorEmail"
            value={formData.directorEmail}
            onChange={handleChange}
            placeholder="director@company.com"
            required
          />
          <small className="field-hint">
            If the director doesn't have an account yet, we'll create one for them.
          </small>
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
                    {company.name} (CIN: {company.identifier})
                  </option>
                ))}
            </optgroup>
            <optgroup label="LLPs">
              {entities
                .filter(entity => entity.type === 'LLP')
                .map(llp => (
                  <option key={llp.id} value={llp.id}>
                    {llp.name} (LLPIN: {llp.identifier})
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