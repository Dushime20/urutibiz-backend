# UrutiBiz Backend - Docker Operations Guide

## 🎯 Overview

This guide provides comprehensive instructions for building, deploying, and managing the UrutiBiz Backend using Docker. The setup follows international DevOps standards and best practices.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Methods](#build-methods)
- [Running Containers](#running-containers)
- [Docker Compose](#docker-compose)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- **Docker**: Version 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Git**: For version control
- **Make**: (Optional) For using Makefile commands

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **OS**: Linux, macOS, or Windows 10/11 with WSL2

### Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Verify Docker is running
docker info
```

## 🚀 Quick Start

### Method 1: Using Makefile (Recommended)

```bash
# Build production image
make build-prod

# Run production container
make run-prod

# View logs
make logs

# Stop container
make stop
```

### Method 2: Using Build Scripts

**Linux/Mac:**
```bash
# Make script executable
chmod +x docker-build.sh

# Build production image
./docker-build.sh production

# Build and push to registry
./docker-build.sh production --push
```

**Windows PowerShell:**
```powershell
# Build production image
.\docker-build.ps1 -Environment production

# Build and push to registry
.\docker-build.ps1 -Environment production -Push
```

### Method 3: Direct Docker Commands

```bash
# Build production image
docker build --target production -t urutibiz-backend:latest .

# Run container
docker run -d -p 10000:10000 --env-file .env.production urutibiz-backend:latest
```

## 🏗️ Build Methods

### Production Build

```bash
# Using Makefile
make build-prod

# Using script (Linux/Mac)
./docker-build.sh production

# Using script (Windows)
.\docker-build.ps1 -Environment production

# Direct Docker command
docker build \
  --target production \
  --build-arg NODE_ENV=production \
  --build-arg APP_VERSION=1.0.0 \
  -t urutibiz-backend:latest \
  .
```

### Development Build

```bash
# Using Makefile
make build-dev

# Using script
./docker-build.sh development

# Direct Docker command
docker build --target development -t urutibiz-backend:dev .
```

### Build Without Cache

```bash
# Using Makefile
make build-no-cache

# Using script
./docker-build.sh production --no-cache

# Direct Docker command
docker build --no-cache -t urutibiz-backend:latest .
```

## 🏃 Running Containers

### Production Container

```bash
# Using Makefile
make run-prod

# Direct Docker command
docker run -d \
  --name urutibiz-backend-prod \
  -p 10000:10000 \
  --env-file .env.production \
  --restart unless-stopped \
  urutibiz-backend:latest
```

### Development Container with Hot Reload

```bash
# Using Makefile
make run-dev

# Direct Docker command
docker run -it --rm \
  --name urutibiz-backend-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  --env-file .env \
  urutibiz-backend:dev
```

### Run with Custom Environment Variables

```bash
docker run -d \
  --name urutibiz-backend \
  -p 10000:10000 \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  urutibiz-backend:latest
```

## 🐳 Docker Compose

### Development Environment

```bash
# Start all services
make up
# or
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Start production services
make up-prod
# or
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Scale Services

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 🚢 Production Deployment

### Step 1: Prepare Environment

```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Critical Environment Variables:**
```env
NODE_ENV=production
PORT=10000
DB_HOST=your-db-host
DB_PASSWORD=strong-password
REDIS_PASSWORD=strong-password
JWT_SECRET=your-secret-key-min-32-chars
```

### Step 2: Build Production Image

```bash
# Build with version tag
docker build \
  --target production \
  --build-arg APP_VERSION=1.0.0 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t urutibiz-backend:1.0.0 \
  -t urutibiz-backend:latest \
  .
```

### Step 3: Test Image

```bash
# Run security scan
docker scan urutibiz-backend:latest

# Test container startup
docker run --rm urutibiz-backend:latest node --version

# Test health check
make test-health
```

### Step 4: Deploy

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or using Makefile
make deploy
```

### Step 5: Run Migrations

```bash
# Run database migrations
make db-migrate
# or
docker exec urutibiz-backend-prod npm run db:migrate
```

### Step 6: Verify Deployment

```bash
# Check container status
docker ps

# Check health
docker inspect --format='{{.State.Health.Status}}' urutibiz-backend-prod

# Test API endpoint
curl http://localhost:10000/health
```

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All logs
make logs

# Backend logs only
make logs-backend

# Last 100 lines
docker logs --tail 100 urutibiz-backend-prod

# Follow logs in real-time
docker logs -f urutibiz-backend-prod

# Logs with timestamps
docker logs -t urutibiz-backend-prod
```

### Monitor Resources

```bash
# Resource usage
make stats
# or
docker stats urutibiz-backend-prod

# Container processes
docker top urutibiz-backend-prod
```

### Health Checks

```bash
# Check health status
make health

# Manual health check
docker exec urutibiz-backend-prod node healthcheck.js

# HTTP health check
curl http://localhost:10000/health
```

### Shell Access

```bash
# Access container shell
make shell
# or
docker exec -it urutibiz-backend-prod sh

# Access as root (for debugging)
make shell-root
# or
docker exec -it -u root urutibiz-backend-prod sh
```

### Database Operations

```bash
# Run migrations
make db-migrate

# Seed database
make db-seed

# Access PostgreSQL shell
make db-shell

# Backup database
docker exec urutibiz-postgres-prod pg_dump -U postgres urutibiz_db > backup.sql

# Restore database
docker exec -i urutibiz-postgres-prod psql -U postgres urutibiz_db < backup.sql
```

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs urutibiz-backend-prod

# Inspect container
docker inspect urutibiz-backend-prod

# Check if port is in use
netstat -ano | findstr :10000  # Windows
lsof -i :10000                 # Linux/Mac
```

### Health Check Failing

```bash
# Test health endpoint manually
docker exec urutibiz-backend-prod node healthcheck.js

# Check if server is running
docker exec urutibiz-backend-prod ps aux

# Verify environment variables
docker exec urutibiz-backend-prod env
```

### Database Connection Issues

```bash
# Check database container
docker ps | grep postgres

# Test database connection
docker exec urutibiz-backend-prod node -e "require('./dist/config/database').testConnection()"

# Check database logs
docker logs urutibiz-postgres-prod
```

### Out of Memory

```bash
# Check memory usage
docker stats urutibiz-backend-prod

# Increase memory limit
docker run -d \
  --memory="2g" \
  --memory-swap="2g" \
  urutibiz-backend:latest
```

### Image Size Too Large

```bash
# Check image size
docker images urutibiz-backend

# Analyze image layers
docker history urutibiz-backend:latest

# Use dive for detailed analysis
dive urutibiz-backend:latest
```

### Build Failures

```bash
# Clean build cache
docker builder prune -a

# Build with verbose output
docker build --progress=plain --no-cache .

# Check disk space
docker system df
```

## 🧹 Cleanup

### Remove Stopped Containers

```bash
make clean
# or
docker container prune -f
```

### Remove Unused Images

```bash
docker image prune -f
```

### Complete Cleanup

```bash
make clean-all
# or
docker system prune -af --volumes
```

### Remove Specific Container

```bash
make rm
# or
docker stop urutibiz-backend-prod
docker rm urutibiz-backend-prod
```

## 🔐 Security Best Practices

### 1. Use Specific Image Versions

```dockerfile
FROM node:18.20.5-alpine3.20  # ✅ Good
FROM node:18-alpine            # ⚠️ Less specific
FROM node:alpine               # ❌ Avoid
```

### 2. Run as Non-Root User

```dockerfile
USER nodejs  # Already configured
```

### 3. Scan for Vulnerabilities

```bash
# Using Docker Scan
docker scan urutibiz-backend:latest

# Using Trivy
trivy image urutibiz-backend:latest

# Using Snyk
snyk container test urutibiz-backend:latest
```

### 4. Use Secrets Management

```bash
# Don't use .env files in production
# Use Docker secrets or external secret managers

# Docker secrets example
echo "my-secret" | docker secret create db_password -
```

### 5. Enable Read-Only Root Filesystem

```bash
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /app/logs \
  urutibiz-backend:latest
```

## 📈 Performance Optimization

### 1. Multi-Stage Builds

Already implemented in Dockerfile - reduces final image size by ~70%

### 2. Layer Caching

```bash
# Order Dockerfile commands from least to most frequently changing
# Already optimized in current Dockerfile
```

### 3. Use BuildKit

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker build .
```

### 4. Resource Limits

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: make build-prod
      
      - name: Run tests
        run: make test
      
      - name: Push to registry
        run: make push
```

### GitLab CI Example

```yaml
build:
  stage: build
  script:
    - make build-prod
    - make push
  only:
    - main
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

## 🆘 Support

For issues or questions:
1. Check logs: `make logs`
2. Review this documentation
3. Check [DOCKER_PRODUCTION_ISSUES.md](./DOCKER_PRODUCTION_ISSUES.md)
4. Contact DevOps team

## 📝 License

MIT License - See LICENSE file for details
