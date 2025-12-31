# PowerShell script to start UrutiBiz backend locally (without Docker)
# Uses your existing local PostgreSQL database

Write-Host "🚀 Starting UrutiBiz Backend (Local Mode)" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating .env from template..." -ForegroundColor Yellow
    
    # Create basic .env if it doesn't exist
    @"
# Database Configuration (Local)
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

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Python Service (Optional)
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "   ✅ Created .env file - please update with your database credentials!" -ForegroundColor Green
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
npm run db:test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Database connection test failed!" -ForegroundColor Yellow
    Write-Host "   Please check your .env database settings" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ Database connection OK" -ForegroundColor Green
    Write-Host ""
}

# Check if migrations are needed
Write-Host "🔄 Checking database migrations..." -ForegroundColor Cyan
Write-Host "   Run 'npm run db:migrate' if you haven't already" -ForegroundColor Gray
Write-Host ""

# Start the server
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "   Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "   API Docs: http://localhost:3000/api-docs" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev








