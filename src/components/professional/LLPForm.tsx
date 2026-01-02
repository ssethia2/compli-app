// src/components/professional/LLPForm.tsx
import React, { useState } from 'react';
import { createLLP } from '../../api/lambda';
import './Forms.css';

interface LLPFormProps {
  onSuccess?: (llpId: string) => void;
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
    llpStatus: 'ACTIVE',
    lastAnnualFilingDate: '',
    financialYear: ''
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

      const result = await createLLP({
        llpIN: formData.llpIN,
        llpName: formData.llpName,
        dateOfIncorporation: formData.dateOfIncorporation || undefined,
        emailId: formData.emailId || undefined,
        registeredAddress: formData.registeredAddress || undefined,
        totalContribution: formData.totalObligationOfContribution || undefined,
        numberOfPartners: formData.numberOfPartners || undefined,
        llpStatus: formData.llpStatus as 'ACTIVE' | 'INACTIVE' | 'UNDER_PROCESS' | 'STRUCK_OFF',
        lastAnnualFilingDate: formData.lastAnnualFilingDate || undefined,
        financialYear: formData.financialYear || undefined
      });

      if (!result.success) {
        setError(result.message || 'Failed to create LLP');
        if (result.errors && Array.isArray(result.errors)) {
          setError(result.errors.join(', '));
        }
        return;
      }

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
        llpStatus: 'ACTIVE',
        lastAnnualFilingDate: '',
        financialYear: ''
      });

      const createdLlpId = result.data?.id;
      if (onSuccess && createdLlpId) {
        onSuccess(createdLlpId);
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
            <option value="UNDER_PROCESS">In Progress</option>
            <option value="STRUCK_OFF">Struck Off</option>
            <option value="AMALGAMATED">Amalgamated</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="lastAnnualFilingDate">Last Annual Filing Date</label>
          <input
            type="date"
            id="lastAnnualFilingDate"
            name="lastAnnualFilingDate"
            value={formData.lastAnnualFilingDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="financialYear">Financial Year</label>
          <input
            type="text"
            id="financialYear"
            name="financialYear"
            value={formData.financialYear}
            onChange={handleChange}
            placeholder="e.g., 2023-24"
          />
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