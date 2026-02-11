# 🚀 Quick Start Guide - 5 Minutes to Production

## ⚡ Super Quick Start (30 seconds)

```bash
# Build and run in one command
make build-prod && make run-prod
```

That's it! Your backend is running on http://localhost:10000

---

## 📋 Step-by-Step Guide (5 minutes)

### Step 1: Build the Image (2 min)

**Windows:**
```powershell
.\docker-build.ps1 -Environment production
```

**Linux/Mac:**
```bash
chmod +x docker-build.sh
./docker-build.sh production
```

**Using Make (All platforms):**
```bash
make build-prod
```

✅ **Expected output:** "Build process completed successfully!"

---

### Step 2: Prepare Environment (1 min)

```bash
# Copy example environment file
cp .env.example .env.production

# Edit with your values (use any text editor)
notepad .env.production  # Windows
nano .env.production     # Linux/Mac
```

**Minimum required variables:**
```env
NODE_ENV=production
PORT=10000
DB_HOST=localhost
DB_PASSWORD=your-password
JWT_SECRET=your-secret-key-min-32-chars
```

---

### Step 3: Run the Container (30 sec)

```bash
make run-prod
```

Or manually:
```bash
docker run -d \
  --name urutibiz-backend-prod \
  -p 10000:10000 \
  --env-file .env.production \
  --restart unless-stopped \
  urutibiz-backend:latest
```

✅ **Expected output:** Container ID

---

### Step 4: Verify It's Running (30 sec)

```bash
# Check health
make health

# Or manually
curl http://localhost:10000/health
```

✅ **Expected output:** `{"status":"ok"}`

---

### Step 5: View Logs (30 sec)

```bash
make logs
```

✅ **Expected output:** Server startup logs

---

## 🎯 Common Commands

```bash
# View all available commands
make help

# Check status
make health

# View logs
make logs

# Access shell
make shell

# Stop container
make stop

# Restart container
make restart-prod
```

---

## 🐳 Using Docker Compose (Alternative)

### For Full Stack (Backend + Database + Redis)

```bash
# Start all services
make up-prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

---

## 🔍 Troubleshooting

### Container won't start?

```bash
# Check logs
make logs

# Check if port is in use
netstat -ano | findstr :10000  # Windows
lsof -i :10000                 # Linux/Mac
```

### Health check failing?

```bash
# Test health endpoint
docker exec urutibiz-backend-prod node healthcheck.js

# Check environment variables
docker exec urutibiz-backend-prod env | grep NODE_ENV
```

### Need to rebuild?

```bash
# Clean build
make build-no-cache
```

---

## 📚 Next Steps

1. ✅ **Read full documentation**: [DOCKER_README.md](./DOCKER_README.md)
2. ✅ **Check all commands**: [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)
3. ✅ **Production checklist**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
4. ✅ **Troubleshooting**: [DOCKER_PRODUCTION_ISSUES.md](./DOCKER_PRODUCTION_ISSUES.md)

---

## 🎉 You're Done!

Your backend is now running in a production-grade Docker container!

**Access your API at:** http://localhost:10000

**Need help?** Run `make help` or check the documentation files.
