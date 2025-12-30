# Run All Migrations Script for Server (PowerShell)
# This script runs all pending migrations and verifies the database schema

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     UrutiBiz - Server Migration Script                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get the directory where the script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Split-Path -Parent $SCRIPT_DIR

Set-Location $BACKEND_DIR

Write-Host "📁 Working directory: $BACKEND_DIR" -ForegroundColor Gray
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Make sure your database configuration is set." -ForegroundColor Yellow
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

Write-Host "🔄 Step 1: Running all pending migrations..." -ForegroundColor Cyan
Write-Host ""

# Run migrations using knex
try {
    npx knex migrate:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed! Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Step 2: Verifying database schema..." -ForegroundColor Cyan
Write-Host ""

# Run the verification script if it exists
if (Test-Path "scripts/run-all-migrations.ts") {
    Write-Host "Running comprehensive verification..." -ForegroundColor Gray
    npm run db:migrate:all
} else {
    Write-Host "⚠️  Verification script not found, skipping detailed verification." -ForegroundColor Yellow
    Write-Host "   Basic migration completed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Migration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test booking creation"
Write-Host "   2. Verify all features work as expected"
Write-Host "   3. Check application logs for any issues"
Write-Host ""



