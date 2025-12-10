# PowerShell script to fix database configuration in .env file
# Updates DB_PORT and helps verify password

Write-Host "Fixing Database Configuration" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "   Creating new .env file..." -ForegroundColor Yellow
    
    @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5434
DB_NAME=urutibiz_db
DB_USER=postgres
DB_PASSWORD=dushime20
DB_SSL=false

# Redis (Optional - set to false to disable)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Python Service (Optional)
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001
"@ | Out-File -FilePath $envFile -Encoding utf8
    
    Write-Host "   [OK] Created .env file with default settings" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Updating .env file..." -ForegroundColor Cyan
    
    # Read current .env
    $content = Get-Content $envFile -Raw
    
    # Fix DB_PORT if it's 5432
    if ($content -match "DB_PORT=5432") {
        $content = $content -replace "DB_PORT=5432", "DB_PORT=5434"
        Write-Host "   [OK] Updated DB_PORT from 5432 to 5434" -ForegroundColor Green
    } elseif ($content -notmatch "DB_PORT=") {
        # Add DB_PORT if missing
        if ($content -match "DB_HOST=") {
            $content = $content -replace "(DB_HOST=[^\r\n]+)", "`$1`r`nDB_PORT=5434"
        } else {
            $content = "DB_PORT=5434`r`n" + $content
        }
        Write-Host "   [OK] Added DB_PORT=5434" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] DB_PORT already set (check if it's 5434)" -ForegroundColor Gray
    }
    
    # Check/update password
    if ($content -match "DB_PASSWORD=([^\r\n]+)") {
        $currentPassword = $matches[1]
        Write-Host "   [INFO] Current DB_PASSWORD is set (hidden)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   [WARNING] If password authentication fails, update DB_PASSWORD in .env" -ForegroundColor Yellow
        Write-Host "      Expected password: dushime20" -ForegroundColor Yellow
    } else {
        # Add DB_PASSWORD if missing
        if ($content -match "DB_USER=") {
            $content = $content -replace "(DB_USER=[^\r\n]+)", "`$1`r`nDB_PASSWORD=dushime20"
        } else {
            $content = "DB_PASSWORD=dushime20`r`n" + $content
        }
        Write-Host "   [OK] Added DB_PASSWORD=dushime20" -ForegroundColor Green
    }
    
    # Ensure DB_NAME is set
    if ($content -notmatch "DB_NAME=") {
        if ($content -match "DB_PORT=") {
            $content = $content -replace "(DB_PORT=[^\r\n]+)", "`$1`r`nDB_NAME=urutibiz_db"
        } else {
            $content = "DB_NAME=urutibiz_db`r`n" + $content
        }
        Write-Host "   [OK] Added DB_NAME=urutibiz_db" -ForegroundColor Green
    }
    
    # Save updated .env
    $content | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "[OK] .env file updated!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current Database Configuration:" -ForegroundColor Cyan
$envContent = Get-Content $envFile
$envContent | Where-Object { $_ -match "^DB_" } | ForEach-Object {
    if ($_ -match "PASSWORD") {
        Write-Host "   $_" -ForegroundColor Gray
    } else {
        Write-Host "   $_" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify your PostgreSQL password is correct" -ForegroundColor Yellow
Write-Host "   2. Test connection: npm run db:test" -ForegroundColor Yellow
Write-Host "   3. If password is wrong, update DB_PASSWORD in .env manually" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to test connection
$test = Read-Host "Would you like to test the database connection now? (y/n)"
if ($test -eq "y" -or $test -eq "Y") {
    Write-Host ""
    Write-Host "Testing database connection..." -ForegroundColor Cyan
    npm run db:test
}

