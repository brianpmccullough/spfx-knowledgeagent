# Configuration Reference

This document describes all configuration options for the SPFx Knowledge Agent.

## Customizer Properties

These properties are passed to the Application Customizer and control its behavior.

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiUrl` | string | Yes | - | Full URL to the Knowledge Agent chat API endpoint |
| `aadClientId` | string | Yes | - | Azure AD Application (client) ID of the backend API |
| `message` | string | No | "SPFx Knowledge Agent" | Display message (currently unused in UI) |

### Example Configuration

```json
{
  "apiUrl": "https://api.example.com/api/chat",
  "aadClientId": "d93c7720-43a9-4924-99c5-68464eb75b20",
  "message": "SPFx Knowledge Agent"
}
```

## Configuration Methods

### Method 1: Local Development (serve.json)

For local development with `gulp serve`, configure properties in `config/serve.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/spfx-build/spfx-serve.schema.json",
  "port": 4321,
  "https": true,
  "serveConfigurations": {
    "default": {
      "pageUrl": "https://contoso.sharepoint.com/sites/dev",
      "customActions": {
        "6d48a638-7f31-45f6-bb8a-b0a51b631784": {
          "location": "ClientSideExtension.ApplicationCustomizer",
          "properties": {
            "message": "SPFx Knowledge Agent",
            "aadClientId": "d93c7720-43a9-4924-99c5-68464eb75b20",
            "apiUrl": "http://localhost:3000/api/chat"
          }
        }
      }
    },
    "production": {
      "pageUrl": "https://contoso.sharepoint.com/sites/hr",
      "customActions": {
        "6d48a638-7f31-45f6-bb8a-b0a51b631784": {
          "location": "ClientSideExtension.ApplicationCustomizer",
          "properties": {
            "message": "SPFx Knowledge Agent",
            "aadClientId": "d93c7720-43a9-4924-99c5-68464eb75b20",
            "apiUrl": "https://api.example.com/api/chat"
          }
        }
      }
    }
  }
}
```

Run with a specific configuration:
```bash
gulp serve --config=production
```

### Method 2: PowerShell Deployment Script

Use the management script to set properties during installation:

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://api.example.com/api/chat" `
    -AadClientId "d93c7720-43a9-4924-99c5-68464eb75b20" `
    -Message "HR Knowledge Agent"
```

### Method 3: Direct Custom Action (PnP PowerShell)

For advanced scenarios, create the custom action directly:

```powershell
Connect-PnPOnline -Url "https://contoso.sharepoint.com/sites/hr" -Interactive

$properties = @{
    apiUrl = "https://api.example.com/api/chat"
    aadClientId = "d93c7720-43a9-4924-99c5-68464eb75b20"
    message = "SPFx Knowledge Agent"
} | ConvertTo-Json -Compress

Add-PnPCustomAction -Name "FooterApplicationCustomizer" `
    -Title "FooterApplicationCustomizer" `
    -Location "ClientSideExtension.ApplicationCustomizer" `
    -ClientSideComponentId "6d48a638-7f31-45f6-bb8a-b0a51b631784" `
    -ClientSideComponentProperties $properties `
    -Scope Site
```

## API Request Context

The chat panel sends additional context with each API request. This context is automatically populated and cannot be configured.

```json
{
  "messages": [...],
  "context": {
    "siteUrl": "https://contoso.sharepoint.com/sites/hr",
    "searchMode": "rag"
  }
}
```

| Context Property | Description |
|------------------|-------------|
| `siteUrl` | Absolute URL of the current SharePoint site (auto-detected) |
| `searchMode` | Current search mode: `"rag"` or `"kql"` (user-toggled) |

## User-Controllable Settings

These settings are controlled by users at runtime via the chat panel UI:

| Setting | UI Control | Values | Default |
|---------|------------|--------|---------|
| Search Mode | Toggle in header | RAG / KQL | RAG |

## Package Configuration

### package-solution.json

Key settings in `config/package-solution.json`:

```json
{
  "solution": {
    "name": "spfx-knowledgeagent-client-side-solution",
    "id": "77cb6cc5-1201-456d-b8f3-5e203bc311ef",
    "version": "1.0.0.0",
    "skipFeatureDeployment": true,
    "webApiPermissionRequests": [
      {
        "resource": "d93c7720-43a9-4924-99c5-68464eb75b20",
        "scope": "user_impersonation"
      }
    ]
  }
}
```

| Setting | Description |
|---------|-------------|
| `skipFeatureDeployment` | `true` enables tenant-scoped deployment |
| `webApiPermissionRequests` | Declares API permissions needed by the solution |

**Important**: Update the `resource` GUID in `webApiPermissionRequests` to match your backend API's Application (client) ID before building the package.

## Component IDs

These IDs are used internally and in deployment scripts:

| Component | ID |
|-----------|-----|
| Application Customizer | `6d48a638-7f31-45f6-bb8a-b0a51b631784` |
| Solution | `77cb6cc5-1201-456d-b8f3-5e203bc311ef` |
| Feature | `e54419eb-580f-4da3-86d9-8e40b316d62b` |

## Environment Variables

The solution does not use environment variables. All configuration is passed through customizer properties.

## Multi-Environment Setup

### Recommended Approach

Use different `apiUrl` values per environment while keeping the same `aadClientId` if your backend API supports multiple environments under the same app registration:

| Environment | apiUrl | aadClientId |
|-------------|--------|-------------|
| Development | `http://localhost:3000/api/chat` | `d93c7720-...` |
| Staging | `https://staging-api.example.com/api/chat` | `d93c7720-...` |
| Production | `https://api.example.com/api/chat` | `d93c7720-...` |

### Separate App Registrations

If you use different app registrations per environment:

| Environment | apiUrl | aadClientId |
|-------------|--------|-------------|
| Development | `http://localhost:3000/api/chat` | `dev-client-id` |
| Staging | `https://staging-api.example.com/api/chat` | `staging-client-id` |
| Production | `https://api.example.com/api/chat` | `prod-client-id` |

**Note**: Each unique `aadClientId` requires a separate API permission grant in SharePoint.

## Updating Configuration

To update configuration on an existing installation:

```powershell
# Update only apiUrl (preserves other properties)
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Update `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://new-api.example.com/api/chat"

# Update multiple properties
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Update `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://new-api.example.com/api/chat" `
    -Message "Updated Knowledge Agent"
```

## Troubleshooting Configuration

### Verify Current Configuration

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Status `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr"
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Chat button doesn't appear | Custom action not installed | Run Install action |
| "Error: AAD Client ID not configured" | Missing `aadClientId` property | Update installation with `-AadClientId` |
| API calls fail with 401 | Wrong `aadClientId` or missing permissions | Verify client ID matches backend API |
| API calls fail with network error | Wrong `apiUrl` | Verify API URL is correct and accessible |

## Related Documentation

- [Deployment Guide](deployment.md)
- [Azure AD Setup](azure-ad-setup.md)
- [Architecture Overview](architecture.md)
