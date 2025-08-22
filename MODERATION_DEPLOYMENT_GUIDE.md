# Moderation System Deployment Guide

## 🚨 **Current Issue: Server Won't Start**

The server is failing to start due to an import error that has been fixed.

## ✅ **Issue Fixed**

**Problem:** `Cannot find module '@/utils/responseHelper'`
**Solution:** Updated import to use correct path `@/utils/response`

## 🚀 **Deployment Steps**

### **Step 1: Verify the Fix**
The import error has been fixed in `src/controllers/moderation.controller.ts`:
```typescript
// ❌ OLD (causing error):
import { ResponseHelper } from '@/utils/responseHelper';

// ✅ NEW (fixed):
import { ResponseHelper } from '@/utils/response';
```

### **Step 2: Run Database Migration**
```bash
# Navigate to your project directory
cd urutibiz-backend

# Run the migration to create the moderation_actions table
npm run migrate
# or
npx knex migrate:latest
```

### **Step 3: Restart the Server**
```bash
# Stop the current server (if running)
# Then start it again
npm run dev
# or
npm start
```

### **Step 4: Test the Server**
The server should now start without the import error.

## 🧪 **Testing the Moderation System**

### **Quick Test:**
```bash
# Test basic moderation posting
node test-moderation-posting-simple.js
```

### **Full Test:**
```bash
# Test all moderation actions API
node test-moderation-actions-api.js
```

## 📋 **What to Test First**

### **1. Server Startup**
- ✅ Server should start without import errors
- ✅ All routes should load successfully

### **2. Basic Moderation Posting**
```bash
POST /admin/products/{id}/moderate
{
  "action": "approve",
  "reason": "Product meets guidelines"
}
```

### **3. Check Moderation History**
```bash
GET /admin/moderation/actions/product/{id}
```

## 🔍 **Troubleshooting**

### **If Server Still Won't Start:**

1. **Check for other import errors:**
   ```bash
   npm run build
   # or
   npx tsc --noEmit
   ```

2. **Verify file paths:**
   - `src/utils/response.ts` exists
   - `src/services/moderation.service.ts` exists
   - `src/models/ModerationAction.model.ts` exists

3. **Check TypeScript config:**
   - Ensure `@` alias is properly configured in `tsconfig.json`

### **If Database Migration Fails:**

1. **Check database connection:**
   ```bash
   node test-db-connection.js
   ```

2. **Verify migration file exists:**
   - `database/migrations/20250707_create_moderation_actions_table.ts`

## 📱 **API Endpoints to Test**

### **Product Moderation:**
```bash
POST /admin/products/{id}/moderate
```

### **User Moderation:**
```bash
POST /admin/users/{id}/moderate
```

### **Moderation History:**
```bash
GET /admin/moderation/actions/product/{id}
GET /admin/moderation/actions/user/{id}
```

### **Moderation Statistics:**
```bash
GET /admin/moderation/stats
```

## 🎯 **Expected Results**

After successful deployment:

1. **✅ Server starts without errors**
2. **✅ Moderation actions are stored with reasons**
3. **✅ Full audit trail is maintained**
4. **✅ All API endpoints respond correctly**
5. **✅ Database table `moderation_actions` is created**

## 🚨 **Common Issues & Solutions**

### **Issue: "Cannot find module" errors**
**Solution:** Check import paths and ensure files exist

### **Issue: Database connection errors**
**Solution:** Verify database is running and credentials are correct

### **Issue: Migration fails**
**Solution:** Check database permissions and connection

### **Issue: API returns 404**
**Solution:** Ensure routes are properly registered in `admin.routes.ts`

## 📞 **Need Help?**

If you encounter any issues:

1. **Check the error logs** for specific error messages
2. **Verify all files exist** in the correct locations
3. **Test database connection** separately
4. **Check TypeScript compilation** for type errors

## 🎉 **Success Indicators**

You'll know the moderation system is working when:

- ✅ Server starts without errors
- ✅ You can POST moderation actions
- ✅ Reasons are stored in the database
- ✅ You can retrieve moderation history
- ✅ All API endpoints respond correctly

**The moderation system should now work perfectly!** 🚀
