@echo off
echo Setting up UrutiBiz Database...
echo.

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and start it, then run this script again
    pause
    exit /b 1
)

echo Starting PostgreSQL and Redis containers...
docker-compose -f docker-compose.database.yml up -d

echo.
echo Waiting for database to be ready...
timeout /t 10 >nul

echo.
echo Testing database connection...
node scripts/test-db-config.js

echo.
echo Database setup complete!
echo.
echo You can now run:
echo   npm run dev
echo.
echo To stop the database:
echo   docker-compose -f docker-compose.database.yml down
echo.
pause
