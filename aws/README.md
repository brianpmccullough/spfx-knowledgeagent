# SPFx Knowledge Agent - AWS Lambda

This directory contains the serverless backend infrastructure for the SPFx Knowledge Agent, enabling secure HTTP API access to Microsoft Graph and SharePoint REST APIs from your SPFx applications.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  SPFx Application (SharePoint)                              │
│  - Sends HTTP requests with CORS headers                    │
│  - No direct Graph/SharePoint API calls                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS with Authorization
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  API Gateway (HTTP API)                                     │
│  - CORS handling                                            │
│  - Request routing                                          │
│  - Logging & monitoring                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Lambda Function (Node.js 20.x, TypeScript)                │
│  - Request validation                                       │
│  - Error handling                                           │
│  - Structured logging to CloudWatch                         │
│  - Service account token management                         │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
     ┌────────┐ ┌─────────┐ ┌──────────────┐
     │ Graph  │ │SharePoint│ │AWS Secrets   │
     │ API    │ │REST API  │ │Manager       │
     └────────┘ └─────────┘ │(Credentials) │
                            └──────────────┘
```

## Project Structure

```
aws/
├── lambda/                          # Lambda function source code
│   ├── src/
│   │   ├── handlers/               # HTTP request handlers
│   │   │   └── index.ts           # Main Lambda handler
│   │   ├── services/              # API service integrations
│   │   │   ├── graphService.ts    # Microsoft Graph API client
│   │   │   ├── sharePointService.ts # SharePoint REST API client
│   │   │   └── authService.ts     # Authentication & token management
│   │   ├── middleware/            # Request/response processing
│   │   │   ├── logger.ts          # Structured logging
│   │   │   ├── corsMiddleware.ts  # CORS header handling
│   │   │   └── errorHandler.ts    # Error handling
│   │   ├── types/                 # TypeScript interfaces
│   │   │   └── index.ts           # Lambda event/response types
│   │   ├── utils/                 # Utility functions
│   │   │   ├── constants.ts       # HTTP constants and endpoints
│   │   │   └── helpers.ts         # Request parsing & utilities
│   │   └── config/                # Configuration
│   │       └── index.ts           # Environment configuration
│   ├── dist/                       # Compiled JavaScript (generated)
│   ├── package.json               # Lambda dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── esbuild.config.mjs         # Build configuration
│   └── .gitignore
├── template.yaml                  # SAM CloudFormation template
├── samconfig.yaml                 # SAM configuration
├── .env.prod                      # Production environment variables
├── .env.example                   # Example environment file
├── build.ps1                      # Build script
├── deploy.ps1                     # Deploy script
├── teardown.ps1                   # Cleanup script
└── README.md                      # This file
```

## Prerequisites

### Required
- **AWS CLI**: [Install AWS CLI v2](https://aws.amazon.com/cli/)
- **AWS SAM CLI**: [Install AWS SAM](https://aws.amazon.com/serverless/sam/)
- **Node.js 20.x**: [Install Node.js](https://nodejs.org/)
- **PowerShell 7+**: [Install PowerShell](https://github.com/PowerShell/PowerShell) (Windows, macOS, Linux)
- **AWS Account**: With appropriate IAM permissions

### AWS IAM Permissions Required
The IAM user or role must have permissions for:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update/delete functions)
- API Gateway (create/update/delete APIs)
- IAM (create/update/delete roles and policies)
- CloudWatch (create/manage log groups)
- Secrets Manager (read secrets - after setup)

## Quick Start

### 1. Configure AWS Credentials

```powershell
aws configure
# Enter your AWS Access Key ID and Secret Access Key
# Default region: us-east-1
# Default output format: json
```

Or set environment variables:
```powershell
$env:AWS_ACCESS_KEY_ID = "your-access-key"
$env:AWS_SECRET_ACCESS_KEY = "your-secret-key"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

### 2. Update Environment Configuration

```powershell
# Copy the example environment file
Copy-Item .env.example .env.dev
Copy-Item .env.example .env.staging
# .env.prod already exists

# Edit your environment files and update:
# - SPFX_ORIGIN: Your SharePoint tenant URL
# - LAMBDA_MEMORY_SIZE: Memory allocation (256-3008 MB)
# - LAMBDA_TIMEOUT: Function timeout (10-900 seconds)
```

### 3. Build the Lambda

```powershell
# Build for production
./build.ps1 -Environment prod

# Build for development with clean artifacts
./build.ps1 -Environment dev -Clean

# Build with verbose output
./build.ps1 -Environment staging -Verbose
```

The build process:
- Validates TypeScript code
- Installs npm dependencies
- Compiles TypeScript to JavaScript using esbuild
- Bundles all dependencies into `dist/handlers/index.js`
- Generates source maps for debugging

### 4. Deploy to AWS

```powershell
# Deploy to production (builds automatically)
./deploy.ps1 -Environment prod

# Deploy to dev without rebuilding (if already built)
./deploy.ps1 -Environment dev -Build:$false

# Deploy with guided setup (first time only)
./deploy.ps1 -Environment prod -Guided
```

Deployment creates:
- Lambda function with proper IAM role
- API Gateway HTTP API
- CloudWatch log groups
- CORS-enabled endpoints

After deployment, you'll see output like:
```
ApiEndpoint: https://abc123def456.execute-api.us-east-1.amazonaws.com/prod
HealthCheckUrl: https://abc123def456.execute-api.us-east-1.amazonaws.com/prod/health
```

Save the `ApiEndpoint` URL for SPFx configuration.

### 5. Test the Deployment

```powershell
# Test the health endpoint (if AWS CLI is available)
$endpoint = "https://abc123def456.execute-api.us-east-1.amazonaws.com/prod"
Invoke-RestMethod -Uri "$endpoint/health" -Method Get

# Or test using curl
curl -X GET "https://abc123def456.execute-api.us-east-1.amazonaws.com/prod/health"
```

### 6. Cleanup (Teardown)

```powershell
# Delete all AWS resources for an environment
./teardown.ps1 -Environment prod

# Force delete without confirmation
./teardown.ps1 -Environment prod -Force

# Teardown will:
# - Delete CloudFormation stack
# - Remove Lambda function
# - Delete API Gateway
# - Clean CloudWatch logs
# - Remove IAM roles
```

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{ "status": "healthy", "timestamp": "2025-12-09T..." }`

### Graph API (Placeholder)
```
GET /graph/*
POST /graph/*
PUT /graph/*
DELETE /graph/*
```
Requires: Implementation after App Registration setup

### SharePoint REST API (Placeholder)
```
GET /sharepoint/*
POST /sharepoint/*
PUT /sharepoint/*
DELETE /sharepoint/*
```
Requires: Implementation after App Registration setup

### CORS Preflight
```
OPTIONS /graph/*
OPTIONS /sharepoint/*
```
Handled automatically - returns 200 OK with CORS headers

## Configuration

### Environment Variables

Edit `.env.prod` (or `.env.dev`, `.env.staging`):

| Variable | Description | Default |
|----------|-------------|---------|
| `SPFX_ORIGIN` | SPFx origin for CORS | `https://*.sharepoint.com` |
| `LAMBDA_MEMORY_SIZE` | Memory in MB | 512 |
| `LAMBDA_TIMEOUT` | Timeout in seconds | 30 |
| `ENVIRONMENT` | Environment name | prod |
| `AWS_REGION` | AWS region | us-east-1 |
| `AWS_ACCOUNT_ID` | AWS account ID | 713181485547 |
| `ENABLE_DETAILED_LOGGING` | Enable debug logging | false |

### Lambda Configuration (template.yaml)

Customize in `template.yaml`:
- **Handler path**: Line ~100, `Handler: dist/handlers/index.handler`
- **Runtime**: Line ~81, `Runtime: nodejs20.x`
- **Logging**: Line ~130, `RetentionInDays: 30`
- **CORS**: Line ~60, `AllowOrigins`, `AllowMethods`, etc.

## Implementation Guide

### Adding Graph API Endpoints

1. Implement in `src/services/graphService.ts`:
```typescript
static async getCalendarEvents(context: LogContext): Promise<any> {
  return this.makeGraphRequest('GET', '/me/calendarview', context);
}
```

2. Add handler in `src/handlers/index.ts`:
```typescript
if (path === '/graph/calendar') {
  return withErrorHandler(
    async () => await GraphService.getCalendarEvents(context),
    context
  );
}
```

3. Test with your Lambda endpoint

### Adding SharePoint Endpoints

1. Implement in `src/services/sharePointService.ts`:
```typescript
static async getListItems(
  siteUrl: string,
  listId: string,
  context: LogContext,
  token?: string
): Promise<any> {
  return this.makeSharePointRequest(
    siteUrl,
    'GET',
    `/web/lists('${listId}')/items`,
    context,
    token
  );
}
```

2. Add handler and route in `src/handlers/index.ts`

## Monitoring & Troubleshooting

### View Lambda Logs

```powershell
# Stream logs in real-time
aws logs tail /aws/lambda/prod-spfx-knowledge-agent --follow

# View specific time range
aws logs filter-log-events `
  --log-group-name /aws/lambda/prod-spfx-knowledge-agent `
  --start-time ([datetime]::Now.AddHours(-1)).ToUnixTimeMilliseconds()
```

### Common Issues

#### 1. **Build Fails: "esbuild not found"**
```powershell
cd aws/lambda
npm install
cd ../..
```

#### 2. **Deploy Fails: "Invalid credentials"**
```powershell
aws configure  # Re-authenticate
# Or check AWS_PROFILE environment variable
```

#### 3. **API Gateway Returns 502**
- Check Lambda logs in CloudWatch
- Verify handler path in `template.yaml`
- Ensure Lambda has proper IAM permissions

#### 4. **CORS Errors in SPFx**
- Update `SPFX_ORIGIN` in `.env.prod` with your actual tenant URL
- Redeploy: `./deploy.ps1 -Environment prod`
- Clear browser cache

## Next Steps

### Setup App Registration
When ready to implement Graph/SharePoint API calls:

1. Create Entra ID App Registration
2. Configure application permissions
3. Store credentials in AWS Secrets Manager
4. Update `src/services/authService.ts`
5. Implement API endpoints

### Setup SPFx Integration
To call the Lambda from SPFx:

1. Install axios: `npm install axios`
2. Create service: `src/services/apiService.ts`
3. Call the Lambda endpoint:
```typescript
import axios from 'axios';

const response = await axios.get(
  'https://your-api-endpoint/health'
);
```

### Add Local Testing
For local development with SAM:

```powershell
# Install SAM (if not already installed)
sam --version

# Build and test locally
cd aws
sam build
sam local start-api

# Test locally
curl http://localhost:3000/health
```

## Cost Optimization

### Lambda
- **Free tier**: 1 million requests/month, 400,000 GB-seconds/month
- **Pricing**: $0.20 per 1M requests + $0.0000166667 per GB-second
- **Tips**: 
  - Use 512 MB (default) for most scenarios
  - Use 256 MB for simple operations
  - Monitor duration with CloudWatch

### API Gateway
- **HTTP APIs**: $0.35 per million requests
- **99.95% SLA**: Included
- **Tips**: Use HTTP API (not REST API) - 70% cheaper

### CloudWatch
- **Log storage**: $0.50 per GB/month
- **Log retention**: Set to 30 days (default) to control costs
- **Tips**: Disable `ENABLE_DETAILED_LOGGING` in production

## Security Best Practices

1. **Credentials**: Store in AWS Secrets Manager, never in code
2. **CORS**: Restrict `SPFX_ORIGIN` to your tenant URL in production
3. **IAM**: Use least-privilege roles for Lambda
4. **Logging**: Enable CloudTrail for API calls
5. **Secrets Manager**: Enable automatic rotation for credentials
6. **Network**: Use VPC endpoints if calling private APIs

## Troubleshooting Commands

```powershell
# Check stack status
aws cloudformation describe-stacks --stack-name spfx-knowledge-agent-prod --region us-east-1

# Get Lambda function info
aws lambda get-function --function-name prod-spfx-knowledge-agent

# Invoke Lambda directly
aws lambda invoke `
  --function-name prod-spfx-knowledge-agent `
  --payload '{}' `
  --region us-east-1 `
  response.json

# Monitor CloudWatch logs
aws logs tail /aws/lambda/prod-spfx-knowledge-agent --follow --region us-east-1
```

## Support & Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api/overview)
- [SharePoint REST API](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/rest-api-overview)

## License

MIT
