# Docker Quick Start Guide

Get UrutiBiz Backend running with Docker in 5 minutes.

## 🚀 Quick Start

### 1. Prerequisites

- Docker Desktop installed and running
- 8GB+ RAM available
- 20GB+ free disk space

### 2. Setup Environment

```bash
# Copy example environment file
cp .env.docker.example .env

# Edit .env with your configuration
# At minimum, update:
# - DB_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - REDIS_PASSWORD
```

### 3. Start All Services

```bash
# Build and start everything
docker-compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Run Database Migrations

```bash
# Wait for services to be healthy (30-60 seconds)
# Then run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### 5. Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test backend
curl http://localhost:10000/health

# Test Python service
curl http://localhost:8001/health
```

## 📋 Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend API | 10000 | http://localhost:10000 | ✅ |
| Python CLIP Service | 8001 | http://localhost:8001 | ✅ |
| PostgreSQL | 5432 | (internal) | ✅ |
| Redis | 6379 | (internal) | ✅ |
| Nginx | 80, 443 | http://localhost | ⚠️ Optional |

## 🛠️ Common Commands

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Restart a service
docker-compose -f docker-compose.prod.yml restart [service-name]

# Rebuild a service
docker-compose -f docker-compose.prod.yml build --no-cache [service-name]

# Execute command in container
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME}
```

## 🔍 Troubleshooting

### Services won't start

```bash
# Check Docker resources
docker system df
docker stats

# Check logs
docker-compose -f docker-compose.prod.yml logs
```

### Database connection issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;"

# Check if extensions are installed
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME} -c "\dx"
```

### Python service issues

```bash
# Check Python service logs
docker-compose -f docker-compose.prod.yml logs python-service

# Rebuild Python service
docker-compose -f docker-compose.prod.yml build --no-cache python-service
docker-compose -f docker-compose.prod.yml up -d python-service
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase Docker Desktop memory limit:
# Settings → Resources → Memory → Increase to 8GB+
```

## 📚 Next Steps

- Read [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) for detailed documentation
- Configure Nginx for production (see deployment guide)
- Set up SSL certificates
- Configure backups

## ✅ Success Checklist

- [ ] All services are running (`docker-compose ps`)
- [ ] Backend health check passes (`curl http://localhost:10000/health`)
- [ ] Python service health check passes (`curl http://localhost:8001/health`)
- [ ] Database migrations completed
- [ ] Can connect to database
- [ ] Environment variables configured

---

**Need help?** Check the full [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)

