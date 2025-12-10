# PowerShell script to build Docker image with optional pre-downloaded wheels
# Usage: .\build-docker.ps1 [--use-wheels]

param(
    [switch]$UseWheels
)

Write-Host "🐳 Building Python Service Docker Image..." -ForegroundColor Cyan
Write-Host ""

# Enable BuildKit
$env:DOCKER_BUILDKIT = "1"

# Check if wheels directory exists and has files
$wheelsDir = Join-Path $PSScriptRoot "wheels"
$hasWheels = (Test-Path $wheelsDir) -and ((Get-ChildItem $wheelsDir -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)

if ($hasWheels) {
    Write-Host "✅ Found pre-downloaded wheels in ./wheels/" -ForegroundColor Green
    Write-Host "   Build will use local wheels (much faster!)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  No pre-downloaded wheels found" -ForegroundColor Yellow
    Write-Host "   To speed up builds, run: .\download-torch-wheels.ps1" -ForegroundColor Yellow
    Write-Host "   Build will download from PyPI (will take 10-20 minutes)" -ForegroundColor Yellow
    Write-Host ""
    
    # Create empty wheels directory so COPY doesn't fail
    if (-not (Test-Path $wheelsDir)) {
        New-Item -ItemType Directory -Path $wheelsDir -Force | Out-Null
        # Create placeholder file so directory isn't empty
        New-Item -ItemType File -Path (Join-Path $wheelsDir ".gitkeep") -Force | Out-Null
    }
}

# Build the image
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
Write-Host ""

$buildArgs = @(
    "build",
    "-t", "urutibiz-python-service:latest",
    "-f", "Dockerfile",
    "."
)

docker @buildArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

