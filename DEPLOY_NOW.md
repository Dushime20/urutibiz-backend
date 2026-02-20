# Quick Deployment Fix

## The Problem
The backend container was crashing because:
1. The database connection was timing out during startup
2. We couldn't verify if PostgreSQL was actually reachable before starting the app
3. The container was starting before PostgreSQL was fully ready

## The Solution
1. Added netcat and postgresql-client to the Docker image for connectivity checks
2. Updated entrypoint script to wait for PostgreSQL to be ready (up to 60 seconds)
3. Added retry logic to database connection (5 attempts with 3-second delays)
4. Added comprehensive startup logging to identify issues

## Test Prerequisites First

Before deploying, test that all services are reachable:

```bash
cd /opt/urutibiz/urutibiz-backend

# Make script executable
chmod +x test-deployment.sh

# Run tests
./test-deployment.sh
```

All tests should pass before proceeding.

## Deploy the Fix

```bash
cd /opt/urutibiz/urutibiz-backend

# Stop the containers
docker-compose -f docker-compose.production.yml down

# Rebuild the backend image with the fix
docker build --no-cache --target production -t urutibiz-backend:latest .

# Start everything
PORT=3000 docker-compose -f docker-compose.production.yml up -d

# Watch the logs in real-time
docker logs urutibiz-api -f
```

## What to Expect

You should see in the logs:
```
=== UrutiBiz Backend Startup Diagnostics ===
...
=== Checking database connectivity ===
✅ Database is reachable at postgres:5432
✅ PostgreSQL is ready to accept connections

=== Starting application ===
=== SERVER STARTUP BEGIN ===
Step 1: Connecting to database...
🔄 Database connection attempt 1/5...
✅ Database connected successfully on attempt 1
Step 2: Initializing Sequelize models...
Step 3: Creating App instance...
Step 4: Initializing application...
Step 5: Starting HTTP server...
🚀 UrutiBiz API server running on port 3000
```

## If It Still Fails

The new logging will show exactly which step failed:

```bash
docker logs urutibiz-api 2>&1 | grep -E "(Step|Error|Failed|===)"
```

Share the output with me.
