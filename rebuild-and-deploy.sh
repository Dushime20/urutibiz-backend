#!/bin/bash
# Complete Rebuild and Deployment Script
# This script rebuilds the Docker image with fixes and deploys it

set -e

echo "🚀 UrutiBiz Backend - Complete Rebuild & Deploy"
echo "================================================"

# Check if running in correct directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run from backend directory."
    exit 1
fi

# 1. Setup Firebase credentials
echo "📝 Step 1: Setting up Firebase credentials..."
if [ ! -f "firebase-credentials.json" ]; then
    bash setup-firebase-credentials.sh
else
    echo "   ✅ firebase-credentials.json already exists"
fi

# 2. Build new Docker image
echo ""
echo "🔨 Step 2: Building Docker image..."
docker build -t urutibiz-backend:latest \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
    .

echo "   ✅ Image built successfully"

# 3. Stop existing containers
echo ""
echo "🛑 Step 3: Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || echo "   No existing containers to stop"

# 4. Start services
echo ""
echo "🚀 Step 4: Starting services..."
docker-compose -f docker-compose.production.yml up -d

# 5. Wait for services to be ready
echo ""
echo "⏳ Step 5: Waiting for services to be ready..."
sleep 10

# 6. Check service health
echo ""
echo "🏥 Step 6: Checking service health..."

# Check postgres
if docker exec urutibiz-postgres pg_isready -U urutibiz_user > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
else
    echo "   ⚠️  PostgreSQL is not ready yet"
fi

# Check redis
if docker exec urutibiz-redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis is ready"
else
    echo "   ⚠️  Redis is not ready yet"
fi

# Check API
if docker ps | grep -q urutibiz-api; then
    echo "   ✅ API container is running"
else
    echo "   ❌ API container is not running"
fi

# 7. Show logs
echo ""
echo "📋 Step 7: Showing recent logs..."
echo "=================================="
docker-compose -f docker-compose.production.yml logs --tail=50 api

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "💡 Useful commands:"
echo "   View logs:     docker-compose -f docker-compose.production.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.production.yml down"
echo "   Restart API:   docker-compose -f docker-compose.production.yml restart api"
echo "   Shell access:  docker exec -it urutibiz-api sh"
