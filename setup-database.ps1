#!/usr/bin/env pwsh

Write-Host "Setting up UrutiBiz Database..." -ForegroundColor Green
Write-Host ""

# Check if Docker is available
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and start it, then run this script again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.database.yml up -d

Write-Host ""
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Yellow
node scripts/test-db-config.js

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To stop the database:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.database.yml down" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
