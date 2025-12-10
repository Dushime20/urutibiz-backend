# Docker Deployment Guide

Complete production-ready Docker deployment setup for UrutiBiz Backend with all services.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Nginx      │  │   Backend    │  │   Python     │  │
│  │  (Port 80)   │→ │  (Port 10000)│→ │  (Port 8001) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│         ┌──────────────────┼──────────────────┐          │
│         │                  │                  │          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   (Volumes)  │  │
│  │  (Internal)  │  │  (Internal)  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB+ RAM (16GB recommended for production)
- 20GB+ free disk space

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_NAME=urutibiz_db
DB_USER=urutibiz_user
DB_PASSWORD=your_secure_password_here
DB_HOST=postgres
DB_PORT=5432
DB_SSL=false

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ============================================
# CLOUDINARY (Image Storage)
# ============================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ============================================
# PYTHON IMAGE SERVICE
# ============================================
PYTHON_IMAGE_SERVICE_URL=http://python-service:8001

# ============================================
# FRONTEND URL
# ============================================
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Run Database Migrations

```bash
# Execute migrations inside the backend container
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### 4. Verify Services

```bash
# Check backend health
curl http://localhost:10000/health

# Check Python service health
curl http://localhost:8001/health

# Check database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT version();"
```

## 📦 Services

### 1. Backend Service (Node.js/TypeScript)

- **Port**: 10000
- **Image**: `urutibiz-backend:prod`
- **Health Check**: `/health` endpoint
- **Dependencies**: PostgreSQL, Redis, Python Service

**Features**:
- Multi-stage build for optimized image size
- Non-root user for security
- Health checks and graceful shutdown
- Automatic restart on failure

### 2. Python Image Service (CLIP)

- **Port**: 8001 (internal)
- **Image**: `urutibiz-python-service:prod`
- **Health Check**: `/health` endpoint
- **Purpose**: Image feature extraction using CLIP model

**Features**:
- OpenAI CLIP ViT-B/32 model
- 512-dimensional embeddings
- Model cache persistence
- Non-root user execution

### 3. PostgreSQL Database

- **Port**: 5432 (internal only)
- **Image**: Custom with PostGIS + pgvector
- **Extensions**: PostGIS, pgvector, uuid-ossp

**Features**:
- PostGIS for geospatial data
- pgvector for vector similarity search
- Automatic initialization script
- Data persistence via volumes

### 4. Redis Cache

- **Port**: 6379 (internal only)
- **Image**: `redis:7-alpine`
- **Purpose**: Session storage, caching, rate limiting

**Features**:
- AOF persistence enabled
- Password protection
- Automatic restart

### 5. Nginx Reverse Proxy (Optional)

- **Ports**: 80, 443
- **Image**: `nginx:alpine`
- **Purpose**: Load balancing, SSL termination

## 🔧 Development Setup

For local development with hot-reload:

```bash
# Start only infrastructure services
docker-compose up -d postgres redis python-service

# Run backend locally with npm
npm run dev
```

Or use the development docker-compose:

```bash
docker-compose up -d
```

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f python-service
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Service Health

```bash
# Check all service health
docker-compose -f docker-compose.prod.yml ps

# Inspect specific service
docker inspect urutibiz-backend-prod | grep Health -A 10
```

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong passwords (32+ characters for JWT secrets)
- ✅ Rotate secrets regularly
- ✅ Use Docker secrets for sensitive data in production

### 2. Network Security
- ✅ Services communicate via internal Docker network
- ✅ Database and Redis ports not exposed externally
- ✅ Only necessary ports exposed (80, 443, 10000)

### 3. Container Security
- ✅ All services run as non-root users
- ✅ Minimal base images (Alpine Linux)
- ✅ Regular security updates

### 4. Data Security
- ✅ Database passwords encrypted
- ✅ SSL/TLS for external connections
- ✅ Volume encryption for sensitive data

## 🚀 Production Deployment

### 1. Pre-Deployment Checklist

- [ ] Update all environment variables
- [ ] Set strong passwords and secrets
- [ ] Configure SSL certificates for Nginx
- [ ] Set up backup strategy for database
- [ ] Configure monitoring and alerting
- [ ] Review resource limits (CPU, memory)
- [ ] Test disaster recovery procedures

### 2. Resource Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 8GB
- Disk: 50GB SSD

**Recommended**:
- CPU: 4+ cores
- RAM: 16GB+
- Disk: 100GB+ SSD

### 3. Scaling

```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale Python service (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale python-service=2
```

### 4. Backup Strategy

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U ${DB_USER} ${DB_NAME} > backup.sql

# Backup volumes
docker run --rm -v urutibiz_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### 5. Updates & Rollbacks

```bash
# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Rollback (using previous image tag)
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check resource usage
docker stats

# Restart service
docker-compose -f docker-compose.prod.yml restart service-name
```

### Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USER} -d ${DB_NAME}

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Python Service Issues

```bash
# Check Python service logs
docker-compose -f docker-compose.prod.yml logs python-service

# Test Python service directly
curl http://localhost:8001/health

# Rebuild Python service
docker-compose -f docker-compose.prod.yml build --no-cache python-service
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add memory limits to docker-compose.yml:

services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

## 📝 Maintenance

### Regular Tasks

1. **Weekly**: Review logs for errors
2. **Monthly**: Update base images and dependencies
3. **Quarterly**: Security audit and dependency updates
4. **As needed**: Database backups and cleanup

### Cleanup

```bash
# Remove unused containers and images
docker system prune -a

# Remove unused volumes (CAUTION: This deletes data)
docker volume prune
```

## 🔗 Service Communication

Services communicate using Docker service names:

- Backend → PostgreSQL: `postgres:5432`
- Backend → Redis: `redis:6379`
- Backend → Python Service: `python-service:8001`

All communication happens within the `urutibiz-network` Docker network.

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL with pgvector](https://github.com/pgvector/pgvector)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## ✅ Production Readiness Checklist

- [x] Multi-stage Docker builds
- [x] Health checks for all services
- [x] Non-root user execution
- [x] Environment variable configuration
- [x] Volume persistence
- [x] Network isolation
- [x] Graceful shutdown handling
- [x] Logging and monitoring
- [x] Database with PostGIS and pgvector
- [x] Python CLIP service integration
- [x] Redis caching layer
- [x] Nginx reverse proxy ready

---

**Last Updated**: 2024
**Maintained by**: UrutiBiz Development Team

