#!/bin/bash
# Python Service Status Check Script
# Usage: ./check-python-service.sh

echo "🐍 Python Image Service Status Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check port 8001
echo "1️⃣ Checking port 8001:"
if sudo netstat -tlnp 2>/dev/null | grep -q ":8001"; then
    echo -e "${GREEN}  ✅ Port 8001 is listening${NC}"
    sudo netstat -tlnp | grep 8001
else
    echo -e "${RED}  ❌ Port 8001 is NOT listening${NC}"
fi

echo ""

# Check health endpoint
echo "2️⃣ Testing health endpoint:"
HEALTH_RESPONSE=$(curl -s http://localhost:8001/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}  ✅ Service is healthy${NC}"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}  ❌ Service is NOT responding${NC}"
    echo "  Response: $HEALTH_RESPONSE"
fi

echo ""

# Check process
echo "3️⃣ Checking Python process:"
PYTHON_PROCESS=$(ps aux | grep -E "python.*main.py|uvicorn.*8001" | grep -v grep)
if [ -n "$PYTHON_PROCESS" ]; then
    echo -e "${GREEN}  ✅ Python service process found:${NC}"
    echo "$PYTHON_PROCESS"
else
    echo -e "${RED}  ❌ No Python service process found${NC}"
fi

echo ""

# Check PM2
echo "4️⃣ Checking PM2:"
if command -v pm2 &> /dev/null; then
    if pm2 list 2>/dev/null | grep -q python; then
        echo -e "${GREEN}  ✅ Python service in PM2:${NC}"
        pm2 list | grep python
    else
        echo -e "${YELLOW}  ⚠️ Python service not in PM2${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️ PM2 not installed${NC}"
fi

echo ""

# Check systemd
echo "5️⃣ Checking systemd service:"
if systemctl list-units 2>/dev/null | grep -q urutibiz-python; then
    echo -e "${GREEN}  ✅ Python service in systemd:${NC}"
    sudo systemctl status urutibiz-python-service --no-pager | head -5
else
    echo -e "${YELLOW}  ⚠️ Python service not in systemd${NC}"
fi

echo ""
echo "===================================="
echo "✅ Check complete!"
echo ""
echo "To start Python service:"
echo "  cd ~/urutibz/urutibiz-backend/python-service"
echo "  pm2 start main.py --name python-image-service --interpreter python3"
echo "  pm2 save"




