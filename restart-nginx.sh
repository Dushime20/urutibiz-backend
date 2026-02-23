#!/bin/bash

echo "🔄 Restarting Nginx service..."

# Stop and remove existing nginx container
docker-compose -f docker-compose.production.yml stop nginx
docker-compose -f docker-compose.production.yml rm -f nginx

# Start nginx
docker-compose -f docker-compose.production.yml up -d nginx

# Check status
echo ""
echo "📊 Container Status:"
docker ps | grep nginx

echo ""
echo "📝 Nginx Logs (last 20 lines):"
docker logs --tail 20 urutibiz-nginx

echo ""
echo "✅ Done! Nginx should now be running on port 8081"
