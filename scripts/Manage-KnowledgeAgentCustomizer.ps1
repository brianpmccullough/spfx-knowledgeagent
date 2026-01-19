<#
.SYNOPSIS
    Manages the SPFx Knowledge Agent Application Customizer on SharePoint sites.

.DESCRIPTION
    This script provides functionality to deploy, install, update, and remove the
    Knowledge Agent Application Customizer on a site-by-site basis using PnP PowerShell 2.x.

.PARAMETER Action
    The action to perform: Deploy, Install, Update, Remove, or Status

.PARAMETER SiteUrl
    The URL of the SharePoint site to manage

.PARAMETER TenantAdminUrl
    The URL of the SharePoint tenant admin site (required for Deploy action)

.PARAMETER PackagePath
    Path to the .sppkg file (required for Deploy action)

.PARAMETER ApiUrl
    The API URL for the Knowledge Agent backend

.PARAMETER AadClientId
    The Azure AD Client ID for authentication

.PARAMETER Message
    Optional message property for the customizer

.PARAMETER PnPClientId
    Required. The Azure AD Application (client) ID registered for PnP PowerShell authentication.
    Register an application using: https://pnp.github.io/powershell/articles/registerapplication.html

.EXAMPLE
    # Deploy package to tenant app catalog
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Deploy -PnPClientId "your-pnp-client-id" -TenantAdminUrl "https://contoso-admin.sharepoint.com" -PackagePath "../sharepoint/solution/spfx-knowledgeagent.sppkg"

.EXAMPLE
    # Install on a specific site
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Install -PnPClientId "your-pnp-client-id" -SiteUrl "https://contoso.sharepoint.com/sites/hr" -ApiUrl "https://api.example.com/api/chat" -AadClientId "d93c7720-43a9-4924-99c5-68464eb75b20"

.EXAMPLE
    # Update configuration on a site
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Update -PnPClientId "your-pnp-client-id" -SiteUrl "https://contoso.sharepoint.com/sites/hr" -ApiUrl "https://newapi.example.com/api/chat"

.EXAMPLE
    # Remove from a site
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Remove -PnPClientId "your-pnp-client-id" -SiteUrl "https://contoso.sharepoint.com/sites/hr"

.EXAMPLE
    # Check status on a site
    .\Manage-KnowledgeAgentCustomizer.ps1 -Action Status -PnPClientId "your-pnp-client-id" -SiteUrl "https://contoso.sharepoint.com/sites/hr"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Deploy", "Install", "Update", "Remove", "Status")]
    [string]$Action,

    [Parameter(Mandatory = $true)]
    [string]$PnPClientId,

    [Parameter(Mandatory = $false)]
    [string]$SiteUrl,

    [Parameter(Mandatory = $false)]
    [string]$TenantAdminUrl,

    [Parameter(Mandatory = $false)]
    [string]$PackagePath,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl,

    [Parameter(Mandatory = $false)]
    [string]$AadClientId,

    [Parameter(Mandatory = $false)]
    [string]$Message = "SPFx Knowledge Agent"
)

# Constants
$AppId = "77cb6cc5-1201-456d-b8f3-5e203bc311ef" # from the package-solution.json
$ComponentId = "6d48a638-7f31-45f6-bb8a-b0a51b631784" # the customizer id from FooterApplicationCustomizer.manifest.json
$CustomActionTitle = "FooterApplicationCustomizer" # the alias from FooterApplicationCustomizer.manifest.json
$PackageName = "spfx-knowledgeagent.sppkg"

function Test-PnPConnection {
    try {
        $ctx = Get-PnPContext -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Connect-ToSite {
    param(
        [string]$Url,
        [string]$ClientId
    )

    Write-Host "Connecting to $Url ..." -ForegroundColor Cyan
    Connect-PnPOnline -Url $Url -Interactive -ClientId $ClientId

    if (-not (Test-PnPConnection)) {
        throw "Failed to connect to $Url"
    }
    Write-Host "Connected successfully." -ForegroundColor Green
}

function Deploy-ToAppCatalog {
    param(
        [string]$AdminUrl,
        [string]$Package,
        [string]$ClientId
    )

    if (-not $AdminUrl) {
        throw "TenantAdminUrl is required for Deploy action"
    }

    if (-not $Package) {
        # Default to the solution path
        $Package = Join-Path $PSScriptRoot "../sharepoint/solution/$PackageName"
    }

    if (-not (Test-Path $Package)) {
        throw "Package file not found: $Package"
    }

    Connect-ToSite -Url $AdminUrl -ClientId $ClientId

    Write-Host "Deploying package to tenant app catalog..." -ForegroundColor Cyan

    # Add the app to the tenant app catalog
    $app = Add-PnPApp -Path $Package -Scope Tenant -Overwrite -Publish

    if ($app) {
        Write-Host "Package deployed successfully!" -ForegroundColor Green
        Write-Host "App ID: $($app.Id)" -ForegroundColor Gray
        Write-Host "App Title: $($app.Title)" -ForegroundColor Gray
    }
    else {
        throw "Failed to deploy package to app catalog"
    }

    Disconnect-PnPOnline
}

function Get-CustomActionProperties {
    param(
        [string]$Api,
        [string]$ClientId,
        [string]$Msg
    )

    $properties = @{
        message = $Msg
    }

    if ($ClientId) {
        $properties.aadClientId = $ClientId
    }

    if ($Api) {
        $properties.apiUrl = $Api
    }

    return $properties | ConvertTo-Json -Compress
}

function Install-Customizer {
    param(
        [string]$Url,
        [string]$Api,
        [string]$AadClient,
        [string]$Msg = "Knowledge Agent",
        [string]$PnPClient
    )

    if (-not $Url) {
        throw "SiteUrl is required for Install action"
    }

    if (-not $Api) {
        throw "ApiUrl is required for Install action"
    }

    if (-not $AadClient) {
        throw "AadClientId is required for Install action"
    }

    Connect-ToSite -Url $Url -ClientId $PnPClient
    Install-App

    # Check if already installed
    $existingAction = Get-PnPCustomAction -Scope Site | Where-Object { $_.ClientSideComponentId -eq $ComponentId }

    if ($existingAction) {
        Write-Host "Customizer is already installed on this site. Use 'Update' action to modify configuration." -ForegroundColor Yellow
        Disconnect-PnPOnline
        return
    }

    $clientSideComponentProperties = Get-CustomActionProperties -Api $Api -ClientId $AadClient -Msg $Msg

    Write-Host "Installing Knowledge Agent customizer..." -ForegroundColor Cyan
    Write-Host "Properties: $clientSideComponentProperties" -ForegroundColor Gray

    Add-PnPCustomAction -Name $CustomActionTitle `
        -Title $CustomActionTitle `
        -Location "ClientSideExtension.ApplicationCustomizer" `
        -ClientSideComponentId $ComponentId `
        -ClientSideComponentProperties $clientSideComponentProperties `
        -Scope Site

    Write-Host "Customizer installed successfully!" -ForegroundColor Green

    Disconnect-PnPOnline
}

function Update-Customizer {
    param(
        [string]$Url,
        [string]$Api,
        [string]$AadClient,
        [string]$Msg,
        [string]$PnPClient
    )

    if (-not $Url) {
        throw "SiteUrl is required for Update action"
    }

    Connect-ToSite -Url $Url -ClientId $PnPClient

    # Find the existing custom action
    $existingAction = Get-PnPCustomAction -Scope Site | Where-Object { $_.ClientSideComponentId -eq $ComponentId }

    if (-not $existingAction) {
        Write-Host "Customizer is not installed on this site. Use 'Install' action first." -ForegroundColor Yellow
        Disconnect-PnPOnline
        return
    }

    # Get current properties
    $currentProps = @{}
    if ($existingAction.ClientSideComponentProperties) {
        $currentProps = $existingAction.ClientSideComponentProperties | ConvertFrom-Json -AsHashtable
    }

    # Update with new values (keep existing if not provided)
    if ($Api) { $currentProps.apiUrl = $Api }
    if ($AadClient) { $currentProps.aadClientId = $AadClient }
    if ($Msg) { $currentProps.message = $Msg }

    $clientSideComponentProperties = $currentProps | ConvertTo-Json -Compress

    Write-Host "Updating Knowledge Agent customizer..." -ForegroundColor Cyan
    Write-Host "New Properties: $clientSideComponentProperties" -ForegroundColor Gray

    # Remove and re-add (PnP doesn't have a direct update for custom action properties)
    Remove-PnPCustomAction -Identity $existingAction.Id -Scope Site -Force

    Add-PnPCustomAction -Name $CustomActionTitle `
        -Title $CustomActionTitle `
        -Location "ClientSideExtension.ApplicationCustomizer" `
        -ClientSideComponentId $ComponentId `
        -ClientSideComponentProperties $clientSideComponentProperties `
        -Scope Site

    Write-Host "Customizer updated successfully!" -ForegroundColor Green

    Disconnect-PnPOnline
}

function Remove-Customizer {
    param(
        [string]$Url,
        [string]$PnPClient
    )

    if (-not $Url) {
        throw "SiteUrl is required for Remove action"
    }

    Connect-ToSite -Url $Url -ClientId $PnPClient

    # Find the existing custom action
    $existingAction = Get-PnPCustomAction -Scope Site | Where-Object { $_.ClientSideComponentId -eq $ComponentId }

    if (-not $existingAction) {
        Write-Host "Customizer is not installed on this site." -ForegroundColor Yellow
        Disconnect-PnPOnline
        return
    }

    Write-Host "Removing Knowledge Agent customizer..." -ForegroundColor Cyan

    Remove-PnPCustomAction -Identity $existingAction.Id -Scope Site -Force

    Write-Host "Customizer removed successfully!" -ForegroundColor Green

    Disconnect-PnPOnline
}

function Get-CustomizerStatus {
    param(
        [string]$Url,
        [string]$PnPClient
    )

    if (-not $Url) {
        throw "SiteUrl is required for Status action"
    }

    Connect-ToSite -Url $Url -ClientId $PnPClient

    # Find the existing custom action
    $existingAction = Get-PnPCustomAction -Scope Site | Where-Object { $_.ClientSideComponentId -eq $ComponentId }

    if (-not $existingAction) {
        Write-Host "Customizer is NOT installed on this site." -ForegroundColor Yellow
    }
    else {
        Write-Host "Customizer IS installed on this site." -ForegroundColor Green
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Cyan
        Write-Host "  ID: $($existingAction.Id)" -ForegroundColor Gray
        Write-Host "  Name: $($existingAction.Name)" -ForegroundColor Gray
        Write-Host "  Component ID: $($existingAction.ClientSideComponentId)" -ForegroundColor Gray

        if ($existingAction.ClientSideComponentProperties) {
            Write-Host "  Properties:" -ForegroundColor Gray
            $props = $existingAction.ClientSideComponentProperties | ConvertFrom-Json
            $props.PSObject.Properties | ForEach-Object {
                Write-Host "    $($_.Name): $($_.Value)" -ForegroundColor Gray
            }
        }
    }

    Disconnect-PnPOnline
}

function Install-App {

    try {
        Install-PnPApp -Identity $AppId
    } catch {
        Write-Host $_
    }
}

# Main execution
try {
    # Verify PnP.PowerShell module is installed
    if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
        throw "PnP.PowerShell module is not installed. Install it with: Install-Module PnP.PowerShell -Scope CurrentUser"
    }

    switch ($Action) {
        "Deploy" {
            Deploy-ToAppCatalog -AdminUrl $TenantAdminUrl -Package $PackagePath -ClientId $PnPClientId
        }
        "Install" {
            Install-Customizer -Url $SiteUrl -Api $ApiUrl -AadClient $AadClientId -Msg $Message -PnPClient $PnPClientId
        }
        "Update" {
            Update-Customizer -Url $SiteUrl -Api $ApiUrl -AadClient $AadClientId -Msg $Message -PnPClient $PnPClientId
        }
        "Remove" {
            Remove-Customizer -Url $SiteUrl -PnPClient $PnPClientId
        }
        "Status" {
            Get-CustomizerStatus -Url $SiteUrl -PnPClient $PnPClientId
        }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
