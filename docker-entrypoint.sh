#!/bin/bash
set -e

echo "=== UrutiBiz Backend Startup Diagnostics ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"
echo ""

echo "=== Environment Check ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "REDIS_HOST: $REDIS_HOST"
echo "PYTHON_IMAGE_SERVICE_URL: $PYTHON_IMAGE_SERVICE_URL"
echo ""

echo "=== File System Check ==="
ls -la /app/ | head -20
echo ""

echo "=== Checking dist directory ==="
if [ -d "/app/dist" ]; then
    echo "✅ dist directory exists"
    ls -la /app/dist/ | head -10
else
    echo "❌ dist directory NOT found"
    exit 1
fi
echo ""

echo "=== Checking server.js ==="
if [ -f "/app/dist/server.js" ]; then
    echo "✅ server.js exists"
else
    echo "❌ server.js NOT found"
    exit 1
fi
echo ""

echo "=== Checking Firebase credentials ==="
if [ -f "/app/firebase-credentials.json" ]; then
    echo "✅ firebase-credentials.json exists"
else
    echo "⚠️  firebase-credentials.json NOT found (optional)"
fi
echo ""

echo "=== Checking database connectivity ==="
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
        echo "✅ Database is reachable at $DB_HOST:$DB_PORT"
        
        # Also verify PostgreSQL is actually ready to accept connections
        if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready to accept connections"
            break
        else
            echo "⏳ PostgreSQL port is open but not ready yet (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        fi
    else
        echo "⏳ Waiting for database at $DB_HOST:$DB_PORT (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Database is not reachable after $MAX_RETRIES attempts"
        echo "❌ Cannot start application without database"
        exit 1
    fi
    
    sleep 2
done
echo ""

echo "=== Starting application ==="
exec "$@"
