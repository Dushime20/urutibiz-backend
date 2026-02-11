# Common Docker Production Issues & Solutions

## 🔴 Critical Issues Found

### 1. Empty healthcheck.js
**Status:** ✅ FIXED
- Created proper health check script
- Tests HTTP endpoint on port 10000
- Exits with proper status codes

### 2. Missing .dockerignore
**Status:** ✅ FIXED
- Created comprehensive .dockerignore
- Excludes dev files, tests, docs
- Reduces image size significantly

### 3. Exposed Secrets in .env
**Status:** ⚠️ ACTION REQUIRED
- **CRITICAL:** Remove all secrets from .env before deploying
- Use .env.example as template
- Store production secrets in secure vault

**Exposed credentials to remove:**
```
TWILIO_ACCOUNT_SID=AC5762b1495f2a2578d209388466d30014
TWILIO_AUTH_TOKEN=6e3c04d65a5d9a023053075ee42a049e
GEMINI_API_KEY=AIzaSyDidYAAzsmOHjO7AIPZ41NhDlZdhiWkqXA
SMTP_PASS=cijn xscv rtnr ooip
CLOUDINARY_API_SECRET=8YTxR-NYsHXe0K1hULICnvBtgBk
FIREBASE_PRIVATE_KEY=[exposed]
```

## 🟡 Warnings

### 1. Weak JWT Secrets
Current: `demo-secret-key-not-for-production`
**Action:** Generate strong random secrets (32+ characters)

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Low BCRYPT_ROUNDS
Current: `8` (too low for production)
**Action:** Set to `12` or higher

### 3. Demo Mode Configuration
`.env` has `NODE_ENV=demo`
**Action:** Set to `production`

### 4. Database SSL Disabled
Current: `DB_SSL=false`
**Action:** Enable SSL for production database

## 🟢 Good Practices Already Implemented

✅ Multi-stage Docker build
✅ Non-root user (urutibiz:nodejs)
✅ Alpine base image (minimal size)
✅ dumb-init for signal handling
✅ Health checks configured
✅ Production dependencies only
✅ Proper file permissions
✅ Resource limits in docker-compose
✅ Service dependencies configured
✅ Network isolation
✅ Volume persistence

## 🔧 Quick Fixes

### Build Production Image
```bash
cd urutibiz-backend
docker build -t urutibiz-backend:prod --target production .
```

### Test Locally
```bash
# Create production env file
cp .env.example .env.production
# Edit .env.production with real values

# Run container
docker run -p 10000:10000 --env-file .env.production urutibiz-backend:prod

# Test health check
curl http://localhost:10000/health
```

### Deploy with Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs urutibiz-backend-prod

# Check if port is in use
netstat -ano | findstr :10000

# Verify environment variables
docker-compose -f docker-compose.prod.yml config
```

### Health Check Failing
```bash
# Test health endpoint manually
docker exec urutibiz-backend-prod node healthcheck.js

# Check if server is running
docker exec urutibiz-backend-prod ps aux

# Test HTTP endpoint
docker exec urutibiz-backend-prod wget -O- http://localhost:10000/health
```

### Database Connection Issues
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection from backend
docker exec urutibiz-backend-prod node -e "require('./dist/config/database').testConnection()"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Redis Connection Issues
```bash
# Test Redis
docker exec urutibiz-redis-prod redis-cli -a YOUR_PASSWORD ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

### Out of Memory
```bash
# Check memory usage
docker stats

# Increase Node.js memory (already set to 2GB)
# ENV NODE_OPTIONS="--max-old-space-size=2048"

# Add resource limits in docker-compose.prod.yml
```

### Build Failures
```bash
# Clean build
docker-compose -f docker-compose.prod.yml build --no-cache

# Check disk space
docker system df

# Clean up
docker system prune -a
```

## 📊 Monitoring Commands

### Check Container Health
```bash
docker inspect --format='{{.State.Health.Status}}' urutibiz-backend-prod
```

### View Resource Usage
```bash
docker stats urutibiz-backend-prod
```

### Check Logs
```bash
# Last 100 lines
docker logs --tail 100 urutibiz-backend-prod

# Follow logs
docker logs -f urutibiz-backend-prod

# Logs with timestamps
docker logs -t urutibiz-backend-prod
```

### Execute Commands in Container
```bash
# Shell access
docker exec -it urutibiz-backend-prod sh

# Run npm commands
docker exec urutibiz-backend-prod npm run db:migrate

# Check Node version
docker exec urutibiz-backend-prod node --version
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Remove all secrets from .env file
- [ ] Generate new JWT secrets
- [ ] Set strong database password
- [ ] Set Redis password
- [ ] Enable database SSL
- [ ] Update CORS_ORIGIN to production domain
- [ ] Set BCRYPT_ROUNDS to 12
- [ ] Disable Swagger (SWAGGER_ENABLED=false)
- [ ] Set LOG_LEVEL to 'error' or 'warn'
- [ ] Review and update API rate limits
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts

## 📈 Performance Optimization

### Image Size Optimization
Current setup already optimized:
- Multi-stage build ✅
- Alpine base image ✅
- .dockerignore configured ✅
- Production dependencies only ✅

### Runtime Optimization
```yaml
# Add to docker-compose.prod.yml
services:
  backend:
    environment:
      - NODE_OPTIONS=--max-old-space-size=2048
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Database Connection Pooling
```env
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=10000
```

## 🔄 Update Strategy

### Zero-Downtime Deployment
```bash
# Build new image
docker-compose -f docker-compose.prod.yml build backend

# Scale up with new version
docker-compose -f docker-compose.prod.yml up -d --scale backend=2 --no-recreate

# Wait for health checks to pass
sleep 30

# Remove old container
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

### Rolling Back
```bash
# Tag current version before deploying
docker tag urutibiz-backend:prod urutibiz-backend:prod-backup

# If issues occur, rollback
docker tag urutibiz-backend:prod-backup urutibiz-backend:prod
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support

For production issues:
1. Check logs first
2. Review this troubleshooting guide
3. Check PRODUCTION_DEPLOYMENT_CHECKLIST.md
4. Contact DevOps team if unresolved
