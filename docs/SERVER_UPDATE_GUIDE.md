# 🔄 Server Update Guide - UrutiBiz

Complete guide for pulling updates and updating the server.
# Admin
Email: admin@urutibiz.com
Password: admin123

# Moderator
Email: moderator@urutibiz.com
Password: password123

# Inspector
Email: inspector@urutibiz.com
Password: password123

# Owner
Email: jane.smith@example.com
Password: password123

# Renter
Email: john.doe@example.com
Password: password123

## 📋 Table of Contents

1. [Quick Update Commands](#quick-update-commands)
2. [Full Update Process](#full-update-process)
3. [Backend Update](#backend-update)
4. [Frontend Update](#frontend-update)
5. [Database Migrations](#database-migrations)
6. [Rollback Procedure](#rollback-procedure)

---

## 🚀 Quick Update Commands

### Complete Update (Backend + Frontend)

```bash
# Navigate to project root
cd ~/urutibz

# Pull latest changes
git pull origin main

# Update Backend
cd urutibiz-backend
npm install
npm run build
pm2 restart urutibiz-backend

# Update Frontend
cd ../urutibz-frontend
npm install
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/

sudo chown -R www-data:www-data /var/www/urutibz-frontend

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📝 Full Update Process

### Step 1: Backup Current State

```bash
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/$(date +%Y%m%d_%H%M%S)

# Backup backend
cp -r ~/urutibz/urutibiz-backend/dist $BACKUP_DIR/backend-dist 2>/dev/null || true
cp ~/urutibz/urutibiz-backend/.env $BACKUP_DIR/backend-env 2>/dev/null || true

# Backup frontend
cp -r /var/www/urutibz-frontend $BACKUP_DIR/frontend 2>/dev/null || true

# Backup database (optional but recommended)
pg_dump -U postgres urutibiz_db > $BACKUP_DIR/database.sql 2>/dev/null || true

echo "✅ Backup created in: $BACKUP_DIR"
```

### Step 2: Pull Latest Code

```bash
cd ~/urutibz

# Check current branch
git branch

# Pull latest changes
git pull origin main

# Or if using a different branch
# git pull origin develop

# Check what changed
git log --oneline -10
```

### Step 3: Check for Breaking Changes

```bash
# Check if package.json changed
cd ~/urutibz/urutibiz-backend
git diff HEAD~1 package.json

# Check if database migrations exist
ls -la database/migrations/ | tail -5
```

---

## 🔧 Backend Update

### Complete Backend Update

```bash
cd ~/urutibz/urutibiz-backend

# 1. Install/Update Dependencies
npm install

# 2. Check for new environment variables
# Compare .env.example with .env
cat .env.example | grep -v "^#" | grep "=" > /tmp/new-env-vars.txt
echo "Check if you need to add any new variables to .env"

# 3. Run Database Migrations (if any)
npm run db:migrate

# 4. Build Backend
npm run build

# 5. Restart Backend with PM2
pm2 restart urutibiz-backend

# 6. Check Backend Status
pm2 status urutibiz-backend
pm2 logs urutibiz-backend --lines 30
```

### Backend Update Script

```bash
#!/bin/bash
# Save as: ~/update-backend.sh

set -e  # Exit on error

echo "🔄 Starting Backend Update..."

cd ~/urutibz/urutibiz-backend

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migrations..."
npm run db:migrate || echo "⚠️ Migration failed, continuing..."

echo "🔨 Building backend..."
npm run build

echo "🔄 Restarting backend..."
pm2 restart urutibiz-backend

echo "⏳ Waiting for backend to start..."
sleep 5

echo "✅ Checking backend status..."
pm2 logs urutibiz-backend --lines 20 --nostream | grep -i -E "error|listening|server running" | tail -5

echo "✅ Backend update complete!"
```

**Make it executable:**
```bash
chmod +x ~/update-backend.sh
```

---

## 🎨 Frontend Update

### Complete Frontend Update

```bash
cd ~/urutibz/urutibz-frontend

# 1. Install/Update Dependencies
npm install

# 2. Check .env file
cat .env
# Update if needed:
# VITE_API_BASE_URL=http://161.97.148.53/api/v1
# VITE_WS_URL=ws://161.97.148.53
# VITE_NODE_ENV=production

# 3. Build Frontend
npm run build

# 4. Deploy Frontend Files
sudo mkdir -p /var/www/urutibz-frontend
sudo rm -rf /var/www/urutibz-frontend/*
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
sudo chmod -R 755 /var/www/urutibz-frontend

# 5. Verify Deployment
ls -la /var/www/urutibz-frontend/index.html

# 6. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Frontend Update Script

```bash
#!/bin/bash
# Save as: ~/update-frontend.sh

set -e  # Exit on error

echo "🔄 Starting Frontend Update..."

cd ~/urutibz/urutibz-frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

if [ ! -d dist ]; then
    echo "❌ Build failed! dist folder not created"
    exit 1
fi

echo "📤 Deploying frontend files..."
sudo mkdir -p /var/www/urutibz-frontend
sudo rm -rf /var/www/urutibz-frontend/*
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
sudo chmod -R 755 /var/www/urutibz-frontend

echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Frontend update complete!"
```

**Make it executable:**
```bash
chmod +x ~/update-frontend.sh
```

---

## 🗄️ Database Migrations

### Check for New Migrations

```bash
cd ~/urutibz/urutibiz-backend

# List all migrations
ls -la database/migrations/

# Check which migrations have been run
npm run knex migrate:status
```

### Run Migrations

```bash
cd ~/urutibz/urutibiz-backend

# Run all pending migrations
npm run db:migrate

# Or manually
npx knex migrate:latest
```

### Rollback Migration (if needed)

```bash
cd ~/urutibz/urutibiz-backend

# Rollback last migration
npm run db:rollback

# Or manually
npx knex migrate:rollback
```

---

## 🔄 Complete Update Script

Create a complete update script that does everything:

```bash
#!/bin/bash
# Save as: ~/update-server.sh

set -e  # Exit on error

echo "=========================================="
echo "🔄 UrutiBiz Server Update Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backup function
backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    BACKUP_DIR=~/backups/$(date +%Y%m%d_%H%M%S)
    mkdir -p $BACKUP_DIR
    
    # Backup backend
    if [ -d ~/urutibz/urutibiz-backend/dist ]; then
        cp -r ~/urutibz/urutibiz-backend/dist $BACKUP_DIR/backend-dist
    fi
    if [ -f ~/urutibz/urutibiz-backend/.env ]; then
        cp ~/urutibz/urutibiz-backend/.env $BACKUP_DIR/backend-env
    fi
    
    # Backup frontend
    if [ -d /var/www/urutibz-frontend ]; then
        sudo cp -r /var/www/urutibz-frontend $BACKUP_DIR/frontend
    fi
    
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
}

# Git pull
pull_updates() {
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    cd ~/urutibz
    git pull origin main
    echo -e "${GREEN}✅ Code updated${NC}"
}

# Update backend
update_backend() {
    echo -e "${YELLOW}🔧 Updating backend...${NC}"
    cd ~/urutibz/urutibiz-backend
    
    echo "  📦 Installing dependencies..."
    npm install
    
    echo "  🗄️ Running migrations..."
    npm run db:migrate || echo "  ⚠️ No new migrations"
    
    echo "  🔨 Building..."
    npm run build
    
    echo "  🔄 Restarting PM2..."
    pm2 restart urutibiz-backend
    
    sleep 3
    
    echo "  ✅ Checking status..."
    pm2 status urutibiz-backend | grep urutibiz-backend
}

# Update frontend
update_frontend() {
    echo -e "${YELLOW}🎨 Updating frontend...${NC}"
    cd ~/urutibz/urutibz-frontend
    
    echo "  📦 Installing dependencies..."
    npm install
    
    echo "  🔨 Building..."
    npm run build
    
    if [ ! -d dist ]; then
        echo -e "${RED}  ❌ Build failed!${NC}"
        exit 1
    fi
    
    echo "  📤 Deploying..."
    sudo mkdir -p /var/www/urutibz-frontend
    sudo rm -rf /var/www/urutibz-frontend/*
    sudo cp -r dist/* /var/www/urutibz-frontend/
    sudo chown -R www-data:www-data /var/www/urutibz-frontend
    sudo chmod -R 755 /var/www/urutibz-frontend
    
    echo "  🔄 Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
}

# Main execution
main() {
    # Ask for confirmation
    read -p "Do you want to create a backup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup
    fi
    
    pull_updates
    update_backend
    update_frontend
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✅ Server update complete!"
    echo "==========================================${NC}"
    echo ""
    echo "🧪 Testing endpoints:"
    echo "  Backend: curl http://localhost:3000/health"
    echo "  Frontend: curl http://localhost:8080/"
    echo "  API: curl http://localhost:8080/api/v1/health"
}

# Run main function
main
```

**Make it executable:**
```bash
chmod +x ~/update-server.sh
```

**Usage:**
```bash
~/update-server.sh
```

---

## 🔙 Rollback Procedure

### Rollback Backend

```bash
# Stop backend
pm2 stop urutibiz-backend

# Restore from backup
BACKUP_DIR=~/backups/YYYYMMDD_HHMMSS  # Use your backup directory
cp -r $BACKUP_DIR/backend-dist/* ~/urutibz/urutibiz-backend/dist/
cp $BACKUP_DIR/backend-env ~/urutibz/urutibiz-backend/.env

# Restart backend
pm2 restart urutibiz-backend
```

### Rollback Frontend

```bash
# Restore from backup
BACKUP_DIR=~/backups/YYYYMMDD_HHMMSS  # Use your backup directory
sudo rm -rf /var/www/urutibz-frontend/*
sudo cp -r $BACKUP_DIR/frontend/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend

# Reload Nginx
sudo systemctl reload nginx
```

### Rollback Git Changes

```bash
cd ~/urutibz

# See commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard HEAD~1

# Or rollback to specific commit
git reset --hard <commit-hash>
```

---

## 📊 Update Checklist

Before updating, check:

- [ ] Backup created
- [ ] Database migrations reviewed
- [ ] Environment variables checked
- [ ] Dependencies updated
- [ ] Backend built successfully
- [ ] Frontend built successfully
- [ ] PM2 process restarted
- [ ] Nginx reloaded
- [ ] Health endpoints tested
- [ ] Logs checked for errors

---

## 🐍 Python Service Status Check

### Check if Python Service is Running

```bash
# Method 1: Check if port 8001 is listening
sudo netstat -tlnp | grep 8001
# Or
sudo ss -tlnp | grep 8001

# Method 2: Test health endpoint
curl http://localhost:8001/health

# Method 3: Check if process is running
ps aux | grep -E "python.*main.py|uvicorn.*8001"

# Method 4: Check with PM2 (if running with PM2)
pm2 list | grep python
pm2 logs python-image-service --lines 20

# Method 5: Check systemd service (if running as service)
sudo systemctl status urutibiz-python-service
sudo journalctl -u urutibiz-python-service -f
```

### Expected Health Response

```bash
curl http://localhost:8001/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

### Complete Python Service Check Script

```bash
#!/bin/bash
# Check Python Service Status

echo "🐍 Checking Python Image Service Status..."
echo ""

# Check port
echo "1️⃣ Checking port 8001:"
if sudo netstat -tlnp | grep -q ":8001"; then
    echo "  ✅ Port 8001 is listening"
    sudo netstat -tlnp | grep 8001
else
    echo "  ❌ Port 8001 is NOT listening"
fi

echo ""

# Check health endpoint
echo "2️⃣ Testing health endpoint:"
HEALTH_RESPONSE=$(curl -s http://localhost:8001/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "  ✅ Service is healthy"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "  ❌ Service is NOT responding"
    echo "  Response: $HEALTH_RESPONSE"
fi

echo ""

# Check process
echo "3️⃣ Checking Python process:"
PYTHON_PROCESS=$(ps aux | grep -E "python.*main.py|uvicorn.*8001" | grep -v grep)
if [ -n "$PYTHON_PROCESS" ]; then
    echo "  ✅ Python service process found:"
    echo "$PYTHON_PROCESS"
else
    echo "  ❌ No Python service process found"
fi

echo ""

# Check PM2
echo "4️⃣ Checking PM2:"
if pm2 list | grep -q python; then
    echo "  ✅ Python service in PM2:"
    pm2 list | grep python
else
    echo "  ⚠️ Python service not in PM2"
fi

echo ""

# Check systemd
echo "5️⃣ Checking systemd service:"
if systemctl list-units | grep -q urutibiz-python; then
    echo "  ✅ Python service in systemd:"
    sudo systemctl status urutibiz-python-service --no-pager | head -5
else
    echo "  ⚠️ Python service not in systemd"
fi
```

### Start Python Service (if not running)

**⚠️ Important:** The Python service path is `~/urutibz/python-service` (not `~/urutibz/urutibiz-backend/python-service`)

```bash
# Option 1: Use fix script (Recommended - handles cleanup and setup)
cd ~/urutibz
chmod +x fix-python-service.sh
./fix-python-service.sh

# Option 2: Manual start with uvicorn (Recommended)
cd ~/urutibz/python-service
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service
pm2 save

# Option 3: Start with uvicorn command string
cd ~/urutibz/python-service
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001" --name python-image-service
pm2 save

# Option 4: Start manually (for testing/debugging)
cd ~/urutibz/python-service
python3 main.py
```

### Fix Python Service Issues

If the service keeps crashing or has duplicate processes:

```bash
# 1. Stop and delete all Python service processes
pm2 delete python-image-service 2>/dev/null || true
pm2 delete all --filter "python-image-service" 2>/dev/null || true

# 2. Install dependencies (if needed)
cd ~/urutibz/python-service
pip3 install -r requirements.txt

# 3. Start fresh
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service

# 4. Check logs
pm2 logs python-image-service --lines 50
```

### Python Service Management Commands

```bash
# Start
pm2 start python-image-service
# Or
cd ~/urutibz/urutibiz-backend/python-service && python3 main.py &

# Stop
pm2 stop python-image-service
# Or
pkill -f "python.*main.py"

# Restart
pm2 restart python-image-service

# View logs
pm2 logs python-image-service
# Or if running manually, check terminal output

# Check status
pm2 status python-image-service
```

## 🧪 Testing After Update

```bash
# Test Backend
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/health

# Test Python Service
curl http://localhost:8001/health

# Test Frontend
curl http://localhost:8080/ | head -20

# Test API through Nginx
curl http://localhost:8080/api/v1/health

# Check PM2 Status
pm2 status
pm2 logs urutibiz-backend --lines 20

# Check Nginx Status
sudo systemctl status nginx
```

---

## 🚨 Troubleshooting

### Update Failed - Backend Won't Start

```bash
# Check logs
pm2 logs urutibiz-backend --lines 50

# Check if build succeeded
ls -la ~/urutibz/urutibiz-backend/dist/

# Rebuild
cd ~/urutibz/urutibiz-backend
npm run build

# Restart
pm2 restart urutibiz-backend
```

### Update Failed - Frontend Not Loading

```bash
# Check if files exist
ls -la /var/www/urutibz-frontend/

# Rebuild and redeploy
cd ~/urutibz/urutibz-frontend
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend

# Check Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Database Migration Failed

```bash
# Check migration status
cd ~/urutibz/urutibiz-backend
npm run knex migrate:status

# Rollback if needed
npm run db:rollback

# Fix migration and try again
npm run db:migrate
```

---

## 📝 Quick Reference

### Most Common Update Commands

```bash
# Quick update (no backup)
cd ~/urutibz && git pull && \
cd urutibiz-backend && npm install && npm run build && pm2 restart urutibiz-backend && \
cd ../urutibz-frontend && npm install && npm run build && \
sudo cp -r dist/* /var/www/urutibz-frontend/ && \
sudo chown -R www-data:www-data /var/www/urutibz-frontend && \
sudo nginx -t && sudo systemctl reload nginx

# Check all services after update
echo "Checking services..."
curl -s http://localhost:3000/health && echo " ✅ Backend" || echo " ❌ Backend"
curl -s http://localhost:8001/health && echo " ✅ Python Service" || echo " ❌ Python Service"
curl -s -I http://localhost:8080/ | head -1 && echo " ✅ Frontend" || echo " ❌ Frontend"
pm2 status
```

### Check What Changed

```bash
cd ~/urutibz
git log --oneline -10
git diff HEAD~1 package.json
git diff HEAD~1 urutibiz-backend/package.json
```

### View Update History

```bash
# Check git commits
cd ~/urutibz
git log --oneline --graph -20

# Check backup directories
ls -la ~/backups/
```

---

## 🔐 Security Notes

1. **Always backup before updating**
2. **Test in staging first** (if available)
3. **Review changelog/commits** before updating
4. **Check for breaking changes** in migration files
5. **Verify environment variables** haven't changed
6. **Monitor logs** after update

---

## 📞 Support

If update fails:
1. Check logs: `pm2 logs urutibiz-backend`
2. Check Nginx: `sudo tail -50 /var/log/nginx/error.log`
3. Restore from backup if needed
4. Check database connection: `sudo -u postgres psql -d urutibiz_db -c "SELECT 1;"`

---

**Last Updated:** 2025-12-16

