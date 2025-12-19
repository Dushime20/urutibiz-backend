# PowerShell script to test PostgreSQL password
# This helps verify if the password in .env matches your actual PostgreSQL password

Write-Host "Testing PostgreSQL Password" -ForegroundColor Cyan
Write-Host ""

# Read password from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $dbPassword = ($envContent | Select-String -Pattern "^DB_PASSWORD=(.+)$").Matches.Groups[1].Value
    $dbHost = ($envContent | Select-String -Pattern "^DB_HOST=(.+)$").Matches.Groups[1].Value
    $dbPort = ($envContent | Select-String -Pattern "^DB_PORT=(.+)$").Matches.Groups[1].Value
    $dbUser = ($envContent | Select-String -Pattern "^DB_USER=(.+)$").Matches.Groups[1].Value
    $dbName = ($envContent | Select-String -Pattern "^DB_NAME=(.+)$").Matches.Groups[1].Value
    
    Write-Host "Configuration from .env:" -ForegroundColor Yellow
    Write-Host "   Host: $dbHost" -ForegroundColor White
    Write-Host "   Port: $dbPort" -ForegroundColor White
    Write-Host "   Database: $dbName" -ForegroundColor White
    Write-Host "   User: $dbUser" -ForegroundColor White
    Write-Host "   Password: $dbPassword" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    exit 1
}

# Check if psql is available
$psqlCmd = $null
try {
    $psqlVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $psqlCmd = "psql"
        Write-Host "[OK] Found psql: $psqlVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] psql not found in PATH" -ForegroundColor Yellow
    Write-Host "   Trying common PostgreSQL installation paths..." -ForegroundColor Yellow
    
    # Try common PostgreSQL paths on Windows
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "C:\Program Files\PostgreSQL\13\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $psqlCmd = $path
            Write-Host "   [OK] Found psql at: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $psqlCmd) {
    Write-Host ""
    Write-Host "[ERROR] psql not found!" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL or add psql to your PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Test password using Node.js:" -ForegroundColor Cyan
    Write-Host "   npm run db:test" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Testing connection with password from .env..." -ForegroundColor Cyan
Write-Host "   If this fails, the password in .env is incorrect" -ForegroundColor Yellow
Write-Host ""

# Set PGPASSWORD environment variable and test connection
$env:PGPASSWORD = $dbPassword

try {
    # Try to connect and run a simple query
    $testQuery = "SELECT version();"
    $result = & $psqlCmd -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Password is CORRECT! Connection successful." -ForegroundColor Green
        Write-Host ""
        Write-Host "Database version:" -ForegroundColor Cyan
        $result | Where-Object { $_ -match "PostgreSQL" } | ForEach-Object {
            Write-Host "   $_" -ForegroundColor White
        }
    } else {
        Write-Host "[ERROR] Password is INCORRECT or connection failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Yellow
        $result | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Solutions:" -ForegroundColor Cyan
        Write-Host "   1. Update DB_PASSWORD in .env to match your PostgreSQL password" -ForegroundColor Yellow
        Write-Host "   2. Or reset PostgreSQL password:" -ForegroundColor Yellow
        Write-Host "      ALTER USER postgres WITH PASSWORD 'dushime20';" -ForegroundColor White
    }
} catch {
    Write-Host "[ERROR] Failed to test connection: $_" -ForegroundColor Red
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""






