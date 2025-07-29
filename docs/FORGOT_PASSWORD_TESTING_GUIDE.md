# 🔐 Forgot Password Testing Guide

This guide covers how to test the complete forgot password functionality in UrutiBiz.

## 📋 Overview

The forgot password system includes:
- **Request Password Reset** - Send reset email
- **Validate Reset Token** - Check if token is valid
- **Reset Password** - Complete password reset
- **Security Features** - Rate limiting, token expiration, session invalidation

## 🚀 Quick Start Testing

### **Step 1: Request Password Reset**

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, password reset instructions have been sent."
}
```

### **Step 2: Check Development Logs**

In development mode, the reset URL will be logged to console:
```
Password reset URL (development): http://localhost:3000/reset-password?token=abc123def456ghi789
```

### **Step 3: Validate Reset Token**

```bash
curl -X GET "http://localhost:3000/api/v1/auth/validate-reset-token/abc123def456ghi789"
```

**Expected Response (Valid Token):**
```json
{
  "success": true,
  "message": "Valid token"
}
```

### **Step 4: Reset Password**

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456ghi789",
    "newPassword": "NewSecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You have been automatically logged in.",
  "data": {
    "token": "jwt_token_here",
    "sessionToken": "session_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "kyc_status": "unverified",
      "role": "user"
    }
  }
}
```

## 📱 Postman Testing

### **Postman Collection Setup**

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:3000/api/v1`
   - `email`: `user@example.com`
   - `reset_token`: (will be set after step 1)

2. **Request Password Reset:**
   ```
   Method: POST
   URL: {{base_url}}/auth/forgot-password
   Body (JSON):
   {
     "email": "{{email}}"
   }
   ```

3. **Validate Reset Token:**
   ```
   Method: GET
   URL: {{base_url}}/auth/validate-reset-token/{{reset_token}}
   ```

4. **Reset Password:**
   ```
   Method: POST
   URL: {{base_url}}/auth/reset-password
   Body (JSON):
   {
     "token": "{{reset_token}}",
     "newPassword": "NewSecurePass123!"
   }
   ```

## 🔍 Detailed Test Scenarios

### **Scenario 1: Valid Password Reset Flow**

1. **Request reset for existing email**
2. **Check console logs for reset URL**
3. **Validate the token**
4. **Reset password with strong password**
5. **Verify automatic login**

### **Scenario 2: Security Testing**

1. **Request reset for non-existent email**
   - Should return success (security through obscurity)
   
2. **Use expired token**
   - Wait 15+ minutes after token generation
   - Should return "Invalid or expired token"

3. **Use already used token**
   - Try to reset password twice with same token
   - Second attempt should fail

4. **Weak password validation**
   ```json
   {
     "token": "valid_token",
     "newPassword": "weak"
   }
   ```
   - Should return password strength error

### **Scenario 3: Rate Limiting**

1. **Make multiple reset requests quickly**
   - Should be limited to 3 requests per hour per IP
   - Check rate limit headers

### **Scenario 4: Session Invalidation**

1. **Login with old password** (should fail)
2. **Login with new password** (should succeed)
3. **Check that old sessions are invalidated**

## 🛠️ Development Testing

### **Environment Variables**

Add these to your `.env` file:
```env
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@urutibiz.com
NODE_ENV=development
```

### **Database Verification**

Check the `password_reset_tokens` table:
```sql
SELECT * FROM password_reset_tokens 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC;
```

### **Email Service Testing**

If EmailService is not configured, check console logs:
```javascript
// In development, reset URLs are logged
console.log('Password reset URL (development):', resetUrl);
```

## 🔧 API Endpoints Reference

### **POST /api/v1/auth/forgot-password**
- **Purpose**: Request password reset
- **Body**: `{ "email": "user@example.com" }`
- **Response**: Success message (always 200 for security)

### **GET /api/v1/auth/validate-reset-token/:token**
- **Purpose**: Validate reset token
- **Params**: `token` (path parameter)
- **Response**: Token validity status

### **POST /api/v1/auth/reset-password**
- **Purpose**: Complete password reset
- **Body**: `{ "token": "...", "newPassword": "..." }`
- **Response**: Success with user data and tokens

## 🔒 Security Features

### **Token Security**
- ✅ 32-byte random token generation
- ✅ 15-minute expiration
- ✅ Single-use tokens
- ✅ Secure storage in database

### **Password Security**
- ✅ Strong password requirements
- ✅ Secure bcrypt hashing
- ✅ Session invalidation after reset

### **Rate Limiting**
- ✅ 3 requests per hour per IP
- ✅ Protection against abuse

### **Privacy Protection**
- ✅ Same response for existing/non-existing emails
- ✅ No user enumeration possible

## 🐛 Troubleshooting

### **Common Issues**

1. **"Email sending failed"**
   - Check EmailService configuration
   - In development, check console logs for reset URL

2. **"Invalid or expired token"**
   - Token expires after 15 minutes
   - Token can only be used once
   - Check database for token status

3. **"Password must be at least 8 characters..."**
   - Password must contain: uppercase, lowercase, number, special character
   - Minimum 8 characters

4. **Rate limiting errors**
   - Wait 1 hour or use different IP
   - Check rate limit configuration

### **Database Queries for Debugging**

```sql
-- Check reset tokens
SELECT * FROM password_reset_tokens 
WHERE user_id = 'your_user_id';

-- Check user sessions
SELECT * FROM user_sessions 
WHERE user_id = 'your_user_id';

-- Check user password hash
SELECT email, password_hash FROM users 
WHERE email = 'user@example.com';
```

## 📊 Testing Checklist

- [ ] Request password reset for existing email
- [ ] Request password reset for non-existing email
- [ ] Validate reset token (valid case)
- [ ] Validate reset token (invalid case)
- [ ] Reset password with strong password
- [ ] Reset password with weak password
- [ ] Use expired token
- [ ] Use already used token
- [ ] Test rate limiting
- [ ] Verify session invalidation
- [ ] Test automatic login after reset
- [ ] Verify old password no longer works

## 🎯 Success Criteria

✅ **User can request password reset**
✅ **Reset email is sent (or URL logged in dev)**
✅ **Token validation works correctly**
✅ **Password reset completes successfully**
✅ **User is automatically logged in**
✅ **Old sessions are invalidated**
✅ **Security features work as expected**
✅ **Rate limiting prevents abuse**

This comprehensive testing guide ensures your forgot password functionality is secure, reliable, and user-friendly! 