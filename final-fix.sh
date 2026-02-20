#!/bin/bash
echo "=== Final Fix: File Permissions ==="

# Stop and remove containers
docker-compose -f docker-compose.production.yml down

# Remove old volumes if they exist (optional - only if you want fresh start)
# docker volume rm urutibiz-backend_uploads_data urutibiz-backend_logs_data 2>/dev/null || true

# Rebuild image with proper directory permissions
docker build --no-cache --target production -t urutibiz-backend:latest .

# Start all services
PORT=3000 docker-compose -f docker-compose.production.yml up -d

echo ""
echo "Waiting for startup..."
sleep 10

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== API Logs ==="
docker logs urutibiz-api --tail 50

echo ""
echo "=== Testing Health Endpoint ==="
sleep 5
curl -v http://localhost:3000/health || echo "Health check failed"

echo ""
echo "Done!"
