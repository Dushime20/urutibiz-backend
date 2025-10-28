@echo off

REM Set environment variables for UrutiBiz Backend
set DB_HOST=localhost
set DB_PORT=5433
set DB_NAME=urutibiz_db
set DB_USER=postgres
set DB_PASSWORD=dushimimana20
set DB_SSL=false

REM JWT Configuration
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
set JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
set JWT_EXPIRES_IN=24h
set JWT_REFRESH_EXPIRES_IN=7d

REM Encryption
set ENCRYPTION_KEY=your-32-character-encryption-key-here

REM Application Configuration
set NODE_ENV=development
set PORT=3000
set API_PREFIX=/api/v1
set FRONTEND_URL=http://localhost:5173

REM Database Pool Configuration
set DB_MAX_CONNECTIONS=10
set DB_IDLE_TIMEOUT=10000
set DB_CONNECTION_TIMEOUT=2000

REM Email Configuration (Optional - for password reset)
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_SECURE=false
set SMTP_USER=
set SMTP_PASS=
set FROM_EMAIL=noreply@urutibiz.com
set FROM_NAME=UrutiBiz

REM CORS Configuration
set CORS_ORIGIN=http://localhost:5173,http://localhost:3000
set CORS_CREDENTIALS=true

REM Rate Limiting
set RATE_LIMIT_WINDOW=15
set RATE_LIMIT_MAX_REQUESTS=100

REM File Upload
set MAX_FILE_SIZE=10485760
set ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf

REM Logging
set LOG_LEVEL=info
set LOG_FILE=logs/app.log

REM Admin Configuration
set ADMIN_EMAIL=admin@urutibiz.com
set ADMIN_PASSWORD=SecureAdminPassword123!

REM Swagger
set SWAGGER_ENABLED=true

echo Environment variables set successfully!
echo Starting UrutiBiz Backend Server...

REM Start the server
npm run dev
