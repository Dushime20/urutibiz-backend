#!/bin/bash
set -e

echo "=== Fixing and Deploying Backend ==="

# Stop containers
echo "Stopping containers..."
docker-compose -f docker-compose.production.yml down

# Remove old image to force rebuild
echo "Removing old image..."
docker rmi urutibiz-backend:latest || true

# Rebuild with verbose output
echo "Rebuilding backend image..."
docker build --no-cache --progress=plain --target production -t urutibiz-backend:latest . 2>&1 | tee build.log

# Start services
echo "Starting services..."
PORT=3000 docker-compose -f docker-compose.production.yml up -d

# Follow logs
echo ""
echo "Following logs (Ctrl+C to stop watching)..."
sleep 3
docker logs urutibiz-api -f
