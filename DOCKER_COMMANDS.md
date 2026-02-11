# 🚀 Docker Commands - Quick Reference

## 📦 Build Commands

### Production Build (Recommended)

```bash
# Windows PowerShell
.\docker-build.ps1 -Environment production

# Linux/Mac
chmod +x docker-build.sh
./docker-build.sh production

# Using Make
make build-prod

# Direct Docker
docker build --target production -t urutibiz-backend:latest .
```

### Development Build

```bash
# Windows
.\docker-build.ps1 -Environment development

# Linux/Mac
./docker-build.sh development

# Make
make build-dev
```

### Build Without Cache

```bash
# Windows
.\docker-build.ps1 -Environment production -NoCache

# Linux/Mac
./docker-build.sh production --no-cache

# Make
make build-no-cache
```

## 🏃 Run Commands

### Run Production Container

```bash
# Using Make (Easiest)
make run-prod

# Using Docker
docker run -d \
  --name urutibiz-backend-prod \
  -p 10000:10000 \
  --env-file .env.production \
  --restart unless-stopped \
  urutibiz-backend:latest
```

### Run Development Container

```bash
make run-dev

# Or with volume mounting
docker run -it --rm \
  --name urutibiz-backend-dev \
  -p 3000:3000 \
  -v ${PWD}/src:/app/src \
  --env-file .env \
  urutibiz-backend:dev
```

### Run with Docker Compose

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# With rebuild
docker-compose up -d --build
```

## 📊 Monitoring Commands

### View Logs

```bash
# All logs
docker logs urutibiz-backend-prod

# Follow logs (real-time)
docker logs -f urutibiz-backend-prod

# Last 100 lines
docker logs --tail 100 urutibiz-backend-prod

# With timestamps
docker logs -t urutibiz-backend-prod

# Using Make
make logs
```

### Check Status

```bash
# List running containers
docker ps

# Check health status
docker inspect --format='{{.State.Health.Status}}' urutibiz-backend-prod

# Resource usage
docker stats urutibiz-backend-prod

# Using Make
make health
make stats
```

### Access Container

```bash
# Shell access
docker exec -it urutibiz-backend-prod sh

# Root access
docker exec -it -u root urutibiz-backend-prod sh

# Run command
docker exec urutibiz-backend-prod node --version

# Using Make
make shell
make shell-root
```

## 🗄️ Database Commands

### Migrations

```bash
# Run migrations
docker exec urutibiz-backend-prod npm run db:migrate

# Rollback migration
docker exec urutibiz-backend-prod npm run db:rollback

# Using Make
make db-migrate
```

### Database Access

```bash
# PostgreSQL shell
docker exec -it urutibiz-postgres-prod psql -U postgres -d urutibiz_db

# Using Make
make db-shell
```

### Backup & Restore

```bash
# Backup
docker exec urutibiz-postgres-prod pg_dump -U postgres urutibiz_db > backup.sql

# Restore
docker exec -i urutibiz-postgres-prod psql -U postgres urutibiz_db < backup.sql
```

## 🧹 Cleanup Commands

### Stop & Remove

```bash
# Stop container
docker stop urutibiz-backend-prod

# Remove container
docker rm urutibiz-backend-prod

# Stop and remove
docker stop urutibiz-backend-prod && docker rm urutibiz-backend-prod

# Using Make
make stop
make rm
```

### Clean Up Resources

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Remove everything
docker system prune -af --volumes

# Using Make
make clean
make clean-all
```

## 🔍 Debugging Commands

### Inspect Container

```bash
# Full inspection
docker inspect urutibiz-backend-prod

# Specific info
docker inspect --format='{{.State.Status}}' urutibiz-backend-prod
docker inspect --format='{{.NetworkSettings.IPAddress}}' urutibiz-backend-prod
```

### Check Processes

```bash
# Container processes
docker top urutibiz-backend-prod

# Inside container
docker exec urutibiz-backend-prod ps aux
```

### Test Health

```bash
# Health check script
docker exec urutibiz-backend-prod node healthcheck.js

# HTTP health check
curl http://localhost:10000/health

# Using Make
make test-health
```

### View Environment Variables

```bash
docker exec urutibiz-backend-prod env
```

## 🔐 Security Commands

### Scan for Vulnerabilities

```bash
# Docker scan
docker scan urutibiz-backend:latest

# Trivy scan
trivy image urutibiz-backend:latest

# Snyk scan
snyk container test urutibiz-backend:latest

# Using Make
make scan
```

### Check Image Details

```bash
# Image size
docker images urutibiz-backend

# Image history
docker history urutibiz-backend:latest

# Using Make
make size
```

## 📤 Registry Commands

### Tag & Push

```bash
# Tag image
docker tag urutibiz-backend:latest docker.io/urutibiz/urutibiz-backend:1.0.0

# Push to registry
docker push docker.io/urutibiz/urutibiz-backend:1.0.0

# Using Make
make tag
make push
```

### Pull from Registry

```bash
# Pull image
docker pull docker.io/urutibiz/urutibiz-backend:latest

# Using Make
make pull
```

## 🔄 Update & Restart Commands

### Update Container

```bash
# Pull latest image
docker pull urutibiz-backend:latest

# Stop old container
docker stop urutibiz-backend-prod

# Remove old container
docker rm urutibiz-backend-prod

# Start new container
docker run -d --name urutibiz-backend-prod -p 10000:10000 urutibiz-backend:latest
```

### Restart Services

```bash
# Restart container
docker restart urutibiz-backend-prod

# Restart all services
docker-compose restart

# Using Make
make restart
make restart-prod
```

## 📋 Complete Workflow Examples

### First Time Setup

```bash
# 1. Build production image
make build-prod

# 2. Create environment file
cp .env.example .env.production
# Edit .env.production with your values

# 3. Start all services
make up-prod

# 4. Run migrations
make db-migrate

# 5. Check health
make health

# 6. View logs
make logs
```

### Daily Development

```bash
# Start development environment
make up

# View logs
make logs

# Make code changes...

# Restart if needed
make restart

# Stop when done
make down
```

### Production Deployment

```bash
# 1. Build and test
make build-prod
make test-health

# 2. Tag and push
make tag
make push

# 3. Deploy
make up-prod

# 4. Run migrations
make db-migrate

# 5. Verify
make health
curl http://localhost:10000/health
```

### Troubleshooting

```bash
# Check logs
make logs

# Check health
make health

# Access shell
make shell

# Check processes
docker top urutibiz-backend-prod

# Check resources
make stats

# Restart if needed
make restart-prod
```

## 🎯 Most Common Commands

```bash
# Build
make build-prod

# Run
make run-prod

# Logs
make logs

# Health
make health

# Shell
make shell

# Stop
make stop

# Clean
make clean

# Help
make help
```

## 💡 Pro Tips

1. **Use Make commands** - They're shorter and handle complexity
2. **Always check logs** - `make logs` is your friend
3. **Test locally first** - Use `make run-dev` before production
4. **Monitor resources** - Use `make stats` regularly
5. **Keep images updated** - Rebuild weekly for security patches

## 🆘 Emergency Commands

### Container Crashed

```bash
# Check what happened
docker logs --tail 100 urutibiz-backend-prod

# Restart
docker restart urutibiz-backend-prod

# If still failing, rebuild
make build-prod
make run-prod
```

### Out of Disk Space

```bash
# Check usage
docker system df

# Clean up
make clean-all

# Remove old images
docker image prune -a
```

### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :10000

# Find process using port (Linux/Mac)
lsof -i :10000

# Kill process or use different port
docker run -d -p 10001:10000 urutibiz-backend:latest
```

## 📚 Quick Reference Card

| Task | Command |
|------|---------|
| Build | `make build-prod` |
| Run | `make run-prod` |
| Logs | `make logs` |
| Health | `make health` |
| Shell | `make shell` |
| Stop | `make stop` |
| Clean | `make clean` |
| Migrate | `make db-migrate` |
| Restart | `make restart-prod` |
| Help | `make help` |

---

**Need more help?** Check [DOCKER_README.md](./DOCKER_README.md) for detailed documentation.
