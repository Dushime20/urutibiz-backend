# 🐍 Python Image Service - Complete Deployment Guide

## Overview

The Python service provides AI-powered image feature extraction using OpenAI's CLIP model for semantic image search.

**What it does:**
- Extracts 512-dimensional feature vectors from images
- Enables "find similar products" functionality
- Industry-standard approach used by major e-commerce platforms

**Technology:**
- Model: CLIP ViT-B/32 (OpenAI)
- Framework: FastAPI + PyTorch
- Size: ~605MB model + ~2GB PyTorch libraries

---

## 🚀 Quick Start

### Windows (Local Testing)

```powershell
# Navigate to python-service
cd python-service

# Enable BuildKit
$env:DOCKER_BUILDKIT=1

# Build image (first time: 10-20 minutes)
docker build -t urutibiz-python-service:latest .

# Run service
docker run -d `
  --name python-service-local `
  -p 8001:8001 `
  -v python-model-cache:/app/.cache/huggingface `
  urutibiz-python-service:latest

# Wait for model download (first run only)
docker logs -f python-service-local

# Test
curl http://localhost:8001/health
```

### Linux (Production)

```bash
# Navigate to python-service
cd /opt/urutibiz/urutibiz-backend/python-service

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build image
docker build -t urutibiz-python-service:latest .

# Start with Docker Compose
cd ..
docker compose -f docker-compose.prod.yml up -d python-service

# Monitor logs
docker logs -f urutibiz-python-service-prod

# Test
curl http://localhost:8001/health
```

---

## 📋 Step-by-Step Deployment

### Step 1: Prerequisites

**System Requirements:**
- RAM: 2GB minimum, 4GB recommended
- Disk: 3GB free space (model + libraries)
- CPU: Any modern CPU (GPU optional)
- Internet: Required for first-time model download

**Software:**
- Docker with BuildKit support
- Docker Compose (for production)

### Step 2: Build Docker Image

```bash
# Navigate to python-service directory
cd python-service

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1  # Linux/Mac
$env:DOCKER_BUILDKIT=1    # Windows PowerShell

# Build image
docker build -t urutibiz-python-service:latest .
```

**Build time:**
- First build: 10-20 minutes (downloads PyTorch ~2GB)
- Subsequent builds: 1-2 minutes (uses cache)

### Step 3: Run Service (Standalone)

```bash
# Create volume for model cache
docker volume create python-model-cache

# Run container
docker run -d \
  --name python-service \
  -p 8001:8001 \
  -v python-model-cache:/app/.cache/huggingface \
  --restart unless-stopped \
  urutibiz-python-service:latest

# Monitor startup
docker logs -f python-service
```

**First run output:**
```
🚀 Starting Python Image Feature Extraction Service
📥 Downloading model files (this may take a while on first run)...
✅ Model files downloaded in 180.5s
🔄 Moving model to cpu...
✅ CLIP model loaded successfully
   - Model: CLIP ViT-B/32
   - Embedding dimension: 512
   - Device: cpu
✅ Service ready to accept requests
```

### Step 4: Run with Docker Compose (Recommended)

Edit `docker-compose.prod.yml`:

```yaml
services:
  python-service:
    build:
      context: ./python-service
      dockerfile: Dockerfile
    image: urutibiz-python-service:prod
    container_name: urutibiz-python-service-prod
    restart: always
    ports:
      - "8001:8001"
    networks:
      - urutibiz-network
    volumes:
      - python-model-cache:/app/.cache/huggingface
    environment:
      - HF_HOME=/app/.cache/huggingface
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  python-model-cache:
    driver: local

networks:
  urutibiz-network:
    driver: bridge
```

Start service:

```bash
docker compose -f docker-compose.prod.yml up -d python-service
```

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:8001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu",
  "model_name": "CLIP ViT-B/32",
  "embedding_dimension": 512
}
```

### Extract Features from Image

```bash
# Download test image
curl -o test.jpg https://via.placeholder.com/300

# Extract features
curl -X POST http://localhost:8001/extract-features \
  -F "file=@test.jpg"
```

**Expected response:**
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],  // 512 numbers
  "dimension": 512
}
```

### Batch Processing

```bash
curl -X POST http://localhost:8001/extract-features-batch \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@image3.jpg"
```

---

## 🔧 Configuration

### Environment Variables

```env
# Port (default: 8001)
PORT=8001

# Model cache directory
HF_HOME=/app/.cache/huggingface

# Python settings
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1
```

### Resource Limits

Add to `docker-compose.prod.yml`:

```yaml
services:
  python-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 🔍 Monitoring

### View Logs

```bash
# Follow logs
docker logs -f urutibiz-python-service-prod

# Last 100 lines
docker logs --tail 100 urutibiz-python-service-prod

# With timestamps
docker logs -t urutibiz-python-service-prod
```

### Check Resource Usage

```bash
# Real-time stats
docker stats urutibiz-python-service-prod

# Memory usage
docker exec urutibiz-python-service-prod free -h

# Disk usage
docker exec urutibiz-python-service-prod df -h
```

### Health Monitoring Script

```bash
#!/bin/bash
# save as check-python-service.sh

HEALTH=$(curl -sf http://localhost:8001/health)

if [ $? -eq 0 ]; then
    echo "✓ Python service is healthy"
    echo $HEALTH | jq .
else
    echo "✗ Python service is down"
    docker logs urutibiz-python-service-prod --tail 20
fi
```

---

## 🐛 Troubleshooting

### Issue: Model Download Fails

**Symptoms:**
- Timeout errors
- Connection refused
- Download interrupted

**Solutions:**

```bash
# 1. Check internet connection
ping huggingface.co

# 2. Retry (automatic retry built-in)
docker restart urutibiz-python-service-prod
docker logs -f urutibiz-python-service-prod

# 3. Use VPN if HuggingFace is blocked
# 4. Increase timeout in Dockerfile:
#    HEALTHCHECK --start-period=120s

# 5. Manual download (if all else fails)
# Download from: https://huggingface.co/openai/clip-vit-base-patch32
# Place in: /app/.cache/huggingface/
```

### Issue: Out of Memory

**Symptoms:**
- Container crashes
- OOM (Out of Memory) errors

**Solutions:**

```bash
# Check memory usage
docker stats urutibiz-python-service-prod

# Increase memory limit
# Edit docker-compose.prod.yml:
services:
  python-service:
    deploy:
      resources:
        limits:
          memory: 4G

# Restart
docker compose -f docker-compose.prod.yml restart python-service
```

### Issue: Service Not Responding

**Symptoms:**
- Health check fails
- Timeout on requests

**Solutions:**

```bash
# 1. Check if running
docker ps | grep python-service

# 2. Check logs
docker logs urutibiz-python-service-prod --tail 100

# 3. Check health endpoint
curl -v http://localhost:8001/health

# 4. Restart service
docker restart urutibiz-python-service-prod

# 5. Rebuild if needed
docker compose -f docker-compose.prod.yml up -d --build python-service
```

### Issue: Slow Performance

**Symptoms:**
- Feature extraction takes >5 seconds
- High CPU usage

**Solutions:**

```bash
# 1. Check resource limits
docker stats urutibiz-python-service-prod

# 2. Increase CPU allocation
# Edit docker-compose.prod.yml:
services:
  python-service:
    deploy:
      resources:
        limits:
          cpus: '4'

# 3. Consider GPU (optional)
# Add to docker-compose.prod.yml:
services:
  python-service:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## 🔄 Updates & Maintenance

### Update Service

```bash
# Pull latest code
cd /opt/urutibiz/urutibiz-backend
git pull origin main

# Rebuild image
cd python-service
docker build -t urutibiz-python-service:latest .

# Restart service
cd ..
docker compose -f docker-compose.prod.yml restart python-service

# Verify
docker logs urutibiz-python-service-prod --tail 50
curl http://localhost:8001/health
```

### Clear Model Cache

```bash
# Stop service
docker compose -f docker-compose.prod.yml stop python-service

# Remove cache volume
docker volume rm urutibiz-backend_python-model-cache

# Restart (will re-download model)
docker compose -f docker-compose.prod.yml up -d python-service

# Monitor download
docker logs -f urutibiz-python-service-prod
```

### Backup Model Cache

```bash
# Create backup
docker run --rm \
  -v urutibiz-backend_python-model-cache:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/python-model-cache-backup.tar.gz -C /data .

# Restore backup
docker run --rm \
  -v urutibiz-backend_python-model-cache:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/python-model-cache-backup.tar.gz -C /data
```

---

## 📊 Performance Metrics

### Typical Performance

- **Startup time**: 30-60 seconds (with cached model)
- **First run**: 5-10 minutes (downloads model)
- **Feature extraction**: 100-500ms per image
- **Batch processing**: 50-200ms per image
- **Memory usage**: 1-2GB
- **CPU usage**: 20-50% during inference

### Optimization Tips

1. **Use model cache volume** - Prevents re-downloading
2. **Batch processing** - More efficient for multiple images
3. **Resource limits** - Prevent memory issues
4. **Health checks** - Monitor service availability
5. **GPU acceleration** - 10x faster (optional)

---

## 🔐 Security

### Best Practices

1. **Run as non-root user** (already configured)
2. **Don't expose port publicly** (use internal network)
3. **Rate limiting** (implement in Nginx)
4. **Input validation** (built into FastAPI)
5. **Regular updates** (update dependencies monthly)

### Network Security

```yaml
# Only expose to backend, not public
services:
  python-service:
    # Remove this in production:
    # ports:
    #   - "8001:8001"
    
    # Backend connects via internal network
    networks:
      - urutibiz-network
```

---

## 📚 API Documentation

### Endpoints

**GET /health**
- Returns service health status
- No authentication required

**POST /extract-features**
- Extracts features from single image
- Input: multipart/form-data with `file` field
- Output: JSON with 512-dimensional embedding

**POST /extract-features-batch**
- Extracts features from multiple images
- Input: multipart/form-data with `files` field (multiple)
- Output: JSON array with embeddings

### Integration with Backend

Backend connects to Python service:

```typescript
// Backend code example
const response = await axios.post(
  `${process.env.PYTHON_IMAGE_SERVICE_URL}/extract-features`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);

const embedding = response.data.embedding; // 512 numbers
```

---

## ✅ Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] BuildKit enabled
- [ ] Sufficient disk space (3GB+)
- [ ] Sufficient RAM (2GB+)
- [ ] Internet connection for first download
- [ ] Python service built successfully
- [ ] Service starts without errors
- [ ] Health check passes
- [ ] Feature extraction works
- [ ] Model cache volume created
- [ ] Backend can connect to service
- [ ] Logs show no errors
- [ ] Resource usage acceptable

---

## 🆘 Support

### Common Commands

```bash
# Status
docker ps | grep python-service

# Logs
docker logs -f urutibiz-python-service-prod

# Health
curl http://localhost:8001/health

# Restart
docker restart urutibiz-python-service-prod

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build python-service

# Stats
docker stats urutibiz-python-service-prod
```

### Getting Help

1. Check logs: `docker logs urutibiz-python-service-prod`
2. Check health: `curl http://localhost:8001/health`
3. Review this guide
4. Check Python service README: `python-service/README.md`

---

**Version**: 1.0.0  
**Last Updated**: 2024-02-05  
**Status**: ✅ Production Ready
