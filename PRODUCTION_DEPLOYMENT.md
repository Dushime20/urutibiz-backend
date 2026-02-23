# Production Deployment Guide - International Standards

## Architecture Overview

```
Internet
    ↓
Nginx (Port 8081) - Reverse Proxy, Rate Limiting, Security
    ↓
Backend API (Port 3000) - Node.js Application
    ↓
PostgreSQL (Port 5432) + Redis (Port 6379)
```

## What's Included

### Nginx Configuration Features

✅ **Performance Optimizations**
- HTTP/1.1 with keepalive connections
- Gzip compression for all text-based content
- Optimized buffer sizes and timeouts
- Connection pooling to backend

✅ **Security Features**
- Rate limiting (5 req/min for auth, 100 req/min for API)
- Connection limits (10 concurrent per IP)
- Security headers (X-Frame-Options, CSP, etc.)
- CORS configuration
- Hidden server tokens
- SSL/TLS ready (TLS 1.2 & 1.3)

✅ **Monitoring & Logging**
- Detailed access logs with timing information
- Request ID tracking
- Separate error logging
- Health check endpoint (no rate limit)

✅ **API Protection**
- Strict rate limiting on auth endpoints
- Request size limits (50MB max)
- Timeout protection
- DDoS mitigation

✅ **WebSocket Support**
- Full Socket.IO compatibility
- Long-lived connections (24h timeout)
- Proper upgrade headers

## Deployment Steps

### 1. Push Changes to Server

```bash
# From your local machine
git add .
git commit -m "Add production-ready nginx configuration"
git push origin main
```

### 2. On Server - Pull and Deploy

```bash
# SSH into server
ssh root@38.242.224.199

# Navigate to backend directory
cd /opt/urutibiz/urutibiz-backend

# Pull latest changes
git pull origin main

# Stop existing services
docker-compose down

# Rebuild and start all services
docker-compose up -d --build

# Verify all containers are running
docker ps
```

### 3. Verify Deployment

```bash
# Check nginx is running
docker ps | grep nginx

# Check nginx logs
docker logs urutibiz-nginx

# Test health endpoint
curl http://localhost:8081/api/v1/health

# Test from external
curl http://38.242.224.199:8081/api/v1/health

# Check rate limiting (should get 429 after 5 requests)
for i in {1..10}; do curl -X POST http://localhost:8081/api/v1/auth/login; done
```

### 4. Monitor Services

```bash
# View all container logs
docker-compose logs -f

# View only nginx logs
docker logs -f urutibiz-nginx

# View only backend logs
docker logs -f urutibiz-api

# Check resource usage
docker stats
```

## Configuration Details

### Rate Limits

| Endpoint Type | Rate Limit | Burst | Use Case |
|--------------|------------|-------|----------|
| Auth endpoints | 5 req/min | 10 | Login, register, password reset |
| API endpoints | 100 req/min | 50 | General API calls |
| General | 200 req/min | 100 | Static files, other requests |
| Connections | 10 concurrent | - | Per IP address |

### Timeouts

- Client body: 12s
- Client header: 12s
- Send: 10s
- Proxy connect: 60s
- Proxy send: 60s
- Proxy read: 60s
- WebSocket: 24h
- Keepalive: 65s

### Buffer Sizes

- Client body buffer: 128KB
- Max body size: 50MB
- Client header buffer: 1KB
- Large headers: 4 × 16KB

## Security Checklist

- [x] Rate limiting enabled
- [x] Connection limits per IP
- [x] Security headers configured
- [x] Server tokens hidden
- [x] CORS properly configured
- [x] Request size limits
- [x] Timeout protection
- [x] Hidden files blocked
- [x] SSL/TLS ready (when certificates added)
- [x] Request ID tracking

## Performance Optimizations

- [x] Gzip compression
- [x] HTTP keepalive
- [x] Connection pooling
- [x] Optimized buffers
- [x] Static file caching (1 year)
- [x] Proxy buffering
- [x] Multi-accept connections
- [x] Epoll event model

## Monitoring Endpoints

### Health Check
```bash
curl http://38.242.224.199:8081/api/v1/health
```

### Check Rate Limiting
```bash
# Test auth rate limit (should block after 5 requests)
for i in {1..10}; do 
  echo "Request $i:"
  curl -w "\nHTTP Status: %{http_code}\n" \
    -X POST http://38.242.224.199:8081/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{}' 
  sleep 1
done
```

### View Logs
```bash
# Access logs
docker exec urutibiz-nginx tail -f /var/log/nginx/access.log

# Error logs
docker exec urutibiz-nginx tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Nginx won't start
```bash
# Check configuration syntax
docker exec urutibiz-nginx nginx -t

# View error logs
docker logs urutibiz-nginx

# Restart nginx
docker-compose restart nginx
```

### Backend not reachable
```bash
# Check if backend is running
docker ps | grep api

# Test backend directly
curl http://localhost:3000/api/v1/health

# Check network connectivity
docker exec urutibiz-nginx ping api
```

### Rate limiting too strict
Edit `nginx.conf` and adjust:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/m;  # Increase from 100
```

Then reload:
```bash
docker-compose restart nginx
```

### High memory usage
```bash
# Check resource usage
docker stats

# Adjust worker connections in nginx.conf
worker_connections 1024;  # Reduce from 2048
```

## SSL/HTTPS Setup (Future)

When you get SSL certificates:

1. Add certificates to server
2. Uncomment HTTPS server block in nginx.conf
3. Update ports in docker-compose.yml
4. Restart services

## Backup & Recovery

### Backup Configuration
```bash
# Backup nginx config
cp nginx.conf nginx.conf.backup

# Backup docker-compose
cp docker-compose.yml docker-compose.yml.backup

# Backup .env
cp .env .env.backup
```

### Rollback
```bash
# Restore previous version
git checkout HEAD~1 nginx.conf

# Restart services
docker-compose restart nginx
```

## Performance Benchmarking

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 http://38.242.224.199:8081/api/v1/health

# Test with rate limiting
ab -n 100 -c 5 http://38.242.224.199:8081/api/v1/auth/login
```

## Next Steps

1. ✅ Deploy nginx configuration
2. ⏳ Monitor for 24 hours
3. ⏳ Adjust rate limits based on usage
4. ⏳ Add SSL certificates
5. ⏳ Set up log rotation
6. ⏳ Configure monitoring alerts
7. ⏳ Set up automated backups

## Support

For issues or questions:
- Check logs: `docker logs urutibiz-nginx`
- Test configuration: `docker exec urutibiz-nginx nginx -t`
- Restart services: `docker-compose restart`
