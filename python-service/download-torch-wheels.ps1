# PowerShell script to pre-download torch and torchvision wheels
# This speeds up Docker builds by avoiding downloading large packages during build

Write-Host "Pre-downloading torch and torchvision wheels..." -ForegroundColor Cyan
Write-Host "   This will download ~2GB of packages to ./wheels/" -ForegroundColor Yellow
Write-Host ""

# Create wheels directory
$wheelsDir = Join-Path $PSScriptRoot "wheels"
if (-not (Test-Path $wheelsDir)) {
    New-Item -ItemType Directory -Path $wheelsDir | Out-Null
    Write-Host "[OK] Created wheels directory: $wheelsDir" -ForegroundColor Green
}

# Check if Python is available
$pythonCmd = $null
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonCmd = "python"
        Write-Host "[OK] Found Python: $pythonVersion" -ForegroundColor Green
    }
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCmd = "python3"
            Write-Host "[OK] Found Python3: $pythonVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Python not found! Please install Python 3.11+" -ForegroundColor Red
        exit 1
    }
}

if (-not $pythonCmd) {
    Write-Host "❌ Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Upgrade pip first
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Cyan
& $pythonCmd -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] pip upgrade failed, continuing anyway..." -ForegroundColor Yellow
}

# Download torch and torchvision wheels
Write-Host ""
Write-Host "Downloading torch (this may take 10-20 minutes)..." -ForegroundColor Cyan
Write-Host "   Package size: ~1.5GB" -ForegroundColor Yellow
Write-Host "   Platform: Linux x86_64 (for Docker container)" -ForegroundColor Gray

# Download wheels for Linux (Docker container), not Windows
# We need manylinux wheels that work in the Docker container
& $pythonCmd -m pip download `
    --only-binary=:all: `
    --platform manylinux_2_27_x86_64 `
    --platform manylinux_2_28_x86_64 `
    --platform manylinux1_x86_64 `
    --platform linux_x86_64 `
    --python-version 311 `
    --abi cp311 `
    --dest $wheelsDir `
    torch>=2.1.0 torchvision>=0.16.0 `
    --no-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Successfully downloaded torch wheels!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Downloaded files:" -ForegroundColor Cyan
    Get-ChildItem $wheelsDir | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        $sizeText = "$sizeMB MB"
        Write-Host "   - $($_.Name) ($sizeText)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "[OK] Ready! Now Docker builds will use these local wheels." -ForegroundColor Green
    Write-Host "   Next step: Build Docker image with BuildKit enabled" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Failed to download torch wheels" -ForegroundColor Red
    Write-Host "   You can still build Docker image, it will download during build" -ForegroundColor Yellow
    exit 1
}

