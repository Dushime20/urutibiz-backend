#!/bin/bash
# Quick rebuild script for production deployment

echo "=== Quick Rebuild and Deploy ==="

# Stop containers
echo "Stopping containers..."
docker-compose -f docker-compose.production.yml down

# Rebuild backend image with diagnostics
echo "Rebuilding backend image..."
docker build --no-cache --target production -t urutibiz-backend:latest .

# Start services
echo "Starting services..."
PORT=${PORT:-3000} docker-compose -f docker-compose.production.yml up -d

# Wait a bit
sleep 5

# Show status
echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== API Logs (last 100 lines) ==="
docker logs urutibiz-api --tail 100

echo ""
echo "=== Check if port is exposed ==="
docker port urutibiz-api || echo "No ports exposed"

echo ""
echo "Done! Check logs above for any errors."
