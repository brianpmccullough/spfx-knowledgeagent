# Azure AD / Entra ID Setup

This document explains how to configure Azure AD (Entra ID) for the SPFx Knowledge Agent.

## Overview

The SPFx Knowledge Agent uses Azure AD for authentication. The SPFx customizer acquires a delegated access token on behalf of the current user and sends it to the backend API for validation.

## Prerequisites

- Azure AD tenant (same tenant as SharePoint)
- Global Administrator or Application Administrator role
- Backend API already registered in Azure AD

## Architecture

```
SharePoint User
      │
      │ 1. Requests token for Backend API
      ▼
┌─────────────────────────────────────────────┐
│         SharePoint Online                    │
│  (SPFx AadTokenProviderFactory)             │
│                                              │
│  Uses: SharePoint Online Web Client          │
│        Extensibility Service Principal       │
│        (08e18876-6177-487e-b8b5-cf950c1e598c)│
└─────────────────────────────────────────────┘
      │
      │ 2. Returns delegated token
      ▼
┌─────────────────────────────────────────────┐
│           Backend API                        │
│  App Registration: d93c7720-43a9-...        │
│  Validates token, returns response          │
└─────────────────────────────────────────────┘
```

## Step 1: Backend API App Registration

If your backend API is not yet registered in Azure AD:

1. Go to [Azure Portal](https://portal.azure.com) > **Azure Active Directory** > **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: Knowledge Agent API
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: (leave blank for API-only)
4. Click **Register**
5. Note the **Application (client) ID** - this is your `aadClientId`

### Expose an API

1. Go to **Expose an API**
2. Click **Set** next to Application ID URI (accept default or customize)
3. Click **Add a scope**:
   - **Scope name**: `user_impersonation`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: Access Knowledge Agent API
   - **Admin consent description**: Allows the app to access Knowledge Agent API on behalf of the signed-in user
   - **User consent display name**: Access Knowledge Agent API
   - **User consent description**: Allows the app to access Knowledge Agent API on your behalf
   - **State**: Enabled
4. Click **Add scope**

## Step 2: Configure SPFx API Permissions

The SPFx solution declares required API permissions in `config/package-solution.json`:

```json
{
  "solution": {
    "webApiPermissionRequests": [
      {
        "resource": "d93c7720-43a9-4924-99c5-68464eb75b20",
        "scope": "user_impersonation"
      }
    ]
  }
}
```

Update the `resource` GUID to match your backend API's Application (client) ID.

## Step 3: Grant API Permissions

After deploying the SPFx package to the app catalog, you must approve the API permission request.

### Option A: SharePoint Admin Center (Manual)

1. Go to [SharePoint Admin Center](https://admin.microsoft.com/sharepoint)
2. Navigate to **Advanced** > **API access**
3. Find the pending permission request for your API
4. Click **Approve**

### Option B: PowerShell Script (Automated)

Use the provided script to grant permissions programmatically:

```powershell
cd scripts
./set-entraid-permissions.ps1
```

This script:
1. Connects to Microsoft Graph
2. Finds the SharePoint Online Web Client Extensibility service principal
3. Grants the `user_impersonation` scope for your backend API

**Script Configuration:**

Edit `set-entraid-permissions.ps1` to update these values:

```powershell
# Your backend API's Application (client) ID
$resourceAppIds = @("d93c7720-43a9-4924-99c5-68464eb75b20")

# The scope to grant
$scopes = @("user_impersonation")
```

### Option C: Verify Permissions

To check what permissions are currently granted:

```powershell
cd scripts
./check-entraid-permissions.ps1
```

## Step 4: Backend Token Validation

Your backend API must validate incoming tokens. Key validation points:

| Claim | Expected Value |
|-------|----------------|
| `aud` (audience) | Your API's Application ID URI or Client ID |
| `iss` (issuer) | `https://sts.windows.net/{tenant-id}/` |
| `tid` (tenant ID) | Your Azure AD tenant ID |
| `scp` (scope) | `user_impersonation` |

Example token payload:
```json
{
  "aud": "api://d93c7720-43a9-4924-99c5-68464eb75b20",
  "iss": "https://sts.windows.net/contoso.onmicrosoft.com/",
  "iat": 1704067200,
  "exp": 1704070800,
  "name": "John Doe",
  "oid": "user-object-id",
  "scp": "user_impersonation",
  "tid": "tenant-id",
  "upn": "john.doe@contoso.com"
}
```

## Troubleshooting

### "AADSTS65001: The user or administrator has not consented"

**Cause**: API permissions not approved in SharePoint Admin Center.

**Solution**: Approve the pending permission request or run `set-entraid-permissions.ps1`.

### "AADSTS700016: Application not found"

**Cause**: The `aadClientId` property doesn't match a valid app registration.

**Solution**: Verify the Application (client) ID in Azure AD matches the `aadClientId` configured in the customizer.

### "AADSTS50013: Assertion audience does not match"

**Cause**: Token acquired for wrong audience.

**Solution**: Ensure `aadClientId` in customizer properties matches the backend API's Application ID.

### Token not being sent to API

**Cause**: AadTokenProvider failed to acquire token.

**Solution**:
1. Check browser console for errors
2. Verify API permissions are granted
3. Ensure user has access to the backend API

## Security Best Practices

1. **Use Delegated Permissions** - The solution uses delegated (user) permissions, not application permissions. This ensures the API sees requests in the context of the actual user.

2. **Validate All Claims** - Backend should validate `aud`, `iss`, `tid`, and `scp` claims.

3. **Don't Trust Client-Provided User Info** - Always extract user identity from the validated token, not from request body.

4. **Monitor Token Lifetimes** - Default token lifetime is 1 hour. The SPFx token provider handles refresh automatically.

5. **Audit API Access** - Enable logging on your backend API to track who is accessing the Knowledge Agent.

## Related Documentation

- [Connect to Azure AD-secured APIs in SPFx](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/use-aad-tutorial)
- [Microsoft identity platform access tokens](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens)
- [Expose an API in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-configure-app-expose-web-apis)
