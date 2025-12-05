# Image Search by Photo Implementation

## Overview

This implementation provides AI-powered image search functionality similar to Alibaba.com, allowing users to search for products by uploading an image or providing an image URL. The system uses TensorFlow.js MobileNet to extract image features and compare them with product images in the database.

## Features

- ✅ **AI-Powered Image Similarity**: Uses MobileNet (TensorFlow.js) for feature extraction
- ✅ **Flexible Input**: Accepts image file uploads or image URLs
- ✅ **Similarity Scoring**: Returns products sorted by similarity score
- ✅ **Configurable Threshold**: Adjustable minimum similarity threshold
- ✅ **Automatic Embedding Generation**: Generates embeddings when images are uploaded
- ✅ **Fallback Method**: Works even when MobileNet model is unavailable

## Architecture

### Components

1. **Database Migration** (`20250115_add_image_embeddings_to_product_images.ts`)
   - Adds `image_embedding` JSONB column to `product_images` table
   - Creates GIN index for fast similarity searches

2. **Image Similarity Service** (`src/services/imageSimilarity.service.ts`)
   - Extracts image features using MobileNet
   - Calculates cosine similarity between feature vectors
   - Provides fallback method when MobileNet is unavailable

3. **Product Image Service** (`src/services/productImage.service.ts`)
   - Automatically generates embeddings when images are uploaded
   - Stores embeddings in the database

4. **Products Controller** (`src/controllers/products.controller.ts`)
   - `searchByImage` method handles image search requests
   - Supports both file uploads and image URLs

5. **API Route** (`src/routes/products.routes.ts`)
   - `POST /api/v1/products/search-by-image` endpoint

## Setup Instructions

### 1. Run Database Migration

```bash
cd urutibiz-backend
npm run db:migrate
```

This will add the `image_embedding` column to the `product_images` table.

### 2. Generate Embeddings for Existing Images

If you have existing product images, run the script to generate embeddings:

```bash
ts-node -r tsconfig-paths/register scripts/generate-image-embeddings.ts
```

This script will:
- Find all product images without embeddings
- Generate embeddings for each image
- Update the database with the embeddings

### 3. Model Loading

The MobileNet model is loaded from TensorFlow Hub on first use. Ensure your server has internet access for the initial model download. The model is cached in memory for subsequent requests.

**Note**: If the model fails to load, the system automatically falls back to a basic feature extraction method that works offline.

## API Usage

### Endpoint

```
POST /api/v1/products/search-by-image
```

### Request Options

#### Option 1: File Upload (multipart/form-data)

```bash
curl -X POST http://localhost:3000/api/v1/products/search-by-image \
  -F "image=@/path/to/image.jpg" \
  -F "threshold=0.5" \
  -F "limit=20" \
  -F "page=1"
```

#### Option 2: Image URL (application/json)

```bash
curl -X POST http://localhost:3000/api/v1/products/search-by-image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/product-image.jpg",
    "threshold": 0.5,
    "limit": 20,
    "page": 1
  }'
```

### Query Parameters

- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20, max: 50): Number of results per page
- `threshold` (optional, default: 0.5): Minimum similarity score (0-1)

### Response Format

```json
{
  "success": true,
  "message": "Image search completed successfully",
  "data": {
    "items": [
      {
        "product": {
          "id": "uuid",
          "title": "Product Name",
          "description": "Product description",
          "base_price_per_day": 100.00,
          "currency": "RWF"
        },
        "image": {
          "id": "uuid",
          "url": "https://example.com/image.jpg",
          "thumbnail_url": "https://example.com/thumb.jpg",
          "is_primary": true
        },
        "similarity": 0.85,
        "similarity_percentage": 85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "search_metadata": {
      "threshold": 0.5,
      "query_features_dimension": 1280
    }
  }
}
```

## How It Works

### 1. Feature Extraction

When an image is uploaded or provided via URL:
- Image is downloaded and preprocessed (resized to 224x224, normalized)
- MobileNet extracts a 1280-dimensional feature vector
- If MobileNet is unavailable, falls back to basic histogram/texture features (128 dimensions)

### 2. Similarity Calculation

- Query image features are compared with all product image embeddings in the database
- Cosine similarity is calculated between feature vectors
- Results are filtered by similarity threshold and sorted by similarity score

### 3. Embedding Storage

- Embeddings are stored as JSONB arrays in the `image_embedding` column
- GIN index enables fast similarity searches
- Embeddings are automatically generated when new images are uploaded

## Performance Considerations

- **Model Loading**: MobileNet model is loaded once and cached in memory
- **Batch Processing**: Embedding generation script processes images in batches
- **Database Index**: GIN index on `image_embedding` column for fast queries
- **Similarity Threshold**: Higher thresholds reduce result set size and improve performance

## Troubleshooting

### Model Loading Fails

If you see warnings about MobileNet model loading:
- Check internet connectivity (required for initial download)
- The system will automatically use fallback method
- Fallback method works offline but may have lower accuracy

### No Results Returned

- Check if product images have embeddings (run the generation script)
- Lower the similarity threshold (try 0.3 or 0.4)
- Ensure product images are active and have valid URLs

### Slow Performance

- Reduce the `limit` parameter
- Increase the `threshold` to filter more results
- Consider processing embeddings in background jobs for large datasets

## Future Enhancements

- [ ] Support for vector similarity search using PostgreSQL pgvector extension
- [ ] Background job processing for embedding generation
- [ ] Caching of similarity results
- [ ] Support for multiple image models (ResNet, EfficientNet)
- [ ] Image preprocessing improvements (object detection, cropping)
- [ ] Real-time embedding updates when images change

## References

- [Alibaba.com Image Search](https://www.alibaba.com/)
- [TensorFlow.js MobileNet](https://www.tensorflow.org/js/models)
- [MobileNet Paper](https://arxiv.org/abs/1704.04861)

