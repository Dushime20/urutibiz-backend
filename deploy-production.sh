#!/bin/bash
set -e

echo "=== UrutiBiz Backend Production Deployment ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file with required environment variables"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Load environment variables
source .env

# Check critical environment variables
REQUIRED_VARS=(
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables present${NC}"
echo ""

# Check if firebase-credentials.json exists
if [ ! -f "firebase-credentials.json" ]; then
    echo -e "${YELLOW}⚠️  Warning: firebase-credentials.json not found${NC}"
    echo "Push notifications will not work without Firebase credentials"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ firebase-credentials.json found${NC}"
fi
echo ""

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p uploads logs
chmod 755 uploads logs
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Build images
echo "Building Docker images..."
echo "This may take several minutes..."
echo ""

# Build PostgreSQL image
echo "Building PostgreSQL with PostGIS and pgvector..."
docker build -f Dockerfile.postgres -t urutibiz-postgres:latest . || {
    echo -e "${RED}❌ Failed to build PostgreSQL image${NC}"
    exit 1
}
echo -e "${GREEN}✅ PostgreSQL image built${NC}"
echo ""

# Build migration image
echo "Building migration image..."
docker build -f Dockerfile.migrations -t urutibiz-migration:latest . || {
    echo -e "${RED}❌ Failed to build migration image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Migration image built${NC}"
echo ""

# Build backend image
echo "Building backend API image..."
docker build --target production -t urutibiz-backend:latest . || {
    echo -e "${RED}❌ Failed to build backend image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend image built${NC}"
echo ""

# Build Python service image
if [ -d "python-service" ]; then
    echo "Building Python AI service image..."
    docker build -t urutibiz-python-service:latest ./python-service || {
        echo -e "${RED}❌ Failed to build Python service image${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Python service image built${NC}"
else
    echo -e "${YELLOW}⚠️  python-service directory not found, skipping${NC}"
fi
echo ""

# Start services
echo "Starting services..."
PORT=${PORT:-3000} docker-compose -f docker-compose.production.yml up -d

echo ""
echo "Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "=== Service Status ==="
docker-compose -f docker-compose.production.yml ps

echo ""
echo "=== Checking API logs ==="
docker logs urutibiz-api --tail 50

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Backend API: localhost:${PORT:-3000}"
echo "  - Python Service: localhost:8001"
echo ""
echo "Health check: curl http://localhost:${PORT:-3000}/health"
echo "API docs: http://localhost:${PORT:-3000}/api-docs"
echo ""
echo "To view logs:"
echo "  docker logs urutibiz-api -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.production.yml down"
