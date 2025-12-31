#!/bin/bash
# Setup Python Service with Virtual Environment
# Usage: ./setup-python-service.sh

set -e

echo "🐍 Setting up Python Image Service with Virtual Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Navigate to python-service directory
cd ~/urutibz/python-service

# Step 1: Stop existing service
echo "1️⃣ Stopping existing service..."
pm2 delete python-image-service 2>/dev/null || true
sleep 2

# Step 2: Create virtual environment
echo ""
echo "2️⃣ Creating virtual environment..."
if [ -d "venv" ]; then
    echo -e "${YELLOW}  ⚠️ Virtual environment already exists${NC}"
    read -p "  Remove and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf venv
        python3 -m venv venv
        echo -e "${GREEN}  ✅ Virtual environment created${NC}"
    fi
else
    python3 -m venv venv
    echo -e "${GREEN}  ✅ Virtual environment created${NC}"
fi

# Step 3: Activate and install dependencies
echo ""
echo "3️⃣ Installing dependencies (this may take 5-10 minutes)..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}  ✅ Dependencies installed${NC}"

# Step 4: Verify installation
echo ""
echo "4️⃣ Verifying installation..."
python -m uvicorn --version
python -c "import fastapi; print('✅ FastAPI:', fastapi.__version__)"
python -c "import torch; print('✅ PyTorch:', torch.__version__)" || echo "⚠️ PyTorch check skipped"

# Step 5: Start with PM2
echo ""
echo "5️⃣ Starting service with PM2..."
deactivate

# Use the venv Python interpreter
pm2 start "venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1" \
    --name python-image-service

sleep 5

# Step 6: Check status
echo ""
echo "6️⃣ Checking service status..."
pm2 status python-image-service

# Step 7: Check logs
echo ""
echo "7️⃣ Recent logs:"
pm2 logs python-image-service --lines 20 --nostream

# Step 8: Test health endpoint
echo ""
echo "8️⃣ Testing health endpoint..."
sleep 3
HEALTH=$(curl -s http://localhost:8001/health 2>&1)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}  ✅ Service is healthy!${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${YELLOW}  ⚠️ Service may still be starting...${NC}"
    echo "  Response: $HEALTH"
    echo ""
    echo "  Check logs with: pm2 logs python-image-service"
fi

# Step 9: Save PM2 config
echo ""
echo "9️⃣ Saving PM2 configuration..."
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
echo ""
echo "Note: First model download may take a few minutes (~605MB)"




