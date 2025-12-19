# PowerShell script to start UrutiBiz backend + Python service locally
# Uses your existing local PostgreSQL database

Write-Host "🚀 Starting UrutiBiz Backend + Python Service (Local Mode)" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
$pythonFound = $false
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonFound = $true
        Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
    }
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonFound = $true
            Write-Host "✅ Found Python3: $pythonVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Python not found - Python service will be skipped" -ForegroundColor Yellow
        Write-Host "   Image search features will be disabled" -ForegroundColor Yellow
    }
}

Write-Host ""

# Start Python service in background (if available)
$pythonProcess = $null
if ($pythonFound) {
    Write-Host "🐍 Starting Python service..." -ForegroundColor Cyan
    Write-Host "   Service will run on: http://localhost:8001" -ForegroundColor Green
    
    $pythonServiceDir = Join-Path $PSScriptRoot "python-service"
    $mainPy = Join-Path $pythonServiceDir "main.py"
    
    if (Test-Path $mainPy) {
        # Start Python service in background
        $pythonProcess = Start-Process -FilePath "python" -ArgumentList $mainPy -WorkingDirectory $pythonServiceDir -PassThru -NoNewWindow
        Write-Host "   ✅ Python service started (PID: $($pythonProcess.Id))" -ForegroundColor Green
        Write-Host ""
        
        # Wait a bit for Python service to start
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   ⚠️  main.py not found, skipping Python service" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "   Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "   API Docs: http://localhost:3000/api-docs" -ForegroundColor Green
Write-Host ""
Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Handle Ctrl+C to stop Python service too
$null = Register-EngineEvent PowerShell.Exiting -Action {
    if ($pythonProcess -and -not $pythonProcess.HasExited) {
        Write-Host "`n🛑 Stopping Python service..." -ForegroundColor Yellow
        Stop-Process -Id $pythonProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

try {
    npm run dev
} finally {
    # Cleanup: Stop Python service when backend stops
    if ($pythonProcess -and -not $pythonProcess.HasExited) {
        Write-Host "`n🛑 Stopping Python service..." -ForegroundColor Yellow
        Stop-Process -Id $pythonProcess.Id -Force -ErrorAction SilentlyContinue
    }
}






