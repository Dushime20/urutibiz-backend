#!/bin/bash

# Set environment variables for UrutiBiz Backend
export DB_HOST=localhost
export DB_PORT=5433
export DB_NAME=urutibiz_db
export DB_USER=postgres
export DB_PASSWORD=dushimimana20
export DB_SSL=false

# JWT Configuration
export JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
export JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
export JWT_EXPIRES_IN=24h
export JWT_REFRESH_EXPIRES_IN=7d

# Encryption
export ENCRYPTION_KEY=your-32-character-encryption-key-here

# Application Configuration
export NODE_ENV=development
export PORT=3000
export API_PREFIX=/api/v1
export FRONTEND_URL=http://localhost:5173

# Database Pool Configuration
export DB_MAX_CONNECTIONS=10
export DB_IDLE_TIMEOUT=10000
export DB_CONNECTION_TIMEOUT=2000

# Email Configuration (Optional - for password reset)
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_SECURE=false
export SMTP_USER=
export SMTP_PASS=
export FROM_EMAIL=noreply@urutibiz.com
export FROM_NAME=UrutiBiz

# CORS Configuration
export CORS_ORIGIN=http://localhost:5173,http://localhost:3000
export CORS_CREDENTIALS=true

# Rate Limiting
export RATE_LIMIT_WINDOW=15
export RATE_LIMIT_MAX_REQUESTS=100

# File Upload
export MAX_FILE_SIZE=10485760
export ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf

# Logging
export LOG_LEVEL=info
export LOG_FILE=logs/app.log

# Admin Configuration
export ADMIN_EMAIL=admin@urutibiz.com
export ADMIN_PASSWORD=SecureAdminPassword123!

# Swagger
export SWAGGER_ENABLED=true

echo "Environment variables set successfully!"
echo "Starting UrutiBiz Backend Server..."

# Start the server
npm run dev
