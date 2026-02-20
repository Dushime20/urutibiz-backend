# Quick Deployment Fix

## The Problem
The backend container was crashing because the database connection was timing out during startup. Even though PostgreSQL's healthcheck passed, it wasn't fully ready to accept connections when the API tried to connect.

## The Solution
Added retry logic to the database connection with 5 attempts and 3-second delays between retries.

## Deploy the Fix

Run these commands on your production server:

```bash
cd /opt/urutibiz/urutibiz-backend

# Stop the containers
docker-compose -f docker-compose.production.yml down

# Rebuild the backend image with the fix
docker build --no-cache --target production -t urutibiz-backend:latest .

# Start everything
PORT=3000 docker-compose -f docker-compose.production.yml up -d

# Wait 30 seconds for startup
sleep 30

# Check status
docker ps

# Check logs
docker logs urutibiz-api --tail 100

# Test the API
curl http://localhost:3000/health
```

## What to Expect

You should see in the logs:
```
🔄 Database connection attempt 1/5...
✅ Database connected successfully on attempt 1 (health check: XXms)
✅ Application initialized successfully
🚀 UrutiBiz API server running on port 3000
```

## If It Still Fails

Check the logs for the specific error:
```bash
docker logs urutibiz-api 2>&1 | grep -E "(Error|Failed|Exception)" | tail -20
```

Then share the output with me.
