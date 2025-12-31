import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { getDocuments as getDocumentsFromLambda } from './lambda';

const client = generateClient<Schema>();

export interface DocumentFilter {
  userId?: string;
  role?: 'DIRECTORS' | 'PROFESSIONALS';
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  serviceRequestId?: string;
}

export interface DocumentUploadParams {
  file: File;
  documentName?: string;
  documentType: 'IDENTITY' | 'ADDRESS_PROOF' | 'BOARD_RESOLUTION' | 'FINANCIAL_STATEMENT' | 'COMPLIANCE_CERTIFICATE' | 'OTHER';
  uploadedBy: string;
  entityId?: string;
  entityType?: 'COMPANY' | 'LLP';
  serviceRequestId?: string;
}

/**
 * Generate S3 key for file upload
 */
const generateS3Key = (fileName: string, uploadedBy: string, serviceRequestId?: string, entityId?: string): string => {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (serviceRequestId) {
    return `service-requests/${serviceRequestId}/${timestamp}_${sanitizedName}`;
  } else if (entityId) {
    return `entities/${entityId}/${timestamp}_${sanitizedName}`;
  } else {
    return `public/users/${uploadedBy}/${timestamp}_${sanitizedName}`;
  }
};

/**
 * Get documents based on role and filters
 * SECURITY: All filtering logic now in backend Lambda
 */
export const getDocuments = async (filter: DocumentFilter) => {
  // Validate required fields
  if (!filter.userId || !filter.role) {
    throw new Error('userId and role are required');
  }

  // Call Lambda backend which enforces security
  const result = await getDocumentsFromLambda({
    userId: filter.userId,
    role: filter.role,
    serviceRequestId: filter.serviceRequestId,
    entityId: filter.entityId,
    entityType: filter.entityType
  });

  if (!result.success) {
    throw new Error(result.message || 'Failed to get documents');
  }

  return { data: result.data, errors: [] };
};

/**
 * Upload a document to S3 and create database record
 */
export const uploadDocument = async (params: DocumentUploadParams) => {
  const fileKey = generateS3Key(
    params.file.name,
    params.uploadedBy,
    params.serviceRequestId,
    params.entityId
  );

  // Upload to S3
  await uploadData({
    key: fileKey,
    data: params.file,
  }).result;

  // Create document record in database
  const documentData = {
    fileName: params.file.name,
    documentName: params.documentName || params.file.name,
    fileKey: fileKey,
    fileSize: params.file.size,
    mimeType: params.file.type,
    uploadedBy: params.uploadedBy,
    uploadedAt: new Date().toISOString(),
    documentType: params.documentType,
    entityId: params.entityId,
    entityType: params.entityType,
    serviceRequestId: params.serviceRequestId,
    isPublic: false
  };

  return await client.models.Document.create(documentData);
};

/**
 * Get signed URL for document download
 */
export const getDocumentUrl = async (fileKey: string) => {
  return await getUrl({
    key: fileKey,
    options: {
      expiresIn: 3600, // 1 hour
      validateObjectExistence: false
    }
  });
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string) => {
  return await client.models.Document.delete({ id: documentId });
};

/**
 * Get user profiles for document uploaders
 */
export const getDocumentUploaderProfiles = async (uploaderIds: string[]) => {
  const uniqueIds = [...new Set(uploaderIds)];
  const profileMap = new Map();

  const profilePromises = uniqueIds.map(async (uploadedBy) => {
    try {
      const profiles = await client.models.UserProfile.list({
        filter: { userId: { eq: uploadedBy } }
      });
      const profile = profiles.data.length > 0 ? profiles.data[0] : null;
      return { userId: uploadedBy, profile };
    } catch (error) {
      console.error(`Error fetching profile for ${uploadedBy}:`, error);
      return { userId: uploadedBy, profile: null };
    }
  });

  const profileResults = await Promise.all(profilePromises);
  profileResults.forEach(({ userId, profile }) => {
    profileMap.set(userId, profile);
  });

  return profileMap;
};
