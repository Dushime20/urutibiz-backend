# 🚀 UrutiBiz Backend - Production Deployment Guide

## Quick Start

```bash
# 1. Build all images
docker build --target production -t urutibiz-backend:latest .
docker build -f Dockerfile.migrations -t urutibiz-migration:latest .
docker build -f Dockerfile.postgres -t urutibiz-postgres:latest .
cd python-service && docker build -t urutibiz-python-service:latest . && cd ..

# 2. Deploy everything
docker-compose -f docker-compose.production.yml up -d

# 3. Check status
docker-compose -f docker-compose.production.yml ps

# 4. View logs
docker-compose -f docker-compose.production.yml logs -f
```

## Services Included

### 1. PostgreSQL (with PostGIS + pgvector)
- **Port**: 5432
- **Image**: Custom built with Dockerfile.postgres
- **Features**: Geographic data + AI embeddings support

### 2. Redis
- **Port**: 6379
- **Image**: redis:7-alpine
- **Purpose**: Caching and session storage

### 3. Migration Service
- **Runs**: Once before API starts
- **Image**: Custom built with Dockerfile.migrations
- **Purpose**: Runs all 147 database migrations

### 4. Backend API
- **Port**: 3000 (configurable via PORT in .env)
- **Image**: urutibiz-backend:latest
- **Features**: Full REST API + WebSocket support

### 5. Python AI Service
- **Port**: 8001
- **Image**: urutibiz-python-service:latest
- **Purpose**: Image embeddings for AI-powered search

## Environment Variables

Required in `.env` file:

```env
# Application
PORT=3000
NODE_ENV=production

# Database
DB_NAME=urutibiz_db
DB_USER=urutibiz_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Firebase (optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
```

## Nginx Configuration

The backend runs on port 3000. Configure Nginx to proxy requests:

```bash
# Copy nginx config
sudo cp nginx-urutibiz.conf /etc/nginx/sites-available/urutibiz

# Edit domain
sudo nano /etc/nginx/sites-available/urutibiz
# Change: server_name yourdomain.com;

# Enable
sudo ln -s /etc/nginx/sites-available/urutibiz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Maintenance Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f python-service

# Restart services
docker-compose -f docker-compose.production.yml restart api
docker-compose -f docker-compose.production.yml restart python-service

# Stop everything
docker-compose -f docker-compose.production.yml down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose -f docker-compose.production.yml down -v

# Rebuild and restart
docker build --target production -t urutibiz-backend:latest .
docker-compose -f docker-compose.production.yml up -d api
```

## Health Checks

```bash
# Backend API
curl http://localhost:3000/health

# Python Service
curl http://localhost:8001/health

# Through Nginx (if configured)
curl http://your-domain.com/health
```

## File Structure

```
urutibiz-backend/
├── docker-compose.production.yml  ← Main production file (USE THIS)
├── Dockerfile                     ← Backend API image
├── Dockerfile.migrations          ← Migration runner image
├── Dockerfile.postgres            ← PostgreSQL with extensions
├── nginx-urutibiz.conf           ← Nginx configuration
├── .env                          ← Environment variables
├── python-service/
│   └── Dockerfile                ← Python AI service
└── database/
    └── migrations/               ← All database migrations
```

## Troubleshooting

### Container keeps restarting
```bash
docker logs urutibiz-api --tail 100
```

### Port not exposed
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
# Should show: 0.0.0.0:3000->3000/tcp
```

### Migration failed
```bash
docker logs urutibiz-migration
# Check which migration failed and fix the issue
```

### Python service not responding
```bash
docker logs urutibiz-python-service
# First run downloads 605MB model, takes 5-10 minutes
```

## Production Checklist

- [ ] All environment variables set in `.env`
- [ ] Strong passwords for DB and Redis
- [ ] JWT secrets are random and secure (32+ chars)
- [ ] Nginx configured and running
- [ ] SSL certificate installed (optional but recommended)
- [ ] Firewall configured (allow ports 80, 443, 22)
- [ ] Backups scheduled
- [ ] Monitoring set up

## Support

For issues, check:
1. Container logs: `docker logs <container-name>`
2. Nginx logs: `/var/log/nginx/urutibiz_error.log`
3. System logs: `journalctl -u docker`
