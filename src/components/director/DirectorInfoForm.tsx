import React, { useState, useEffect } from 'react';
import './DirectorInfoForm.css';

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
  mode: 'professional' | 'appointee'; // NEW: Determines which fields to show
  taskId?: string; // NEW: Task ID for workflow
  preselectedCompanies?: Array<{ id: string; name: string; cin: string }>; // NEW: Companies selected by professional (for appointee mode)
}

const DirectorInfoForm: React.FC<DirectorInfoFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceRequestId: _serviceRequestId,
  appointmentData,
  mode,
  taskId: _taskId,
  preselectedCompanies = []
}) => {

  // DEBUG: Log what we're receiving
  useEffect(() => {
    if (isOpen) {
      console.log('DirectorInfoForm opened with appointmentData:', appointmentData);
      console.log('ALL KEYS IN appointmentData:', Object.keys(appointmentData || {}));
      console.log('Director Name:', appointmentData?.directorName);
      console.log('Director DIN:', appointmentData?.directorDIN, appointmentData?.din);
      console.log('Director UserId:', appointmentData?.directorUserId);
      console.log('Entity ID:', appointmentData?.entityId);
    }
  }, [isOpen, appointmentData]);

  const [formData, setFormData] = useState<DirectorInfo>({
    fullName: appointmentData?.directorName || '',
    fatherName: '',
    dateOfBirth: '',
    nationality: 'Indian',
    gender: 'MALE',
    din: appointmentData?.directorDIN || appointmentData?.din || '',
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
    nominalCapital: '', // Will be fetched from entity
    paidUpCapital: '', // Will be fetched from entity
    otherCompanyInterests: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NEW: State for professional mode - companies for disclosure (just names)
  const [companyNames, setCompanyNames] = useState<string[]>(['']);

  // NEW: State for appointee mode - companies with disclosure details
  const [companyDisclosures, setCompanyDisclosures] = useState<Array<{
    id: string;
    name: string;
    cin: string;
    natureOfInterest?: string;
    shareholdingPercentage?: number;
    dateOfInterest?: string;
  }>>(preselectedCompanies.map(c => ({ ...c, natureOfInterest: '', shareholdingPercentage: undefined, dateOfInterest: '' })));

  // Update form data when appointmentData changes
  useEffect(() => {
    if (isOpen && appointmentData) {
      console.log('Updating form with appointmentData...');
      setFormData(prev => ({
        ...prev,
        fullName: appointmentData?.directorName || prev.fullName,
        din: appointmentData?.directorDIN || appointmentData?.din || prev.din,
        appointmentDate: appointmentData?.appointmentDate || prev.appointmentDate,
        designation: appointmentData?.designation || prev.designation,
        category: appointmentData?.category || prev.category,
        companyName: appointmentData?.companyName || prev.companyName,
        cin: appointmentData?.cinNumber || prev.cin,
        entityId: appointmentData?.entityId,
        entityType: appointmentData?.entityType || prev.entityType,
        companyRegistration: appointmentData?.cin || prev.companyRegistration
      }));
    }
  }, [isOpen, appointmentData]);


  // NEW: Initialize company disclosures for appointee mode
  useEffect(() => {
    if (isOpen && mode === 'appointee' && preselectedCompanies.length > 0) {
      setCompanyDisclosures(
        preselectedCompanies.map(c => ({
          ...c,
          natureOfInterest: '',
          shareholdingPercentage: undefined,
          dateOfInterest: ''
        }))
      );
    }
  }, [isOpen, mode, preselectedCompanies]);


  const handleInputChange = (field: keyof DirectorInfo, value: string | boolean | Array<any>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'professional') {
        // Professional mode: Just pass the company names
        const validCompanyNames = companyNames.filter(name => name.trim() !== '');
        const companiesForDisclosure = validCompanyNames.map((name, index) => ({
          id: `company-${Date.now()}-${index}`,
          name: name.trim()
        }));

        onSubmit({
          ...formData,
          companiesForDisclosure
        } as any);
      } else {
        // Appointee mode: Pass company disclosures
        onSubmit({
          companyDisclosures
        } as any);
      }
    } catch (error) {
      console.error('Error submitting director info:', error);
      setError('Failed to submit information. Please try again.');
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
          <h2>
            {mode === 'professional'
              ? 'Director Information Form'
              : 'Interest Disclosure Form'}
          </h2>
          <p>
            {mode === 'professional'
              ? 'Please provide the following information for director appointment forms (DIR-2, DIR-8, MBP-1)'
              : 'Please disclose your interest in the following companies'}
          </p>
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
            {/* Professional mode: Show all form sections except interest disclosure */}
            {mode === 'professional' && (
              <>
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

            {/* Professional mode: Company names for interest disclosure */}
            <div className="form-section">
              <h3>Companies for Interest Disclosure</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                Enter company/LLP names where the appointee may have an interest. The appointee will provide details later.
              </p>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Company/LLP Names *</label>
                  {companyNames.map((name, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const newNames = [...companyNames];
                          newNames[index] = e.target.value;
                          setCompanyNames(newNames);
                        }}
                        placeholder="Enter company/LLP name"
                        style={{ flex: 1 }}
                      />
                      {companyNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCompanyNames(companyNames.filter((_, i) => i !== index))}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCompanyNames([...companyNames, ''])}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                  >
                    + Add Another Company
                  </button>
                </div>
              </div>
            </div>
              </>
            )}

            {/* Appointee mode: Interest disclosure for preselected companies */}
            {mode === 'appointee' && (
              <div className="form-section">
                <h3>Interest Disclosure (MBP-1)</h3>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Please provide details about your interest in the following companies
                </p>
                {companyDisclosures.map((company, index) => (
                    <div key={company.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      backgroundColor: '#f9fafb'
                    }}>
                      <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#374151' }}>
                        {company.name} ({company.cin})
                      </h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nature of Interest *</label>
                          <input
                            type="text"
                            value={company.natureOfInterest || ''}
                            onChange={(e) => {
                              const updated = [...companyDisclosures];
                              updated[index].natureOfInterest = e.target.value;
                              setCompanyDisclosures(updated);
                            }}
                            placeholder="Director, Shareholder, Partner, etc."
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Shareholding Percentage</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={company.shareholdingPercentage || ''}
                            onChange={(e) => {
                              const updated = [...companyDisclosures];
                              updated[index].shareholdingPercentage = e.target.value ? parseFloat(e.target.value) : undefined;
                              setCompanyDisclosures(updated);
                            }}
                            placeholder="e.g., 25.5"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Date of Interest *</label>
                          <input
                            type="date"
                            value={company.dateOfInterest || ''}
                            onChange={(e) => {
                              const updated = [...companyDisclosures];
                              updated[index].dateOfInterest = e.target.value;
                              setCompanyDisclosures(updated);
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}


            <div className="form-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading
                  ? 'Submitting...'
                  : mode === 'professional'
                    ? 'Submit Information & Send to Appointee'
                    : 'Submit Interest Disclosure'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectorInfoForm;