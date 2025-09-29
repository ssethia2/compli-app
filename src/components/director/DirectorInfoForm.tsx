import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from '../../../amplify/data/resource';
import './DirectorInfoForm.css';

const client = generateClient<Schema>();

interface DirectorInfo {
  // Personal Information
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  nationality: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  
  // Identification
  din: string;
  pan: string;
  aadhar: string;
  passport: string;
  
  // Address Information
  residentialAddress: string;
  state: string;
  pincode: string;
  country: string;
  
  // Contact Information
  email: string;
  mobileNumber: string;
  
  // Professional Information  
  occupation: string; // AppointedOccupation for DIR-2
  professionalMembership: string; // AppointedProfessional for DIR-2
  
  // Appointment Details
  appointmentDate: string;
  designation: string;
  category: 'PROMOTER' | 'INDEPENDENT' | 'NOMINEE' | 'OTHER';
  
  // Existing Directorships & Positions (for DIR-2)
  existingDirectorships: string; // AppointedExistingCompanies
  existingPositions: string; // AppointedExistingPositions
  
  // No additional details needed - DIR-8 has empty table for manual entry
  
  // Location Details
  city: string; // AppointedCity for DIR-8 and MBP-1
  placeOfSigning: string; // Place for signature
  
  // Declarations
  consentGiven: boolean;
  notDisqualified: boolean;
  noConflictOfInterest: boolean;
  
  // Company Information (from appointment request)
  companyName?: string;
  cin?: string;
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  
  // Company Capital Information (for DIR-8)
  companyRegistration?: string; // CompanyRegistration
  nominalCapital?: string; // CompanyNominal
  paidUpCapital?: string; // CompanyPaid
  
  // MBP-1 Interest Disclosure
  otherCompanyInterests: Array<{
    companyName: string;
    natureOfInterest: string;
    shareholding: string;
    dateOfInterest: string;
  }>;
}

interface DirectorInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (directorInfo: DirectorInfo) => void;
  serviceRequestId?: string;
  appointmentData?: any;
}

const DirectorInfoForm: React.FC<DirectorInfoFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceRequestId: _serviceRequestId,
  appointmentData
}) => {
  const { user } = useAuthenticator();
  
  const [formData, setFormData] = useState<DirectorInfo>({
    fullName: '',
    fatherName: '',
    dateOfBirth: '',
    nationality: 'Indian',
    gender: 'MALE',
    din: '',
    pan: '',
    aadhar: '',
    passport: '',
    residentialAddress: '',
    state: '',
    pincode: '',
    country: 'India',
    email: '',
    mobileNumber: '',
    occupation: '',
    professionalMembership: '',
    appointmentDate: appointmentData?.appointmentDate || '',
    designation: appointmentData?.designation || 'DIRECTOR',
    category: appointmentData?.category || 'PROMOTER',
    existingDirectorships: '',
    existingPositions: '',
    city: '',
    placeOfSigning: '',
    consentGiven: false,
    notDisqualified: false,
    noConflictOfInterest: false,
    companyName: appointmentData?.companyName || '',
    cin: appointmentData?.cinNumber || '',
    entityId: appointmentData?.entityId,
    entityType: appointmentData?.entityType || 'COMPANY',
    companyRegistration: appointmentData?.cin || '',
    nominalCapital: '',
    paidUpCapital: '',
    otherCompanyInterests: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form with existing user profile data
  useEffect(() => {
    if (isOpen && user?.username) {
      fetchUserProfileData();
    }
  }, [isOpen, user?.username]);

  const fetchUserProfileData = async () => {
    try {
      const userProfile = await client.models.UserProfile.list({
        filter: {
          or: [
            { userId: { eq: user?.username } },
            { email: { eq: user?.signInDetails?.loginId } }
          ]
        }
      });

      if (userProfile.data.length > 0) {
        const profile = userProfile.data[0];
        setFormData(prev => ({
          ...prev,
          din: profile.din || prev.din,
          email: profile.email || prev.email,
          fullName: profile.displayName || prev.fullName,
          pan: profile.pan || prev.pan
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleInputChange = (field: keyof DirectorInfo, value: string | boolean | Array<any>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof DirectorInfo)[] = [
      'fullName', 'fatherName', 'dateOfBirth', 'din', 'pan', 'email', 
      'mobileNumber', 'residentialAddress', 'state', 'pincode',
      'appointmentDate', 'designation', 'occupation'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }

    if (!formData.consentGiven) {
      setError('Please provide consent for appointment');
      return false;
    }

    if (!formData.notDisqualified) {
      setError('Please confirm you are not disqualified from being a director');
      return false;
    }

    if (!formData.noConflictOfInterest) {
      setError('Please confirm there is no conflict of interest');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting director info:', error);
      setError('Failed to submit director information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="director-info-modal-overlay" onClick={handleClose}>
      <div className="director-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="director-info-header">
          <h2>Director Information Form</h2>
          <p>Please provide the following information for director appointment forms (DIR-2, DIR-8, MBP-1)</p>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="director-info-content">
          {error && <div className="error-message">{error}</div>}

          {formData.companyName && (
            <div className="context-info">
              <p><strong>Appointment for:</strong> {formData.companyName} ({formData.cin})</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Father's Name *</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="form-section">
              <h3>Identification</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>DIN *</label>
                  <input
                    type="text"
                    value={formData.din}
                    onChange={(e) => handleInputChange('din', e.target.value)}
                    pattern="[0-9]{8}"
                    maxLength={8}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>PAN *</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Aadhar Number</label>
                  <input
                    type="text"
                    value={formData.aadhar}
                    onChange={(e) => handleInputChange('aadhar', e.target.value)}
                    pattern="[0-9]{12}"
                    maxLength={12}
                  />
                </div>
                <div className="form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    value={formData.passport}
                    onChange={(e) => handleInputChange('passport', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h3>Address Information</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Residential Address *</label>
                  <textarea
                    value={formData.residentialAddress}
                    onChange={(e) => handleInputChange('residentialAddress', e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="form-section">
              <h3>Professional Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Occupation *</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    placeholder="e.g., Business, Service, Professional"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Professional Membership Details</label>
                  <input
                    type="text"
                    value={formData.professionalMembership}
                    onChange={(e) => handleInputChange('professionalMembership', e.target.value)}
                    placeholder="Membership No. and Certificate of Practice No. (if applicable)"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="form-section">
              <h3>Appointment Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Designation *</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="PROMOTER">Promoter</option>
                    <option value="INDEPENDENT">Independent</option>
                    <option value="NOMINEE">Nominee</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Existing Directorships Details */}
            <div className="form-section">
              <h3>Existing Directorships & Positions</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Companies/LLPs where I am Director/Partner</label>
                  <textarea
                    value={formData.existingDirectorships}
                    onChange={(e) => handleInputChange('existingDirectorships', e.target.value)}
                    rows={3}
                    placeholder="List all companies/LLPs where you are currently a Director/Partner"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Positions Held in Above Companies</label>
                  <textarea
                    value={formData.existingPositions}
                    onChange={(e) => handleInputChange('existingPositions', e.target.value)}
                    rows={3}
                    placeholder="Specify positions like Managing Director, CEO, Whole-time Director, Secretary, CFO, Manager, or Shareholder"
                  />
                </div>
              </div>
            </div>

            {/* Company Capital Information */}
            <div className="form-section">
              <h3>Company Capital Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nominal Capital</label>
                  <input
                    type="text"
                    value={formData.nominalCapital}
                    onChange={(e) => handleInputChange('nominalCapital', e.target.value)}
                    placeholder="e.g., Rs. 1,00,000"
                  />
                </div>
                <div className="form-group">
                  <label>Paid-Up Capital</label>
                  <input
                    type="text"
                    value={formData.paidUpCapital}
                    onChange={(e) => handleInputChange('paidUpCapital', e.target.value)}
                    placeholder="e.g., Rs. 1,00,000"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <h3>Location Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Place of Signing</label>
                  <input
                    type="text"
                    value={formData.placeOfSigning}
                    onChange={(e) => handleInputChange('placeOfSigning', e.target.value)}
                    placeholder="City/Town for signature"
                  />
                </div>
              </div>
            </div>


            {/* MBP-1 Interest Disclosure */}
            <div className="form-section">
              <h3>Interest Disclosure (MBP-1)</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Other Company Interests</label>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                    Disclose your interest or concern in other companies, including shareholding details
                  </p>
                  {formData.otherCompanyInterests.map((interest, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px', 
                      padding: '1rem', 
                      marginBottom: '1rem',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Company/Firm Name</label>
                          <input
                            type="text"
                            value={interest.companyName}
                            onChange={(e) => {
                              const newInterests = [...formData.otherCompanyInterests];
                              newInterests[index].companyName = e.target.value;
                              handleInputChange('otherCompanyInterests', newInterests);
                            }}
                            placeholder="Company/Firm name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Nature of Interest</label>
                          <input
                            type="text"
                            value={interest.natureOfInterest}
                            onChange={(e) => {
                              const newInterests = [...formData.otherCompanyInterests];
                              newInterests[index].natureOfInterest = e.target.value;
                              handleInputChange('otherCompanyInterests', newInterests);
                            }}
                            placeholder="Director, Shareholder, etc."
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Shareholding</label>
                          <input
                            type="text"
                            value={interest.shareholding}
                            onChange={(e) => {
                              const newInterests = [...formData.otherCompanyInterests];
                              newInterests[index].shareholding = e.target.value;
                              handleInputChange('otherCompanyInterests', newInterests);
                            }}
                            placeholder="% or number of shares"
                          />
                        </div>
                        <div className="form-group">
                          <label>Date of Interest</label>
                          <input
                            type="date"
                            value={interest.dateOfInterest}
                            onChange={(e) => {
                              const newInterests = [...formData.otherCompanyInterests];
                              newInterests[index].dateOfInterest = e.target.value;
                              handleInputChange('otherCompanyInterests', newInterests);
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newInterests = formData.otherCompanyInterests.filter((_, i) => i !== index);
                              handleInputChange('otherCompanyInterests', newInterests);
                            }}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newInterests = [...formData.otherCompanyInterests, {
                        companyName: '',
                        natureOfInterest: '',
                        shareholding: '',
                        dateOfInterest: ''
                      }];
                      handleInputChange('otherCompanyInterests', newInterests);
                    }}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Add Company Interest
                  </button>
                </div>
              </div>
            </div>

            {/* Declarations */}
            <div className="form-section">
              <h3>Declarations</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
                    required
                  />
                  I hereby give my consent for appointment as Director of the above company *
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.notDisqualified}
                    onChange={(e) => handleInputChange('notDisqualified', e.target.checked)}
                    required
                  />
                  I declare that I am not disqualified from being appointed as Director *
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.noConflictOfInterest}
                    onChange={(e) => handleInputChange('noConflictOfInterest', e.target.checked)}
                    required
                  />
                  I declare that there is no conflict of interest in my appointment *
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Information for Form Preparation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectorInfoForm;