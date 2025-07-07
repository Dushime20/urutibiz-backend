@echo off
echo 🐳 Starting UrutiBiz Database Services...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Start database services
echo 📦 Starting PostgreSQL and Redis...
docker-compose up -d

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Test database connection
echo 🔍 Testing database connection...
node test-db-connection.js

echo ✅ Database setup complete!
echo.
echo 📊 Database Info:
echo   - PostgreSQL: localhost:5432
echo   - Database: postgres
echo   - User: postgres
echo   - Password: 12345
echo.
echo 🚀 You can now start the server with: npm run dev
pause
