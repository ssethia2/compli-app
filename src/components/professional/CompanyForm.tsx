// src/components/professional/CompanyForm.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import './Forms.css';

// Initialize the data client
const client = generateClient<Schema>();

// Define the exact types from the schema
type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_PROCESS';
type CompanyType = 'PRIVATE' | 'PUBLIC' | 'ONE_PERSON' | 'SECTION_8';

interface CompanyFormProps {
  onSuccess?: () => void;
}

// Create a type-safe form state
interface CompanyFormState {
  cinNumber: string;
  companyName: string;
  rocName: string;
  dateOfIncorporation: string;
  emailId: string;
  registeredAddress: string;
  authorizedCapital: number;
  paidUpCapital: number;
  numberOfDirectors: number;
  companyStatus: CompanyStatus;
  companyType: CompanyType;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CompanyFormState>({
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
    } else if (name === 'companyStatus') {
      // Ensure companyStatus is one of the allowed values
      setFormData({
        ...formData,
        companyStatus: value as CompanyStatus
      });
    } else if (name === 'companyType') {
      // Ensure companyType is one of the allowed values
      setFormData({
        ...formData,
        companyType: value as CompanyType
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
      console.log('Creating company with data:', formData);
      
      // Create the company record
      const result = await client.models.Company.create({
        cinNumber: formData.cinNumber,
        companyName: formData.companyName,
        rocName: formData.rocName || undefined,
        dateOfIncorporation: formData.dateOfIncorporation || undefined,
        emailId: formData.emailId || undefined,
        registeredAddress: formData.registeredAddress || undefined,
        authorizedCapital: formData.authorizedCapital || undefined,
        paidUpCapital: formData.paidUpCapital || undefined,
        numberOfDirectors: formData.numberOfDirectors || undefined,
        companyStatus: formData.companyStatus,
        companyType: formData.companyType
      });
      
      console.log('Company created successfully:', result);
      
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
      setError(`Failed to create company: ${err instanceof Error ? err.message : String(err)}`);
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