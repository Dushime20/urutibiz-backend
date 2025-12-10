# PowerShell script to check and start Docker Desktop

Write-Host "Checking Docker Desktop status..." -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Desktop is running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run:" -ForegroundColor Yellow
        Write-Host "  docker-compose up --build" -ForegroundColor White
        exit 0
    }
} catch {
    Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Attempting to start Docker Desktop..." -ForegroundColor Cyan

# Try to start Docker Desktop
$dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktopPath) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process $dockerDesktopPath
    Write-Host ""
    Write-Host "⏳ Waiting for Docker Desktop to start (this may take 30-60 seconds)..." -ForegroundColor Yellow
    
    # Wait for Docker to be ready (max 2 minutes)
    $timeout = 120
    $elapsed = 0
    $interval = 5
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        
        try {
            docker info 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Docker Desktop is now running!" -ForegroundColor Green
                Write-Host ""
                Write-Host "You can now run:" -ForegroundColor Yellow
                Write-Host "  docker-compose up --build" -ForegroundColor White
                exit 0
            }
        } catch {
            # Continue waiting
        }
        
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "⚠️  Docker Desktop is taking longer than expected to start." -ForegroundColor Yellow
    Write-Host "Please check Docker Desktop manually and ensure it's running." -ForegroundColor Yellow
} else {
    Write-Host "❌ Docker Desktop not found at: $dockerDesktopPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "2. Start Docker Desktop manually" -ForegroundColor White
    Write-Host "3. Wait for it to fully start (whale icon in system tray)" -ForegroundColor White
}

