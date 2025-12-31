# 🚀 Quick Deployment Reference - UrutiBiz

Quick command reference for deploying and updating UrutiBiz on Ubuntu.

---

## 📋 Initial Deployment (First Time)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL, Redis, Nginx
sudo apt install -y postgresql postgresql-contrib postgis redis-server nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Setup Database
```bash
sudo -u postgres psql
# In PostgreSQL:
CREATE DATABASE urutibiz_db;
CREATE USER urutibiz_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE urutibiz_db TO urutibiz_user;
\c urutibiz_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### 3. Clone Project
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <YOUR_REPO_URL> urutibz
sudo chown -R $USER:$USER /var/www/urutibz
```

### 4. Deploy Backend
```bash
cd /var/www/urutibz/urutibiz-backend

# Create .env file (see COMPLETE_DEPLOYMENT_GUIDE.md for template)
nano .env

# Install, migrate, build, start
npm ci
npm run db:migrate
npm run build
pm2 start dist/server.js --name urutibiz-backend
pm2 save
pm2 startup  # Follow instructions
```

### 5. Deploy Frontend
```bash
cd /var/www/urutibz/urutibz-frontend

# Create .env file
nano .env
# Add: VITE_API_BASE_URL=https://api.your-domain.com/api/v1

# Install, build, deploy
npm ci
npm run build
sudo mkdir -p /var/www/urutibz-frontend
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
```

### 6. Configure Nginx
```bash
# Frontend config
sudo nano /etc/nginx/sites-available/urutibz-frontend
# (See COMPLETE_DEPLOYMENT_GUIDE.md for config)

# Backend config
sudo nano /etc/nginx/sites-available/urutibz-backend
# (See COMPLETE_DEPLOYMENT_GUIDE.md for config)

# Enable sites
sudo ln -s /etc/nginx/sites-available/urutibz-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/urutibz-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d api.your-domain.com
```

---

## 🔄 Updating Codebase

### Quick Update (Using Script)
```bash
# Make script executable (first time only)
chmod +x /var/www/urutibz/update-deployment.sh

# Run update
/var/www/urutibz/update-deployment.sh
```

### Manual Update - Backend
```bash
cd /var/www/urutibz/urutibiz-backend
git pull origin main
npm ci
npm run db:migrate
npm run build
pm2 restart urutibiz-backend
```

### Manual Update - Frontend
```bash
cd /var/www/urutibz/urutibz-frontend
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/
sudo chown -R www-data:www-data /var/www/urutibz-frontend
```

---

## 🔍 Useful Commands

### PM2 Management
```bash
pm2 status                    # View all processes
pm2 logs urutibiz-backend     # View logs
pm2 restart urutibiz-backend  # Restart
pm2 stop urutibiz-backend     # Stop
pm2 monit                     # Monitor resources
```

### Service Status
```bash
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
pm2 status
```

### Health Checks
```bash
# Backend health
curl http://localhost:10000/health

# Database
psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT 1;"

# Redis
redis-cli ping
```

### Logs
```bash
# Backend logs
pm2 logs urutibiz-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Database Backup
```bash
# Create backup
pg_dump -U urutibiz_user urutibiz_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U urutibiz_user urutibiz_db < backup_20240101.sql
```

---

## 🛠️ Troubleshooting

### Backend Not Starting
```bash
pm2 logs urutibiz-backend
cd /var/www/urutibz/urutibiz-backend
node dist/server.js  # Test manually
```

### Database Connection Issues
```bash
sudo systemctl status postgresql
psql -U urutibiz_user -d urutibiz_db -h localhost
```

### Frontend Not Loading
```bash
sudo nginx -t
sudo systemctl restart nginx
ls -la /var/www/urutibz-frontend
```

### Port Already in Use
```bash
sudo lsof -i :10000
sudo kill -9 <PID>
```

---

## 📁 Important File Locations

```
/var/www/urutibz/                    # Project root
/var/www/urutibz/urutibiz-backend/   # Backend code
/var/www/urutibz/urutibz-frontend/   # Frontend code
/var/www/urutibz-frontend/            # Frontend web files
/etc/nginx/sites-available/           # Nginx configs
/var/log/nginx/                       # Nginx logs
```

---

## ✅ Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and database created
- [ ] Redis installed and running
- [ ] Nginx installed and configured
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] Database migrations run
- [ ] Backend running with PM2
- [ ] Frontend built and deployed
- [ ] Nginx configured for both
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Health checks passing

---

For detailed instructions, see **COMPLETE_DEPLOYMENT_GUIDE.md**


