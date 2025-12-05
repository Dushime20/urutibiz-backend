# Image Feature Extraction Service

Industry-standard image search implementation using CLIP model.

## Setup

1. Install Python dependencies:
```bash
cd python-service
pip install -r requirements.txt
```

2. Start the service:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### Health Check
```
GET /health
```

### Extract Features (Single Image)
```
POST /extract-features
Content-Type: multipart/form-data

file: [image file]
```

Response:
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "dimension": 512
}
```

### Extract Features (Batch)
```
POST /extract-features-batch
Content-Type: multipart/form-data

files: [multiple image files]
```

## Model Information

- **Model**: CLIP ViT-B/32 (OpenAI)
- **Embedding Dimension**: 512
- **Why CLIP**: 
  - Understands semantic meaning (car vs clothes)
  - Pre-trained on large datasets
  - Industry standard for image search
  - Used by major e-commerce platforms

