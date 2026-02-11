# Simple Deployment Guide - Copy & Paste Commands

## Windows Local Testing

```powershell
# 1. Build
.\docker-build.ps1 -Environment production

# 2. Run
docker run -d --name urutibiz-backend-local -p 3000:3000 --env-file .env urutibiz-backend:latest

# 3. Check
curl http://localhost:3000/health

# 4. Stop
docker stop urutibiz-backend-local
docker rm urutibiz-backend-local
```

---

## Linux Production Server

### Initial Setup (One Time)

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create directory
sudo mkdir -p /opt/urutibiz
cd /opt/urutibiz

# Upload your code or clone
git clone YOUR_REPO_URL urutibiz-backend
cd urutibiz-backend

# Create environment file
cp .env.example .env.production
nano .env.production
# Edit and save (Ctrl+X, Y, Enter)

# Generate secrets
openssl rand -base64 32  # Copy for JWT_SECRET
openssl rand -base64 32  # Copy for JWT_REFRESH_SECRET
```

### Deploy

```bash
# Build images
docker build --target production -t urutibiz-backend:latest .
cd python-service
docker build -t urutibiz-python-service:latest .
cd ..

# Start everything
docker compose -f docker-compose.prod.yml up -d

# Wait 30 seconds
sleep 30

# Run migrations
docker exec urutibiz-backend-prod npm run db:migrate

# Check
docker ps
curl http://localhost:10000/health
curl http://localhost:8001/health
```

### Setup Nginx

```bash
# Install
sudo apt install -y nginx

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create config
sudo nano /etc/nginx/sites-available/urutibiz
```

Paste this:

```nginx
upstream backend {
    server localhost:10000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Save and continue:

```bash
# Enable
sudo ln -s /etc/nginx/sites-available/urutibiz /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Setup SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com --email your@email.com --agree-tos

# Test
curl https://yourdomain.com/health
```

---

## Daily Commands

```bash
# View logs
docker logs -f urutibiz-backend-prod

# Restart
docker restart urutibiz-backend-prod

# Update
cd /opt/urutibiz/urutibiz-backend
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
docker exec urutibiz-postgres-prod pg_dump -U urutibiz_user urutibiz_prod > backup.sql
```

---

## That's It!

Your backend is now running at: `https://yourdomain.com`
