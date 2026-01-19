# Deployment Guide

This document provides instructions for deploying the SPFx Knowledge Agent to a SharePoint Online environment.

## Prerequisites

Before deploying, ensure you have:

- [ ] SharePoint Online tenant with App Catalog configured
- [ ] SharePoint Administrator or Site Collection Administrator permissions
- [ ] Backend Knowledge Agent API deployed and accessible (see: https://github.com/brianpmccullough/spfx-knowledgeagent-api)
- [ ] Azure AD app registration for the backend API (see [Azure AD Setup](azure-ad-setup.md))
- [ ] Node.js v22.x installed
- [ ] PnP.PowerShell 2.x module installed
- [ ] Azure AD app registration for PnP PowerShell (see below)

### Install PnP.PowerShell

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

### Register PnP PowerShell Application

PnP PowerShell requires an Azure AD app registration for authentication. Register one using:

```powershell
Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP PowerShell" -Tenant contoso.onmicrosoft.com -Interactive
```

Note the **Application (client) ID** returned - this is your `PnPClientId` used in all script commands.

For more details, see: https://pnp.github.io/powershell/articles/authentication.html

## Deployment Steps

### Step 1: Build the Solution Package

```bash
# Install dependencies (if not already done)
npm install

# Build (production)
gulp bundle --ship
gulp package-solution --ship
```

This creates the package at `sharepoint/solution/spfx-knowledgeagent.sppkg`.

### Step 2: Deploy to Tenant App Catalog

#### Option A: Using PowerShell (Recommended)

```powershell
cd scripts

.\Manage-KnowledgeAgentCustomizer.ps1 -Action Deploy `
    -PnPClientId "your-pnp-client-id" `
    -TenantAdminUrl "https://contoso-admin.sharepoint.com" `
    -PackagePath "../sharepoint/solution/spfx-knowledgeagent.sppkg"
```

#### Option B: Manual Upload

1. Go to your tenant App Catalog site (e.g., `https://contoso.sharepoint.com/sites/appcatalog`)
2. Navigate to **Apps for SharePoint**
3. Click **Upload** and select `spfx-knowledgeagent.sppkg`
4. In the dialog, check **Make this solution available to all sites in the organization**
5. Click **Deploy**

### Step 3: Approve API Permissions

After deploying the package, approve the API permission request:

#### Option A: SharePoint Admin Center

1. Go to [SharePoint Admin Center](https://admin.microsoft.com/sharepoint)
2. Navigate to **Advanced** > **API access**
3. Find the pending request for your Knowledge Agent API
4. Click **Approve**

#### Option B: Using PowerShell

```powershell
cd scripts
.\set-entraid-permissions.ps1
```

### Step 4: Install on Target Sites

The package is tenant-scoped but is recommended to be installed per site for testing and evaluation purposes.

#### Using PowerShell (Recommended)

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://your-api-endpoint.com/api/chat" `
    -AadClientId "d93c7720-43a9-4924-99c5-68464eb75b20"
```

#### Batch Installation

Create a CSV file `sites.csv`:

```csv
SiteUrl,ApiUrl,AadClientId
https://contoso.sharepoint.com/sites/hr,https://api.example.com/api/chat,d93c7720-43a9-4924-99c5-68464eb75b20
https://contoso.sharepoint.com/sites/finance,https://api.example.com/api/chat,d93c7720-43a9-4924-99c5-68464eb75b20
https://contoso.sharepoint.com/sites/legal,https://api-legal.example.com/api/chat,d93c7720-43a9-4924-99c5-68464eb75b20
```

Then run:

```powershell
$pnpClientId = "your-pnp-client-id"
$sites = Import-Csv "sites.csv"

foreach ($site in $sites) {
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
        -PnPClientId $pnpClientId `
        -SiteUrl $site.SiteUrl `
        -ApiUrl $site.ApiUrl `
        -AadClientId $site.AadClientId
}
```

## Management Operations

### Check Installation Status

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Status `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr"
```

Output:
```
Customizer IS installed on this site.

Details:
  ID: 12345678-1234-1234-1234-123456789012
  Name: FooterApplicationCustomizer
  Component ID: 6d48a638-7f31-45f6-bb8a-b0a51b631784
  Properties:
    apiUrl: https://api.example.com/api/chat
    aadClientId: d93c7720-43a9-4924-99c5-68464eb75b20
    message: SPFx Knowledge Agent
```

### Update Configuration

To change the API URL or other properties on an existing installation:

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Update `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://new-api.example.com/api/chat"
```

Note: Update preserves existing properties not specified in the command.

### Remove from a Site

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Remove `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr"
```

## Updating the Solution

When deploying a new version:

1. **Build the new package**
   ```bash
   gulp bundle --ship
   gulp package-solution --ship
   ```

2. **Update the App Catalog**
   ```powershell
   .\Manage-KnowledgeAgentCustomizer.ps1 -Action Deploy `
       -PnPClientId "your-pnp-client-id" `
       -TenantAdminUrl "https://contoso-admin.sharepoint.com" `
       -PackagePath "../sharepoint/solution/spfx-knowledgeagent.sppkg"
   ```

3. **Existing installations auto-update**
   - Sites with the customizer installed will automatically receive the update
   - No need to re-install on each site
   - Configuration (apiUrl, aadClientId) is preserved

## Rollback

To remove the solution entirely:

1. **Remove from all sites**
   ```powershell
   # For each site
   .\Manage-KnowledgeAgentCustomizer.ps1 -Action Remove `
       -PnPClientId "your-pnp-client-id" `
       -SiteUrl "https://contoso.sharepoint.com/sites/hr"
   ```

2. **Remove from App Catalog**
   - Go to App Catalog > Apps for SharePoint
   - Select `spfx-knowledgeagent.sppkg`
   - Click **Delete**

3. **Revoke API Permissions** (optional)
   - Go to SharePoint Admin Center > Advanced > API access
   - Find and remove the permission grant

## Troubleshooting Deployment

### "App Catalog not found"

**Cause**: Tenant doesn't have an App Catalog site.

**Solution**: Create App Catalog via SharePoint Admin Center > More features > Apps > App Catalog.

### "Access denied" when deploying

**Cause**: Insufficient permissions.

**Solution**: Ensure you have SharePoint Administrator role or Site Collection Administrator on the App Catalog.

### Customizer not appearing on site

**Causes**:
1. Custom action not installed
2. API permissions not granted
3. JavaScript errors in browser

**Solutions**:
1. Run `Status` action to verify installation
2. Check API permissions in SharePoint Admin Center
3. Open browser DevTools (F12) and check Console for errors

### "AADSTS" errors in browser console

See [Azure AD Setup - Troubleshooting](azure-ad-setup.md#troubleshooting).

## Environment-Specific Deployments

### Development

For local development, ensure you have [set up your SPFx tenant domain](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment#set-the-spfx_serve_tenant_domain-environment-variable-optional).

Use `gulp serve` with `config/serve.json` pointing to a dev API:

```json
{
  "properties": {
    "apiUrl": "http://localhost:3000/api/chat"
  }
}
```

### Staging

Deploy to a test tenant or isolated site collection with staging API:

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/staging" `
    -ApiUrl "https://staging-api.example.com/api/chat" `
    -AadClientId "staging-client-id"
```

### Production

Deploy with production API endpoint:

```powershell
.\Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://api.example.com/api/chat" `
    -AadClientId "production-client-id"
```

## Related Documentation

- [Configuration Reference](configuration.md)
- [Azure AD Setup](azure-ad-setup.md)
- [Architecture Overview](architecture.md)
