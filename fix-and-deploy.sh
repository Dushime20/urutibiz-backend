#!/bin/bash
set -e

echo "=========================================="
echo "UrutiBiz Backend - Complete Fix & Deploy"
echo "=========================================="
echo ""

cd /opt/urutibiz/urutibiz-backend

# Step 1: Stop everything
echo "Step 1: Stopping containers..."
docker compose -f docker-compose.production.yml down
echo "✓ Containers stopped"
echo ""

# Step 2: Create Firebase credentials
echo "Step 2: Setting up Firebase credentials..."
if [ ! -f "firebase-credentials.json" ]; then
    bash setup-firebase-credentials.sh
else
    echo "✓ firebase-credentials.json already exists"
fi
chmod 644 firebase-credentials.json
echo "✓ Firebase credentials ready"
echo ""

# Step 3: Verify .env has PORT=3000
echo "Step 3: Configuring environment..."
if grep -q "^PORT=" .env; then
    sed -i 's/^PORT=.*/PORT=3000/' .env
else
    echo "PORT=3000" >> .env
fi
echo "✓ PORT set to 3000"
echo ""

# Step 4: Start database and Redis
echo "Step 4: Starting database and Redis..."
docker compose -f docker-compose.production.yml up -d postgres redis
echo "Waiting for services to be ready..."
sleep 20

# Check database is ready
if docker exec urutibiz-postgres pg_isready -U urutibiz_user > /dev/null 2>&1; then
    echo "✓ Database is ready"
else
    echo "⚠ Database may not be ready yet, continuing..."
fi
echo ""

# Step 5: Start backend
echo "Step 5: Starting backend..."
docker compose -f docker-compose.production.yml up -d api
echo "Waiting for backend to start..."
sleep 30
echo ""

# Step 6: Check status
echo "Step 6: Checking status..."
echo ""
echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep urutibiz
echo ""

# Check if backend is restarting
if docker ps | grep urutibiz-api | grep -q "Restarting"; then
    echo "⚠ Backend is restarting - checking logs..."
    echo ""
    docker logs urutibiz-api --tail 50
    echo ""
    echo "❌ Backend failed to start. Check logs above."
    exit 1
fi

# Step 7: Test backend
echo "Step 7: Testing backend..."
sleep 5

if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend is responding on port 3000"
elif curl -sf http://localhost:3000/ > /dev/null 2>&1; then
    echo "✓ Backend is responding on port 3000 (root endpoint)"
else
    echo "Testing backend response:"
    curl -s http://localhost:3000/health || curl -s http://localhost:3000/ || echo "No response"
fi
echo ""

# Step 8: Update Nginx
echo "Step 8: Updating Nginx configuration..."
if [ -f "/etc/nginx/sites-available/urutibiz" ]; then
    sed -i 's/server localhost:[0-9]*;/server localhost:3000;/g' /etc/nginx/sites-available/urutibiz
    
    if nginx -t > /dev/null 2>&1; then
        systemctl reload nginx
        echo "✓ Nginx updated and reloaded"
    else
        echo "⚠ Nginx config test failed"
        nginx -t
    fi
else
    echo "⚠ Nginx config not found at /etc/nginx/sites-available/urutibiz"
fi
echo ""

# Step 9: Final test
echo "Step 9: Final verification..."
echo ""
echo "Testing through Nginx on port 8081:"
curl -s http://38.242.224.199:8081/health || curl -s http://38.242.224.199:8081/ | head -5
echo ""
echo ""

# Summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "Backend: http://localhost:3000"
echo "Nginx: http://38.242.224.199:8081"
echo ""
echo "Check logs: docker logs -f urutibiz-api"
echo "Check status: docker ps | grep urutibiz"
echo ""
