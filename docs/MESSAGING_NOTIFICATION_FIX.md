# Messaging Notification Fix - Server Deployment Guide

## Problem
Messages work locally but notifications are not being sent on the server when renters send messages to owners.

## Root Causes

### 1. Code Not Deployed
The notification code was just added to `MessagingService.sendMessage()`. If the server hasn't been restarted or the code hasn't been deployed, notifications won't work.

### 2. Server in Demo Mode
If `NODE_ENV=demo` on the server, external services (including email) may be disabled.

### 3. Email Service Not Configured
Email service requires proper SMTP configuration on the server.

### 4. Missing Environment Variables
Notification services need proper environment variables configured.

## Solution Steps

### Step 1: Deploy Updated Code
```bash
# On your server
cd ~/urutibz/urutibiz-backend

# Pull latest code
git pull origin main  # or your branch name

# Rebuild TypeScript
npm run build

# Restart the server
pm2 restart all
# or
npm run start
```

### Step 2: Check Server Environment
```bash
# Check if server is in demo mode
echo $NODE_ENV

# If it shows "demo", change it to "production" in .env
# Edit .env file
nano .env

# Change:
# NODE_ENV=production  # NOT "demo"
```

### Step 3: Verify Email Configuration
Check your `.env` file on the server has email settings:

```bash
# Required email settings
SMTP_HOST=smtp.gmail.com  # or your SMTP server
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@urutibz.com
SMTP_SECURE=false  # true for port 465
```

### Step 4: Test Notification Service
```bash
# Check if notification service is working
node -e "
const { NotificationEngine } = require('./dist/services/notification/NotificationEngine');
const engine = new NotificationEngine();
console.log('NotificationEngine initialized:', !!engine);
"
```

### Step 5: Check Server Logs
```bash
# Watch server logs for notification errors
pm2 logs
# or
tail -f logs/app.log

# Look for:
# - [MessagingService] Notification sent to recipient...
# - [MessagingService] Failed to send notification...
# - Email service errors
```

### Step 6: Verify Database
Make sure the notification tables exist:
```bash
node scripts/check-migration-status.js
node scripts/fix-messaging-tables.js
```

## Debugging Checklist

### ✅ Code Deployment
- [ ] Latest code pulled from repository
- [ ] TypeScript compiled (`npm run build`)
- [ ] Server restarted after code changes

### ✅ Environment Configuration
- [ ] `NODE_ENV=production` (not "demo")
- [ ] Email SMTP settings configured
- [ ] Database connection working
- [ ] All environment variables set

### ✅ Service Status
- [ ] Server is running
- [ ] Database is connected
- [ ] No errors in server logs
- [ ] Notification service initialized

### ✅ Testing
- [ ] Send a test message from renter to owner
- [ ] Check server logs for notification attempts
- [ ] Check email inbox (including spam)
- [ ] Check in-app notifications in database

## Common Issues

### Issue 1: "Running in DEMO mode"
**Solution:** Change `NODE_ENV` from `demo` to `production` in `.env` file

### Issue 2: Email Not Sending
**Solution:** 
- Verify SMTP credentials
- Check firewall allows SMTP port
- Test email service separately

### Issue 3: Code Not Updated
**Solution:**
```bash
# Force rebuild
npm run clean
npm run build
pm2 restart all
```

### Issue 4: Database Errors
**Solution:**
```bash
# Run migration fixes
node scripts/fix-messaging-tables.js
```

## Verification

After deploying, test by:

1. **Send a message** from renter to owner
2. **Check server logs** for:
   ```
   [MessagingService] Notification sent to recipient <owner-id> for message <message-id>
   ```
3. **Check owner's email** (including spam folder)
4. **Check in-app notifications** in the database:
   ```sql
   SELECT * FROM notifications 
   WHERE recipient_id = '<owner-id>' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## Quick Fix Command

Run this on your server to check everything:

```bash
cd ~/urutibz/urutibiz-backend

# 1. Check environment
echo "NODE_ENV: $NODE_ENV"

# 2. Check if code is compiled
ls -la dist/services/messaging.service.js

# 3. Check email config
grep -E "SMTP_|EMAIL_" .env

# 4. Restart server
pm2 restart all

# 5. Check logs
pm2 logs --lines 50
```

## Still Not Working?

1. **Check server logs** for specific error messages
2. **Verify email service** is working independently
3. **Test notification** directly:
   ```javascript
   // In server console or test script
   const { NotificationEngine } = require('./dist/services/notification/NotificationEngine');
   const engine = new NotificationEngine();
   
   await engine.sendNotification({
     type: 'BOOKING_REMINDER',
     recipientId: '<test-user-id>',
     recipientEmail: '<test-email>',
     title: 'Test Notification',
     message: 'This is a test',
     channels: ['EMAIL', 'IN_APP']
   });
   ```

4. **Check database** for notification records:
   ```sql
   SELECT * FROM notifications 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

