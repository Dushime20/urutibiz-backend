#!/bin/bash
# Complete rebuild script for Python service

echo "🔄 Stopping Python service..."
cd /opt/urutibiz/urutibiz-backend
docker compose -f docker-compose.prod.yml stop python-service

echo "🗑️ Removing old container..."
docker rm -f urutibiz-python-service-prod 2>/dev/null || true

echo "🗑️ Removing old images..."
docker rmi -f urutibiz-python-service:latest 2>/dev/null || true
docker rmi -f urutibiz-python-service:prod 2>/dev/null || true
docker rmi -f $(docker images | grep python-service | awk '{print $3}') 2>/dev/null || true

echo "🧹 Clearing build cache..."
docker builder prune -f

echo "🔨 Building fresh image..."
cd python-service
export DOCKER_BUILDKIT=1
docker build --no-cache --pull -t urutibiz-python-service:latest .

echo "🚀 Starting service..."
cd ..
docker compose -f docker-compose.prod.yml up -d python-service

echo "📋 Checking logs..."
sleep 5
docker logs urutibiz-python-service-prod

echo "✅ Done! Monitor with: docker logs -f urutibiz-python-service-prod"
