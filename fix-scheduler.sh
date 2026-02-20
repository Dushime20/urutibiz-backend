#!/bin/bash
echo "=== Fixing Booking Scheduler ==="

# Stop API container
docker stop urutibiz-api

# Rebuild image
echo "Rebuilding backend image..."
docker build --target production -t urutibiz-backend:latest .

# Start API container
echo "Starting API container..."
PORT=3000 docker-compose -f docker-compose.production.yml up -d api

# Wait for startup
echo "Waiting for startup..."
sleep 10

# Check logs
echo ""
echo "=== Checking logs for scheduler initialization ==="
docker logs urutibiz-api 2>&1 | grep -E "(Step 4.5|Booking scheduler|system user)"

echo ""
echo "=== Testing health endpoint ==="
curl -s http://localhost:3000/health | head -5

echo ""
echo "=== Container status ==="
docker ps | grep urutibiz-api

echo ""
echo "Done! Check logs above for 'Created system user' or 'Found system user' message."
