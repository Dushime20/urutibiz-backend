@echo off
REM Quick PostgreSQL Docker Setup for UrutiBiz (Windows)
REM This script sets up a PostgreSQL container for development

echo 🐳 Setting up PostgreSQL with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Remove existing container if it exists
docker ps -a --format "table {{.Names}}" | findstr /C:"urutibiz-postgres" >nul
if %errorlevel% equ 0 (
    echo 🔄 Removing existing PostgreSQL container...
    docker stop urutibiz-postgres >nul 2>&1
    docker rm urutibiz-postgres >nul 2>&1
)

REM Create and start PostgreSQL container
echo 🚀 Creating PostgreSQL container...
docker run --name urutibiz-postgres ^
  -e POSTGRES_DB=urutibiz_dev ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=12345 ^
  -p 5432:5432 ^
  -d postgres:15

REM Wait for container to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 5 >nul

REM Check if container is running
docker ps --format "table {{.Names}}" | findstr /C:"urutibiz-postgres" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL container is running!
    echo.
    echo 📋 Connection Details:
    echo    Host: localhost
    echo    Port: 5432
    echo    Database: urutibiz_dev
    echo    Username: postgres
    echo    Password: 12345
    echo.
    echo 🔧 Next Steps:
    echo    1. Test connection: npm run db:setup
    echo    2. Run migrations: npm run db:migrate
    echo    3. Start development: npm run dev
    echo.
    echo 🛠️ Container Management:
    echo    Stop: docker stop urutibiz-postgres
    echo    Start: docker start urutibiz-postgres
    echo    Remove: docker stop urutibiz-postgres ^&^& docker rm urutibiz-postgres
) else (
    echo ❌ Failed to start PostgreSQL container
    echo Check Docker logs: docker logs urutibiz-postgres
    exit /b 1
)
