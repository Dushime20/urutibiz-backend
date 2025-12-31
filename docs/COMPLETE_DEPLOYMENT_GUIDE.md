# 🚀 Complete UrutiBiz Deployment Guide for Ubuntu (Contabo VPS)

Complete step-by-step deployment guide including pgvector and Python image search service.

---

## 📋 Table of Contents

1. [Why PM2 Instead of Docker?](#why-pm2-instead-of-docker)
2. [Part 1: Server Setup (One-Time)](#part-1-server-setup-one-time)
3. [Part 2: Complete Backend Deployment (Database + pgvector + Python Service + Backend)](#part-2-complete-backend-deployment-database--pgvector--python-service--backend)
4. [Part 3: Complete Frontend Deployment](#part-3-complete-frontend-deployment)
5. [Part 4: Nginx Configuration & SSL](#part-4-nginx-configuration--ssl)
6. [Part 5: Updating Your Codebase](#part-5-updating-your-codebase)
7. [Part 6: Troubleshooting](#part-6-troubleshooting)

---

## Why PM2 Instead of Docker?

### 🎯 Why We Chose PM2 for This Deployment

This guide uses **PM2** for process management instead of Docker. Here's why:

#### ✅ **Advantages of PM2 (Our Choice)**

1. **Simpler for Single-Server Deployments**
   - Direct process management - no container abstraction
   - Easier to understand and debug
   - Less moving parts = fewer things that can break

2. **Better Resource Efficiency**
   - No container overhead (Docker uses ~100-200MB RAM per container)
   - Direct access to system resources
   - Lower memory footprint = more resources for your app

3. **Easier Debugging**
   - Direct access to logs: `pm2 logs`
   - Can easily attach debugger to running process
   - No container networking complexity

4. **Faster Startup**
   - No container image pulling/building
   - No container startup overhead
   - Processes start immediately

5. **Better for VPS Deployments**
   - Contabo VPS typically has limited resources
   - PM2 uses less RAM and CPU
   - Perfect for single-server setups

6. **Native System Integration**
   - Works directly with systemd
   - Easy integration with system services (PostgreSQL, Redis, Nginx)
   - No port mapping complexity

7. **Easier Updates**
   - Just `git pull` and `pm2 restart`
   - No need to rebuild Docker images
   - Faster deployment cycles

#### 🐳 **When Docker Would Be Better**

Docker is better suited for:

1. **Multi-Server/Microservices Architecture**
   - When you need to scale across multiple servers
   - When services need to be isolated
   - When using Kubernetes or Docker Swarm

2. **Development Consistency**
   - "Works on my machine" problem
   - Team members with different OS setups
   - Consistent environments across dev/staging/prod

3. **Complex Dependencies**
   - When services have conflicting dependencies
   - When you need specific OS versions
   - When isolating services is critical

4. **Cloud-Native Deployments**
   - AWS ECS, Google Cloud Run, Azure Container Instances
   - Serverless container platforms
   - Auto-scaling container services

5. **CI/CD Pipelines**
   - Automated builds and deployments
   - Container registries (Docker Hub, ECR)
   - Version-controlled infrastructure

#### 📊 **Comparison Table**

| Feature | PM2 (Our Choice) | Docker |
|---------|------------------|--------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐⭐ Complex |
| **Resource Usage** | ⭐ Low | ⭐⭐ Medium |
| **Startup Time** | ⭐ Fast | ⭐⭐ Slower |
| **Debugging** | ⭐ Easy | ⭐⭐ Moderate |
| **Scaling** | ⭐ Single server | ⭐⭐⭐ Multi-server |
| **Isolation** | ⭐ None | ⭐⭐⭐ Full |
| **Portability** | ⭐ Server-specific | ⭐⭐⭐ Any platform |
| **Learning Curve** | ⭐ Easy | ⭐⭐⭐ Steeper |

#### 🔄 **Can You Use Docker Instead?**

**Yes!** Your project already has Docker support:

- `docker-compose.yml` - Development setup
- `docker-compose.prod.yml` - Production setup
- `Dockerfile` - Backend container
- `python-service/Dockerfile` - Python service container

**To use Docker instead:**

1. Follow the Docker deployment guide: `urutibiz-backend/DOCKER_DEPLOYMENT_GUIDE.md`
2. Use `docker-compose.prod.yml` for production
3. Replace PM2 commands with Docker commands

**Docker Commands Equivalent:**

```bash
# Instead of: pm2 start dist/server.js --name urutibiz-backend
docker-compose -f docker-compose.prod.yml up -d backend

# Instead of: pm2 restart urutibiz-backend
docker-compose -f docker-compose.prod.yml restart backend

# Instead of: pm2 logs urutibiz-backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

#### 💡 **Our Recommendation**

**Use PM2 if:**
- ✅ Single server deployment (like Contabo VPS)
- ✅ Limited resources (RAM/CPU)
- ✅ Want simplicity and easy debugging
- ✅ Direct control over processes
- ✅ Faster deployment cycles

**Use Docker if:**
- ✅ Multiple servers or microservices
- ✅ Need environment consistency
- ✅ Using cloud container services
- ✅ Complex CI/CD pipelines
- ✅ Team with different development environments

#### 🎯 **For This Guide**

We chose **PM2** because:
1. You're deploying to a **Contabo VPS** (single server)
2. **Resource efficiency** is important
3. **Simplicity** makes maintenance easier
4. **Faster updates** when you make code changes
5. **Easier troubleshooting** when things go wrong

**Both approaches work!** Choose based on your needs. This guide focuses on PM2 for simplicity, but you can adapt it for Docker if preferred.

---

---

# Part 1: Server Setup (One-Time)

**Complete all steps in this section first, then move to Part 2.**

## Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common
```

## Step 2: Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS (public access)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# DO NOT allow 8001 and 10000 publicly - they should only be accessible via localhost
# These ports are for internal communication only
# Nginx will proxy requests from port 80/443 to these internal ports

# Enable firewall
sudo ufw enable
sudo ufw status
```

**🔒 Security Note:** Ports 10000 (backend) and 8001 (Python service) should **NOT** be publicly accessible. They should only work via `localhost` on the server. Nginx handles all public traffic on ports 80/443 and routes internally.

## Step 3: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## Step 4: Install PostgreSQL with PostGIS

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

**Check your PostgreSQL version:**

```bash
# Check PostgreSQL version
psql --version
# OR
sudo -u postgres psql -c "SELECT version();"
```

**Install PostGIS for your PostgreSQL version:**

```bash
# For PostgreSQL 14
sudo apt install -y postgis postgresql-14-postgis-3

# For PostgreSQL 15
sudo apt install -y postgis postgresql-15-postgis-3

# For PostgreSQL 16
sudo apt install -y postgis postgresql-16-postgis-3

# For PostgreSQL 17
sudo apt install -y postgis postgresql-17-postgis-3
```

**Note:** Replace the version number (14, 15, 16, 17) with your actual PostgreSQL version.

## Step 5: Install pgvector Extension

**First, check your PostgreSQL version:**

```bash
# Get PostgreSQL version number (e.g., 14, 15, 16, 17)
psql --version | grep -oP '\d+' | head -1
# OR
sudo -u postgres psql -c "SHOW server_version_num;" | grep -oP '\d+' | head -1
```

**Method 1: Try installing pgvector package (if available for your version):**

```bash
# Replace XX with your PostgreSQL version (14, 15, 16, or 17)
# For PostgreSQL 14:
sudo apt install -y postgresql-14-pgvector

# For PostgreSQL 15:
sudo apt install -y postgresql-15-pgvector

# For PostgreSQL 16:
sudo apt install -y postgresql-16-pgvector

# For PostgreSQL 17:
sudo apt install -y postgresql-17-pgvector
```

**Method 2: If package is not available, install from source (RECOMMENDED):**

This method works for **any PostgreSQL version** and is more reliable:

```bash
# Install build dependencies
# Replace XX with your PostgreSQL version (14, 15, 16, or 17)
# For PostgreSQL 14:
sudo apt install -y postgresql-server-dev-14 build-essential git

# For PostgreSQL 15:
sudo apt install -y postgresql-server-dev-15 build-essential git

# For PostgreSQL 16:
sudo apt install -y postgresql-server-dev-16 build-essential git

# For PostgreSQL 17:
sudo apt install -y postgresql-server-dev-17 build-essential git

# If you're not sure of the version, try this (installs dev tools for all versions):
sudo apt install -y postgresql-server-dev-all build-essential git

# Clone and build pgvector from source
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
cd /
rm -rf /tmp/pgvector
```

**Verify pgvector installation:**

```bash
# Check if pgvector files were installed
ls -la /usr/share/postgresql/*/extension/vector*

# You should see files like:
# /usr/share/postgresql/14/extension/vector.control
# /usr/share/postgresql/14/extension/vector--*.sql
```

**If you get "Unable to locate package" errors:**

This means the package isn't in your repositories. **Always use Method 2 (install from source)** - it works for all PostgreSQL versions and is the recommended approach.

## Step 6: Install Python 3.8+ and pip

**First, check what Python version is available on your system:**

```bash
# Check if Python 3 is installed
python3 --version

# Check available Python versions
ls /usr/bin/python3*
```

**Option 1: Use System Python (if Python 3.8+ is available)**

If your system already has Python 3.8 or higher, you can use it:

```bash
# Install pip and venv for system Python
sudo apt install -y python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

**Option 2: Install Python 3.11 from deadsnakes PPA (Recommended)**

If Python 3.11 is not available, install it from the deadsnakes PPA:

```bash
# Add deadsnakes PPA for Python 3.11
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip for Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Verify installation
python3.11 --version
python3.11 -m pip --version
```

**Option 3: Install Python 3.12 (Alternative)**

If Python 3.11 is not available, you can use Python 3.12:

```bash
# Add deadsnakes PPA
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.12
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Install pip for Python 3.12
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12

# Verify installation
python3.12 --version
python3.12 -m pip --version
```

**Note:** The Python service requires Python 3.8 or higher. Python 3.11 or 3.12 is recommended for best compatibility with machine learning libraries (PyTorch, etc.).

**If you get "Unable to locate package python3.11" error:**

This means Python 3.11 is not in your default repositories. Use **Option 2** above to install from deadsnakes PPA, or use **Option 1** if your system Python is 3.8+.

## Step 7: Install Redis

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl status redis-server
redis-cli ping
```

## Step 8: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

## Step 9: Install PM2

```bash
sudo npm install -g pm2
pm2 --version
```

## Step 10: Clone Project

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <YOUR_REPOSITORY_URL> urutibz
# OR if uploading manually: sudo mkdir -p /var/www/urutibz
sudo chown -R $USER:$USER /var/www/urutibz
cd /var/www/urutibz
```

**✅ Part 1 Complete! Now move to Part 2.**

---

# Part 2: Complete Backend Deployment (Database + pgvector + Python Service + Backend)

**This section covers everything for the backend. Complete all steps before moving to Part 3.**

## Backend Step 1: Setup Database with pgvector

```bash
# Connect to PostgreSQL
sudo -u postgres psql
```

**Inside PostgreSQL, run these commands (copy and paste one by one):**

```sql
CREATE DATABASE urutibiz_db;
CREATE USER urutibiz_user WITH PASSWORD 'dushimimana20';
ALTER ROLE urutibiz_user SET client_encoding TO 'utf8';
ALTER ROLE urutibiz_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE urutibiz_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE urutibiz_db TO urutibiz_user;
\c urutibiz_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

**Replace `your_secure_password_here` with a strong password. Save this password!**

**Verify pgvector is installed:**

```bash
psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

**Test database connection:**

```bash
psql -U urutibiz_user -d urutibiz_db -h localhost
# Enter password when prompted
# Type \q to exit
```

## Backend Step 2: Setup Python Image Search Service

**First, determine which Python version to use:**

```bash
# Check available Python versions
python3 --version
python3.11 --version 2>/dev/null || echo "Python 3.11 not found"
python3.12 --version 2>/dev/null || echo "Python 3.12 not found"

# Use the version that's available (prefer 3.11 or 3.12, fallback to python3)
# Replace PYTHON_CMD with: python3.11, python3.12, or python3
```

**Setup Python service:**

```bash
# Navigate to Python service directory
cd /var/www/urutibz/urutibiz-backend/python-service

# Determine Python command (use the version you installed in Step 6)
# If you installed Python 3.11: PYTHON_CMD=python3.11
# If you installed Python 3.12: PYTHON_CMD=python3.12
# If using system Python 3.8+: PYTHON_CMD=python3

# Set Python command (adjust based on what's available)
PYTHON_CMD=$(which python3.11 2>/dev/null || which python3.12 2>/dev/null || which python3)
echo "Using Python: $PYTHON_CMD"
$PYTHON_CMD --version

# Create virtual environment
$PYTHON_CMD -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
# Note: This will take 10-20 minutes on first run (downloads CLIP model ~500MB)
pip install -r requirements.txt

# Test Python service
python main.py
```

**Press Ctrl+C to stop the test. The service should start without errors.**

**Deactivate virtual environment:**

```bash
deactivate
```

**Note:** If you get errors about Python version, make sure you're using Python 3.8 or higher. The service requires Python 3.8+ for compatibility with PyTorch and other ML libraries.

## Backend Step 3: Create Python Service Startup Script

```bash
# Create systemd service file for Python service
sudo nano /etc/systemd/system/urutibiz-python-service.service
```

**Paste this configuration:**

```ini
[Unit]
Description=UrutiBiz Python Image Search Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/urutibz/urutibiz-backend/python-service
Environment="PATH=/var/www/urutibz/urutibiz-backend/python-service/venv/bin"
Environment="HF_HOME=/var/www/urutibz/urutibiz-backend/python-service/.cache/huggingface"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/var/www/urutibz/urutibiz-backend/python-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

**Enable and start Python service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable urutibiz-python-service
sudo systemctl start urutibiz-python-service
sudo systemctl status urutibiz-python-service
```

**Test Python service:**

```bash
curl http://localhost:8001/health
```

**You should see a JSON response with status "ok".**

## Backend Step 4: Navigate to Backend Directory

```bash
cd /var/www/urutibz/urutibiz-backend
```

## Backend Step 5: Generate Security Keys

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate JWT Refresh Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 24
```

**Copy these values - you'll need them in the next step.**

## Backend Step 6: Create Backend Environment File

```bash
nano .env
```

**Paste this configuration (replace the values with your actual data):**

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:5173,http://161.97.148.53:8080

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urutibiz_db
DB_USER=urutibiz_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false
DB_MAX_CONNECTIONS=20

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=paste_your_generated_jwt_secret_here
JWT_REFRESH_SECRET=paste_your_generated_refresh_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# ENCRYPTION
# ============================================
ENCRYPTION_KEY=paste_your_generated_encryption_key_here
BCRYPT_ROUNDS=12

# ============================================
# CORS CONFIGURATION
# ============================================
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:5174,http://161.97.148.53:8080
CORS_CREDENTIALS=true

# ============================================
# PYTHON IMAGE SEARCH SERVICE
# ============================================
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@urutibiz.com
FROM_NAME=UrutiBiz

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/app.log

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@urutibiz.com
ADMIN_PASSWORD=SecureAdminPassword123!
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

**Important:** Replace:
- IP address is already set to `161.97.148.53`
- `your_secure_password_here` with your database password
- `paste_your_generated_jwt_secret_here` with the first generated key
- `paste_your_generated_refresh_secret_here` with the second generated key
- `paste_your_generated_encryption_key_here` with the third generated key
- Email credentials with your actual SMTP settings

**📝 Note:** When you add a domain later, update `FRONTEND_URL` and `CORS_ORIGIN` to use `https://your-domain.com` instead of the IP address.

## Backend Step 7: Install Backend Dependencies

```bash
npm ci
```

## Backend Step 8: Run Database Migrations

```bash
npm run db:migrate
```

**This will enable pgvector and create all necessary tables and indexes.**

**Optional - Seed initial data:**

```bash
npm run db:seed
```

## Backend Step 9: Build Backend Application

```bash
npm run build
```

## Backend Step 10: Start Backend with PM2

```bash
pm2 start dist/server.js --name urutibiz-backend
pm2 start "node -r tsconfig-paths/register dist/server.js" --name urutibiz-backend
pm2 save
pm2 startup
```

**After `pm2 startup`, it will show a command. Copy and run that command (it starts with `sudo`).**

## Backend Step 11: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs urutibiz-backend

# Test health endpoint (on server, use localhost)
curl http://localhost:10000/health

# Test Python service connection (backend should connect to it)
curl http://localhost:10000/api/v1/health/python-service

# Test Python service directly
curl http://localhost:8001/health
```

**You should see JSON responses indicating everything is working.**

**📝 Note:** These `localhost` tests work when you're **SSH'd into the server**. If testing from your local Windows machine, you would need to use the server's IP address, but **ports 10000 and 8001 should be blocked by firewall** for security (only Nginx on ports 80/443 should be public).

**✅ Part 2 Complete! Backend, Database, pgvector, and Python Service are all deployed. Move to Part 3 for Frontend.**

---

# Part 3: Complete Frontend Deployment

**This section covers everything for the frontend. Complete all steps.**

## Frontend Step 1: Navigate to Frontend Directory

```bash
cd /var/www/urutibz/urutibz-frontend
```

## Frontend Step 2: Create Frontend Environment File

```bash
nano .env
```

**Paste this configuration:**

```env
VITE_API_BASE_URL=http://161.97.148.53/api/v1
VITE_WS_URL=ws://161.97.148.53
VITE_NODE_ENV=production
```

**Example:**
```env
VITE_API_BASE_URL=http://161.97.148.53/api/v1
VITE_WS_URL=ws://161.97.148.53
VITE_NODE_ENV=production
```

**📝 Note:** 
- Using `http://` (not `https://`) since SSL requires a domain name
- Using `ws://` (not `wss://`) for WebSocket connections
- When you add a domain later, update these to use `https://your-domain.com` and `wss://your-domain.com`

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## Frontend Step 3: Install Frontend Dependencies

```bash
npm ci
```

## Frontend Step 4: Build Frontend for Production

```bash
npm run build
```

**This creates a `dist/` directory with optimized files.**

## Frontend Step 5: Create Web Directory and Deploy Files

```bash
sudo mkdir -p /var/www/urutibz-frontend
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
sudo chmod -R 755 /var/www/urutibz-frontend
```

**✅ Part 3 Complete! Frontend is now deployed. Move to Part 4 for Nginx and SSL.**

---

# Part 4: Nginx Configuration & SSL

**This section configures Nginx to serve your frontend and proxy your backend.**

**📝 Important:** This guide shows configuration using **IP address** for initial setup. You can add a domain later and update the configuration.

**Setup Options:**
- **Option 1 (This Guide):** Use IP address now, add domain later
  - ✅ Quick setup, no domain needed
  - ❌ No SSL/HTTPS (requires domain)
  - ❌ Less user-friendly URLs
  
- **Option 2 (Later):** Use domain name
  - ✅ SSL/HTTPS support
  - ✅ Professional URLs
  - ✅ Better SEO
  - Requires: Domain name, DNS A record pointing to your IP

**When ready to add a domain:**
1. Point your domain's A record to your server's IP address
2. Update Nginx configurations (replace IP with domain)
3. Update environment files (replace IP with domain)
4. Get SSL certificates using Certbot
5. Restart services

## Nginx Step 0: Get Your Public IP Address

**First, find your server's public IP address:**

```bash
# Method 1: Using hostname
hostname -I

# Method 2: Using ip command
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 3: Using curl (shows external IP)
curl ifconfig.me
curl ipinfo.io/ip
```

**Copy your IP address (e.g., `185.123.45.67`) - you'll need it for the configurations below.**

## Nginx Step 1: Configure Frontend Nginx (Using IP Address)

```bash
sudo nano /etc/nginx/sites-available/urutibz-frontend
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name 161.97.148.53;

    root /var/www/urutibz-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Example:** If your IP is `185.123.45.67`, use `server_name 185.123.45.67;`

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## Nginx Step 2: Configure Backend Nginx (Reverse Proxy - Using IP Address with Path)

**Option A: Backend on same IP with `/api` path (Recommended for IP setup)**

```bash
sudo nano /etc/nginx/sites-available/urutibz-backend
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name 161.97.148.53;

    # API endpoints - proxy to backend
    location /api {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Option B: Backend on different port (Alternative - requires firewall changes)**

If you prefer to use a different port for the backend API (e.g., port 8080), you can configure it separately. However, this requires opening an additional port in the firewall, which is less secure. **Option A (same IP with `/api` path) is recommended.**

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## Nginx Step 3: Combine Frontend and Backend (Single Configuration - Recommended)

**Instead of separate files, you can combine both in one configuration:**

```bash
sudo nano /etc/nginx/sites-available/urutibz

sudo nano /etc/nginx/sites-available/urutibiz_full 
```

**Paste this combined configuration:**

```nginx
server {
    listen 80;
    server_name 161.97.148.53;

    root /var/www/urutibz-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API endpoints - proxy to backend
    location /api {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend SPA routing - serve index.html for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## Nginx Step 4: Enable Nginx Site

**If using combined configuration (recommended):**

```bash
sudo ln -s /etc/nginx/sites-available/urutibz /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
```

**If using separate configurations:**

```bash
sudo ln -s /etc/nginx/sites-available/urutibz-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/urutibz-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
```

**If test passes, reload Nginx:**

```bash
sudo systemctl reload nginx
```

## SSL Step: Skip for Now (IP Address Setup)

**⚠️ Important:** SSL certificates (HTTPS) **cannot be obtained for IP addresses** using Let's Encrypt. SSL certificates require a domain name.

**For now, your application will run on HTTP (port 80).**

**When you're ready to add a domain:**
1. Point your domain's A record to your server's IP address
2. Update Nginx configurations to use the domain name
3. Update environment files to use the domain
4. Then follow the SSL steps below to get HTTPS certificates

**SSL Configuration (for when you add a domain):**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate for frontend
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Get SSL certificate for backend API (if using separate domain)
sudo certbot --nginx -d api.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**✅ Part 4 Complete! Your application is now accessible via HTTP using your IP address.**

---

# Part 5: Updating Your Codebase

**When you make code changes, use these commands to update your deployment.**

## Update Backend

```bash
cd /var/www/urutibz/urutibiz-backend
git pull origin main
npm ci
npm run db:migrate
npm run build
pm2 restart urutibiz-backend
pm2 logs urutibiz-backend --lines 50
```

## Update Python Service

```bash
cd /var/www/urutibz/urutibiz-backend/python-service
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart urutibiz-python-service
sudo systemctl status urutibiz-python-service
```

## Update Frontend

```bash
cd /var/www/urutibz/urutibz-frontend
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
```

## Quick Update Script

**Create this script for easier updates:**

```bash
nano ~/update-urutibz.sh
```

**Paste this:**

```bash
#!/bin/bash
echo "🔄 Updating UrutiBiz..."

# Update Backend
echo "📦 Updating Backend..."
cd /var/www/urutibz/urutibiz-backend
git pull origin main
npm ci
npm run db:migrate
npm run build
pm2 restart urutibiz-backend

# Update Python Service
echo "🐍 Updating Python Service..."
cd /var/www/urutibz/urutibiz-backend/python-service
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart urutibiz-python-service

# Update Frontend
echo "🎨 Updating Frontend..."
cd /var/www/urutibz/urutibz-frontend
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend

echo "✅ Update complete!"
pm2 status
sudo systemctl status urutibiz-python-service
```

**Make it executable:**

```bash
chmod +x ~/update-urutibz.sh
```

**Run it:**

```bash
~/update-urutibz.sh
```

---

# Part 6: Troubleshooting

## Backend Not Starting

```bash
pm2 logs urutibiz-backend
cd /var/www/urutibz/urutibiz-backend
node dist/server.js
```

## Python Service Not Starting

```bash
sudo systemctl status urutibiz-python-service
sudo journalctl -u urutibiz-python-service -n 50
cd /var/www/urutibz/urutibiz-backend/python-service
source venv/bin/activate
python main.py
```

## Python Service Connection Failed

```bash
# Test Python service directly (on server, use localhost)
curl http://localhost:8001/health

# Check if service is running
sudo systemctl status urutibiz-python-service

# Check logs
sudo journalctl -u urutibiz-python-service -f

# Restart service
sudo systemctl restart urutibiz-python-service

# Verify it's listening on localhost only
sudo netstat -tlnp | grep 8001
# Should show: 127.0.0.1:8001 (localhost only, not 0.0.0.0)
```

## Database Connection Failed

```bash
sudo systemctl status postgresql
psql -U urutibiz_user -d urutibiz_db -h localhost
```

## pgvector Extension Not Found

**Error: "Unable to locate package postgresql-XX-pgvector"**

This error occurs when:
1. The pgvector package isn't available in your repositories
2. Your PostgreSQL version doesn't match the package name
3. The package repository doesn't have pgvector

**Solution: Always install from source (works for all PostgreSQL versions)**

```bash
# Step 1: Check your PostgreSQL version
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
echo "PostgreSQL version: $PG_VERSION"

# Step 2: Install build dependencies
# Try specific version first
sudo apt install -y postgresql-server-dev-${PG_VERSION} build-essential git

# If that fails, try installing dev tools for all versions
sudo apt install -y postgresql-server-dev-all build-essential git

# Step 3: Install pgvector from source
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
cd /
rm -rf /tmp/pgvector

# Step 4: Verify installation
ls -la /usr/share/postgresql/*/extension/vector*

# Step 5: Enable extension in your database
psql -U urutibiz_user -d urutibiz_db -h localhost -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Step 6: Verify it's enabled
psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

**Quick one-liner fix (if you know your PostgreSQL version):**

```bash
# Replace XX with your version (14, 15, 16, or 17)
sudo apt install -y postgresql-server-dev-XX build-essential git && \
cd /tmp && git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git && \
cd pgvector && make && sudo make install && cd / && rm -rf /tmp/pgvector
```

**If you get "Unable to locate package postgresql-server-dev-XX":**

```bash
# Install dev tools for all PostgreSQL versions
sudo apt install -y postgresql-server-dev-all build-essential git

# Then install pgvector from source
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
cd /
rm -rf /tmp/pgvector
```

## Python Installation Failed

**Error: "Unable to locate package python3.11"**

This error occurs when:
1. Python 3.11 is not in your default Ubuntu repositories
2. Your Ubuntu version doesn't include Python 3.11
3. The deadsnakes PPA hasn't been added

**Solution 1: Install Python 3.11 from deadsnakes PPA (Recommended)**

```bash
# Add deadsnakes PPA
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip for Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Verify installation
python3.11 --version
python3.11 -m pip --version
```

**Solution 2: Use System Python (if Python 3.8+ is available)**

If your system already has Python 3.8 or higher, you can use it:

```bash
# Check Python version
python3 --version

# If it's 3.8 or higher, install pip and venv
sudo apt install -y python3-pip python3-venv

# Verify
python3 --version
pip3 --version
```

**Solution 3: Install Python 3.12 (Alternative)**

If Python 3.11 is not available, try Python 3.12:

```bash
# Add deadsnakes PPA
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.12
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Install pip for Python 3.12
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12

# Verify installation
python3.12 --version
python3.12 -m pip --version
```

**After installing Python, update the Python service setup:**

When creating the virtual environment, use the Python version you installed:

```bash
# For Python 3.11
python3.11 -m venv venv

# For Python 3.12
python3.12 -m venv venv

# For system Python 3.8+
python3 -m venv venv
```

**Note:** The Python service requires Python 3.8 or higher. Python 3.11 or 3.12 is recommended for best compatibility with PyTorch and machine learning libraries.

## Frontend Not Loading

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
ls -la /var/www/urutibz-frontend
sudo systemctl restart nginx
```

## Port Already in Use

```bash
# Check port 10000 (backend)
sudo lsof -i :10000

# Check port 8001 (Python service)
sudo lsof -i :8001

# Kill process (replace PID with actual process ID)
sudo kill -9 <PID>
```

## Check All Services

**All these commands should be run on the server via SSH (use `localhost`):**

```bash
# Backend (on server)
pm2 status
curl http://localhost:10000/health

# Python Service (on server)
sudo systemctl status urutibiz-python-service
curl http://localhost:8001/health

# Database (on server)
sudo systemctl status postgresql
psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT version();"

# Redis (on server)
sudo systemctl status redis-server
redis-cli ping

# Nginx (on server)
sudo systemctl status nginx

# Verify ports are only listening on localhost (not publicly accessible)
sudo netstat -tlnp | grep -E '10000|8001'
# Should show 127.0.0.1:10000 and 127.0.0.1:8001 (localhost only)
```

**🌐 Testing from Your Browser (Local Machine):**

```bash
# These should work from your browser:
http://161.97.148.53              # Frontend
http://161.97.148.53/api/v1/health  # Backend API (via Nginx)
http://161.97.148.53/health        # Backend health check

# These should NOT work from outside (blocked by firewall):
http://161.97.148.53:10000/health  # Should fail (good - security)
http://161.97.148.53:8001/health   # Should fail (good - security)
```

**Your URLs:**
- Frontend: `http://161.97.148.53`
- API: `http://161.97.148.53/api/v1/health`

---

## ✅ Final Verification Checklist

After completing all parts, verify:

### Testing on the Server (SSH Session)

**When you're logged into the server via SSH, use `localhost`:**

```bash
# Backend health check
curl http://localhost:10000/health

# Python service health
curl http://localhost:8001/health

# Database connection
psql -U urutibiz_user -d urutibiz_db -h localhost

# Redis
redis-cli ping
```

### Testing from Your Local Machine (Windows/Mac)

**When testing from your computer, use the server's IP address:**

```bash
# First, find your server's IP address (run this on the server)
hostname -I
# Or
ip addr show
# Or use curl to get external IP
curl ifconfig.me
# Look for the public IP (usually starts with something like 185.x.x.x for Contabo)

# Then from your local machine, test using the IP:
# Frontend (via Nginx on port 80)
curl http://161.97.148.53
curl http://161.97.148.53/api/v1/health

# These should NOT work (blocked by firewall - good for security):
curl http://161.97.148.53:10000/health  # Should fail
curl http://161.97.148.53:8001/health   # Should fail
```

**⚠️ Important Security Note:**
- Ports 10000 and 8001 should **NOT** be publicly accessible
- They should only be accessible via `localhost` on the server
- Only ports 80 (HTTP) should be public (443 for HTTPS when you add a domain)
- Nginx handles routing from public ports to internal services

### Complete Verification Checklist

- [ ] **On Server (SSH):**
  - [ ] Backend health: `curl http://localhost:10000/health`
  - [ ] Python service: `curl http://localhost:8001/health`
  - [ ] PM2 shows backend running: `pm2 status`
  - [ ] Python service running: `sudo systemctl status urutibiz-python-service`
  - [ ] Database connection: `psql -U urutibiz_user -d urutibiz_db -h localhost`
  - [ ] pgvector enabled: `psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT * FROM pg_extension WHERE extname = 'vector';"`
  - [ ] Redis works: `redis-cli ping`
  - [ ] Nginx running: `sudo systemctl status nginx`

- [ ] **From Your Browser (Local Machine):**
  - [ ] Frontend loads: Visit `http://161.97.148.53`
  - [ ] API accessible: `http://161.97.148.53/api/v1/health`
  - [ ] Frontend can make API calls (check browser console for errors)
  
**📝 Note:** When you add a domain later, you'll update these URLs to use `https://your-domain.com` and get SSL certificates.

- [ ] **All Services Running:**
  - [ ] Backend (PM2)
  - [ ] Python Service (systemd)
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] Nginx

---

## 📝 Quick Reference

**Backend Commands:**
```bash
cd /var/www/urutibz/urutibiz-backend
pm2 restart urutibiz-backend
pm2 logs urutibiz-backend
```

**Python Service Commands:**
```bash
sudo systemctl restart urutibiz-python-service
sudo systemctl status urutibiz-python-service
sudo journalctl -u urutibiz-python-service -f
curl http://localhost:8001/health
```

**Frontend Commands:**
```bash
cd /var/www/urutibz/urutibz-frontend
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/
```

**Database Backup:**
```bash
pg_dump -U urutibiz_user urutibiz_db > backup_$(date +%Y%m%d).sql
```

---

**Last Updated:** 2024  
**Version:** 3.0.0  
**For Contabo VPS Users**  
**Includes:** PostgreSQL, PostGIS, pgvector, Python CLIP Service, Node.js Backend, React Frontend
