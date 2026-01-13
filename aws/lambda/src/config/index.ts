/**
 * Lambda configuration from environment variables
 */
export const config = {
  environment: process.env.ENVIRONMENT || "prod",
  spfxOrigin: process.env.SPFX_ORIGIN || "*",
  awsRegion: process.env.AWS_REGION || "us-east-1",

  // Azure/Microsoft 365 (to be configured after App Registration setup)
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  // Azure client secret would be retrieved from AWS Secrets Manager
  // (see services/authService.ts for implementation)

  // Lambda settings
  functionTimeout: parseInt(process.env.FUNCTION_TIMEOUT || "30"),

  // Feature flags
  enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === "true",
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const requiredKeys = ["environment"];
  const missingKeys = requiredKeys.filter((key) => !config[key as keyof typeof config]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }
}
