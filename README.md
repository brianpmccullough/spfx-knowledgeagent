# SPFx Knowledge Agent

A SharePoint Framework (SPFx) Application Customizer that adds an AI-powered Knowledge Agent chat panel to SharePoint Online sites. Users can ask questions about site content and receive intelligent responses powered by RAG (Retrieval-Augmented Generation) or KQL-based search.

![SPFx Version](https://img.shields.io/badge/SPFx-1.21.1-green.svg)
![Node.js Version](https://img.shields.io/badge/Node.js-22.x-green.svg)

![Knowledge Agent Screenshot](./docs/screenshot.png)

## Features

- **Floating Chat Button** - Non-intrusive chat button positioned in the bottom-right corner of SharePoint pages
- **Slide-out Panel** - Clean, modern chat interface using Fluent UI components
- **Dual Search Modes** - Toggle between RAG (vector search) and KQL (keyword search) modes
- **Azure AD Authentication** - Secure API calls using SPFx AAD token provider
- **Site-Aware Context** - Passes site URL to the backend for contextual responses
- **Per-Site Configuration** - Deploy to specific sites with custom API endpoints and settings
- **Conversation History** - Maintains chat history within the session (page refresh)

## Prerequisites

- Node.js v22.x
- SharePoint Online tenant with App Catalog
- [Knowledge Agent Backend API](https://github.com/brianpmccullough/spfx-knowledgeagent-api) deployed and accessible
- Azure AD App Registration for the backend API with permissions granted
- PnP.PowerShell 2.x (for deployment using scripts)
- Setup your [SPFx tenant domain](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment#set-the-spfx_serve_tenant_domain-environment-variable-optional)

## Quick Start

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/brianpmccullough/spfx-knowledgeagent.git
   cd spfx-knowledgeagent
   npm install
   ```

2. **Run the Knowledge Agent Backend API**
   Run or deploy the [Knowledge Agent Backend API](https://github.com/brianpmccullough/spfx-knowledgeagent-api).  Specific steps available in the repo.

3. **Configure for local development**

   Update `config/serve.json` with your tenant and API settings.  You can update the "default" and/or "dev" configuration per your needs.

   ```json
   {
     "properties": {
       "aadClientId": "your-api-client-id",
       "apiUrl": "https://your-api-endpoint/api/chat"
     }
   }
   ```

   | Property | Required | Description |
   |----------|----------|-------------|
   | `apiUrl` | Yes | Full URL to the Knowledge Agent chat API endpoint |
   | `aadClientId` | Yes | EntraID (Azure AD) Client ID of the backend API (used for token acquisition to communicate with Knowledge Agent Backend API endpoint|
   | `message` | No | Display message (default: "SPFx Knowledge Agent") |

4. **Grant API permissions**
   Let a SharePoint Online admin install and grant requested permissions to the knowledge agent api, or, to automate the setup, run the script:

   ```powershell
   cd scripts
   ./set-entraid-permissions.ps1
   ```

5. **Run locally**

   ```bash
   gulp serve
   ```

   or

   ```bash
   gulp serve --config=dev
   ```

## Deployment

### Build the package

```bash
gulp bundle --ship
gulp package-solution --ship
```

### Deploy using PowerShell

Requires a registered PnP PowerShell application. See [Deployment Guide](docs/deployment.md) for setup instructions.

```powershell
# Deploy to tenant app catalog
./scripts/Manage-KnowledgeAgentCustomizer.ps1 -Action Deploy `
    -PnPClientId "your-pnp-client-id" `
    -TenantAdminUrl "https://contoso-admin.sharepoint.com" `
    -PackagePath "./sharepoint/solution/spfx-knowledgeagent.sppkg"

# Install on a specific site
./scripts/Manage-KnowledgeAgentCustomizer.ps1 -Action Install `
    -PnPClientId "your-pnp-client-id" `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ApiUrl "https://your-api.com/api/chat" `
    -AadClientId "your-client-id"
```

See [Deployment Guide](docs/deployment.md) for manual or batch installation, management operations, troubleshooting, and more.

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Azure AD Setup](docs/azure-ad-setup.md)
- [Deployment Guide](docs/deployment.md)
- [Configuration Reference](docs/configuration.md)

## Project Structure

```
spfx-knowledgeagent/
├── config/                     # SPFx configuration files
│   ├── package-solution.json   # Solution packaging config
│   └── serve.json              # Local development settings
├── docs/                       # Documentation
├── scripts/                    # PowerShell management scripts
│   ├── Manage-KnowledgeAgentCustomizer.ps1
│   ├── check-entraid-permissions.ps1
│   └── set-entraid-permissions.ps1
├── src/
│   └── extensions/
│       └── footer/             # Application Customizer
│           ├── components/     # React components
│           │   ├── ChatPanel.tsx
│           │   ├── ChatMessage.tsx
│           │   └── Footer.tsx
│           └── FooterApplicationCustomizer.ts
└── sharepoint/
    └── solution/               # Packaged .sppkg file
```

## Scripts

| Script | Description |
|--------|-------------|
| `Manage-KnowledgeAgentCustomizer.ps1` | Install, update, remove customizer on sites |
| `set-entraid-permissions.ps1` | Grant API permissions to SPFx |
| `check-entraid-permissions.ps1` | Verify current API permission grants |

## API Contract

The chat panel sends POST requests to the configured `apiUrl` with the following payload:

```json
{
  "messages": [
    { "role": "user", "content": "User message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "context": {
    "siteUrl": "https://contoso.sharepoint.com/sites/hr",
    "searchMode": "rag"
  }
}
```

Expected response:
```json
{
  "response": "Assistant response text",
  "messages": [...]
}
```

## License

This project is provided as-is without warranty. See LICENSE file for details.

## References

- [SharePoint Framework Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [SPFx Application Customizers](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/extensions/get-started/using-page-placeholder-with-extensions)
- [PnP PowerShell](https://pnp.github.io/powershell/)
