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
if command -v nc &> /dev/null; then
    if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
        echo "✅ Database is reachable at $DB_HOST:$DB_PORT"
    else
        echo "❌ Cannot reach database at $DB_HOST:$DB_PORT"
    fi
else
    echo "⚠️  netcat not available, skipping connectivity check"
fi
echo ""

echo "=== Starting application ==="
exec "$@"
