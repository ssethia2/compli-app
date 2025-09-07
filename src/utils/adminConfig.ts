// Admin configuration utility
// For production, you can fetch from AWS Systems Manager Parameter Store

export const getAdminCodes = async (): Promise<Record<string, any>> => {
  // Option 1: Environment variables (current)
  if (import.meta.env.VITE_ADMIN_CODE_1) {
    return {
      [import.meta.env.VITE_ADMIN_CODE_1]: {
        email: 'admin@complianceportal.com',
        displayName: 'System Administrator',
        userId: 'admin_system',
        role: 'ADMIN' as const
      },
      [import.meta.env.VITE_ADMIN_CODE_2 || 'BACKUP_CODE']: {
        email: 'assets@complianceportal.com', 
        displayName: 'Asset Manager',
        userId: 'admin_assets',
        role: 'ADMIN' as const
      }
    };
  }

  // Option 2: AWS Systems Manager Parameter Store (for production)
  // Uncomment and configure when needed
  /*
  try {
    const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm');
    const client = new SSMClient({ region: 'us-east-1' });
    
    const adminCode1 = await client.send(new GetParameterCommand({
      Name: '/compliance-portal/admin/code1',
      WithDecryption: true
    }));
    
    const adminCode2 = await client.send(new GetParameterCommand({
      Name: '/compliance-portal/admin/code2', 
      WithDecryption: true
    }));

    return {
      [adminCode1.Parameter?.Value || 'DEFAULT1']: {
        email: 'admin@complianceportal.com',
        displayName: 'System Administrator',
        userId: 'admin_system',
        role: 'ADMIN' as const
      },
      [adminCode2.Parameter?.Value || 'DEFAULT2']: {
        email: 'assets@complianceportal.com',
        displayName: 'Asset Manager', 
        userId: 'admin_assets',
        role: 'ADMIN' as const
      }
    };
  } catch (error) {
    console.error('Failed to fetch admin codes from SSM:', error);
    // Fallback to defaults
  }
  */

  // Fallback defaults (not recommended for production)
  return {
    'COMPLIANCE_ADMIN_2025': {
      email: 'admin@complianceportal.com',
      displayName: 'System Administrator',
      userId: 'admin_system', 
      role: 'ADMIN' as const
    },
    'ASSET_MANAGER_2025': {
      email: 'assets@complianceportal.com',
      displayName: 'Asset Manager',
      userId: 'admin_assets',
      role: 'ADMIN' as const
    }
  };
};