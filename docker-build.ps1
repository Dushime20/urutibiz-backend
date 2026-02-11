# =============================================================================
# UrutiBiz Backend - Docker Build Script (PowerShell)
# =============================================================================
# Description: Professional Docker build script for Windows
# Usage: .\docker-build.ps1 -Environment production -Push
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('production', 'prod', 'development', 'dev', 'testing', 'test')]
    [string]$Environment,
    
    [switch]$Push,
    [switch]$NoCache,
    [switch]$NoTest,
    [switch]$Help
)

# Configuration
$APP_NAME = "urutibiz-backend"
$VERSION = "1.0.0"
$REGISTRY = "docker.io"
$NAMESPACE = "urutibiz"
$BUILD_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$VCS_REF = try { (git rev-parse --short HEAD 2>$null) } catch { "unknown" }

# Colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

function Show-Header {
    param([string]$Title)
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  $Title" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
}

function Show-Usage {
    @"
Usage: .\docker-build.ps1 -Environment <env> [options]

Environments:
  production, prod     Build production image
  development, dev     Build development image
  testing, test        Build testing image

Options:
  -Push               Push image to registry after build
  -NoCache            Build without using cache
  -NoTest             Skip image testing
  -Help               Show this help message

Examples:
  .\docker-build.ps1 -Environment production
  .\docker-build.ps1 -Environment production -Push
  .\docker-build.ps1 -Environment development -NoCache
  .\docker-build.ps1 -Environment testing -NoTest
"@
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed"
        exit 1
    }
    
    # Check Docker daemon
    try {
        docker info | Out-Null
    } catch {
        Write-Error "Docker daemon is not running"
        exit 1
    }
    
    # Check required files
    if (-not (Test-Path "Dockerfile")) {
        Write-Error "Dockerfile not found"
        exit 1
    }
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

function Get-EnvironmentConfig {
    param([string]$Env)
    
    switch ($Env) {
        { $_ -in 'production', 'prod' } {
            return @{
                Env = 'production'
                Target = 'production'
                TagSuffix = ''
            }
        }
        { $_ -in 'development', 'dev' } {
            return @{
                Env = 'development'
                Target = 'development'
                TagSuffix = '-dev'
            }
        }
        { $_ -in 'testing', 'test' } {
            return @{
                Env = 'testing'
                Target = 'testing'
                TagSuffix = '-test'
            }
        }
        default {
            Write-Error "Invalid environment: $Env"
            exit 1
        }
    }
}

function Build-DockerImage {
    param($Config)
    
    Show-Header "Building Docker Image"
    
    Write-Info "Environment: $($Config.Env)"
    Write-Info "Target: $($Config.Target)"
    Write-Info "Version: $VERSION"
    Write-Info "Build Date: $BUILD_DATE"
    Write-Info "VCS Ref: $VCS_REF"
    
    $cacheFlag = if ($NoCache) { "--no-cache" } else { "" }
    
    $buildArgs = @(
        "build",
        "--target", $Config.Target,
        "--build-arg", "NODE_ENV=$($Config.Env)",
        "--build-arg", "APP_VERSION=$VERSION",
        "--build-arg", "BUILD_DATE=$BUILD_DATE",
        "--build-arg", "VCS_REF=$VCS_REF",
        "--tag", "${APP_NAME}:${VERSION}$($Config.TagSuffix)",
        "--tag", "${APP_NAME}:latest$($Config.TagSuffix)",
        "--progress=plain"
    )
    
    if ($cacheFlag) {
        $buildArgs += $cacheFlag
    }
    
    $buildArgs += "."
    
    & docker $buildArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Image built successfully"
    } else {
        Write-Error "Image build failed"
        exit 1
    }
}

function Test-DockerImage {
    param($Config)
    
    Show-Header "Testing Docker Image"
    
    Write-Info "Running image tests..."
    
    # Test 1: Check if image exists
    $imageExists = docker image inspect "${APP_NAME}:latest$($Config.TagSuffix)" 2>$null
    if ($imageExists) {
        Write-Success "Image exists"
    } else {
        Write-Error "Image not found"
        exit 1
    }
    
    # Test 2: Check image size
    $size = docker image inspect "${APP_NAME}:latest$($Config.TagSuffix)" --format='{{.Size}}' | ForEach-Object { [math]::Round($_ / 1MB, 2) }
    Write-Info "Image size: $size MB"
    
    # Test 3: Check for vulnerabilities (if trivy is installed)
    if (Get-Command trivy -ErrorAction SilentlyContinue) {
        Write-Info "Scanning for vulnerabilities..."
        trivy image --severity HIGH,CRITICAL "${APP_NAME}:latest$($Config.TagSuffix)"
    } else {
        Write-Warning "Trivy not installed, skipping vulnerability scan"
    }
    
    # Test 4: Run container health check (production only)
    if ($Config.Env -eq 'production') {
        Write-Info "Starting container for health check..."
        
        docker run -d `
            --name "${APP_NAME}-test" `
            -p 10001:10000 `
            -e NODE_ENV=production `
            -e DB_HOST=localhost `
            -e REDIS_HOST=localhost `
            "${APP_NAME}:latest$($Config.TagSuffix)" 2>$null
        
        Start-Sleep -Seconds 10
        
        $healthCheck = docker exec "${APP_NAME}-test" node healthcheck.js 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Health check passed"
        } else {
            Write-Warning "Health check failed (may need database connection)"
        }
        
        docker stop "${APP_NAME}-test" 2>$null | Out-Null
        docker rm "${APP_NAME}-test" 2>$null | Out-Null
    }
    
    Write-Success "Image tests completed"
}

function Add-ImageTags {
    param($Config)
    
    Show-Header "Tagging Image"
    
    $fullImage = "${REGISTRY}/${NAMESPACE}/${APP_NAME}"
    
    docker tag "${APP_NAME}:${VERSION}$($Config.TagSuffix)" "${fullImage}:${VERSION}$($Config.TagSuffix)"
    docker tag "${APP_NAME}:latest$($Config.TagSuffix)" "${fullImage}:latest$($Config.TagSuffix)"
    
    Write-Success "Image tagged: ${fullImage}:${VERSION}$($Config.TagSuffix)"
    Write-Success "Image tagged: ${fullImage}:latest$($Config.TagSuffix)"
}

function Push-DockerImage {
    param($Config)
    
    Show-Header "Pushing Image to Registry"
    
    $fullImage = "${REGISTRY}/${NAMESPACE}/${APP_NAME}"
    
    Write-Info "Pushing ${fullImage}:${VERSION}$($Config.TagSuffix)..."
    docker push "${fullImage}:${VERSION}$($Config.TagSuffix)"
    
    Write-Info "Pushing ${fullImage}:latest$($Config.TagSuffix}..."
    docker push "${fullImage}:latest$($Config.TagSuffix)"
    
    Write-Success "Images pushed successfully"
}

function Show-Summary {
    param($Config)
    
    Show-Header "Build Summary"
    
    Write-Host "Environment:  $($Config.Env)" -ForegroundColor Yellow
    Write-Host "Version:      $VERSION" -ForegroundColor Yellow
    Write-Host "Build Date:   $BUILD_DATE" -ForegroundColor Yellow
    Write-Host "VCS Ref:      $VCS_REF" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Local Images:" -ForegroundColor Yellow
    docker images $APP_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    Write-Host ""
    
    if ($Push) {
        Write-Host "✓ Images pushed to registry" -ForegroundColor Green
    } else {
        Write-Host "ℹ Images not pushed (use -Push flag)" -ForegroundColor Yellow
    }
}

# Main execution
try {
    if ($Help) {
        Show-Usage
        exit 0
    }
    
    Show-Header "UrutiBiz Backend - Docker Build"
    
    Test-Prerequisites
    $config = Get-EnvironmentConfig -Env $Environment
    Build-DockerImage -Config $config
    
    if (-not $NoTest) {
        Test-DockerImage -Config $config
    }
    
    if ($Push) {
        Add-ImageTags -Config $config
        Push-DockerImage -Config $config
    }
    
    Show-Summary -Config $config
    
    Write-Success "Build process completed successfully!"
    
} catch {
    Write-Error "Build process failed: $_"
    exit 1
}
