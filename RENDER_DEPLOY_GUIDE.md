# 🚀 Deploy UrutiBiz Backend to Render - Step by Step

## 🎉 DEPLOYMENT STATUS: TYPESCRIPT BUILD FIXED ✅

### Latest Updates (✅ COMPLETED)
- **CRITICAL FIX**: Moved TypeScript types from devDependencies to dependencies
- **ROOT CAUSE**: Render production builds don't install devDependencies, causing missing `@types/*` packages
- **SOLUTION**: Moved essential TypeScript packages to dependencies:
  - `@types/express`, `@types/compression`, `@types/morgan`
  - `@types/swagger-jsdoc`, `@types/swagger-ui-express`  
  - `@types/passport*`, `@types/uuid`, `@types/bcryptjs`
  - `@types/jsonwebtoken`, `@types/multer`, `@types/nodemailer`
  - `typescript` compiler itself
- **CLEANUP**: Fixed TypeScript warnings (unused imports, parameters)
- **STATUS**: ✅ Local build passes, new deployment triggered
- **NEXT**: Monitor Render build logs for successful deployment

## Quick Deployment Checklist

### Prerequisites ✅
- [x] GitHub repository: `https://github.com/dkubwimana/urutibiz-backend`
- [x] Render account: [render.com](https://render.com)
- [x] Project is ready with build scripts
- [x] All TypeScript dependencies installed
- [x] Build process tested and working

## Step 1: Create Render Account & Database

### 1.1 Sign up for Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### 1.2 Create PostgreSQL Database
1. **In Render Dashboard → Click "New +"**
2. **Select "PostgreSQL"**
3. **Configure Database:**
   ```
   Database Name: urutibiz-backend-db
   Database User: urutibiz_user
   Region: Oregon (US West) or Frankfurt (Europe)
   PostgreSQL Version: 15 (latest)
   Plan: Free (0$)
   ```
4. **Click "Create Database"**
5. **Wait for database to initialize** (2-3 minutes)
6. **Copy Database URL** - You'll need this!

## Step 2: Deploy Web Service

### 2.1 Create Web Service
1. **In Render Dashboard → Click "New +"**
2. **Select "Web Service"**
3. **Select "Build and deploy from a Git repository"**

### 2.2 Connect GitHub Repository
1. **Click "Connect account"** (if not already connected)
2. **Search for: `urutibiz-backend`**
3. **Click "Connect"**

### 2.3 Configure Service Settings
```
Name: urutibiz-backend
Environment: Node
Region: [Same as your database]
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

### 2.4 Set Instance Type
- **Free Plan**: Select "Free" (512 MB RAM, shared CPU)
- **For Production**: Consider "Starter" ($7/month) for better performance

## Step 3: Configure Environment Variables

**In the Environment section, add these variables:**

### Core Database Configuration
```bash
DATABASE_URL=postgresql://user:password@hostname:port/database
NODE_ENV=production
PORT=10000
```

### Application Configuration
```bash
API_VERSION=v1
JWT_SECRET=your-super-secure-jwt-secret-here-make-it-long-and-random
JWT_EXPIRES_IN=24h
```

### CORS Configuration
```bash
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

### Upload Configuration
```bash
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### OCR Configuration (Optional)
```bash
TESSERACT_WORKER_AMOUNT=2
```

### Demo Mode (Optional - for testing)
```bash
ENABLE_DEMO_MODE=true
DEMO_ADMIN_EMAIL=admin@urutibiz.com
DEMO_ADMIN_PASSWORD=demo123
```

## Step 4: Deploy!

1. **Click "Create Web Service"**
2. **Wait for Build & Deploy** (5-10 minutes first time)
3. **Monitor logs** for any errors

## Step 5: Database Setup

### 5.1 Run Migrations
After successful deployment, you'll need to run database migrations:

**Option A: Using Render Shell (Recommended)**
1. Go to your web service dashboard
2. Click "Shell" tab
3. Run: `npm run db:migrate`

**Option B: Local with Remote Database**
1. Copy your DATABASE_URL from Render
2. Set it in your local .env
3. Run: `npm run db:migrate`

### 5.2 Seed Database (Optional)
```bash
npm run db:seed
```

## Step 6: Test Your Deployment

### Health Check
Your app will be available at: `https://your-app-name.onrender.com`

Test endpoints:
- Health: `https://your-app-name.onrender.com/health`
- API Health: `https://your-app-name.onrender.com/api/v1/health`
- API Root: `https://your-app-name.onrender.com/api/v1`

### Expected Response
```json
{
  "status": "ok",
  "timestamp": "2025-07-06T...",
  "version": "1.0.0",
  "uptime": "0:00:30"
}
```

## 🎯 Quick Deploy Commands

### For Immediate Deployment:
1. **Database**: Create PostgreSQL on Render
2. **Web Service**: Connect GitHub repo `urutibiz-backend`
3. **Environment**: Set DATABASE_URL + JWT_SECRET
4. **Deploy**: Click "Create Web Service"
5. **Migrate**: Run `npm run db:migrate` in Shell

## 🔧 Troubleshooting

### Common Issues:

**Build Fails:**
- Check Node.js version (should be 18+)
- Verify package.json scripts exist
- Check build logs for specific errors

**App Crashes:**
- Database connection issues (check DATABASE_URL)
- Missing environment variables
- Port conflicts (ensure PORT=10000)

**Database Issues:**
- Run migrations: `npm run db:migrate`
- Check database URL format
- Verify database is running

## 🔧 Troubleshooting Docker Build Errors

### Issue: "failed to compute cache key" or "/logs not found"

If you see Docker-related errors during build, **Render might be incorrectly detecting your app as a Docker app**. Here's how to fix it:

#### Solution 1: Force Native Node.js Build
1. **In your Render Web Service settings:**
   - Go to "Settings" tab
   - Under "Build & Deploy"
   - Set **Environment**: `Node`
   - Ensure **Build Command**: `npm install && npm run build`
   - Ensure **Start Command**: `npm start`
   - **DO NOT** select Docker environment

#### Solution 2: Temporarily Rename/Remove Dockerfile
1. **Rename Dockerfile temporarily:**
   ```bash
   git mv Dockerfile Dockerfile.backup
   git commit -m "temp: disable Docker for Render native build"
   git push
   ```

2. **Redeploy on Render** - it should now use native Node.js

3. **Restore Dockerfile later:**
   ```bash
   git mv Dockerfile.backup Dockerfile
   git commit -m "restore: Dockerfile for local development"
   git push
   ```

#### Solution 3: Use .renderignore
Create a `.renderignore` file to exclude Docker files:
```
Dockerfile
docker-compose*.yml
.dockerignore
```

### Expected Build Process (Native Node.js)
```
[INFO] Installing dependencies...
[INFO] npm install
[INFO] Building application...
[INFO] npm run build
[INFO] Starting application...
[INFO] npm start
```

**If you see Docker commands in the build log, Render is using the wrong build method!**

### Need Help?
- Check deployment logs in Render dashboard
- Test locally first with `npm run build && npm start`
- Verify environment variables are set correctly

## 🎉 Success!

Your UrutiBiz Backend should now be live on Render! 

**Next Steps:**
- Set up custom domain (optional)
- Configure monitoring
- Set up staging environment
- Add CI/CD workflows
