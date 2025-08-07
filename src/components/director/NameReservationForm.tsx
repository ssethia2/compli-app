import React, { useState } from 'react';
// import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
// import type { Schema } from '../../../amplify/data/resource';
import './NameReservationForm.css';

// const client = generateClient<Schema>();

interface NameReservationFormProps {
  onSuccess: (tempEntityData: any) => void;
  entityType: 'COMPANY' | 'LLP';
}

const NameReservationForm: React.FC<NameReservationFormProps> = ({ onSuccess, entityType }) => {
  const { user } = useAuthenticator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstProposedName: '',
    secondProposedName: '',
    proposedObject: '',
    isTrademarked: 'no',
    wordMark: '',
    trademarkClass: '',
    trademarkPanNumber: '',
    significanceOfName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.username) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create temporary entity record
      const tempEntityData = {
        directorUserId: user.username,
        entityType: entityType,
        currentStep: 'NAME_RESERVATION',
        status: 'Initiated name reservation process',
        nameReservationData: {
          firstProposedName: formData.firstProposedName,
          secondProposedName: formData.secondProposedName,
          proposedObject: formData.proposedObject,
          isTrademarked: formData.isTrademarked === 'yes',
          ...(formData.isTrademarked === 'yes' && {
            wordMark: formData.wordMark,
            trademarkClass: formData.trademarkClass,
            trademarkPanNumber: formData.trademarkPanNumber
          }),
          significanceOfName: formData.significanceOfName
        }
      };

      console.log('Creating temporary entity:', tempEntityData);
      
      // TODO: Replace with actual database call once TempEntity model is created
      // const result = await client.models.TempEntity.create(tempEntityData);
      
      // Reset form
      setFormData({
        firstProposedName: '',
        secondProposedName: '',
        proposedObject: '',
        isTrademarked: 'no',
        wordMark: '',
        trademarkClass: '',
        trademarkPanNumber: '',
        significanceOfName: ''
      });
      
      onSuccess(tempEntityData);
      
    } catch (error) {
      console.error('Error creating temporary entity:', error);
      alert('Error submitting name reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="name-reservation-form">
      <div className="form-header">
        <h3>Name Reservation for {entityType === 'COMPANY' ? 'Company' : 'LLP'}</h3>
        <p>Please provide the following details to begin the {entityType.toLowerCase()} creation process.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-section">
          <h4>Proposed Names</h4>
          
          <div className="form-group">
            <label htmlFor="firstProposedName">
              First Proposed Name of the {entityType === 'COMPANY' ? 'Company' : 'LLP'} *
            </label>
            <input
              type="text"
              id="firstProposedName"
              value={formData.firstProposedName}
              onChange={(e) => handleInputChange('firstProposedName', e.target.value)}
              required
              placeholder={`Enter first proposed ${entityType.toLowerCase()} name`}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="secondProposedName">
              Second Proposed Name of the {entityType === 'COMPANY' ? 'Company' : 'LLP'} *
            </label>
            <input
              type="text"
              id="secondProposedName"
              value={formData.secondProposedName}
              onChange={(e) => handleInputChange('secondProposedName', e.target.value)}
              required
              placeholder={`Enter second proposed ${entityType.toLowerCase()} name`}
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Business Details</h4>
          
          <div className="form-group">
            <label htmlFor="proposedObject">
              Proposed Object of the {entityType === 'COMPANY' ? 'Company' : 'LLP'} *
            </label>
            <textarea
              id="proposedObject"
              value={formData.proposedObject}
              onChange={(e) => handleInputChange('proposedObject', e.target.value)}
              required
              rows={4}
              placeholder={`Describe the main business activities and objectives of the ${entityType.toLowerCase()}`}
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Trademark Information</h4>
          
          <div className="form-group">
            <label>Is the proposed name trademarked? *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="isTrademarked"
                  value="yes"
                  checked={formData.isTrademarked === 'yes'}
                  onChange={(e) => handleInputChange('isTrademarked', e.target.value)}
                />
                Yes
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="isTrademarked"
                  value="no"
                  checked={formData.isTrademarked === 'no'}
                  onChange={(e) => handleInputChange('isTrademarked', e.target.value)}
                />
                No
              </label>
            </div>
          </div>
          
          {formData.isTrademarked === 'yes' && (
            <div className="trademark-details">
              <div className="form-group">
                <label htmlFor="wordMark">Word Mark *</label>
                <input
                  type="text"
                  id="wordMark"
                  value={formData.wordMark}
                  onChange={(e) => handleInputChange('wordMark', e.target.value)}
                  required={formData.isTrademarked === 'yes'}
                  placeholder="Enter the trademarked word or phrase"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="trademarkClass">Class *</label>
                <input
                  type="text"
                  id="trademarkClass"
                  value={formData.trademarkClass}
                  onChange={(e) => handleInputChange('trademarkClass', e.target.value)}
                  required={formData.isTrademarked === 'yes'}
                  placeholder="Enter trademark class"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="trademarkPanNumber">PAN No. of Trademark Holder *</label>
                <input
                  type="text"
                  id="trademarkPanNumber"
                  value={formData.trademarkPanNumber}
                  onChange={(e) => handleInputChange('trademarkPanNumber', e.target.value)}
                  required={formData.isTrademarked === 'yes'}
                  placeholder="Enter PAN number"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  title="PAN should be in format: ABCDE1234F"
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="significanceOfName">Significance of Name *</label>
            <textarea
              id="significanceOfName"
              value={formData.significanceOfName}
              onChange={(e) => handleInputChange('significanceOfName', e.target.value)}
              required
              rows={3}
              placeholder="Explain the significance or meaning behind the proposed name"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? 'Submitting...' : 'Submit Name Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NameReservationForm;