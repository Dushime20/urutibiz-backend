# 🚀 UrutiBiz Deployment Checklist

Quick reference checklist for deploying UrutiBiz to production.

## Pre-Deployment

### Server Setup
- [ ] Server provisioned (CPU: 4+, RAM: 8GB+, Storage: 50GB+)
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 13+ installed with PostGIS extension
- [ ] Redis 6+ installed
- [ ] Nginx/Apache installed
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Domain names configured
- [ ] DNS records set up (A records, CNAME)

### Security
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH key-based authentication enabled
- [ ] Strong passwords set for all services
- [ ] Security updates applied

## Backend Deployment

### Environment Setup
- [ ] Repository cloned
- [ ] `.env` file created with all required variables
- [ ] Database credentials configured
- [ ] Redis credentials configured
- [ ] JWT secrets generated (32+ characters)
- [ ] Encryption key generated (32 characters)

### Database
- [ ] PostgreSQL database created
- [ ] Database user created with proper permissions
- [ ] PostGIS extension enabled
- [ ] Migrations run successfully (`npm run db:migrate`)
- [ ] Seed data loaded (optional)
- [ ] Database backup strategy configured

### Application
- [ ] Dependencies installed (`npm ci`)
- [ ] Application built (`npm run build`)
- [ ] Application starts successfully
- [ ] Health check endpoint responds (`/health`)
- [ ] API documentation accessible (`/api-docs`)

### Process Management
- [ ] PM2 installed and configured
- [ ] Application running with PM2
- [ ] PM2 startup script configured
- [ ] Logs directory configured

### Reverse Proxy
- [ ] Nginx configured for backend
- [ ] SSL certificate installed
- [ ] WebSocket support configured
- [ ] CORS headers configured correctly

## Frontend Deployment

### Environment Setup
- [ ] Repository cloned
- [ ] `.env` file created
- [ ] `VITE_API_BASE_URL` set to backend URL
- [ ] `VITE_WS_URL` set to WebSocket URL

### Build
- [ ] Dependencies installed (`npm ci`)
- [ ] Production build created (`npm run build`)
- [ ] Build output verified in `dist/` directory

### Web Server
- [ ] Static files copied to web server
- [ ] Nginx/Apache configured for SPA routing
- [ ] SSL certificate installed
- [ ] Static asset caching configured
- [ ] Security headers configured

## External Services

### Email (SMTP)
- [ ] SMTP credentials configured
- [ ] Test email sent successfully
- [ ] Email templates verified

### SMS (Twilio) - Optional
- [ ] Twilio account created
- [ ] Phone number purchased
- [ ] Credentials added to `.env`
- [ ] Test SMS sent

### Payments (Stripe) - Optional
- [ ] Stripe account created
- [ ] API keys obtained
- [ ] Webhook endpoint configured
- [ ] Test payment processed

### File Storage
- [ ] Cloudinary account created OR
- [ ] AWS S3 bucket created
- [ ] Credentials configured
- [ ] Test file upload successful

### Push Notifications (Firebase) - Optional
- [ ] Firebase project created
- [ ] Service account key generated
- [ ] Credentials added to `.env`
- [ ] Test notification sent

## Verification

### Backend
- [ ] Health check: `GET /health` returns 200
- [ ] Database health: `GET /api/v1/health/db` returns 200
- [ ] Redis health: `GET /api/v1/health/redis` returns 200
- [ ] Authentication: Login endpoint works
- [ ] API endpoints: Key endpoints respond correctly
- [ ] WebSocket: Socket.IO connections work

### Frontend
- [ ] Homepage loads correctly
- [ ] API calls to backend succeed
- [ ] Authentication flow works
- [ ] Navigation works (SPA routing)
- [ ] Images and assets load
- [ ] Mobile responsive design works

### Integration
- [ ] User can register
- [ ] User can login
- [ ] User can browse products
- [ ] User can create booking
- [ ] Payment flow works (test mode)
- [ ] Notifications received
- [ ] File uploads work

## Post-Deployment

### Monitoring
- [ ] Application logs monitored
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Performance metrics tracked

### Backups
- [ ] Database backup automated
- [ ] Backup restoration tested
- [ ] Backup storage configured (off-site)

### Documentation
- [ ] Deployment documentation updated
- [ ] Environment variables documented
- [ ] Runbook created for common issues

### Team
- [ ] Team notified of deployment
- [ ] Access credentials shared securely
- [ ] Support channels established

## Rollback Plan

- [ ] Previous version tagged in Git
- [ ] Database rollback procedure documented
- [ ] Rollback script prepared
- [ ] Rollback tested in staging

## Quick Commands Reference

```bash
# Backend
cd urutibiz-backend
npm ci
npm run build
npm run db:migrate
pm2 start dist/server.js --name urutibiz-backend

# Frontend
cd urutibz-frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/urutibz-frontend/

# Database
pg_dump -U postgres urutibiz_db > backup.sql

# Logs
pm2 logs urutibiz-backend
tail -f urutibiz-backend/logs/app.log

# Health Checks
curl https://api.your-domain.com/health
curl https://your-domain.com
```

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

