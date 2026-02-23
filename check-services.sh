#!/bin/bash

echo "🔍 Checking UrutiBiz Services Status"
echo "===================================="
echo ""

echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep urutibiz

echo ""
echo "🌐 Port Listening Status:"
echo "Port 3000 (API):"
netstat -tuln | grep :3000 || echo "  ❌ Not listening"

echo "Port 8081 (Nginx):"
netstat -tuln | grep :8081 || echo "  ❌ Not listening"

echo ""
echo "🏥 Health Checks:"
echo "API Direct (port 3000):"
curl -s http://localhost:3000/api/v1/health | head -c 100 || echo "  ❌ Failed"

echo ""
echo "Nginx Proxy (port 8081):"
curl -s http://localhost:8081/api/v1/health | head -c 100 || echo "  ❌ Failed"

echo ""
echo "===================================="
