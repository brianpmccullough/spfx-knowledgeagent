<#
.SYNOPSIS
    Deploy script for SPFx Knowledge Agent Lambda function to AWS (top-level)

.DESCRIPTION
    Deploys the Lambda and API Gateway using CloudFormation via the
    PowerShell `AWS.Tools.*` modules. This file is the top-level entrypoint
    and was recreated to use `AWS.Tools` as requested.
#>

param(
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod',
    
    [switch]$Build = $true,
    
    [switch]$Guided,
    
    [switch]$SkipValidation
)

$ErrorActionPreference = 'Stop'
$WarningPreference = 'Continue'

# Get script directory (aws/ root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir ".env.$Environment"
$TemplateFile = Join-Path $ScriptDir 'template.yaml'
$LambdaDir = Join-Path $ScriptDir 'lambda'

function Write-Header { param([string]$Message) Write-Host "========================================" -ForegroundColor Cyan; Write-Host $Message -ForegroundColor Cyan; Write-Host "========================================" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "• $Message" -ForegroundColor Yellow }

function Ensure-AwsToolsModules {
    param()
    # Map logical services to candidate module names (tries in order)
    $candidates = @{
        'Common' = @('AWS.Tools.Common','AWSPowerShell.NetCore')
        'STS'    = @('AWS.Tools.SecurityToken','AWS.Tools.STS','AWSPowerShell.NetCore')
        'CloudFormation' = @('AWS.Tools.CloudFormation','AWSPowerShell.NetCore')
    }

    # Ensure PowerShell Gallery and NuGet provider are available for Install-Module
    try {
        $psGallery = Get-PSRepository -Name PSGallery -ErrorAction SilentlyContinue
        if (-not $psGallery) {
            Write-Info "PowerShell Gallery (PSGallery) not registered. Attempting to register default PSGallery..."
            Register-PSRepository -Default -ErrorAction Stop
            Write-Success "PSGallery registered"
        }

        if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
            Write-Info "Installing NuGet package provider (required by Install-Module)..."
            Install-PackageProvider -Name NuGet -Force -Scope CurrentUser -ErrorAction Stop
            Write-Success "NuGet provider installed"
        }
    }
    catch {
        Write-Warning "Could not register PSGallery or install NuGet provider automatically: $_"
        Write-Warning "If this environment restricts PowerShell Gallery access, please register PSGallery and install NuGet manually and re-run the script."
        Write-Warning "Manual steps to try (run in an elevated PowerShell if required):"
        Write-Host "  Register-PSRepository -Default" -ForegroundColor Yellow
        Write-Host "  Install-PackageProvider -Name NuGet -Force" -ForegroundColor Yellow
        return $false
    }

    $imported = @()

    foreach ($logical in $candidates.Keys) {
        $found = $false
        foreach ($modName in $candidates[$logical]) {
            if (Get-Module -ListAvailable -Name $modName -ErrorAction SilentlyContinue) {
                Write-Info "Found available module: $modName"
                try { Import-Module $modName -ErrorAction Stop; $imported += $modName; $found = $true; break }
                catch { Write-Warning "Found $modName but failed to import: $_" }
            }
            else {
                Write-Info "Module $modName not present; will attempt to install"
                try { Install-Module -Name $modName -Scope CurrentUser -Force -ErrorAction Stop; Import-Module $modName -ErrorAction Stop; Write-Success "$modName installed and imported"; $imported += $modName; $found = $true; break }
                catch { Write-Warning "Could not install/import ${$modName}: ${$_}" }
            }
        }
        if (-not $found) {
            Write-Error "Could not find or install any candidate module for logical service: $logical"
            Write-Error "Tried: $($candidates[$logical] -join ', ')"
            return $false
        }
    }

    Write-Success "AWS tools modules loaded: $($imported -join ', ')"
    return $true
}

function Test-AwsCredentials {
    try { Ensure-AwsToolsModules; $identity = Get-STSCallerIdentity -ErrorAction Stop; if ($identity -and $identity.Account) { return $true } ; return $false }
    catch { return $false }
}

try {
    Write-Header "SPFx Knowledge Agent Lambda Deploy"
    Write-Info "Environment: $Environment"
    Write-Info "Template: $TemplateFile"

    # Load environment variables
    if (Test-Path $EnvFile) {
        Write-Host "`nLoading environment from: $EnvFile" -ForegroundColor White
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -and -not $_.StartsWith('#')) {
                $key, $value = $_ -split '=', 2
                if ($key -and $value) { [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), 'Process') }
            }
        }
        Write-Success "Environment variables loaded"
    }
    else { Write-Warning "Environment file not found: $EnvFile"; Write-Info "Using defaults from template.yaml" }

    Write-Host "`nValidating environment..." -ForegroundColor White

    if (-not (Ensure-AwsToolsModules)) { Write-Error "Required AWS.Tools modules are missing and could not be installed."; exit 1 }
    Write-Success "AWS.Tools modules available"

    if (-not $SkipValidation) {
        if (-not (Test-AwsCredentials)) { Write-Error "AWS credentials not configured or invalid"; Write-Info "Configure credentials (env vars, AWS SSO, or shared config)"; exit 1 }
        Write-Success "AWS credentials valid"
    }

    if (-not (Test-Path $TemplateFile)) { Write-Error "SAM template not found: $TemplateFile"; exit 1 }
    Write-Success "SAM template found"

    # Check for Lambda build artifacts
    $DistDir = Join-Path $LambdaDir 'dist'
    if (-not (Test-Path $DistDir)) { Write-Warning "Lambda build artifacts not found"; $Build = $true }

    # Build if requested or needed (build script now lives in aws/scripts)
    if ($Build) {
        Write-Host "`nBuilding Lambda..." -ForegroundColor White
        $buildScript = Join-Path $ScriptDir  'build.ps1'
        if (-not (Test-Path $buildScript)) { Write-Error "Build script not found: $buildScript"; exit 1 }
        & pwsh $buildScript -Environment $Environment
        if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }
    }

    Write-Host "`nPreparing CloudFormation deployment..." -ForegroundColor White
    $stackName = "spfx-knowledge-agent-$Environment"
    $region = 'us-east-1'

    $templateBody = Get-Content $TemplateFile -Raw
    $cfParameters = @()
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([A-Z_]+)=(.+)$') {
                $key = $matches[1]; $value = $matches[2]
                switch ($key) { 'SPFX_ORIGIN' { $cfParameters += @{ ParameterKey = 'SpfxOrigin'; ParameterValue = $value } } 'LAMBDA_MEMORY_SIZE' { $cfParameters += @{ ParameterKey = 'LambdaMemorySize'; ParameterValue = $value } } 'LAMBDA_TIMEOUT' { $cfParameters += @{ ParameterKey = 'LambdaTimeout'; ParameterValue = $value } } }
            }
        }
    }

    $existing = Get-CFNStack -StackName $stackName -Region $region -ErrorAction SilentlyContinue
    if (-not $existing) {
        Write-Info "Creating CloudFormation stack: $stackName"
        New-CFNStack -StackName $stackName -TemplateBody $templateBody -Capability 'CAPABILITY_IAM' -Parameter $cfParameters -Tag @{ Key = 'Environment'; Value = $Environment }, @{ Key = 'Application'; Value = 'spfx-knowledge-agent' } -Region $region -ErrorAction Stop
    }
    else {
        Write-Info "Updating CloudFormation stack: $stackName"
        try { Update-CFNStack -StackName $stackName -TemplateBody $templateBody -Parameter $cfParameters -Capability 'CAPABILITY_IAM' -Region $region -ErrorAction Stop }
        catch { if ($_.Exception.Message -match 'No updates are to be performed') { Write-Info 'No updates to perform' } else { throw } }
    }

    # Wait for stack to reach a terminal state
    while ($true) {
        Start-Sleep -Seconds 5
        $stack = Get-CFNStack -StackName $stackName -Region $region -ErrorAction Stop
        $status = $stack.StackStatus
        Write-Info "Stack status: $status"
        if ($status -match '(_COMPLETE)$') { break }
        if ($status -match '(_FAILED|_ROLLBACK_COMPLETE|_ROLLBACK_FAILED|_DELETE_COMPLETE)$') { throw "Stack in failed state: $status" }
    }

    Write-Success "Deployment completed"

    Write-Host "`nRetrieving deployment information..." -ForegroundColor White
    $stack = Get-CFNStack -StackName $stackName -Region $region -ErrorAction Stop
    Write-Host "`n" -ForegroundColor White; Write-Host "Deployment Outputs:" -ForegroundColor Green
    $outputs = $stack.Outputs
    foreach ($o in $outputs) { Write-Info "$($o.OutputKey)`:`n  $($o.OutputValue)" }

    $apiEndpoint = $outputs | Where-Object { $_.OutputKey -eq 'ApiEndpoint' } | Select-Object -ExpandProperty OutputValue -ErrorAction SilentlyContinue
    if ($apiEndpoint) {
        Write-Host "`n" -ForegroundColor White; Write-Host "API Endpoint (use in SPFx):" -ForegroundColor Yellow; Write-Host $apiEndpoint -ForegroundColor Cyan
        Write-Host "`nTesting health endpoint..." -ForegroundColor White
        $healthUrl = "$apiEndpoint/health"
        try { $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10; Write-Success "Health check passed: $($response.status)" }
        catch { Write-Warning "Health check failed (may be cold start): $_" }
    }

    Write-Host "`nDeployment completed successfully!`n" -ForegroundColor Green
    Write-Info "Next steps:"
    Write-Info "1. Note the API Endpoint URL above"
    Write-Info "2. Update your SPFx configuration with the endpoint"
    Write-Info "3. Set up App Registration in Azure (when ready)"
    Write-Info "4. Configure AWS Secrets Manager with Azure credentials"

}
catch { Write-Error "Deployment failed: $_"; exit 1 }
