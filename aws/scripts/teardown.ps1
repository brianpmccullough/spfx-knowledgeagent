<#
.SYNOPSIS
    Teardown script for SPFx Knowledge Agent Lambda infrastructure

.DESCRIPTION
    Removes AWS resources created by the CloudFormation stack. This script
    lives in `aws/scripts/` and locates the `aws/` folder as its parent.
#>

param(
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod',
    
    [switch]$Force,
    
    [switch]$SkipValidation
)

$ErrorActionPreference = 'Stop'
$WarningPreference = 'Continue'

# Script and aws root directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AwsRoot = Split-Path -Parent $ScriptDir
$StackName = "spfx-knowledge-agent-$Environment"

function Write-Header { param([string]$Message) Write-Host "========================================" -ForegroundColor Cyan; Write-Host $Message -ForegroundColor Cyan; Write-Host "========================================" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "• $Message" -ForegroundColor Yellow }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }

function Test-AwsCredentials {
    try { Ensure-AwsToolsModules; $identity = Get-STSCallerIdentity -ErrorAction Stop; if ($identity -and $identity.Account) { return $true } ; return $false }
    catch { return $false }
}

function Ensure-AwsToolsModules {
    param()
    $required = @('AWS.Tools.Common','AWS.Tools.STS','AWS.Tools.CloudFormation')
    foreach ($mod in $required) {
        if (-not (Get-Module -ListAvailable -Name $mod)) {
            Write-Warning "$mod not found. Installing to CurrentUser scope..."
            try { Install-Module -Name $mod -Scope CurrentUser -Force -ErrorAction Stop; Write-Success "$mod installed" }
            catch { Write-Error "Failed to install $mod: $_"; throw }
        }
    }
    try { Import-Module AWS.Tools.Common -ErrorAction Stop; Import-Module AWS.Tools.STS -ErrorAction Stop; Import-Module AWS.Tools.CloudFormation -ErrorAction Stop; return $true }
    catch { Write-Error "Could not import AWS.Tools modules: $_"; return $false }
}

function Get-UserConfirmation { param([string]$Message) Write-Warning $Message; $response = Read-Host "Type 'yes' to confirm"; return $response -eq 'yes' }

try {
    Write-Header "SPFx Knowledge Agent Lambda Teardown"
    Write-Info "Environment: $Environment"
    Write-Info "Stack Name: $StackName"

    if (-not $SkipValidation) {
        Write-Host "`nValidating AWS credentials..." -ForegroundColor White
        if (-not (Test-AwsCredentials)) { Write-Error "AWS credentials not configured or invalid"; Write-Info "Configure credentials (env vars, AWS SSO, or shared config)"; exit 1 }
        Write-Success "AWS credentials valid"
    }

    Write-Host "`nChecking for existing CloudFormation stack..." -ForegroundColor White
    try {
        $stack = Get-CFNStack -StackName $StackName -Region 'us-east-1' -ErrorAction SilentlyContinue
        if (-not $stack) { Write-Warning "Stack not found: $StackName"; Write-Info "Nothing to teardown"; exit 0 }
        Write-Info "Found stack with status: $($stack.StackStatus)"
    }
    catch { Write-Warning "Could not query stack status"; Write-Info "Stack may not exist or AWS credentials are invalid" }

    Write-Host "`nResources to be deleted:" -ForegroundColor White
    Write-Info "CloudFormation Stack: $StackName"
    Write-Info "Lambda Function: $Environment-spfx-knowledge-agent"
    Write-Info "API Gateway: $Environment-spfx-api"
    Write-Info "CloudWatch Log Groups: /aws/lambda/$Environment-spfx-knowledge-agent"
    Write-Info "CloudWatch Log Groups: /aws/apigateway/$Environment-spfx-api"
    Write-Info "IAM Roles and Policies"

    if (-not $Force) {
        Write-Host "`n" -ForegroundColor White
        $confirmed = Get-UserConfirmation "This will permanently delete all resources. Are you sure?"
        if (-not $confirmed) { Write-Info "Teardown cancelled"; exit 0 }
    }
    else { Write-Warning "Force flag set - proceeding without confirmation" }

    Write-Host "`nDeleting CloudFormation stack..." -ForegroundColor White
    try {
        Remove-CFNStack -StackName $StackName -Region 'us-east-1' -ErrorAction Stop
        Write-Success "Delete initiated"
        Write-Info "Waiting for stack deletion (this may take a few minutes)..."
        while ($true) {
            Start-Sleep -Seconds 5
            $s = Get-CFNStack -StackName $StackName -Region 'us-east-1' -ErrorAction SilentlyContinue
            if (-not $s) { break }
            if ($s.StackStatus -match 'DELETE_COMPLETE') { break }
            if ($s.StackStatus -match 'DELETE_FAILED') { Write-Warning "Stack deletion failed: $($s.StackStatus)"; break }
        }
        Write-Success "Stack deletion complete"
    }
    catch { Write-Warning "Stack deletion error: $_" }

    Write-Host "`nCleaning up local build artifacts..." -ForegroundColor White
    $distDir = Join-Path $AwsRoot 'lambda' 'dist'
    if (Test-Path $distDir) {
        try { Remove-Item $distDir -Recurse -Force -ErrorAction SilentlyContinue; Write-Success "Build artifacts cleaned" }
        catch { Write-Warning "Could not clean build artifacts: $_" }
    }

    Write-Host "`nTeardown completed!`n" -ForegroundColor Green
    Write-Info "All AWS resources for $Environment environment have been removed"
    Write-Info "To redeploy, run: pwsh ./scripts/deploy.ps1 -Environment $Environment"

}
catch { Write-Error "Teardown failed: $_"; exit 1 }
