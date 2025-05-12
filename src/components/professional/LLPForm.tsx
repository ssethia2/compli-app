// src/components/professional/LLPForm.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './Forms.css';

// Initialize the data client
const client = generateClient<Schema>();

interface LLPFormProps {
  onSuccess?: () => void;
}

const LLPForm: React.FC<LLPFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    llpIN: '',
    llpName: '',
    rocName: '',
    dateOfIncorporation: '',
    emailId: '',
    numberOfPartners: 0,
    numberOfDesignatedPartners: 0,
    registeredAddress: '',
    totalObligationOfContribution: 0,
    llpStatus: 'ACTIVE'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert numeric values
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
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
      console.log('Creating LLP with data:', formData);
      
      // Create the LLP record
      const result = await client.models.LLP.create(formData);
      console.log('LLP created successfully:', result);
      
      // Reset form
      setFormData({
        llpIN: '',
        llpName: '',
        rocName: '',
        dateOfIncorporation: '',
        emailId: '',
        numberOfPartners: 0,
        numberOfDesignatedPartners: 0,
        registeredAddress: '',
        totalObligationOfContribution: 0,
        llpStatus: 'ACTIVE'
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      alert('LLP created successfully!');
    } catch (err) {
      console.error('Error creating LLP:', err);
      setError(`Failed to create LLP: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h2>Add New LLP</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="llpIN">LLPIN *</label>
          <input
            type="text"
            id="llpIN"
            name="llpIN"
            value={formData.llpIN}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="llpName">LLP Name *</label>
          <input
            type="text"
            id="llpName"
            name="llpName"
            value={formData.llpName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dateOfIncorporation">Date of Incorporation</label>
          <input
            type="date"
            id="dateOfIncorporation"
            name="dateOfIncorporation"
            value={formData.dateOfIncorporation}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="rocName">ROC Name</label>
          <input
            type="text"
            id="rocName"
            name="rocName"
            value={formData.rocName}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="emailId">Email ID</label>
          <input
            type="email"
            id="emailId"
            name="emailId"
            value={formData.emailId}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="registeredAddress">Registered Address</label>
          <textarea
            id="registeredAddress"
            name="registeredAddress"
            value={formData.registeredAddress}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numberOfPartners">Number of Partners</label>
            <input
              type="number"
              id="numberOfPartners"
              name="numberOfPartners"
              value={formData.numberOfPartners}
              onChange={handleChange}
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="numberOfDesignatedPartners">Designated Partners</label>
            <input
              type="number"
              id="numberOfDesignatedPartners"
              name="numberOfDesignatedPartners"
              value={formData.numberOfDesignatedPartners}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="totalObligationOfContribution">Total Obligation of Contribution</label>
          <input
            type="number"
            id="totalObligationOfContribution"
            name="totalObligationOfContribution"
            value={formData.totalObligationOfContribution}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="llpStatus">LLP Status</label>
          <select
            id="llpStatus"
            name="llpStatus"
            value={formData.llpStatus}
            onChange={handleChange}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_PROCESS">Under Process</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create LLP'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LLPForm;