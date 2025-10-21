/**
 * Environment configuration
 */

interface EnvironmentConfig {
  environment: string;
  agentCoreUrl: string;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
  cognitoRegion: string;
}

const env: EnvironmentConfig = {
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  agentCoreUrl: import.meta.env.VITE_AGENT_CORE_URL || '',
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  cognitoUserPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
  cognitoRegion: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
};

// Validate required environment variables
export function validateEnvironment(): void {
  const required = [
    'agentCoreUrl',
    'cognitoUserPoolId',
    'cognitoUserPoolClientId',
  ];

  const missing = required.filter((key) => !env[key as keyof EnvironmentConfig]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export default env;
