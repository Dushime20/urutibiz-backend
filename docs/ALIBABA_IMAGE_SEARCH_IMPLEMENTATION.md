# Alibaba.com Image Search Implementation Guide

## How Alibaba.com Implements Image Search

Based on research and Alibaba Cloud documentation, Alibaba.com uses the following approach:

### 1. **Deep Learning Feature Extraction**
- Uses **Convolutional Neural Networks (CNNs)** like VGG, ResNet, or Transformer-based models
- Extracts high-dimensional feature vectors (typically 128-2048 dimensions)
- Features capture visual characteristics: colors, shapes, textures, objects

### 2. **Vector Database Storage**
- Stores extracted features as **vectors** in a specialized database
- Uses **AnalyticDB for PostgreSQL** (supports vector retrieval)
- Vectors are indexed for fast similarity search

### 3. **Similarity Search Algorithm**
- Uses **Approximate Nearest Neighbor (ANN)** search for efficiency
- Compares query image vector with stored product image vectors
- Returns products sorted by similarity score

### 4. **Query Optimization**
- Separates data fetching (images vs pricing) for better performance
- Uses batch processing for similarity calculations
- Implements caching for frequently searched images

## Our Implementation (Matching Alibaba's Approach)

### Architecture

```
User Uploads Image
    ↓
Feature Extraction (MobileNet/CNN)
    ↓
Vector Embedding (1280-dim or 128-dim fallback)
    ↓
Similarity Search (Cosine Similarity)
    ↓
Ranked Results by Similarity Score
```

### Key Components

#### 1. **Feature Extraction Service** (`imageSimilarity.service.ts`)
- **Primary**: MobileNet v2 (TensorFlow.js) - 1280-dimensional vectors
- **Fallback**: Basic histogram/texture features - 128-dimensional vectors
- **Lazy Loading**: TensorFlow.js loads only when needed

#### 2. **Vector Storage**
- **Database**: PostgreSQL with JSONB column (`image_embedding`)
- **Index**: GIN index for fast JSONB queries
- **Format**: Array of numbers `[0.123, 0.456, ...]`

#### 3. **Similarity Search**
- **Algorithm**: Cosine Similarity (normalized to 0-1 range)
- **Optimization**: Pre-normalized query vectors for faster computation
- **Threshold**: Configurable minimum similarity (default: 0.5)

#### 4. **Query Optimization** (Alibaba Pattern)
```typescript
// Step 1: Fetch images with embeddings (no pricing columns)
const productImages = await db('product_images')
  .select('image_embedding', 'product_id', ...)
  .whereNotNull('image_embedding');

// Step 2: Fetch pricing separately (from product_prices table)
const pricing = await db('product_prices')
  .whereIn('product_id', productIds)
  .where('is_active', true);

// Step 3: Enrich images with pricing data
const enriched = productImages.map(img => ({
  ...img,
  ...pricingMap.get(img.product_id)
}));
```

### Performance Optimizations (Alibaba-style)

1. **Separate Data Fetching**
   - Images and embeddings fetched separately from pricing
   - Avoids SQL errors from missing columns
   - Better query performance

2. **Batch Processing**
   - Process multiple embeddings in batches
   - Pre-normalize query vectors
   - Use efficient similarity algorithms

3. **Caching Strategy**
   - Cache frequently searched images
   - Cache model loading (MobileNet)
   - Cache similarity results

4. **Vector Indexing**
   - GIN index on `image_embedding` JSONB column
   - Fast lookup for products with embeddings

### API Endpoint

```
POST /api/v1/products/search-by-image
```

**Request:**
- `image` (file) or `image_url` (string)
- `threshold` (number, 0-1, default: 0.5)
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product": {
          "id": "uuid",
          "title": "Product Name",
          "description": "...",
          "base_price_per_day": 100.00,
          "currency": "RWF"
        },
        "image": {
          "id": "uuid",
          "url": "https://...",
          "is_primary": true
        },
        "similarity": 0.85,
        "similarity_percentage": 85
      }
    ],
    "pagination": { ... },
    "search_metadata": {
      "threshold": 0.5,
      "query_features_dimension": 1280
    }
  }
}
```

### Differences from Alibaba

| Feature | Alibaba.com | Our Implementation |
|---------|-------------|-------------------|
| Model | VGG/ResNet/Transformer | MobileNet v2 (lighter, faster) |
| Vector DB | AnalyticDB PostgreSQL | PostgreSQL JSONB |
| ANN Search | Specialized vector search | Cosine similarity |
| Scale | Millions of products | Optimized for thousands |

### Future Enhancements (Alibaba-level)

1. **Upgrade to ResNet/EfficientNet**
   - Better accuracy for product images
   - 2048-dimensional vectors

2. **PostgreSQL pgvector Extension**
   - Native vector similarity search
   - Faster ANN queries
   - Better indexing

3. **Caching Layer**
   - Redis for similarity results
   - Cache popular searches

4. **Batch Embedding Generation**
   - Background jobs for processing
   - Queue system for large datasets

## Testing

Test the implementation:
```bash
# Upload image
curl -X POST http://localhost:3000/api/v1/products/search-by-image \
  -F "image=@test-image.jpg" \
  -F "threshold=0.5"

# Or use URL
curl -X POST http://localhost:3000/api/v1/products/search-by-image \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/image.jpg"}'
```

## References

- [Alibaba Cloud: Building Image-Based Search System](https://www.alibabacloud.com/help/en/analyticdb/analyticdb-for-postgresql/user-guide/case-build-an-image-based-search-system)
- [Shopping with Your Camera: Visual Image Search at Alibaba](https://medium.com/coinmonks/shopping-with-your-camera-visual-image-search-meets-e-commerce-at-alibaba-8551925746d0)

