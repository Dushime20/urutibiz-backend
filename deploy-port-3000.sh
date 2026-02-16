#!/bin/bash
set -e

echo "=========================================="
echo "UrutiBiz Backend Deployment (Port 3000)"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop any existing processes on port 3000 and 5000
echo -e "${YELLOW}Step 1: Stopping existing processes...${NC}"
echo "Checking for processes on port 3000 and 5000..."

# Kill any process on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port 3000..."
    kill -9 $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null || true
fi

# Kill any process on port 5000
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port 5000..."
    kill -9 $(lsof -Pi :5000 -sTCP:LISTEN -t) 2>/dev/null || true
fi

# Stop PM2 processes if any
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
fi

echo -e "${GREEN}✓ Existing processes stopped${NC}"
echo ""

# Step 2: Stop all Docker containers
echo -e "${YELLOW}Step 2: Stopping Docker containers...${NC}"
docker compose -f docker-compose.production.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✓ Docker containers stopped${NC}"
echo ""

# Step 3: Update .env file to use port 3000
echo -e "${YELLOW}Step 3: Configuring environment...${NC}"
if [ -f .env ]; then
    # Update PORT in .env
    if grep -q "^PORT=" .env; then
        sed -i 's/^PORT=.*/PORT=3000/' .env
    else
        echo "PORT=3000" >> .env
    fi
    echo -e "${GREEN}✓ .env configured for port 3000${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi
echo ""

# Step 4: Build Docker image
echo -e "${YELLOW}Step 4: Building Docker image...${NC}"
docker build --target production -t urutibiz-backend:latest .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

# Step 5: Start services with docker-compose.production.yml
echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker compose -f docker-compose.production.yml up -d postgres redis
echo "Waiting for database and Redis to be ready..."
sleep 15
echo -e "${GREEN}✓ Database and Redis started${NC}"
echo ""

# Step 6: Start backend
echo -e "${YELLOW}Step 6: Starting backend...${NC}"
docker compose -f docker-compose.production.yml up -d api
echo "Waiting for backend to start..."
sleep 30
echo -e "${GREEN}✓ Backend started${NC}"
echo ""

# Step 7: Check backend status
echo -e "${YELLOW}Step 7: Verifying backend...${NC}"
if docker ps | grep -q urutibiz-api; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
    
    # Check logs
    echo ""
    echo "Recent logs:"
    docker logs urutibiz-api --tail 20
    echo ""
    
    # Test health endpoint
    echo "Testing backend on port 3000..."
    sleep 5
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is responding on port 3000${NC}"
    else
        echo -e "${YELLOW}⚠ Backend may need authentication or different endpoint${NC}"
        echo "Testing root endpoint..."
        curl -s http://localhost:3000/ | head -n 5
    fi
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    echo "Check logs with: docker logs urutibiz-api"
    exit 1
fi
echo ""

# Step 8: Update Nginx configuration
echo -e "${YELLOW}Step 8: Updating Nginx configuration...${NC}"
if [ -f nginx-urutibiz.conf ]; then
    # Copy to Nginx sites-available
    cp nginx-urutibiz.conf /etc/nginx/sites-available/urutibiz
    
    # Remove old symlink if exists
    rm -f /etc/nginx/sites-enabled/urutibiz
    
    # Create new symlink
    ln -s /etc/nginx/sites-available/urutibiz /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
        
        # Reload Nginx
        systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    else
        echo -e "${RED}✗ Nginx configuration test failed${NC}"
        nginx -t
        exit 1
    fi
else
    echo -e "${RED}✗ nginx-urutibiz.conf not found${NC}"
    exit 1
fi
echo ""

# Step 9: Final verification
echo -e "${YELLOW}Step 9: Final verification...${NC}"
echo ""
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "Testing through Nginx on port 8081..."
sleep 2
if curl -sf http://38.242.224.199:8081/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx is proxying correctly${NC}"
else
    echo -e "${YELLOW}⚠ Testing root endpoint...${NC}"
    curl -s http://38.242.224.199:8081/ | head -n 5
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Backend running on: http://localhost:3000"
echo "Nginx proxy on: http://38.242.224.199:8081"
echo ""
echo "Useful commands:"
echo "  View logs: docker logs -f urutibiz-api"
echo "  Restart: docker restart urutibiz-api"
echo "  Stop all: docker compose -f docker-compose.production.yml down"
echo ""
echo "Test endpoints:"
echo "  curl http://38.242.224.199:8081/health"
echo "  curl http://38.242.224.199:8081/api/v1/auth/login"
echo ""
