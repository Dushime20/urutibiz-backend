# 🚀 Quick Start - Production Deployment

## TL;DR - Get Running in 3 Commands

```bash
cd /opt/urutibiz/urutibiz-backend
bash setup-firebase-credentials.sh
bash rebuild-and-deploy.sh
```

That's it! Your backend will be running with all fixes applied.

---

## What This Does

1. ✅ Creates proper Firebase credentials file
2. ✅ Rebuilds Docker image with code fixes
3. ✅ Starts postgres, redis, and API containers
4. ✅ Configures proper networking and health checks
5. ✅ Shows you the logs and status

---

## Alternative: Quick Test (No Rebuild)

If you just want to test without rebuilding:

```bash
cd /opt/urutibiz/urutibiz-backend
bash quick-fix-run.sh
```

---

## What Was Fixed

### 1. Firebase Private Key Issue
- **Problem**: Docker's `--env-file` doesn't handle multi-line env vars properly
- **Solution**: Load credentials from JSON file or export with proper newlines
- **Code Fix**: Updated `PushNotificationService.ts` to support file-based credentials

### 2. Database Connection
- **Problem**: Backend starts before postgres is ready
- **Solution**: Added health checks and proper service dependencies in docker-compose

---

## Verify Everything Works

```bash
# Check all containers are running
docker ps

# Check API logs (should see no Firebase errors)
docker logs urutibiz-api | grep -i firebase

# Test database connection
docker exec urutibiz-postgres psql -U urutibiz_user -d urutibiz_db -c "SELECT 1"

# Test API health endpoint
curl http://localhost:3000/health
```

---

## Common Commands

```bash
# View live logs
docker-compose -f docker-compose.production.yml logs -f api

# Restart just the API
docker-compose -f docker-compose.production.yml restart api

# Stop everything
docker-compose -f docker-compose.production.yml down

# Start everything
docker-compose -f docker-compose.production.yml up -d

# Shell into API container
docker exec -it urutibiz-api sh

# Check database
docker exec -it urutibiz-postgres psql -U urutibiz_user -d urutibiz_db
```

---

## Files Created

| File | Purpose |
|------|---------|
| `QUICK_START.md` | This file - quick reference |
| `PRODUCTION_DEPLOYMENT_FIX.md` | Complete detailed guide |
| `FIREBASE_DATABASE_FIX.md` | Technical deep-dive |
| `docker-compose.production.yml` | Production docker-compose config |
| `setup-firebase-credentials.sh` | Creates Firebase JSON file |
| `quick-fix-run.sh` | Quick test without rebuild |
| `rebuild-and-deploy.sh` | Complete rebuild and deploy |

---

## Troubleshooting

### Firebase Error Still Appears?
```bash
# Check credentials file exists
ls -la firebase-credentials.json

# Verify it's valid JSON
cat firebase-credentials.json | jq .

# Check it's mounted in container
docker exec urutibiz-api ls -la /app/firebase-credentials.json
```

### Database Connection Failed?
```bash
# Check postgres is running
docker ps | grep postgres

# Check postgres logs
docker logs urutibiz-postgres

# Test connection from API container
docker exec urutibiz-api ping postgres
```

### Port Already in Use?
```bash
# Find what's using the port
netstat -tulpn | grep 3000

# Change port in .env
echo "PORT=10001" >> .env

# Or change in docker-compose.production.yml
```

---

## Need Help?

1. Check `PRODUCTION_DEPLOYMENT_FIX.md` for detailed explanations
2. Check `FIREBASE_DATABASE_FIX.md` for technical details
3. View logs: `docker-compose -f docker-compose.production.yml logs -f`

---

## Security Reminder

🔒 The `firebase-credentials.json` file contains sensitive data:
- Don't commit it to git (add to `.gitignore`)
- Keep permissions restricted: `chmod 600 firebase-credentials.json`
- Use Docker secrets or Kubernetes secrets in production
