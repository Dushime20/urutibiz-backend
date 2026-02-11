# Production Deployment Checklist

## ✅ Pre-Deployment Security

### 1. Environment Variables
- [ ] Remove all hardcoded credentials from `.env`
- [ ] Use `.env.example` as template
- [ ] Store secrets in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Generate new JWT secrets (min 32 characters, random)
- [ ] Generate new encryption keys
- [ ] Update all API keys with production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable SSL for database (`DB_SSL=true`)
- [ ] Set strong Redis password

### 2. Database Security
- [ ] Use strong database password
- [ ] Enable SSL/TLS connections
- [ ] Restrict database access to backend IP only
- [ ] Set up database backups (automated daily)
- [ ] Configure connection pooling limits
- [ ] Run all migrations on production database
- [ ] Verify database indexes are created

### 3. API Security
- [ ] Enable rate limiting (already in nginx.conf)
- [ ] Configure CORS for production domain only
- [ ] Disable Swagger in production (`SWAGGER_ENABLED=false`)
- [ ] Enable Helmet security headers
- [ ] Set up API authentication/authorization
- [ ] Implement request validation
- [ ] Add API versioning

### 4. Docker Configuration
- [ ] Review and update `.dockerignore`
- [ ] Verify healthcheck.js works
- [ ] Test multi-stage build locally
- [ ] Scan image for vulnerabilities: `docker scan urutibiz-backend:prod`
- [ ] Optimize image size (current setup is good)
- [ ] Set resource limits in docker-compose

## 🚀 Deployment Steps

### 1. Build and Test Locally
```bash
# Build production image
docker build -t urutibiz-backend:prod --target production .

# Test the image
docker run -p 10000:10000 --env-file .env.production urutibiz-backend:prod

# Check health endpoint
curl http://localhost:10000/health
```

### 2. Deploy with Docker Compose
```bash
# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Verify all services are healthy
docker-compose -f docker-compose.prod.yml ps
```

### 3. Database Migration
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Verify migration status
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate:status
```

### 4. SSL/TLS Setup
- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Update nginx.conf with SSL configuration
- [ ] Enable HTTPS redirect
- [ ] Test SSL configuration: https://www.ssllabs.com/ssltest/

### 5. Monitoring Setup
- [ ] Set up application logging (Winston already configured)
- [ ] Configure log aggregation (ELK, CloudWatch, etc.)
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring (New Relic, DataDog, etc.)
- [ ] Create alerts for critical errors

## 🔍 Post-Deployment Verification

### 1. Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Database connectivity
docker-compose -f docker-compose.prod.yml exec backend node -e "require('./dist/config/database').testConnection()"

# Redis connectivity
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a YOUR_PASSWORD ping
```

### 2. API Testing
- [ ] Test authentication endpoints
- [ ] Test critical business logic endpoints
- [ ] Verify file uploads work
- [ ] Test WebSocket connections
- [ ] Check email sending
- [ ] Verify SMS sending (Twilio)
- [ ] Test push notifications

### 3. Performance Testing
- [ ] Load test critical endpoints
- [ ] Monitor memory usage
- [ ] Check response times
- [ ] Verify caching is working
- [ ] Test under concurrent users

### 4. Security Verification
- [ ] Run security scan: `npm audit`
- [ ] Check for exposed secrets
- [ ] Verify HTTPS is enforced
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Check security headers

## 🔧 Production Configuration

### Recommended Environment Variables
```env
NODE_ENV=production
PORT=10000
LOG_LEVEL=error

# Increase for production
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Connection pools
DB_POOL_MIN=2
DB_POOL_MAX=10
REDIS_MAX_CONNECTIONS=50

# Rate limiting (requests per minute)
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### Docker Resource Limits
Add to docker-compose.prod.yml:
```yaml
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

## 🔄 Backup Strategy

### Database Backups
```bash
# Daily automated backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres urutibiz_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres urutibiz_db < backup_20240101.sql
```

### Volume Backups
- [ ] uploads directory
- [ ] logs directory
- [ ] Redis data (if persistence needed)

## 🚨 Rollback Plan

### Quick Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Rollback
```bash
# Rollback last migration
docker-compose -f docker-compose.prod.yml exec backend npm run db:rollback
```

## 📊 Monitoring Endpoints

- Health: `GET /health`
- Metrics: `GET /metrics` (if implemented)
- Status: `GET /api/v1/status`

## 🔐 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate credentials regularly** - Every 90 days
3. **Use least privilege** - Database users, API keys
4. **Enable audit logging** - Track all admin actions
5. **Regular security updates** - Update dependencies monthly
6. **Implement 2FA** - For admin accounts
7. **Use WAF** - Web Application Firewall (Cloudflare, AWS WAF)
8. **DDoS protection** - Rate limiting + CDN

## 📝 Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Verify backups completed

### Weekly
- [ ] Review security logs
- [ ] Check performance metrics
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup restoration test
- [ ] Update SSL certificates (if needed)

## 🆘 Emergency Contacts

- DevOps Lead: [contact]
- Database Admin: [contact]
- Security Team: [contact]
- On-Call Engineer: [contact]

## 📚 Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
