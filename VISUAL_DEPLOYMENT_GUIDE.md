# 📊 Visual Deployment Guide

## 🔴 Problem Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Current Setup                        │
└─────────────────────────────────────────────────────────────┘

    docker run --env-file .env ...
           │
           ├─> .env contains:
           │   FIREBASE_PRIVATE_KEY="-----BEGIN...\n...\n..."
           │                          ↑
           │                          └─ Literal \n (not newlines!)
           │
           ├─> Docker passes to container as-is
           │
           └─> Firebase SDK tries to parse
                   │
                   └─> ❌ ERROR: Invalid PEM formatted message


    Backend Container starts
           │
           ├─> Tries to connect to postgres
           │        │
           │        └─> ❌ ERROR: Database not ready
           │
           └─> NotificationEngine fails to initialize
```

## 🟢 Solution Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Fixed Architecture                        │
└─────────────────────────────────────────────────────────────┘

    docker-compose.production.yml
           │
           ├─> Starts postgres with health check
           │        │
           │        └─> Waits until healthy ✅
           │
           ├─> Starts redis with health check
           │        │
           │        └─> Waits until healthy ✅
           │
           └─> Starts API (depends_on: postgres, redis)
                   │
                   ├─> Mounts firebase-credentials.json
                   │        │
                   │        └─> Proper JSON with real newlines ✅
                   │
                   └─> PushNotificationService
                            │
                            ├─> Try: Load from file
                            │        └─> ✅ SUCCESS!
                            │
                            └─> Fallback: Load from env vars
```

## 📋 Step-by-Step Visual Flow

### Step 1: Setup Firebase Credentials
```
┌──────────────────────────────────────────┐
│  bash setup-firebase-credentials.sh      │
└──────────────────────────────────────────┘
                  │
                  ├─> Creates firebase-credentials.json
                  │   {
                  │     "project_id": "...",
                  │     "private_key": "-----BEGIN...\n...",
                  │     "client_email": "..."
                  │   }
                  │
                  └─> Sets permissions: chmod 600
                           │
                           └─> ✅ Secure credentials file ready
```

### Step 2: Build Docker Image
```
┌──────────────────────────────────────────┐
│  docker build -t urutibiz-backend:latest │
└──────────────────────────────────────────┘
                  │
                  ├─> Copies updated PushNotificationService.ts
                  │        │
                  │        └─> Now supports file-based credentials
                  │
                  └─> ✅ Image built with fixes
```

### Step 3: Deploy with Docker Compose
```
┌──────────────────────────────────────────────────────────┐
│  docker-compose -f docker-compose.production.yml up -d   │
└──────────────────────────────────────────────────────────┘
                  │
                  ├─> Start postgres
                  │        │
                  │        ├─> Initialize database
                  │        └─> Health check: pg_isready
                  │                 │
                  │                 └─> ✅ Healthy
                  │
                  ├─> Start redis
                  │        │
                  │        ├─> Load data from volume
                  │        └─> Health check: redis-cli ping
                  │                 │
                  │                 └─> ✅ Healthy
                  │
                  └─> Start API (waits for postgres & redis)
                           │
                           ├─> Mount firebase-credentials.json
                           ├─> Connect to postgres ✅
                           ├─> Connect to redis ✅
                           ├─> Initialize Firebase ✅
                           └─> Server listening on port 10000 ✅
```

## 🔄 Service Dependency Flow

```
┌─────────────┐
│  Postgres   │
│  (port 5432)│
└──────┬──────┘
       │ Health Check
       │ pg_isready
       ├─> Retry every 10s
       └─> ✅ Ready after ~5s

┌─────────────┐
│   Redis     │
│  (port 6379)│
└──────┬──────┘
       │ Health Check
       │ redis-cli ping
       ├─> Retry every 10s
       └─> ✅ Ready after ~3s

       ┌──────────────────────┐
       │  Both services ready │
       └──────────┬───────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │   Backend API       │
       │   (port 10000)      │
       │                     │
       │  ✅ Firebase init   │
       │  ✅ DB connected    │
       │  ✅ Redis connected │
       │  ✅ Server running  │
       └─────────────────────┘
```

## 🎯 Firebase Initialization Flow

```
┌────────────────────────────────────────────────────────┐
│         PushNotificationService.initialize()           │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Check GOOGLE_APPLICATION_     │
        │ CREDENTIALS env var           │
        └───────────┬───────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    File exists?            No file
        │                       │
        ├─> Yes                 │
        │   │                   │
        │   ├─> Read JSON       │
        │   ├─> Parse           │
        │   └─> Initialize      │
        │       Firebase        │
        │       ✅ SUCCESS      │
        │                       │
        └───────────────────────┴─> Try env vars
                                    │
                                    ├─> Get FIREBASE_PRIVATE_KEY
                                    ├─> Replace \n with newlines
                                    ├─> Initialize Firebase
                                    └─> ✅ SUCCESS (fallback)
```

## 📊 Before vs After Comparison

### Before (Broken)
```
┌─────────────────────────────────────────┐
│ Container Start                         │
├─────────────────────────────────────────┤
│ ❌ Firebase: Invalid PEM format         │
│ ❌ Database: Connection refused         │
│ ❌ NotificationEngine: Init failed      │
│ ⚠️  Server: Running with errors         │
└─────────────────────────────────────────┘
```

### After (Fixed)
```
┌─────────────────────────────────────────┐
│ Container Start                         │
├─────────────────────────────────────────┤
│ ✅ Postgres: Healthy                    │
│ ✅ Redis: Healthy                       │
│ ✅ Firebase: Initialized from file      │
│ ✅ Database: Connected                  │
│ ✅ NotificationEngine: Templates loaded │
│ ✅ Server: Listening on port 10000      │
└─────────────────────────────────────────┘
```

## 🗂️ File Structure

```
urutibiz-backend/
│
├── 📄 .env                              # Environment variables
├── 🔒 firebase-credentials.json         # Firebase service account (gitignored)
├── 🐳 docker-compose.production.yml     # Production compose config
│
├── 📜 Scripts (executable)
│   ├── setup-firebase-credentials.sh    # Create Firebase JSON
│   ├── quick-fix-run.sh                 # Quick test
│   └── rebuild-and-deploy.sh            # Complete deployment
│
├── 📚 Documentation
│   ├── QUICK_START.md                   # 3-command quick start
│   ├── PRODUCTION_DEPLOYMENT_FIX.md     # Complete guide
│   ├── FIREBASE_DATABASE_FIX.md         # Technical details
│   └── VISUAL_DEPLOYMENT_GUIDE.md       # This file
│
└── 💻 Source Code
    └── src/services/notification/channels/
        └── PushNotificationService.ts   # ✅ Updated with file support
```

## 🎬 Quick Start Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    3 Commands to Deploy                      │
└─────────────────────────────────────────────────────────────┘

    1️⃣  cd /opt/urutibiz/urutibiz-backend
         │
         └─> Navigate to backend directory

    2️⃣  bash setup-firebase-credentials.sh
         │
         ├─> Creates firebase-credentials.json
         └─> ✅ Credentials ready

    3️⃣  bash rebuild-and-deploy.sh
         │
         ├─> Builds Docker image
         ├─> Stops old containers
         ├─> Starts new containers
         ├─> Waits for health checks
         └─> ✅ Deployment complete!

┌─────────────────────────────────────────────────────────────┐
│                    Verify Deployment                         │
└─────────────────────────────────────────────────────────────┘

    docker ps
         │
         └─> Should show 3 containers running:
             ✅ urutibiz-postgres
             ✅ urutibiz-redis
             ✅ urutibiz-api

    docker logs urutibiz-api
         │
         └─> Should show:
             ✅ Firebase Admin initialized
             ✅ Database connection established
             ✅ Server listening on port 10000
```

## 🔧 Troubleshooting Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    Common Issues                             │
└─────────────────────────────────────────────────────────────┘

Issue: Firebase still fails
    │
    ├─> Check: ls -la firebase-credentials.json
    │        └─> File exists? ✅
    │        └─> Permissions 600? ✅
    │
    ├─> Check: cat firebase-credentials.json | jq .
    │        └─> Valid JSON? ✅
    │
    └─> Check: docker exec urutibiz-api ls -la /app/firebase-credentials.json
             └─> File mounted? ✅

Issue: Database connection fails
    │
    ├─> Check: docker ps | grep postgres
    │        └─> Container running? ✅
    │
    ├─> Check: docker logs urutibiz-postgres
    │        └─> No errors? ✅
    │
    └─> Check: docker exec urutibiz-api ping postgres
             └─> Network OK? ✅

Issue: Port already in use
    │
    ├─> Check: netstat -tulpn | grep 10000
    │        └─> Shows what's using port
    │
    └─> Fix: Change PORT in .env or docker-compose
```

## 🎉 Success Indicators

```
✅ All containers running
   docker ps shows 3 containers

✅ No Firebase errors
   docker logs urutibiz-api | grep -i firebase
   Shows: "Firebase Admin initialized"

✅ Database connected
   docker logs urutibiz-api | grep -i database
   Shows: "Database connection established"

✅ API responding
   curl http://localhost:10000/health
   Returns: 200 OK

✅ Services healthy
   docker-compose -f docker-compose.production.yml ps
   All show "Up (healthy)"
```

## 📞 Need More Help?

```
📖 Quick Start        → QUICK_START.md
📖 Complete Guide     → PRODUCTION_DEPLOYMENT_FIX.md
📖 Technical Details  → FIREBASE_DATABASE_FIX.md
📖 Visual Guide       → VISUAL_DEPLOYMENT_GUIDE.md (this file)
```
