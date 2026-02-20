#!/bin/bash
echo "=== Quick Rebuild ==="

# Stop API container only
docker stop urutibiz-api
docker rm urutibiz-api

# Rebuild image
docker build --target production -t urutibiz-backend:latest .

# Start API container
PORT=3000 docker-compose -f docker-compose.production.yml up -d api

# Follow logs
sleep 2
docker logs urutibiz-api -f
