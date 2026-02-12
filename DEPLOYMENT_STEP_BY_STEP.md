# 🚀 Complete Production Deployment Guide
## Step-by-Step from Zero to Production

**Author**: Senior DevOps Engineer  
**Target**: Windows (Local Testing) + Linux (Production Server)  
**Time**: 30-60 minutes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part A: Windows Local Testing](#part-a-windows-local-testing)
3. [Part B: Linux Server Setup](#part-b-linux-server-setup)
4. [Part C: Database Configuration](#part-c-database-configuration)
5. [Part D: Nginx Configuration](#part-d-nginx-configuration)
6. [Part E: SSL/HTTPS Setup](#part-e-ssl-https-setup)
7. [Part F: Deployment & Verification](#part-f-deployment-verification)
8. [Part G: Monitoring & Maintenance](#part-g-monitoring-maintenance)

---

## Prerequisites

### What You Need

**Local (Windows):**
- Docker Desktop installed
- PowerShell 5.1+
- Git
- Text editor (VS Code recommended)

**Server (Linux):**
- Ubuntu 20.04+ or similar
- Root or sudo access
- Domain name pointed to server IP
- Minimum 2GB RAM, 2 CPU cores, 20GB disk

**Credentials Ready:**
- Database password
- JWT secrets
- API keys (Twilio, Cloudinary, etc.)
- Email SMTP credentials

---

## Part A: Windows Local Testing

### Step 1: Verify Docker Installation

```powershell
# Check Docker is installed and running
docker --version
docker info

# If not installed, download from: https://www.docker.com/products/docker-desktop
```

### Step 2: Clone/Update Repository

```powershell
# Navigate to your project
cd C:\Users\user\Desktop\project\urutibz\urutibiz-backend

# Pull latest changes (if using Git)
git pull origin main
```

### Step 3: Create Environment File

```powershell
# Copy example environment file
Copy-Item .env.example .env.local

# Edit the file
notepad .env.local
```

**Minimum configuration for local testing:**
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urutibiz_dev
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=local-dev-secret-min-32-characters
JWT_REFRESH_SECRET=local-dev-refresh-secret-min-32
```


### Step 4: Build Docker Image (Windows)

```powershell
# Method 1: Using PowerShell script (Recommended)
.\docker-build.ps1 -Environment production

# Method 2: Direct Docker command
docker build --target production -t urutibiz-backend:latest .

# Verify image was created
docker images urutibiz-backend
```

**Expected output:**
```
REPOSITORY          TAG       SIZE
urutibiz-backend    latest    ~250MB
```

### Step 5: Start Database & Redis (Local Testing)

```powershell
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d postgres redis

# Verify they're running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### Step 6: Run Backend Container (Local)

```powershell
# Run the backend
docker run -d `
  --name urutibiz-backend-local `
  -p 3000:3000 `
  --env-file .env.local `
  --network urutibiz-backend_urutibiz-network `
  urutibiz-backend:latest

# Check if running
docker ps

# View logs
docker logs -f urutibiz-backend-local
```


### Step 7: Run Database Migrations (Local)

```powershell
# Run migrations
docker exec urutibiz-backend-local npm run db:migrate

# Seed database (optional)
docker exec urutibiz-backend-local npm run db:seed
```

### Step 8: Test Local Deployment

```powershell
# Test health endpoint
curl http://localhost:3000/health

# Or use browser
Start-Process "http://localhost:3000/health"

# Check API documentation (if Swagger enabled)
Start-Process "http://localhost:3000/api-docs"
```

**Expected response:**
```json
{"status":"ok","timestamp":"2024-02-05T10:00:00.000Z"}
```

### Step 9: Stop Local Environment

```powershell
# Stop backend
docker stop urutibiz-backend-local
docker rm urutibiz-backend-local

# Stop all services
docker-compose down

# Or keep database running
docker-compose stop backend
```

---

## Part B: Linux Server Setup

### Step 1: Connect to Server via SSH

```bash
# From Windows PowerShell or Linux terminal
ssh root@your-server-ip

# Or with key
ssh -i path/to/key.pem ubuntu@your-server-ip

# Example
ssh root@192.168.1.100
```

### Step 2: Update System

```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim nano htop
```

### Step 3: Install Docker on Linux

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```


### Step 4: Configure Docker (Linux)

```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER

# Apply group changes (logout/login or run)
newgrp docker

# Test Docker without sudo
docker run hello-world
```

### Step 5: Install Docker Compose (if not installed)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### Step 6: Create Application Directory

```bash
# Create app directory
sudo mkdir -p /opt/urutibiz
cd /opt/urutibiz

# Set ownership
sudo chown -R $USER:$USER /opt/urutibiz
```

### Step 7: Clone Repository to Server

```bash
# Clone from Git
git clone https://github.com/your-username/urutibiz-backend.git
cd urutibiz-backend

# Or upload files via SCP from Windows
# From Windows PowerShell:
# scp -r C:\Users\user\Desktop\project\urutibz\urutibiz-backend root@your-server-ip:/opt/urutibiz/
```


### Step 8: Create Production Environment File

```bash
# Copy example file
cp .env.example .env.production

# Edit with nano or vim
nano .env.production
```

**Production environment configuration:**
```env
# Application
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1

# Frontend
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Database (use strong passwords!)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=urutibiz_prod
DB_USER=urutibiz_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123!@#
DB_SSL=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_456!@#

# JWT (generate strong secrets)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_789
JWT_REFRESH_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_012
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=CHANGE_THIS_32_CHARACTER_KEY_345

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=YourApp

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Python Service
PYTHON_IMAGE_SERVICE_URL=http://python-service:8001

# Monitoring
SWAGGER_ENABLED=false
LOG_LEVEL=error
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`


### Step 9: Generate Strong Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate another for refresh token
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32

# Copy these values to .env.production
```

### Step 10: Build Docker Image on Server

```bash
# Make build script executable
chmod +x docker-build.sh

# Build production image
./docker-build.sh production

# Or use direct Docker command
docker build --target production -t urutibiz-backend:latest .

# Verify image
docker images | grep urutibiz-backend
```

---

## Part C: Database Configuration

### Step 1: Update Docker Compose for Production

Edit `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

Ensure database configuration:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: urutibiz-postgres-prod
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - urutibiz-network
    # Don't expose port in production for security
    # ports:
    #   - "5432:5432"

volumes:
  postgres_data:
    driver: local

networks:
  urutibiz-network:
    driver: bridge
```

### Step 2: Start Database

```bash
# Start only database first
docker compose -f docker-compose.prod.yml up -d postgres

# Check if running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs postgres

# Wait for database to be ready (about 10 seconds)
sleep 10
```


### Step 3: Test Database Connection

```bash
# Connect to PostgreSQL
docker exec -it urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod

# Inside PostgreSQL, run:
\l              # List databases
\dt             # List tables (will be empty initially)
\q              # Quit
```

### Step 4: Create Database Backup Script

```bash
# Create backup directory
mkdir -p /opt/urutibiz/backups

# Create backup script
cat > /opt/urutibiz/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/urutibiz/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/urutibiz_backup_$DATE.sql"

docker exec urutibiz-postgres-prod pg_dump -U urutibiz_user urutibiz_prod > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

# Make executable
chmod +x /opt/urutibiz/backup-db.sh

# Test backup
./backup-db.sh
```

### Step 5: Schedule Automatic Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/urutibiz/backup-db.sh >> /opt/urutibiz/backups/backup.log 2>&1
```

---

## Part D: Nginx Configuration

### Step 1: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test Nginx is working
curl http://localhost
```

### Step 2: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```
# Create wheels directory for Python service
mkdir -p python-service/wheels

# Now start backend only (skip python service for now)
docker compose -f docker-compose.prod.yml up -d backend

# Check status
docker compose -f docker-compose.prod.yml ps

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

### Step 3: Create Nginx Configuration

```bash
# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/urutibiz
```

**Nginx configuration:**
```nginx
# Upstream backend
upstream backend {
    server localhost:10000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# HTTP Server (will redirect to HTTPS after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/urutibiz_access.log;
    error_log /var/log/nginx/urutibiz_error.log;

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api_limit burst=50 nodelay;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/v1/auth {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        limit_req zone=auth_limit burst=10 nodelay;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`


### Step 4: Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/urutibiz /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Step 5: Test Nginx (Before SSL)

```bash
# Test from server
curl http://localhost/health

# Test from your computer (replace with your server IP)
curl http://your-server-ip/health
```

---

## Part E: SSL/HTTPS Setup

### Step 1: Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Obtain SSL Certificate

```bash
# Make sure your domain points to your server IP first!
# Check with: nslookup yourdomain.com

# Obtain certificate (replace with your domain and email)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --email your-email@example.com --agree-tos --no-eff-email

# Certbot will automatically:
# 1. Obtain certificate
# 2. Update Nginx configuration
# 3. Set up HTTPS redirect
```

### Step 3: Test SSL Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test HTTPS
curl https://yourdomain.com/health

# Check SSL grade (from your computer)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### Step 4: Set Up Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically creates a cron job
# Verify it exists
sudo systemctl list-timers | grep certbot

# Or check cron
sudo cat /etc/cron.d/certbot
```

### Step 5: Update Nginx for Production (Optional Hardening)

```bash
sudo nano /etc/nginx/sites-available/urutibiz
```

Add after the SSL configuration Certbot created:

```nginx
# Additional SSL hardening
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (uncomment after testing)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

```bash
# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Part F: Deployment & Verification

### Step 1: Start All Services

```bash
# Navigate to project directory
cd /opt/urutibiz/urutibiz-backend

# Start all services with Docker Compose
docker compose -f docker-compose.prod.yml up -d

# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Expected output: All services should be "Up"
```

### Step 2: Run Database Migrations

```bash
# Wait 30 seconds for backend to fully start
sleep 30

# Run migrations
docker exec urutibiz-backend-prod npm run db:migrate

# Check migration status
docker exec urutibiz-backend-prod npm run db:migrate:status

# Seed initial data (if needed)
docker exec urutibiz-backend-prod npm run db:seed
```

### Step 3: Verify All Services

```bash
# Check backend health
curl https://yourdomain.com/health

# Check backend logs
docker logs urutibiz-backend-prod --tail 50

# Check database
docker exec -it urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod -c "\dt"

# Check Redis
docker exec urutibiz-redis-prod redis-cli -a YOUR_REDIS_PASSWORD ping
```

### Step 4: Test API Endpoints

```bash
# Test from server
curl https://yourdomain.com/api/v1/health

# Test authentication endpoint
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Check response (should get 200 or appropriate response)
```


### Step 5: Configure System Services (Auto-Start on Reboot)

```bash
# Create systemd service for Docker Compose
sudo nano /etc/systemd/system/urutibiz.service
```

**Service configuration:**
```ini
[Unit]
Description=UrutiBiz Backend Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/urutibiz/urutibiz-backend
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable urutibiz.service
sudo systemctl start urutibiz.service

# Check status
sudo systemctl status urutibiz.service
```

### Step 6: Test Auto-Restart

```bash
# Reboot server to test auto-start
sudo reboot

# After reboot, reconnect and check
ssh root@your-server-ip

# Verify services started automatically
docker ps
curl https://yourdomain.com/health
```

---

## Part G: Monitoring & Maintenance

### Step 1: Set Up Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/urutibiz
```

```
/var/log/nginx/urutibiz_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### Step 2: Create Monitoring Script

```bash
# Create monitoring script
cat > /opt/urutibiz/monitor.sh << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "==================================="
echo "UrutiBiz Backend Health Check"
echo "==================================="
echo ""

# Check Docker containers
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check backend health
echo -n "Backend Health: "
if curl -sf https://yourdomain.com/health > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check disk space
echo ""
echo "Disk Usage:"
df -h / | tail -1

# Check memory
echo ""
echo "Memory Usage:"
free -h | grep Mem

# Check Docker stats
echo ""
echo "Container Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "==================================="
EOF

chmod +x /opt/urutibiz/monitor.sh

# Run it
./monitor.sh
```


### Step 3: Create Update/Deployment Script

```bash
# Create deployment script
cat > /opt/urutibiz/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to project directory
cd /opt/urutibiz/urutibiz-backend

# Pull latest changes
echo "Pulling latest code..."
git pull origin main

# Backup database
echo "Backing up database..."
./backup-db.sh

# Build new image
echo "Building Docker image..."
docker build --target production -t urutibiz-backend:latest .

# Stop old containers
echo "Stopping old containers..."
docker compose -f docker-compose.prod.yml down

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 30

# Run migrations
echo "Running database migrations..."
docker exec urutibiz-backend-prod npm run db:migrate

# Health check
echo "Checking health..."
if curl -sf https://yourdomain.com/health > /dev/null; then
    echo "✓ Deployment successful!"
else
    echo "✗ Health check failed!"
    exit 1
fi

# Clean up old images
echo "Cleaning up..."
docker image prune -f

echo "Deployment complete!"
EOF

chmod +x /opt/urutibiz/deploy.sh
```

### Step 4: Common Maintenance Commands

```bash
# View logs
docker logs -f urutibiz-backend-prod

# View last 100 lines
docker logs --tail 100 urutibiz-backend-prod

# Restart backend
docker restart urutibiz-backend-prod

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check resource usage
docker stats

# Access backend shell
docker exec -it urutibiz-backend-prod sh

# Access database
docker exec -it urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod

# View Nginx logs
sudo tail -f /var/log/nginx/urutibiz_access.log
sudo tail -f /var/log/nginx/urutibiz_error.log
```


### Step 5: Set Up Monitoring Alerts (Optional)

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Create alert script for disk space
cat > /opt/urutibiz/check-disk.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
CURRENT=$(df / | grep / | awk '{ print $5}' | sed 's/%//g')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
    echo "Disk usage is above ${THRESHOLD}%: ${CURRENT}%"
    # Add email notification here if needed
fi
EOF

chmod +x /opt/urutibiz/check-disk.sh

# Add to crontab (check every hour)
(crontab -l 2>/dev/null; echo "0 * * * * /opt/urutibiz/check-disk.sh") | crontab -
```

### Step 6: Security Hardening Checklist

```bash
# 1. Change SSH port (optional but recommended)
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
sudo systemctl restart sshd

# 2. Disable root login
sudo nano /etc/ssh/sshd_config
# Change: PermitRootLogin yes to PermitRootLogin no
sudo systemctl restart sshd

# 3. Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 4. Configure fail2ban for Nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/urutibiz_error.log
```

```bash
sudo systemctl restart fail2ban
```

---

## 🎯 Quick Command Reference

### Windows (Local Testing)

```powershell
# Build
.\docker-build.ps1 -Environment production

# Run
docker run -d --name urutibiz-backend-local -p 3000:3000 --env-file .env.local urutibiz-backend:latest

# Logs
docker logs -f urutibiz-backend-local

# Stop
docker stop urutibiz-backend-local
docker rm urutibiz-backend-local

# Full stack
docker-compose up -d
docker-compose down
```

### Linux (Production Server)

```bash
# Connect
ssh root@your-server-ip

# Navigate
cd /opt/urutibiz/urutibiz-backend

# Deploy
./deploy.sh

# Monitor
./monitor.sh

# Logs
docker logs -f urutibiz-backend-prod

# Restart
docker compose -f docker-compose.prod.yml restart

# Database backup
./backup-db.sh

# Health check
curl https://yourdomain.com/health
```

---

## 🆘 Troubleshooting Guide

### Issue: Container Won't Start

```bash
# Check logs
docker logs urutibiz-backend-prod

# Check if port is in use
sudo netstat -tulpn | grep 10000

# Check environment variables
docker exec urutibiz-backend-prod env

# Restart container
docker restart urutibiz-backend-prod
```

### Issue: Database Connection Failed

```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs urutibiz-postgres-prod

# Test connection
docker exec urutibiz-backend-prod node -e "require('./dist/config/database').testConnection()"

# Restart database
docker restart urutibiz-postgres-prod
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check backend is running
docker ps | grep backend

# Check backend logs
docker logs urutibiz-backend-prod

# Check Nginx logs
sudo tail -f /var/log/nginx/urutibiz_error.log

# Test backend directly
curl http://localhost:10000/health

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: SSL Certificate Problems

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Issue: Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean old logs
sudo journalctl --vacuum-time=7d

# Clean old backups
find /opt/urutibiz/backups -name "*.sql" -mtime +7 -delete
```

### Issue: High Memory Usage

```bash
# Check container stats
docker stats

# Restart containers
docker compose -f docker-compose.prod.yml restart

# Check system memory
free -h

# Kill memory-intensive processes
htop
```

---

## 📊 Post-Deployment Checklist

### Immediate Verification (First 5 Minutes)

- [ ] All Docker containers are running: `docker ps`
- [ ] Backend health check passes: `curl https://yourdomain.com/health`
- [ ] Database is accessible: `docker exec -it urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod -c "\dt"`
- [ ] Redis is responding: `docker exec urutibiz-redis-prod redis-cli -a PASSWORD ping`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] SSL certificate is valid: `curl https://yourdomain.com/health`
- [ ] No errors in logs: `docker logs urutibiz-backend-prod --tail 50`

### First Hour Verification

- [ ] Test user registration endpoint
- [ ] Test user login endpoint
- [ ] Test file upload functionality
- [ ] Test WebSocket connections
- [ ] Test email sending
- [ ] Test SMS sending (if applicable)
- [ ] Monitor resource usage: `docker stats`
- [ ] Check Nginx access logs: `sudo tail -f /var/log/nginx/urutibiz_access.log`

### First Day Verification

- [ ] Database backup completed successfully
- [ ] Auto-restart works after reboot
- [ ] SSL auto-renewal is configured
- [ ] Monitoring scripts are working
- [ ] All API endpoints respond correctly
- [ ] Performance is acceptable
- [ ] No memory leaks detected

### Security Checklist

- [ ] All secrets changed from defaults
- [ ] Strong passwords used (min 16 characters)
- [ ] JWT secrets are random and secure
- [ ] Database not exposed to public
- [ ] Redis not exposed to public
- [ ] Firewall configured correctly
- [ ] SSH key authentication enabled
- [ ] Root login disabled (optional)
- [ ] Fail2ban installed and configured
- [ ] SSL certificate valid and auto-renewing
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Security headers configured

---

## 🔄 Update/Rollback Procedures

### Standard Update Procedure

```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Navigate to project
cd /opt/urutibiz/urutibiz-backend

# 3. Backup database
./backup-db.sh

# 4. Pull latest code
git pull origin main

# 5. Build new image
docker build --target production -t urutibiz-backend:latest .

# 6. Stop old containers
docker compose -f docker-compose.prod.yml down

# 7. Start new containers
docker compose -f docker-compose.prod.yml up -d

# 8. Run migrations
sleep 30
docker exec urutibiz-backend-prod npm run db:migrate

# 9. Verify
curl https://yourdomain.com/health
```

### Quick Rollback Procedure

```bash
# 1. Stop current containers
docker compose -f docker-compose.prod.yml down

# 2. Restore database backup
docker exec -i urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod < /opt/urutibiz/backups/urutibiz_backup_YYYYMMDD_HHMMSS.sql

# 3. Checkout previous version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 4. Rebuild image
docker build --target production -t urutibiz-backend:latest .

# 5. Start containers
docker compose -f docker-compose.prod.yml up -d

# 6. Verify
curl https://yourdomain.com/health
```

---

## 📞 Support & Resources

### Important Files

- **Environment**: `/opt/urutibiz/urutibiz-backend/.env.production`
- **Nginx Config**: `/etc/nginx/sites-available/urutibiz`
- **SSL Certificates**: `/etc/letsencrypt/live/yourdomain.com/`
- **Backups**: `/opt/urutibiz/backups/`
- **Logs**: `/var/log/nginx/` and `docker logs`

### Useful Commands Cheat Sheet

```bash
# Service Management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status urutibiz

# Docker Management
docker ps                                    # List containers
docker logs -f <container>                   # Follow logs
docker exec -it <container> sh               # Access shell
docker stats                                 # Resource usage
docker compose -f docker-compose.prod.yml ps # List services

# Database
docker exec -it urutibiz-postgres-prod psql -U urutibiz_user -d urutibiz_prod
./backup-db.sh                               # Backup database

# Monitoring
./monitor.sh                                 # Run health check
htop                                         # System resources
df -h                                        # Disk usage
free -h                                      # Memory usage

# Logs
docker logs urutibiz-backend-prod --tail 100
sudo tail -f /var/log/nginx/urutibiz_error.log
sudo journalctl -u nginx -f

# Deployment
./deploy.sh                                  # Deploy updates
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

### Emergency Contacts

- **DevOps Lead**: [Your contact]
- **Database Admin**: [Your contact]
- **On-Call Engineer**: [Your contact]

### External Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Deployment Complete!

Your UrutiBiz backend is now fully deployed and production-ready!

**Access your API at**: `https://yourdomain.com/api/v1`

**Next steps:**
1. Deploy frontend application
2. Configure monitoring and alerts
3. Set up CI/CD pipeline
4. Document API endpoints
5. Train team on maintenance procedures

---

**Version**: 1.0.0  
**Last Updated**: 2024-02-05  
**Status**: ✅ Production Ready


---

## Part H: Python Image Service Setup

### Overview

The Python service provides AI-powered image feature extraction using OpenAI's CLIP model for image search functionality.

**What it does:**
- Extracts 512-dimensional feature vectors from images
- Enables semantic image search (find similar products)
- Used by major e-commerce platforms

### Step 1: Verify Python Service Files

```bash
# Check Python service directory
ls -la python-service/

# Expected files:
# - Dockerfile
# - main.py
# - requirements.txt
# - requirements-base.txt
# - requirements-torch.txt
```

### Step 2: Build Python Service Image (Linux)

```bash
# Navigate to python-service directory
cd /opt/urutibiz/urutibiz-backend/python-service

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Build image (first build takes 10-20 minutes to download PyTorch)
docker build -t urutibiz-python-service:latest .

# Verify image
docker images | grep python-service

# Go back to main directory
cd /opt/urutibiz/urutibiz-backend
```

**Note**: First build downloads ~2GB of PyTorch libraries. Subsequent builds use cache.

### Step 3: Build Python Service (Windows - Optional for Local Testing)

```powershell
# Navigate to python-service
cd python-service

# Enable BuildKit
$env:DOCKER_BUILDKIT=1

# Build image
docker build -t urutibiz-python-service:latest .

# Go back
cd ..
```


### Step 4: Update Docker Compose to Include Python Service

The `docker-compose.prod.yml` should already include the Python service. Verify:

```bash
nano docker-compose.prod.yml
```

Ensure this section exists:

```yaml
services:
  python-service:
    build:
      context: ./python-service
      dockerfile: Dockerfile
    image: urutibiz-python-service:prod
    container_name: urutibiz-python-service-prod
    restart: always
    ports:
      - "8001:8001"
    networks:
      - urutibiz-network
    volumes:
      # Persist HuggingFace model cache (saves re-downloading 605MB model)
      - python-model-cache:/app/.cache/huggingface
    environment:
      - HF_HOME=/app/.cache/huggingface
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s  # Give time for model to download on first run

volumes:
  python-model-cache:
    driver: local
```

### Step 5: Start Python Service

```bash
# Start only Python service first (to download model)
docker compose -f docker-compose.prod.yml up -d python-service

# Watch logs (first run downloads 605MB CLIP model)
docker logs -f urutibiz-python-service-prod

# Wait for "Service ready to accept requests" message
# First run: 5-10 minutes (downloads model)
# Subsequent runs: 30 seconds (uses cached model)
```

**Expected output:**
```
🚀 Starting Python Image Feature Extraction Service
📥 Downloading model files (this may take a while on first run)...
✅ Model files downloaded in 180.5s
✅ CLIP model loaded successfully
✅ Service ready to accept requests
```


### Step 6: Test Python Service

```bash
# Test health endpoint
curl http://localhost:8001/health

# Expected response:
# {
#   "status": "healthy",
#   "model_loaded": true,
#   "device": "cpu",
#   "model_name": "CLIP ViT-B/32",
#   "embedding_dimension": 512
# }

# Test from backend container
docker exec urutibiz-backend-prod curl http://python-service:8001/health
```

### Step 7: Test Image Feature Extraction

```bash
# Create test image (or use existing)
curl -o test-image.jpg https://via.placeholder.com/300

# Test feature extraction
curl -X POST http://localhost:8001/extract-features \
  -F "file=@test-image.jpg"

# Expected response:
# {
#   "success": true,
#   "embedding": [0.123, 0.456, ...],  # 512 numbers
#   "dimension": 512
# }
```

### Step 8: Configure Backend to Use Python Service

Verify `.env.production` has:

```env
PYTHON_IMAGE_SERVICE_URL=http://python-service:8001
```

**Note**: Use service name `python-service` (not `localhost`) for Docker internal communication.

### Step 9: Restart Backend with Python Service

```bash
# Restart backend to connect to Python service
docker restart urutibiz-backend-prod

# Check backend logs
docker logs urutibiz-backend-prod --tail 50

# Verify connection
docker exec urutibiz-backend-prod curl http://python-service:8001/health
```


### Step 10: Python Service Troubleshooting

#### Issue: Model Download Fails

```bash
# Check logs
docker logs urutibiz-python-service-prod

# Common causes:
# 1. Network timeout - retry will happen automatically
# 2. HuggingFace blocked - use VPN
# 3. Disk space - check: df -h

# Manual retry
docker restart urutibiz-python-service-prod
docker logs -f urutibiz-python-service-prod
```

#### Issue: Out of Memory

```bash
# Check memory usage
docker stats urutibiz-python-service-prod

# Increase memory limit in docker-compose.prod.yml:
services:
  python-service:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# Restart
docker compose -f docker-compose.prod.yml restart python-service
```

#### Issue: Service Not Responding

```bash
# Check if running
docker ps | grep python-service

# Check health
curl http://localhost:8001/health

# Restart service
docker restart urutibiz-python-service-prod

# Check logs
docker logs urutibiz-python-service-prod --tail 100
```

### Step 11: Python Service Maintenance

```bash
# View logs
docker logs -f urutibiz-python-service-prod

# Check resource usage
docker stats urutibiz-python-service-prod

# Restart service
docker restart urutibiz-python-service-prod

# Update service
cd /opt/urutibiz/urutibiz-backend/python-service
git pull origin main
docker build -t urutibiz-python-service:latest .
docker compose -f ../docker-compose.prod.yml restart python-service

# Clear model cache (if needed)
docker volume rm urutibiz-backend_python-model-cache
docker compose -f docker-compose.prod.yml up -d python-service
```

### Python Service Performance Notes

**First Run:**
- Downloads 605MB CLIP model from HuggingFace
- Takes 5-10 minutes depending on internet speed
- Model cached in Docker volume for future use

**Subsequent Runs:**
- Uses cached model
- Starts in ~30 seconds
- No re-download needed

**Resource Usage:**
- Memory: ~1-2GB
- CPU: Moderate during inference
- Disk: ~1GB for model cache

**Production Recommendations:**
- Keep model cache volume persistent
- Monitor memory usage
- Consider GPU for faster inference (optional)
- Set up health check monitoring

---
