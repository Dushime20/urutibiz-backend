#!/bin/bash
# Fix and Start Python Service Script
# Usage: ./fix-python-service.sh

set -e

echo "🐍 Fixing Python Image Service..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Stop and delete all Python service processes
echo "1️⃣ Cleaning up existing Python service processes..."
pm2 delete python-image-service 2>/dev/null || true
pm2 delete all --filter "python-image-service" 2>/dev/null || true
sleep 2

# Step 2: Check if dependencies are installed
echo ""
echo "2️⃣ Checking Python dependencies..."
cd ~/urutibz/python-service

if [ ! -f requirements.txt ]; then
    echo -e "${RED}❌ requirements.txt not found!${NC}"
    exit 1
fi

# Check if Python packages are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️ FastAPI not installed. Installing dependencies...${NC}"
    pip3 install -r requirements.txt
else
    echo -e "${GREEN}✅ Dependencies appear to be installed${NC}"
fi

# Step 3: Test if main.py can be imported
echo ""
echo "3️⃣ Testing Python script..."
if ! python3 -c "import main" 2>/dev/null; then
    echo -e "${YELLOW}⚠️ Testing direct execution...${NC}"
    python3 -c "import sys; sys.path.insert(0, '.'); import main" || {
        echo -e "${RED}❌ Python script has errors. Checking logs...${NC}"
        python3 main.py --help 2>&1 | head -20
        exit 1
    }
fi

# Step 4: Start with uvicorn using PM2
echo ""
echo "4️⃣ Starting Python service with PM2..."
cd ~/urutibz/python-service

# Use python3 -m uvicorn (this works even if uvicorn is not in PATH)
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service

sleep 3

# Step 5: Check status
echo ""
echo "5️⃣ Checking service status..."
pm2 status python-image-service

# Step 6: Check logs
echo ""
echo "6️⃣ Recent logs:"
pm2 logs python-image-service --lines 20 --nostream

# Step 7: Test health endpoint
echo ""
echo "7️⃣ Testing health endpoint..."
sleep 2
HEALTH=$(curl -s http://localhost:8001/health 2>&1)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Service is healthy!${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${YELLOW}⚠️ Service may still be starting...${NC}"
    echo "Response: $HEALTH"
    echo ""
    echo "Check logs with: pm2 logs python-image-service"
fi

# Step 8: Save PM2 configuration
echo ""
echo "8️⃣ Saving PM2 configuration..."
pm2 save

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Python service setup complete!"
echo "==========================================${NC}"
echo ""
echo "Useful commands:"
echo "  Check status: pm2 status python-image-service"
echo "  View logs: pm2 logs python-image-service"
echo "  Restart: pm2 restart python-image-service"
echo "  Test: curl http://localhost:8001/health"

