// src/components/professional/CompanyForm.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './Forms.css';

const client = generateClient<Schema>();

interface CompanyFormProps {
  onSuccess?: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    cinNumber: '',
    companyName: '',
    rocName: '',
    dateOfIncorporation: '',
    emailId: '',
    registeredAddress: '',
    authorizedCapital: 0,
    paidUpCapital: 0,
    numberOfDirectors: 0,
    companyStatus: 'ACTIVE',
    companyType: 'PRIVATE'
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
      // Create the company record
      await client.models.Company.create(formData);
      
      // Reset form
      setFormData({
        cinNumber: '',
        companyName: '',
        rocName: '',
        dateOfIncorporation: '',
        emailId: '',
        registeredAddress: '',
        authorizedCapital: 0,
        paidUpCapital: 0,
        numberOfDirectors: 0,
        companyStatus: 'ACTIVE',
        companyType: 'PRIVATE'
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Company created successfully!');
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h2>Add New Company</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cinNumber">CIN Number *</label>
          <input
            type="text"
            id="cinNumber"
            name="cinNumber"
            value={formData.cinNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="companyName">Company Name *</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="companyType">Company Type</label>
          <select
            id="companyType"
            name="companyType"
            value={formData.companyType}
            onChange={handleChange}
          >
            <option value="PRIVATE">Private Limited</option>
            <option value="PUBLIC">Public Limited</option>
            <option value="ONE_PERSON">One Person Company</option>
            <option value="SECTION_8">Section 8 Company</option>
          </select>
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
            <label htmlFor="authorizedCapital">Authorized Capital</label>
            <input
              type="number"
              id="authorizedCapital"
              name="authorizedCapital"
              value={formData.authorizedCapital}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="paidUpCapital">Paid Up Capital</label>
            <input
              type="number"
              id="paidUpCapital"
              name="paidUpCapital"
              value={formData.paidUpCapital}
              onChange={handleChange}
              step="0.01"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="numberOfDirectors">Number of Directors</label>
          <input
            type="number"
            id="numberOfDirectors"
            name="numberOfDirectors"
            value={formData.numberOfDirectors}
            onChange={handleChange}
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="companyStatus">Company Status</label>
          <select
            id="companyStatus"
            name="companyStatus"
            value={formData.companyStatus}
            onChange={handleChange}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_PROCESS">Under Process</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;