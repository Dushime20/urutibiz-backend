# 📦 UrutiBiz Deployment Package Summary

This package contains everything you need to deploy and maintain the UrutiBiz project on Ubuntu.

---

## 📄 Files Included

### 1. **COMPLETE_DEPLOYMENT_GUIDE.md**
   - **Purpose**: Comprehensive step-by-step deployment guide
   - **Use When**: First-time deployment or detailed troubleshooting
   - **Contents**: 
     - Complete server setup instructions
     - Software installation commands
     - Database configuration
     - Backend and frontend deployment
     - Nginx configuration
     - SSL certificate setup
     - Update procedures
     - Troubleshooting guide

### 2. **QUICK_DEPLOYMENT_REFERENCE.md**
   - **Purpose**: Quick command reference
   - **Use When**: You know what to do, just need the commands
   - **Contents**: 
     - Condensed command lists
     - Quick update procedures
     - Common troubleshooting commands
     - File locations

### 3. **deploy.sh**
   - **Purpose**: Automated initial deployment script
   - **Use When**: First-time deployment
   - **How to Use**:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```
   - **What it does**: 
     - Checks prerequisites
     - Installs dependencies
     - Runs migrations
     - Builds applications
     - Starts services with PM2

### 4. **update-deployment.sh**
   - **Purpose**: Automated update script for code changes
   - **Use When**: You've made code changes and want to update production
   - **How to Use**:
     ```bash
     chmod +x update-deployment.sh
     ./update-deployment.sh
     ```
   - **What it does**:
     - Pulls latest code from Git
     - Installs new dependencies
     - Runs database migrations
     - Rebuilds applications
     - Restarts services
     - Verifies health

---

## 🚀 Quick Start

### For First-Time Deployment:

1. **Read**: `COMPLETE_DEPLOYMENT_GUIDE.md` (sections 1-8)
2. **Run**: `./deploy.sh` (after setting up prerequisites)
3. **Configure**: Nginx and SSL (see guide)

### For Updates:

1. **Option A**: Run `./update-deployment.sh` (recommended)
2. **Option B**: Follow manual steps in `QUICK_DEPLOYMENT_REFERENCE.md`

---

## 📋 Deployment Flow

```
┌─────────────────────────────────────┐
│  1. Server Setup                    │
│     - Update Ubuntu                 │
│     - Install Node.js, PostgreSQL,  │
│       Redis, Nginx, PM2            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Database Setup                  │
│     - Create database               │
│     - Create user                   │
│     - Enable PostGIS                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Clone Project                    │
│     - Git clone or upload files     │
│     - Set permissions               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Backend Deployment               │
│     - Configure .env                │
│     - Install dependencies          │
│     - Run migrations                │
│     - Build application             │
│     - Start with PM2                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Frontend Deployment              │
│     - Configure .env                │
│     - Install dependencies          │
│     - Build application             │
│     - Copy to web directory         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Nginx Configuration              │
│     - Frontend config               │
│     - Backend reverse proxy         │
│     - Enable sites                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. SSL Setup                        │
│     - Install Certbot               │
│     - Get certificates              │
│     - Auto-renewal                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  8. Verification                     │
│     - Health checks                 │
│     - Test endpoints                │
│     - Verify services               │
└─────────────────────────────────────┘
```

---

## 🔄 Update Flow

```
┌─────────────────────────────────────┐
│  Code Changes Made                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Run: ./update-deployment.sh         │
│  OR                                  │
│  Manual Steps (see guide)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend Update:                    │
│  1. git pull                         │
│  2. npm ci                           │
│  3. npm run db:migrate               │
│  4. npm run build                    │
│  5. pm2 restart                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend Update:                   │
│  1. git pull                         │
│  2. npm ci                           │
│  3. npm run build                    │
│  4. Copy to web directory           │
└─────────────────────────────────────┘
```

---

## 🎯 Key Points

### Environment Variables
- **Backend**: `/var/www/urutibz/urutibiz-backend/.env`
- **Frontend**: `/var/www/urutibz/urutibz-frontend/.env`
- **Never commit** `.env` files to Git!

### Important Directories
- **Project Root**: `/var/www/urutibz`
- **Backend Code**: `/var/www/urutibz/urutibiz-backend`
- **Frontend Code**: `/var/www/urutibz/urutibz-frontend`
- **Web Files**: `/var/www/urutibz-frontend`
- **Nginx Configs**: `/etc/nginx/sites-available/`

### Process Management
- **PM2** manages the backend process
- **Nginx** serves frontend and proxies backend
- **Systemd** manages PostgreSQL, Redis, Nginx

### Security
- Use strong passwords for database
- Generate secure JWT secrets (32+ characters)
- Enable SSL/TLS for all connections
- Keep system updated: `sudo apt update && sudo apt upgrade`

---

## 🆘 Getting Help

1. **Check Logs First**:
   ```bash
   pm2 logs urutibiz-backend
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verify Services**:
   ```bash
   pm2 status
   sudo systemctl status postgresql
   sudo systemctl status redis-server
   sudo systemctl status nginx
   ```

3. **Health Checks**:
   ```bash
   curl http://localhost:10000/health
   redis-cli ping
   psql -U urutibiz_user -d urutibiz_db -h localhost -c "SELECT 1;"
   ```

4. **Review Documentation**:
   - `COMPLETE_DEPLOYMENT_GUIDE.md` - Full details
   - `QUICK_DEPLOYMENT_REFERENCE.md` - Quick commands

---

## ✅ Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] Ubuntu server (20.04+ recommended)
- [ ] Root or sudo access
- [ ] Domain name(s) configured
- [ ] DNS records pointing to server IP
- [ ] Git repository access (or files ready)
- [ ] Database password ready
- [ ] Email service credentials (for SMTP)
- [ ] SSL certificate plan (Let's Encrypt recommended)

---

## 📝 Post-Deployment Checklist

After deployment, verify:

- [ ] Backend health check passes: `curl http://localhost:10000/health`
- [ ] Frontend loads: Visit `https://your-domain.com`
- [ ] API accessible: `https://api.your-domain.com/health`
- [ ] Database connection works
- [ ] Redis connection works
- [ ] SSL certificates active
- [ ] PM2 auto-start configured
- [ ] Backups configured
- [ ] Monitoring set up

---

## 🔐 Security Reminders

1. **Change default passwords**
2. **Use strong JWT secrets** (generate with `openssl rand -base64 32`)
3. **Enable firewall** (`sudo ufw enable`)
4. **Keep system updated** (`sudo apt update && sudo apt upgrade`)
5. **Use SSL/TLS** for all connections
6. **Don't commit** `.env` files
7. **Regular backups** of database
8. **Monitor logs** for suspicious activity

---

**Last Updated**: 2024
**Version**: 1.0.0

For detailed instructions, start with **COMPLETE_DEPLOYMENT_GUIDE.md**
