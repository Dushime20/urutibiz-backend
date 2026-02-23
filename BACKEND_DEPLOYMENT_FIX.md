# Backend API Deployment Fix

## Issue Fixed
The backend API container was failing with error: `accountSid must start with AC`

## Root Cause
The `docker-compose.yml` wasn't passing Twilio and other environment variables from `.env` file to the API container.

## Solution Applied
Updated `docker-compose.yml` to include all required environment variables:
- Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- Email/SMTP configuration
- Cloudinary credentials
- Firebase credentials
- API configuration
- All other service credentials

## Deploy the Fix

```bash
cd /opt/urutibiz/urutibiz-backend
docker compose down
docker compose up -d --build
```

## Verify Deployment

```bash
# Check all containers are healthy
docker compose ps

# Watch API logs
docker compose logs -f api

# Test health endpoint
curl http://localhost:3000/health
```

## Expected Result
- All containers should show "healthy" status
- API logs should show successful startup without Twilio errors
- Health endpoint should return 200 OK

## Test Backend API from Windows CMD

```cmd
curl http://38.242.224.199:3000/health
```

Or test in browser: http://38.242.224.199:3000/health
