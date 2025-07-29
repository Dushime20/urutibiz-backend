# Password Reset Setup Guide

## Issue Fixed ✅

The password reset emails were trying to redirect to `http://localhost:3000/reset-password` (backend) instead of `http://localhost:5173/reset-password` (frontend).

## Configuration Required

### 1. Environment Variables

Create or update your `.env` file with these settings:

```bash
# Frontend URL for password reset emails
FRONTEND_URL=http://localhost:5173

# Email Configuration (for actual email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@urutibiz.com
FROM_NAME=UrutiBiz
SUPPORT_EMAIL=support@urutibiz.com
```

### 2. Code Changes Made

✅ **Fixed in `src/services/auth.service.ts`**:
- Changed default frontend URL from `http://localhost:3000` to `http://localhost:5173`

## Testing the Fix

### Option 1: Test with API endpoints
```bash
node test-reset-password-api.js
```

### Option 2: Test the complete flow
1. Request password reset: `POST /api/v1/auth/forgot-password`
2. Check email or server logs for reset URL
3. Visit the reset URL in your browser: `http://localhost:5173/reset-password?token=YOUR_TOKEN`
4. Enter new password and submit

### Option 3: Test with existing token
The token from your error message: `ef709a8e1a1608f2626951e4ddaeafe673929a4e5d2bdc0259567eeff20df9fa`

Visit: `http://localhost:5173/reset-password?token=ef709a8e1a1608f2626951e4ddaeafe673929a4e5d2bdc0259567eeff20df9fa`

## Frontend Integration

Your frontend at `http://localhost:5173/reset-password` should:

1. **Extract the token** from the URL query parameter
2. **Validate the token** by calling: `GET /api/v1/auth/validate-reset-token/:token`
3. **Show password reset form** if token is valid
4. **Submit new password** to: `POST /api/v1/auth/reset-password`

## Security Features

- ✅ Tokens expire in 15 minutes
- ✅ Tokens are single-use
- ✅ Strong password requirements enforced
- ✅ All user sessions invalidated after reset
- ✅ Rate limiting (3 requests per hour)
- ✅ Privacy protection (same response for existing/non-existing emails)

## Troubleshooting

### Email not sending?
- Check SMTP configuration in `.env`
- In development, check server logs for reset URL
- Run: `node test-email-config.js`

### Token expired?
- Request a new password reset
- Tokens expire after 15 minutes

### Frontend not receiving token?
- Check URL format: `http://localhost:5173/reset-password?token=TOKEN`
- Ensure your frontend route handles the `token` query parameter 