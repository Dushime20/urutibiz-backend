# Image Search Microservice Architecture

## Overview

The image search feature follows industry-standard microservices architecture patterns, with a dedicated Python service for AI model inference and a Node.js service for API handling and business logic.

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────────────────────┐
│   Node.js API Service           │
│   (Express + TypeScript)        │
│                                 │
│   - Request handling            │
│   - Authentication              │
│   - Business logic              │
│   - Database queries            │
│   - Result ranking              │
└──────┬──────────────────────────┘
       │
       │ HTTP REST API
       │ (with retry & circuit breaker)
       ▼
┌─────────────────────────────────┐
│   Python CLIP Service            │
│   (FastAPI + PyTorch)            │
│                                 │
│   - CLIP model inference        │
│   - Feature extraction          │
│   - Image preprocessing         │
│   - Embedding generation        │
└─────────────────────────────────┘
       │
       │ PostgreSQL
       ▼
┌─────────────────────────────────┐
│   PostgreSQL Database           │
│   (with pgvector extension)     │
│                                 │
│   - Product data                │
│   - Image embeddings            │
│   - Vector similarity search    │
└─────────────────────────────────┘
```

## Components

### 1. Python CLIP Service (`python-service/`)

**Technology Stack:**
- FastAPI (REST API framework)
- PyTorch (Deep learning framework)
- CLIP Model (OpenAI CLIP ViT-B/32)
- Uvicorn (ASGI server)

**Endpoints:**
- `GET /health` - Health check endpoint
- `POST /extract-features` - Extract features from single image
- `POST /extract-features-batch` - Batch feature extraction

**Features:**
- Automatic model loading on startup
- GPU support (CUDA) with CPU fallback
- Image preprocessing (RGB conversion, normalization)
- 512-dimensional embedding vectors
- Error handling and logging

**Configuration:**
- Port: 8001 (configurable via environment)
- Host: 0.0.0.0 (all interfaces)
- Model: `openai/clip-vit-base-patch32`

### 2. Node.js Service Client (`src/services/pythonImageService.ts`)

**Features:**
- ✅ **Retry Logic**: Exponential backoff (3 retries by default)
- ✅ **Circuit Breaker**: Prevents cascading failures
- ✅ **Health Checks**: Periodic health monitoring (every 60 seconds)
- ✅ **Automatic Reconnection**: Reconnects when service becomes available
- ✅ **Request Logging**: Detailed request/response logging
- ✅ **Error Handling**: Graceful degradation with fallback methods
- ✅ **Response Validation**: Validates response format and dimensions

**Circuit Breaker States:**
- **Closed**: Normal operation, requests allowed
- **Open**: Too many failures, requests rejected immediately
- **Half-Open**: Testing recovery, limited requests allowed

**Configuration:**
- Service URL: `PYTHON_IMAGE_SERVICE_URL` (default: `http://localhost:8001`)
- Timeout: 30 seconds
- Max Retries: 3
- Retry Delay: 1 second (exponential backoff)
- Circuit Breaker Threshold: 5 failures
- Circuit Breaker Timeout: 30 seconds

### 3. Image Search Service (`src/services/imageSearch.service.ts`)

**Features:**
- Multi-stage similarity search
- pgvector integration for efficient vector search
- Result ranking and quality scoring
- Caching (Redis + Memory)
- Pagination support
- Category filtering

**Search Flow:**
1. Extract features from query image (via Python service)
2. Use pgvector for cosine similarity search
3. Rank results by similarity score
4. Apply quality filters
5. Return paginated results

### 4. Database (PostgreSQL + pgvector)

**Schema:**
- `product_images.image_embedding`: `vector(512)` type
- HNSW index for fast similarity search
- Cosine distance operator (`<=>`)

**Query Example:**
```sql
SELECT 
  *,
  1 - (image_embedding <=> $1::vector) as similarity
FROM product_images
WHERE image_embedding IS NOT NULL
ORDER BY image_embedding <=> $1::vector
LIMIT 20;
```

## Microservices Best Practices

### 1. Service Discovery
- Environment variable configuration (`PYTHON_IMAGE_SERVICE_URL`)
- Default fallback to `http://localhost:8001`
- Health check endpoint for service availability

### 2. Resilience Patterns

#### Retry Logic
```typescript
// Exponential backoff: 1s, 2s, 4s
await retryWithBackoff(async () => {
  return await client.post('/extract-features', formData);
}, 3);
```

#### Circuit Breaker
```typescript
// Prevents cascading failures
if (circuitBreaker.state === 'open') {
  throw new Error('Service unavailable');
}
```

#### Health Checks
```typescript
// Periodic health monitoring
setInterval(async () => {
  await testConnection();
}, 60000);
```

### 3. Error Handling
- Graceful degradation (fallback to TensorFlow.js)
- Detailed error logging
- User-friendly error messages
- Automatic service recovery

### 4. Monitoring & Observability
- Request/response logging
- Performance metrics (response time)
- Circuit breaker state tracking
- Service availability status

### 5. Security
- CORS configuration (configurable for production)
- Input validation (image size, format)
- Timeout protection
- Error message sanitization

## Deployment

### Development
```bash
# Terminal 1: Start Python service
cd python-service
python main.py

# Terminal 2: Start Node.js service
npm run dev
```

### Production
```bash
# Python service (systemd service or Docker)
cd python-service
uvicorn main:app --host 0.0.0.0 --port 8001

# Node.js service
npm run build
npm start
```

### Docker (Recommended)
```yaml
# docker-compose.yml
services:
  python-service:
    build: ./python-service
    ports:
      - "8001:8001"
    environment:
      - PYTHON_ENV=production
  
  nodejs-service:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PYTHON_IMAGE_SERVICE_URL=http://python-service:8001
    depends_on:
      - python-service
```

## Testing

### Health Check
```bash
curl http://localhost:8001/health
```

### Feature Extraction
```bash
curl -X POST http://localhost:8001/extract-features \
  -F "file=@image.jpg"
```

### Image Search
```bash
curl -X POST http://localhost:5000/api/v1/products/search-by-image \
  -F "image=@query.jpg" \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Python Service Not Available
1. Check if service is running: `curl http://localhost:8001/health`
2. Check logs for errors
3. Verify Python dependencies: `pip list`
4. Check port conflicts: `netstat -an | grep 8001`

### Circuit Breaker Open
1. Check Python service health
2. Review error logs
3. Wait for circuit breaker timeout (30 seconds)
4. Service will automatically attempt recovery

### Slow Response Times
1. Check Python service performance
2. Verify GPU availability (if using CUDA)
3. Review database query performance
4. Check network latency between services

## Performance Optimization

1. **Batch Processing**: Use `/extract-features-batch` for multiple images
2. **Caching**: Enable Redis caching for repeated queries
3. **Connection Pooling**: Reuse HTTP connections
4. **Database Indexing**: Ensure HNSW index is created
5. **GPU Acceleration**: Use CUDA for faster inference

## Future Enhancements

- [ ] Service mesh integration (Istio/Linkerd)
- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] Metrics collection (Prometheus)
- [ ] Auto-scaling based on load
- [ ] Multi-model support (different CLIP variants)
- [ ] A/B testing for model selection

