# Backend Production Deployment Fix

## Issues Fixed

1. **Wrong Docker target**: Changed from `development` to `production`
2. **Missing ts-node-dev**: Production build uses compiled JavaScript, not TypeScript
3. **Wrong NODE_ENV**: Changed from `development` to `production`
4. **Removed volume mounts**: Production doesn't need source code mounted

## Changes Made

- `target: production` - Uses compiled dist/server.js
- `NODE_ENV=production` - Runs in production mode
- Removed volume mounts - Uses built code from image
- All environment variables properly configured

## Deploy Now

```bash
cd /opt/urutibiz/urutibiz-backend

# Stop and remove old containers
docker compose down

# Rebuild with production target
docker compose up -d --build

# Watch logs
docker compose logs -f api
```

## Verify Deployment

```bash
# Check container status (should show "healthy")
docker compose ps

# Test health endpoint
curl http://localhost:3000/health

# Test from external
curl http://38.242.224.199:3000/health

# Check API logs
docker compose logs api --tail=50
```

## Expected Output

Container should show:
- Status: Up X minutes (healthy)
- Logs: "Server running on port 3000"
- Health check: Returns 200 OK

## Troubleshooting

If still failing:
```bash
# Check detailed logs
docker compose logs api

# Check if port is in use
netstat -tlnp | grep 3000

# Restart specific service
docker compose restart api
```
