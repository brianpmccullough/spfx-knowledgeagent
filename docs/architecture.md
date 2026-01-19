# Architecture Overview

This document describes the architecture of the SPFx Knowledge Agent solution.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SharePoint Online                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     SharePoint Page                                │  │
│  │                                                                    │  │
│  │   ┌─────────────────────────────────────────────────────────┐     │  │
│  │   │              SPFx Application Customizer                 │     │  │
│  │   │  ┌─────────────┐    ┌────────────────────────────────┐  │     │  │
│  │   │  │ Chat Button │───▶│         Chat Panel             │  │     │  │
│  │   │  └─────────────┘    │  ┌──────────────────────────┐  │  │     │  │
│  │   │                     │  │    Message History       │  │  │     │  │
│  │   │                     │  ├──────────────────────────┤  │  │     │  │
│  │   │                     │  │    RAG/KQL Toggle        │  │  │     │  │
│  │   │                     │  ├──────────────────────────┤  │  │     │  │
│  │   │                     │  │    Input + Send          │  │  │     │  │
│  │   │                     │  └──────────────────────────┘  │  │     │  │
│  │   │                     └────────────────────────────────┘  │     │  │
│  │   └─────────────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + Bearer Token
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Azure AD / Entra ID                               │
│                    (Token Validation & User Auth)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Knowledge Agent Backend API                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         /api/chat                                │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌───────────────────────┐  │   │
│  │  │ RAG Search  │   │ KQL Search  │   │    LLM Integration    │  │   │
│  │  │ (Vectors)   │   │ (Keywords)  │   │   (Response Gen)      │  │   │
│  │  └─────────────┘   └─────────────┘   └───────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### SPFx Application Customizer

The front-end component deployed to SharePoint sites.

| Component | File | Description |
|-----------|------|-------------|
| `FooterApplicationCustomizer` | `FooterApplicationCustomizer.ts` | Entry point; registers the customizer and renders the Footer component |
| `Footer` | `Footer.tsx` | Renders the floating chat button and manages panel state |
| `ChatPanel` | `ChatPanel.tsx` | Main chat interface with message history, input, and API communication |
| `ChatMessage` | `ChatMessage.tsx` | Individual message bubble component |

### Authentication Flow

```
1. User opens SharePoint page
         │
         ▼
2. SPFx Customizer loads
         │
         ▼
3. User clicks chat button & enters/sends message
         │
         ▼
4. ChatPanel requests token via AadTokenProvider
   - Resource: Backend API Client ID (aadClientId property)
   - Scope: user_impersonation
         │
         ▼
5. SharePoint returns delegated access token
         │
         ▼
6. ChatPanel sends POST to apiUrl with Bearer token
         │
         ▼
7. Backend validates token & processes request
         │
         ▼
8. Response displayed in chat panel
```

### Data Flow

**Request Payload:**
```typescript
{
  messages: IApiChatMessage[];  // Conversation history
  context: {
    siteUrl: string;            // Current SharePoint site URL
    searchMode: 'rag' | 'kql';  // Selected search mode
  }
}
```

**Response Payload:**
```typescript
{
  response: string;             // Assistant's response text
  messages: IApiChatMessage[];  // Updated conversation history
}
```

## Component Hierarchy

```
FooterApplicationCustomizer
└── Footer
    ├── Chat Button (Fluent UI IconButton)
    └── ChatPanel (Fluent UI Panel)
        ├── Header
        │   ├── Icon + Title
        │   └── RAG/KQL Toggle
        ├── Messages Container
        │   ├── Starter Prompts (when empty)
        │   └── ChatMessage[] (when has messages)
        │       └── Loading Indicator
        └── Input Container
            ├── TextField (multiline)
            └── Send Button
```

## State Management

State is managed locally within React components using `useState` hooks:

| State | Component | Purpose |
|-------|-----------|---------|
| `isPanelOpen` | Footer | Controls panel visibility |
| `messages` | ChatPanel | Display messages (UI format) |
| `apiMessages` | ChatPanel | API message history (sent to backend) |
| `inputValue` | ChatPanel | Current input field value |
| `isLoading` | ChatPanel | Loading state during API calls |
| `isRagMode` | ChatPanel | Toggle state for RAG vs KQL |

## Configuration Injection

Properties are injected through the SPFx customizer lifecycle:

```
package-solution.json (webApiPermissionRequests)
         │
         ▼
serve.json / Custom Action Properties
         │
         ▼
FooterApplicationCustomizer.properties
         │
         ▼
Footer props
         │
         ▼
ChatPanel props
```

## Security Considerations

1. **Token-based Authentication** - All API calls use Azure AD bearer tokens
2. **Delegated Permissions** - Uses `user_impersonation` scope (user context)
3. **No Secrets in Client** - API Client ID is not a secret; tokens are acquired at runtime
4. **HTTPS Only** - All communication over TLS
5. **CORS** - Backend must allow requests from SharePoint origins

## Deployment Architecture

```
Tenant App Catalog
└── spfx-knowledgeagent.sppkg (tenant-scoped)
    │
    ├── Site A ──▶ Custom Action (apiUrl: https://api1.com)
    ├── Site B ──▶ Custom Action (apiUrl: https://api2.com)
    └── Site C ──▶ Custom Action (apiUrl: https://api1.com)
```

The solution supports:
- **Tenant-wide deployment** via app catalog
- **Site-specific configuration** via custom actions
- **Different API endpoints** per site if needed
