import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateUserProfileParams {
  userId: string;
  email: string;
  role: 'DIRECTORS' | 'PROFESSIONALS' | 'ADMIN';
  displayName?: string;
  din?: string;
  dinStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  dscStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NOT_AVAILABLE';
  pan?: string;
  panDocumentUrl?: string;
  eSignImageUrl?: string;
}

export interface UpdateUserProfileParams {
  id: string;
  displayName?: string;
  din?: string;
  dinStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  dscStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NOT_AVAILABLE';
  pan?: string;
  panDocumentUrl?: string;
  eSignImageUrl?: string;
}

/**
 * Get user profile by userId (Cognito username)
 */
export const getUserProfileByUserId = async (userId: string) => {
  const result = await client.models.UserProfile.list({
    filter: { userId: { eq: userId } }
  });

  return result.data.length > 0 ? result.data[0] : null;
};

/**
 * Get user profile by email
 */
export const getUserProfileByEmail = async (email: string) => {
  const result = await client.models.UserProfile.list({
    filter: { email: { eq: email } }
  });

  return result.data.length > 0 ? result.data[0] : null;
};

/**
 * Get user profile by DIN
 */
export const getUserProfileByDIN = async (din: string) => {
  const result = await client.models.UserProfile.list({
    filter: { din: { eq: din } }
  });

  return result.data.length > 0 ? result.data[0] : null;
};

/**
 * Get user profile by database ID
 */
export const getUserProfileById = async (id: string) => {
  const result = await client.models.UserProfile.get({ id });
  return result.data;
};

/**
 * Create a new user profile
 */
export const createUserProfile = async (params: CreateUserProfileParams) => {
  return await client.models.UserProfile.create(params);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (params: UpdateUserProfileParams) => {
  return await client.models.UserProfile.update(params);
};

/**
 * Update user e-signature
 */
export const updateUserSignature = async (userId: string, eSignImageUrl: string) => {
  const profile = await getUserProfileByUserId(userId);

  if (!profile) {
    throw new Error('User profile not found');
  }

  return await client.models.UserProfile.update({
    id: profile.id,
    eSignImageUrl
  });
};

/**
 * Update user PAN document
 */
export const updateUserPAN = async (userId: string, pan: string, panDocumentUrl: string) => {
  const profile = await getUserProfileByUserId(userId);

  if (!profile) {
    throw new Error('User profile not found');
  }

  return await client.models.UserProfile.update({
    id: profile.id,
    pan,
    panDocumentUrl
  });
};

/**
 * Get all profiles by role
 */
export const getUserProfilesByRole = async (role: 'DIRECTORS' | 'PROFESSIONALS' | 'ADMIN') => {
  const result = await client.models.UserProfile.list({
    filter: { role: { eq: role } }
  });

  return result.data;
};

/**
 * Get all directors
 */
export const getAllDirectors = async () => {
  return getUserProfilesByRole('DIRECTORS');
};

/**
 * Get all professionals
 */
export const getAllProfessionals = async () => {
  return getUserProfilesByRole('PROFESSIONALS');
};

/**
 * Check if profile exists by userId or email
 */
export const checkProfileExists = async (userId: string, email: string) => {
  const byUserId = await getUserProfileByUserId(userId);
  const byEmail = await getUserProfileByEmail(email);

  return {
    existsByUserId: !!byUserId,
    existsByEmail: !!byEmail,
    profileByUserId: byUserId,
    profileByEmail: byEmail
  };
};

/**
 * Merge email-based profile with Cognito userId
 * Used when a director signs up after being added by a professional
 */
export const mergeProfileWithCognitoUser = async (email: string, cognitoUserId: string) => {
  const emailProfile = await getUserProfileByEmail(email);

  if (!emailProfile) {
    throw new Error('Profile with email not found');
  }

  // Update profile with Cognito userId
  await client.models.UserProfile.update({
    id: emailProfile.id,
    userId: cognitoUserId
  });

  // Update all DirectorAssociations to use Cognito userId
  const associations = await client.models.DirectorAssociation.list({
    filter: { userId: { eq: emailProfile.userId } }
  });

  for (const assoc of associations.data) {
    await client.models.DirectorAssociation.update({
      id: assoc.id,
      userId: cognitoUserId
    });
  }

  return true;
};
