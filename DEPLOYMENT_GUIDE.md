# 🚀 Production Deployment Guide

**Senior DevOps Engineer's Step-by-Step Deployment**

Target: Production Linux Server (Ubuntu 20.04+)  
Time: 45-60 minutes  
Difficulty: Intermediate

---

## Prerequisites

**Server Requirements:**
- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Root or sudo access
- Domain name pointed to server IP

**Local Requirements:**
- SSH client
- Git (optional, for code updates)

---

## Part 1: Server Setup

### 1.1 Connect to Server

```bash
ssh root@your-server-ip
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git vim htop
```

### 1.3 Install Docker

```bash
# Remove old versions
apt remove docker docker-engine docker.io containerd runc

# Install dependencies
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Verify
docker --version
docker compose version
```

### 1.4 Configure Firewall

```bash
# Install UFW
apt install -y ufw

# Allow SSH (CRITICAL - do this first!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Verify
ufw status
```

---

## Part 2: Application Setup

### 2.1 Create Application Directory

```bash
mkdir -p /opt/urutibiz
cd /opt/urutibiz
```

### 2.2 Clone Repository

```bash
# Option A: Clone from Git
git clone https://github.com/your-username/urutibiz-backend.git
cd urutibiz-backend

# Option B: Upload via SCP (from your local machine)
# scp -r /path/to/urutibiz-backend root@your-server-ip:/opt/urutibiz/
```

### 2.3 Create Environment File

```bash
cd /opt/urutibiz/urutibiz-backend
cp .env.example .env
nano .env
```

**Critical environment variables:**

```env
# Application
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1

# Frontend
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=urutibiz_prod
DB_USER=urutibiz_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123
DB_SSL=false

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_456

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_32_CHAR_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=CHANGE_THIS_32_CHARACTER_KEY

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=YourApp

# Twilio (optional)
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
LOG_LEVEL=info
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### 2.4 Generate Strong Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32

# Copy these values to .env file
```

---

## Part 3: Build & Deploy

### 3.1 Build Docker Image

```bash
cd /opt/urutibiz/urutibiz-backend

# Build production image
docker build --target production -t urutibiz-backend:latest .

# Verify
docker images | grep urutibiz-backend
```

### 3.2 Start Database & Redis

```bash
# Start database and cache
docker compose -f docker-compose.production.yml up -d postgres redis

# Wait for services to be ready
sleep 15

# Verify
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs postgres
```

### 3.3 Run Database Migrations

```bash
# Start backend temporarily to run migrations
docker compose -f docker-compose.production.yml up -d api

# Wait for backend to start
sleep 30

# Run migrations
docker exec urutibiz-api npm run db:migrate

# Check migration status
docker exec urutibiz-api npm run db:migrate:status

# Seed initial data (optional)
docker exec urutibiz-api npm run db:seed
```

### 3.4 Verify Backend

```bash
# Check logs
docker logs urutibiz-api --tail 50

# Test health endpoint
curl http://localhost:10000/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

## Part 4: Nginx & SSL

### 4.1 Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 4.2 Configure Nginx

```bash
# Remove default config
rm /etc/nginx/sites-enabled/default

# Create new config
nano /etc/nginx/sites-available/urutibiz
```

**Nginx configuration:**

```nginx
upstream backend {
    server localhost:10000;
}

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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

    # Health check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### 4.3 Enable Nginx Configuration

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/urutibiz /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 4.4 Install SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain and email)
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Test auto-renewal
certbot renew --dry-run
```

### 4.5 Test HTTPS

```bash
# Test from server
curl https://yourdomain.com/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

## Part 5: Python Service (Optional)

### 5.1 Build Python Service

```bash
cd /opt/urutibiz/urutibiz-backend/python-service

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build image (takes 10-20 minutes first time)
docker build -t urutibiz-python-service:latest .

cd ..
```

### 5.2 Start Python Service

```bash
# Start Python service
docker compose -f docker-compose.production.yml up -d python-service

# Monitor logs (first run downloads 605MB model)
docker logs -f urutibiz-python-service-prod

# Wait for "Service ready to accept requests"
```

### 5.3 Test Python Service

```bash
# Test health
curl http://localhost:8001/health

# Expected: {"status":"healthy","model_loaded":true,...}
```

---

## Part 6: Automation & Monitoring

### 6.1 Create Backup Script

```bash
mkdir -p /opt/urutibiz/backups

cat > /opt/urutibiz/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/urutibiz/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/urutibiz_backup_$DATE.sql"

docker exec urutibiz-postgres pg_dump -U urutibiz_user urutibiz_prod > $BACKUP_FILE
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/urutibiz/backup-db.sh

# Test backup
/opt/urutibiz/backup-db.sh
```

### 6.2 Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/urutibiz/backup-db.sh >> /opt/urutibiz/backups/backup.log 2>&1
```

### 6.3 Create Monitoring Script

```bash
cat > /opt/urutibiz/monitor.sh << 'EOF'
#!/bin/bash

echo "==================================="
echo "UrutiBiz Backend Health Check"
echo "==================================="
echo ""

# Check Docker containers
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

# Check backend health
echo -n "Backend Health: "
if curl -sf https://yourdomain.com/health > /dev/null; then
    echo "✓ OK"
else
    echo "✗ FAILED"
fi

# Check disk space
echo ""
echo "Disk Usage:"
df -h / | tail -1

# Check memory
echo ""
echo "Memory Usage:"
free -h | grep Mem

echo ""
echo "==================================="
EOF

chmod +x /opt/urutibiz/monitor.sh

# Run it
/opt/urutibiz/monitor.sh
```

### 6.4 Create Deployment Script

```bash
cat > /opt/urutibiz/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."
cd /opt/urutibiz/urutibiz-backend

# Backup database
echo "Backing up database..."
/opt/urutibiz/backup-db.sh

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Build new image
echo "Building Docker image..."
docker build --target production -t urutibiz-backend:latest .

# Stop old containers
echo "Stopping old containers..."
docker compose -f docker-compose.production.yml down

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.production.yml up -d

# Wait for backend
echo "Waiting for backend..."
sleep 30

# Run migrations
echo "Running migrations..."
docker exec urutibiz-api npm run db:migrate

# Health check
echo "Checking health..."
if curl -sf https://yourdomain.com/health > /dev/null; then
    echo "✓ Deployment successful!"
else
    echo "✗ Health check failed!"
    exit 1
fi

# Clean up
docker image prune -f

echo "Deployment complete!"
EOF

chmod +x /opt/urutibiz/deploy.sh
```

### 6.5 Create Systemd Service

```bash
cat > /etc/systemd/system/urutibiz.service << 'EOF'
[Unit]
Description=UrutiBiz Backend Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/urutibiz/urutibiz-backend
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable service
systemctl daemon-reload
systemctl enable urutibiz.service
systemctl start urutibiz.service
```

---

## Part 7: Security Hardening

### 7.1 Install Fail2Ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 7.2 Configure Fail2Ban for Nginx

```bash
cat > /etc/fail2ban/jail.local << 'EOF'
[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/urutibiz_error.log
EOF

systemctl restart fail2ban
```

### 7.3 Disable Root Login (Optional)

```bash
# Create non-root user first
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Test login as new user before disabling root!
# ssh deploy@your-server-ip

# Then disable root login
nano /etc/ssh/sshd_config
# Change: PermitRootLogin no

systemctl restart sshd
```

---

## Part 8: Verification

### 8.1 Check All Services

```bash
# Check containers
docker ps

# Check backend
curl https://yourdomain.com/health

# Check database
docker exec urutibiz-postgres pg_isready -U urutibiz_user

# Check Redis
docker exec urutibiz-redis redis-cli -a YOUR_REDIS_PASSWORD ping

# Check logs
docker logs urutibiz-api --tail 50
```

### 8.2 Test API Endpoints

```bash
# Test health
curl https://yourdomain.com/api/v1/health

# Test registration (should return appropriate response)
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

### 8.3 Monitor Logs

```bash
# Backend logs
docker logs -f urutibiz-api

# Nginx logs
tail -f /var/log/nginx/urutibiz_access.log
tail -f /var/log/nginx/urutibiz_error.log

# System logs
journalctl -u urutibiz -f
```

---

## Quick Command Reference

### Service Management

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Stop all services
docker compose -f docker-compose.production.yml down

# Restart backend
docker restart urutibiz-api

# View logs
docker logs -f urutibiz-api

# Check status
docker compose -f docker-compose.production.yml ps
```

### Database Operations

```bash
# Access database
docker exec -it urutibiz-postgres psql -U urutibiz_user -d urutibiz_prod

# Backup database
/opt/urutibiz/backup-db.sh

# Run migrations
docker exec urutibiz-api npm run db:migrate

# Rollback migration
docker exec urutibiz-api npm run db:rollback
```

### Monitoring

```bash
# Health check
/opt/urutibiz/monitor.sh

# Resource usage
docker stats

# Disk space
df -h

# Memory usage
free -h

# System resources
htop
```

### Deployment

```bash
# Deploy updates
/opt/urutibiz/deploy.sh

# Manual deployment
cd /opt/urutibiz/urutibiz-backend
git pull origin main
docker build --target production -t urutibiz-backend:latest .
docker compose -f docker-compose.production.yml up -d --build
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs urutibiz-api

# Check port conflicts
netstat -tulpn | grep 10000

# Restart container
docker restart urutibiz-api
```

### Database Connection Failed

```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs urutibiz-postgres

# Test connection
docker exec urutibiz-api node -e "console.log('Testing DB connection')"
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
docker ps | grep urutibiz-api

# Check backend logs
docker logs urutibiz-api

# Test backend directly
curl http://localhost:10000/health

# Restart Nginx
systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Post-Deployment Checklist

- [ ] All containers running: `docker ps`
- [ ] Backend health check passes: `curl https://yourdomain.com/health`
- [ ] Database accessible
- [ ] Redis responding
- [ ] SSL certificate valid
- [ ] Nginx running
- [ ] No errors in logs
- [ ] Backups scheduled
- [ ] Monitoring script works
- [ ] Firewall configured
- [ ] Auto-restart on reboot tested

---

## Success!

Your UrutiBiz backend is now deployed and production-ready.

**API URL:** `https://yourdomain.com/api/v1`

**Next Steps:**
1. Deploy frontend application
2. Configure monitoring alerts
3. Set up CI/CD pipeline
4. Document API endpoints
5. Train team on maintenance

---

**Version:** 1.0.0  
**Last Updated:** February 16, 2026  
**Status:** ✅ Production Ready
