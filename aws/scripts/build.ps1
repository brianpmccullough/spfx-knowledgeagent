<#
.SYNOPSIS
    Build script for SPFx Knowledge Agent Lambda function
    
.DESCRIPTION
    Compiles TypeScript Lambda source to JavaScript using esbuild,
    validates configuration, and prepares deployment artifacts.
    This script is intended to live in `aws/scripts/` and locates
    the Lambda sources relative to the `aws/` folder.
#>

param(
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'prod',
    
    [switch]$Clean,
    
    [switch]$Verbose
)

$ErrorActionPreference = 'Stop'
$WarningPreference = 'Continue'

# Script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# aws root (one level up)
$AwsRoot = Split-Path -Parent $ScriptDir
$LambdaDir = Join-Path $AwsRoot 'lambda'
$DistDir = Join-Path $LambdaDir 'dist'

function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "• $Message" -ForegroundColor Yellow
}

try {
    Write-Header "SPFx Knowledge Agent Lambda Build"
    
    if (-not (Test-Path $LambdaDir)) {
        Write-Error "Lambda directory not found: $LambdaDir"
        exit 1
    }
    
    Write-Info "Environment: $Environment"
    Write-Info "Lambda directory: $LambdaDir"
    
    # Check for required files
    Write-Host "`nChecking prerequisites..." -ForegroundColor White
    
    $packageJsonPath = Join-Path $LambdaDir 'package.json'
    $tsconfigPath = Join-Path $LambdaDir 'tsconfig.json'
    $handlerPath = Join-Path $LambdaDir 'src' 'handlers' 'index.ts'
    
    if (-not (Test-Path $packageJsonPath)) {
        Write-Error "package.json not found"
        exit 1
    }
    Write-Success "package.json found"
    
    if (-not (Test-Path $tsconfigPath)) {
        Write-Error "tsconfig.json not found"
        exit 1
    }
    Write-Success "tsconfig.json found"
    
    if (-not (Test-Path $handlerPath)) {
        Write-Error "Handler not found: $handlerPath"
        exit 1
    }
    Write-Success "Handler found"
    
    if ($Clean) {
        Write-Info "Cleaning build artifacts..."
        if (Test-Path $DistDir) {
            Remove-Item $DistDir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Cleaned dist directory"
        }
    }
    
    Write-Host "`nChecking dependencies..." -ForegroundColor White
    
    try {
        $nodeVersion = & node --version
        Write-Success "Node.js version: $nodeVersion"
    }
    catch {
        Write-Error "Node.js not found. Please install Node.js 20.x or later"
        exit 1
    }
    
    try {
        $npmVersion = & npm --version
        Write-Success "npm version: $npmVersion"
    }
    catch {
        Write-Error "npm not found. Please install npm"
        exit 1
    }
    
    Write-Host "`nInstalling npm packages..." -ForegroundColor White
    Push-Location $LambdaDir
    
    try {
        & npm install --legacy-peer-deps
        Write-Success "npm packages installed"
    }
    catch {
        Write-Error "Failed to install npm packages: $_"
        exit 1
    }
    
    Write-Host "`nValidating TypeScript..." -ForegroundColor White
    try {
        & npm run validate
        Write-Success "TypeScript validation passed"
    }
    catch {
        Write-Warning "TypeScript validation warnings (non-fatal)"
    }
    
    Write-Host "`nBuilding Lambda function..." -ForegroundColor White
    try {
        & npm run build
        Write-Success "Lambda build completed"
    }
    catch {
        Write-Error "Build failed: $_"
        exit 1
    }
    
    Pop-Location
    
    Write-Host "`nVerifying build artifacts..." -ForegroundColor White
    
    $builtHandler = Join-Path $DistDir 'handlers' 'index.js'
    if (-not (Test-Path $builtHandler)) {
        Write-Error "Build artifact not found: $builtHandler"
        exit 1
    }
    Write-Success "Build artifact verified"
    
    Write-Host "`nBuild Summary:" -ForegroundColor White
    $distSize = (Get-ChildItem $DistDir -Recurse | Measure-Object -Property Length -Sum).Sum
    $distSizeMB = [math]::Round($distSize / 1MB, 2)
    Write-Info "Build output size: $distSizeMB MB"
    
    Write-Host "`nBuild completed successfully!`n" -ForegroundColor Green
    Write-Info "Next step: Run 'pwsh ./scripts/deploy.ps1 -Environment $Environment' to deploy to AWS"
    
}
catch {
    Write-Error "Build failed: $_"
    exit 1
}
