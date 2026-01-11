import React, { useState } from 'react';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { createGeneratedForm } from '../../api/lambda';

interface FormGeneratorProps {
  directorInfoDocument?: {
    fileName: string;
    fileKey: string;
    documentType: string;
  };
  directorDIN: string;
  directorName: string;
  entityName: string;
  entityId: string;
  requiredForms: string[];
  professionalUserId: string;
  onFormsGenerated: () => void;
}

const FormGenerator: React.FC<FormGeneratorProps> = ({
  directorInfoDocument,
  directorDIN,
  directorName,
  entityName,
  entityId,
  requiredForms,
  professionalUserId,
  onFormsGenerated
}) => {
  const [generating, setGenerating] = useState(false);
  const [directorInfo, setDirectorInfo] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadDirectorInfo = async () => {
    if (!directorInfoDocument || !directorInfoDocument.fileKey) {
      alert('Director information document not found');
      return;
    }

    try {
      // Fetch the actual JSON content from S3 using the fileKey directly
      const signedUrl = await getUrl({
        key: directorInfoDocument.fileKey,
        options: {
          expiresIn: 3600, // 1 hour
          validateObjectExistence: false
        }
      });

      // Fetch the JSON content
      const response = await fetch(signedUrl.url.toString());
      const directorInfo = await response.json();

      console.log('Loaded director info from S3:', directorInfo);
      setDirectorInfo(directorInfo);
      setShowPreview(true);
    } catch (error) {
      console.error('Could not load director info from S3:', error);
      alert('Failed to load director information. Please try again.');
    }
  };

  const generateForms = async () => {
    if (!directorInfo) {
      await loadDirectorInfo();
      return;
    }

    setGenerating(true);
    
    try {
      // Generate each required form
      for (const formType of requiredForms) {
        let formContent = '';
        
        switch (formType) {
          case 'DIR-2':
            formContent = generateDIR2Form(directorInfo);
            break;
          case 'DIR-8':
            formContent = generateDIR8Form(directorInfo);
            break;
          case 'MBP-1':
            formContent = generateMBP1Form(directorInfo);
            break;
        }

        // Upload the generated form to S3 and save as a document
        if (formContent) {
          const timestamp = Date.now();
          const fileName = `${formType}_${directorDIN}_${timestamp}.txt`;
          const fileKey = `entities/${entityId}/generated-forms/${fileName}`;
          
          // Upload the form content to S3
          await uploadData({
            key: fileKey,
            data: new Blob([formContent], { type: 'text/plain' }),
          }).result;

          // Create the document record via backend API
          await createGeneratedForm({
            fileName: fileName,
            documentName: `${formType} Form - ${directorName}`,
            fileKey: fileKey,
            fileSize: formContent.length,
            professionalUserId: professionalUserId,
            entityId: entityId,
            entityType: 'COMPANY' // TODO: Get from task metadata
          });
        }
      }

      alert(`Successfully generated ${requiredForms.join(', ')} forms for ${directorName}`);
      onFormsGenerated();
      
    } catch (error) {
      console.error('Error generating forms:', error);
      alert('Failed to generate forms. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateDIR2Form = (info: any): string => {
    return `FORM DIR-2
Consent to act as a Director of the Company

${info.fullName}
${info.residentialAddress}
Email id: ${info.email}

To,
${entityName}
Company Address

SUBJECT: CONSENT TO ACT AS A DIRECTOR OF THE COMPANY

I, ${info.fullName}, hereby give my consent to act as the Director of ${entityName} pursuant to Section 152(5) of the Companies Act 2013.

1. DIN: ${info.din}
2. Name: ${info.fullName}
3. Father's Name: ${info.fatherName}
4. Address: ${info.residentialAddress}
5. Email ID: ${info.email}
6. Mobile No.: ${info.mobileNumber}
7. Income Tax PAN: ${info.pan}
8. Occupation: ${info.occupation}
9. Date of Birth: ${info.dateOfBirth}
10. Nationality: ${info.nationality}
11. Existing Companies/Positions: ${info.existingDirectorships}, ${info.existingPositions}
12. Professional Membership: ${info.professionalMembership}

Declaration
I declare that I have not been convicted of any offence and am not disqualified from being a director.

Date: ${new Date().toLocaleDateString()}                    ${info.fullName}
Place: ${info.placeOfSigning}                              DIN: ${info.din}
`;
  };

  const generateDIR8Form = (info: any): string => {
    return `FORM DIR-8
Intimation by Director

Name of the Director: ${info.fullName}
Address: ${info.residentialAddress}

Registration No. of Company: ${info.companyRegistration || 'TBD'}
Nominal Capital: Rs. ${info.nominalCapital}
Paid – Up Capital: Rs. ${info.paidUpCapital}
Name of Company: ${entityName}
Address of Registered Office: Company Address

To,
The Board of Directors 

I, ${info.fullName}, son of ${info.fatherName}, resident of ${info.city}, director in the company hereby give notice that I am/was director in the following other companies during the last three years:

[Previous directorships table - to be filled manually]

I confirm that I have not incurred disqualification under section 164(2) of the Companies Act, 2013.

                                                            (Name: ${info.fullName})
Date: ${new Date().toLocaleDateString()}
Place: ${info.placeOfSigning}                              DIN: ${info.din}
`;
  };

  const generateMBP1Form = (info: any): string => {
    return `FORM MBP – 1
Notice of interest by director

Name: ${info.fullName}
Address: ${info.residentialAddress}

To 
The Board of Directors 
${entityName}
Company Address

Dear Sir(s),

I, ${info.fullName}, son of ${info.fatherName}, resident of ${info.city}, being a director in the company hereby give notice of my interest or concern in the following companies:

${info.otherCompanyInterests.map((interest: any, index: number) => 
  `${index + 1}. ${interest.companyName} - ${interest.natureOfInterest} - ${interest.shareholding} - ${interest.dateOfInterest}`
).join('\n') || '[No other interests declared]'}

                                                            (Name: ${info.fullName})
Date: ${new Date().toLocaleDateString()}
Place: ${info.placeOfSigning}                              DIN: ${info.din}
`;
  };

  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      backgroundColor: '#f9fafb',
      marginBottom: '2rem'
    }}>
      <h3>Form Generator</h3>
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Director:</strong> {directorName} (DIN: {directorDIN})</p>
        <p><strong>Entity:</strong> {entityName}</p>
        <p><strong>Required Forms:</strong> {requiredForms.join(', ')}</p>
      </div>

      {!showPreview ? (
        <button
          onClick={loadDirectorInfo}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          📄 Load Director Information
        </button>
      ) : (
        <div>
          <div style={{ 
            background: 'white', 
            border: '1px solid #d1d5db', 
            borderRadius: '4px', 
            padding: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <h4>Director Information Preview:</h4>
            <p><strong>Name:</strong> {directorInfo?.fullName}</p>
            <p><strong>DIN:</strong> {directorInfo?.din}</p>
            <p><strong>Email:</strong> {directorInfo?.email}</p>
            <p><strong>Mobile:</strong> {directorInfo?.mobileNumber}</p>
            <p><strong>Address:</strong> {directorInfo?.residentialAddress}</p>
            <p><strong>Occupation:</strong> {directorInfo?.occupation}</p>
          </div>
          
          <button
            onClick={generateForms}
            disabled={generating}
            style={{
              background: generating ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              cursor: generating ? 'not-allowed' : 'pointer',
              marginRight: '1rem'
            }}
          >
            {generating ? '🔄 Generating...' : '🎯 Generate All Forms'}
          </button>
          
          <button
            onClick={() => setShowPreview(false)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default FormGenerator;