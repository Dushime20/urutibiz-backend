# Image Search Setup Guide

Industry-standard image search implementation using CLIP model and pgvector.

## Architecture

```
User Upload → Node.js API → Python CLIP Service → Feature Extraction (512D)
                                                      ↓
PostgreSQL (pgvector) ← Store Embeddings ← Normalize Vector
                                                      ↓
Similarity Search (cosine distance) → Return Top Matches
```

## Setup Steps

### 1. Install Python Service Dependencies

```bash
cd python-service
pip install -r requirements.txt
```

**Note**: First run will download CLIP model (~500MB), this may take a few minutes.

### 2. Start Python Service

```bash
# Development
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001
```

The service will be available at `http://localhost:8001`

### 3. Install PostgreSQL pgvector Extension

```sql
-- Connect to your PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Run Database Migration

```bash
npm run db:migrate
```

This will:
- Enable pgvector extension
- Convert `image_embedding` column to vector type (512 dimensions)
- Create index for fast similarity search

### 5. Configure Environment Variables

Add to your `.env` file:

```env
# Python Image Service URL (default: http://localhost:8001)
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001
```

### 6. Start Node.js Server

```bash
npm run dev
```

The server will:
- Check Python service availability on startup
- Precompute embeddings for all product images without embeddings
- Use Python CLIP service for feature extraction

## How It Works

### Feature Extraction Flow

1. **User uploads image** → Node.js receives it
2. **Node.js calls Python service** → `POST /extract-features` with image
3. **Python CLIP model** → Extracts 512-dimensional feature vector
4. **Node.js stores embedding** → In PostgreSQL as vector type

### Search Flow

1. **User uploads search image** → Node.js extracts features
2. **PostgreSQL pgvector** → Performs cosine similarity search
3. **Returns top matches** → Sorted by similarity score

## Benefits

✅ **Accurate**: CLIP understands semantic meaning (car vs clothes)  
✅ **Fast**: pgvector index enables millisecond searches  
✅ **Scalable**: Handles millions of images efficiently  
✅ **Industry Standard**: Same approach used by major e-commerce platforms  

## Troubleshooting

### Python Service Not Available

If Python service is not running:
- Image search will fall back to TensorFlow.js MobileNet
- Check Python service logs for errors
- Ensure port 8001 is not in use

### pgvector Not Available

If pgvector extension is not installed:
- System will use traditional similarity search (slower)
- Install pgvector: `CREATE EXTENSION vector;`
- Run migration again

### Model Download Issues

If CLIP model download fails:
- Check internet connection
- Model is downloaded on first run (~500MB)
- Can be cached for offline use

## Testing
   npm run python:service

1. Start Python service: `python python-service/main.py`
2. Start Node.js server: `npm run dev`
3. Upload an image via API
4. Check logs for:
   - `✅ Python CLIP service is available`
   - `✅ CLIP feature extraction successful: 512 dimensions`
   - `✅ Used pgvector similarity search`

## Production Deployment

### Docker Deployment (Recommended)

The project includes complete Docker setup for production deployment:

```bash
# Build and start all services (Backend, Python Service, PostgreSQL, Redis)
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f python-service

# Check service health
curl http://localhost:8001/health
```

**Docker Configuration**:
- ✅ Python service Dockerfile with CLIP model support
- ✅ Automatic model cache persistence
- ✅ Health checks and graceful shutdown
- ✅ Non-root user execution for security
- ✅ Integrated with backend via Docker network

**Environment Variables**:
- Set `PYTHON_IMAGE_SERVICE_URL=http://python-service:8001` in `.env`
- Services communicate via Docker service names

See `DOCKER_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

### Manual Deployment

1. **Python Service**: Deploy as separate service
   ```bash
   cd python-service
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```
2. **Environment**: Set `PYTHON_IMAGE_SERVICE_URL` to production URL
3. **Database**: Ensure pgvector extension is installed
4. **Monitoring**: Monitor Python service health and response times

