@echo off
REM 🚀 UrutiBiz Backend - Render Deployment Script (Windows)
REM This script helps you deploy to Render with all necessary configurations

echo 🚀 UrutiBiz Backend - Render Deployment Helper
echo ==============================================

REM Pre-deployment checks
echo.
echo 🔍 Running pre-deployment checks...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ✗ package.json not found! Please run this script from the project root.
    pause
    exit /b 1
)

echo ✓ Found package.json

REM Test build process
echo.
echo 🔨 Testing build process...
call npm run build
if errorlevel 1 (
    echo ✗ Build failed! Please fix build errors before deploying.
    pause
    exit /b 1
)

echo ✓ Build successful

REM Check if dist folder was created
if not exist "dist" (
    echo ✗ dist folder not found after build!
    pause
    exit /b 1
)

echo ✓ Build artifacts found

REM Generate random JWT secret
powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(64, 0)" > temp_jwt.txt
set /p JWT_SECRET=<temp_jwt.txt
del temp_jwt.txt

REM Deployment information
echo.
echo 📋 Deployment Information
echo ========================
echo.
echo ℹ Repository: https://github.com/dkubwimana/urutibiz-backend
echo ℹ Branch: main
echo ℹ Build Command: npm install ^&^& npm run build
echo ℹ Start Command: npm start
echo ℹ Health Check: /health
echo ℹ Node Version: 18+
echo.

REM Environment variables template
echo 🔧 Required Environment Variables
echo ==================================
echo.
echo Copy these to your Render web service environment:
echo.
echo # Core Configuration
echo NODE_ENV=production
echo PORT=10000
echo API_VERSION=v1
echo.
echo # Database (get from your Render PostgreSQL service^)
echo DATABASE_URL=postgresql://user:password@hostname:port/database
echo.
echo # Security (generate a secure random string^)
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRES_IN=24h
echo.
echo # CORS
echo CORS_ORIGIN=*
echo CORS_CREDENTIALS=true
echo.
echo # File Uploads
echo UPLOAD_MAX_SIZE=10485760
echo UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
echo.
echo # OCR (Optional^)
echo TESSERACT_WORKER_AMOUNT=2
echo.
echo # Demo Mode (Optional - for testing^)
echo ENABLE_DEMO_MODE=true
echo DEMO_ADMIN_EMAIL=admin@urutibiz.com
echo DEMO_ADMIN_PASSWORD=demo123
echo.

REM Step-by-step instructions
echo 📝 Step-by-Step Deployment Instructions
echo =======================================
echo.
echo 1. Create Render Account:
echo    → Go to https://render.com
echo    → Sign up with GitHub
echo.
echo 2. Create PostgreSQL Database:
echo    → Dashboard → New + → PostgreSQL
echo    → Name: urutibiz-backend-db
echo    → Plan: Free
echo    → Click 'Create Database'
echo    → Copy the DATABASE_URL when ready
echo.
echo 3. Create Web Service:
echo    → Dashboard → New + → Web Service
echo    → Connect GitHub repo: urutibiz-backend
echo    → Name: urutibiz-backend
echo    → Environment: Node
echo    → Build Command: npm install ^&^& npm run build
echo    → Start Command: npm start
echo    → Add all environment variables from above
echo    → Click 'Create Web Service'
echo.
echo 4. After Deployment:
echo    → Wait for build to complete (5-10 minutes^)
echo    → Go to web service → Shell tab
echo    → Run: npm run db:migrate
echo    → Run: npm run db:seed (optional^)
echo.
echo 5. Test Your Deployment:
echo    → Visit: https://your-app-name.onrender.com/health
echo    → Should return: {"status":"ok",...}
echo.

echo ✓ Pre-deployment checks complete!
echo ℹ Your app is ready for deployment to Render!
echo.
echo ⚠ Remember to:
echo   • Set your DATABASE_URL from Render PostgreSQL
echo   • Generate a secure JWT_SECRET
echo   • Run database migrations after deployment
echo.
echo ℹ Need help? Check RENDER_DEPLOY_GUIDE.md for detailed instructions.
echo.
pause
