@echo off
REM Database Configuration Switcher for UrutiBiz Backend (Windows)
REM Usage: switch-db.bat [docker|local]

if "%1"=="docker" (
    echo 🐳 Switching to Docker database configuration...
    echo DB_HOST=localhost > .env.temp
    echo DB_PORT=5433 >> .env.temp
    echo DB_NAME=postgres >> .env.temp
    echo DB_USER=postgres >> .env.temp
    echo DB_PASSWORD=12345 >> .env.temp
    echo DB_SSL=false >> .env.temp
    echo ✅ Docker database configuration set!
    echo 📋 Database: postgres@localhost:5433
    echo 🔧 PostGIS: Pre-installed
    goto :copy_env
)

if "%1"=="local" (
    echo 💻 Switching to Local database configuration...
    echo DB_HOST=localhost > .env.temp
    echo DB_PORT=5432 >> .env.temp
    echo DB_NAME=rent_db >> .env.temp
    echo DB_USER=postgres >> .env.temp
    echo DB_PASSWORD=dushimimana20 >> .env.temp
    echo DB_SSL=false >> .env.temp
    echo ✅ Local database configuration set!
    echo 📋 Database: rent_db@localhost:5432
    echo ⚠️  Note: PostGIS needs to be installed on local PostgreSQL
    goto :copy_env
)

echo ❌ Usage: switch-db.bat [docker^|local]
echo.
echo 🐳 docker  - Use Docker PostgreSQL with PostGIS
echo 💻 local   - Use Local PostgreSQL (requires PostGIS installation)
exit /b 1

:copy_env
REM Copy other environment variables from existing .env
if exist .env (
    findstr /v "^DB_" .env >> .env.temp
)

REM Replace .env with new configuration
move .env.temp .env

echo.
echo 🚀 Next steps:
echo    1. Run migrations: npm run db:migrate
echo    2. Seed data: npm run db:seed
echo    3. Start server: npm run dev



