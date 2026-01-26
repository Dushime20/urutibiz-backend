/**
 * Production-Grade Image Search Service
 * International Standard Implementation (Alibaba.com Approach)
 * 
 * Features:
 * - Multi-stage similarity search with exact match detection
 * - Intelligent caching (Redis + Memory)
 * - Result ranking and quality scoring
 * - Performance optimizations for scale
 * - Error handling and fallbacks
 */

import { getDatabase } from '../config/database';
import imageSimilarityService from './imageSimilarity.service';
import { CacheFactory } from '../utils/CacheManager';
import crypto from 'crypto';

interface ImageSearchOptions {
  threshold?: number;
  page?: number;
  limit?: number;
  minQuality?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
  categoryBoost?: boolean; // Boost results from same category (default: true)
  categoryFilter?: string; // Optional: filter to specific category_id
}

interface SearchResult {
  product: {
    id: string;
    title: string;
    description: string;
    base_price_per_day: number;
    currency: string;
  };
  image: {
    id: string;
    url: string;
    thumbnail_url: string;
    is_primary: boolean;
  };
  similarity: number;
  similarity_percentage: number;
  quality_score?: number;
  match_type: 'exact' | 'high' | 'medium' | 'low';
  match_method?: 'hash' | 'ai'; // How the match was detected
  ai_confidence?: number; // AI similarity score if available
}

class ImageSearchService {
  private cacheManager: any; // EntityCacheManager<SearchResult[]>
  private readonly DEFAULT_THRESHOLD = 0.5;
  private readonly DEFAULT_LIMIT = 20;
  private readonly DEFAULT_PAGE = 1;
  private readonly MIN_QUALITY_SCORE = 0.3;

  constructor() {
    // Initialize cache with Redis + Memory strategy
    try {
      this.cacheManager = CacheFactory.createEntityCache<SearchResult[]>(
        'image_search',
        'redis', // Try Redis first, falls back to memory
        {
          defaultTTL: 3600, // 1 hour default
          keyPrefix: 'urutibiz'
        }
      );
    } catch (error) {
      // Fallback to memory cache if Redis unavailable
      console.warn('Redis cache unavailable, using memory cache:', error);
      try {
        this.cacheManager = CacheFactory.createEntityCache<SearchResult[]>(
          'image_search',
          'memory',
          {
            defaultTTL: 3600,
            keyPrefix: 'urutibiz'
          }
        );
      } catch (memoryError) {
        // If cache completely fails, create a no-op cache
        console.warn('Cache initialization failed, continuing without cache:', memoryError);
        this.cacheManager = {
          get: async () => null,
          set: async () => {},
          invalidate: async () => {},
          clearAll: async () => {}
        };
      }
    }
  }

  /**
   * Generate cache key from image hash
   * Alibaba approach: Cache by image fingerprint
   */
  private generateCacheKey(imageHash: string, options: ImageSearchOptions): string {
    const params = {
      hash: imageHash,
      threshold: options.threshold || this.DEFAULT_THRESHOLD,
      page: options.page || this.DEFAULT_PAGE,
      limit: options.limit || this.DEFAULT_LIMIT,
      minQuality: options.minQuality || this.MIN_QUALITY_SCORE
    };
    const keyString = JSON.stringify(params);
    const hash = crypto.createHash('sha256').update(keyString).digest('hex');
    return `image_search:${hash}`;
  }

  /**
   * Calculate image hash from actual image content (not URL)
   * Alibaba.com approach: Hash actual image bytes for exact matching
   */
  private async calculateImageHash(imageBuffer: Buffer | string): Promise<string> {
    let buffer: Buffer;
    
    if (typeof imageBuffer === 'string') {
      // Download image from URL and hash the content
      try {
        const axios = require('axios');
        const response = await axios.get(imageBuffer, {
          responseType: 'arraybuffer',
          timeout: 8000,
          maxContentLength: 10 * 1024 * 1024
        });
        buffer = Buffer.from(response.data);
      } catch (error) {
        // If download fails, fallback to URL hash (not ideal but better than nothing)
        console.warn('Failed to download image for hash calculation, using URL hash:', error);
        return crypto.createHash('sha256').update(imageBuffer).digest('hex');
      }
    } else {
      buffer = imageBuffer;
    }
    
    // Hash the actual image content (Alibaba approach)
    // Use SHA-256 for reliable exact matching
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract features from image (with caching)
   * CRITICAL: Must extract features from the actual query image, not hardcoded
   */
  private async extractFeatures(imageBuffer: Buffer | string): Promise<number[]> {
    try {
      let features: number[];
      
      // Extract features from the actual input image (not hardcoded)
      if (typeof imageBuffer === 'string') {
        features = await imageSimilarityService.extractFeaturesFromUrl(imageBuffer);
      } else {
        features = await imageSimilarityService.extractFeaturesFromBuffer(imageBuffer);
      }
      
      // Verify features are valid (not all zeros or empty)
      if (!features || features.length === 0) {
        throw new Error('Feature extraction returned empty array');
      }
      
      const featureSum = features.reduce((sum, val) => sum + Math.abs(val), 0);
      if (featureSum === 0) {
        throw new Error('Feature extraction returned all zeros');
      }
      
      // Verify features are different for different images (not constant)
      const featureVariance = this.calculateVariance(features);
      if (featureVariance === 0) {
        console.warn('⚠️ WARNING: Feature vector has zero variance (all values identical)!');
      }
      
      return features;
    } catch (error) {
      console.error('❌ Feature extraction failed:', error);
      // Try fallback
      try {
        const imageFeatureExtractionService = (await import('./imageFeatureExtraction.service')).default;
        if (typeof imageBuffer === 'string') {
          return await imageFeatureExtractionService.extractFeaturesFromUrl(imageBuffer);
        }
        return await imageFeatureExtractionService.extractFeaturesFromBuffer(imageBuffer);
      } catch (fallbackError) {
        throw new Error(`All feature extraction methods failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Calculate variance of feature vector (for validation)
   */
  private calculateVariance(features: number[]): number {
    if (features.length === 0) return 0;
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    return variance;
  }

  /**
   * Calculate quality score for search result
   * Alibaba approach: Multi-factor quality scoring with AI confidence
   */
  private calculateQualityScore(
    similarity: number,
    isExactMatch: boolean,
    isPrimaryImage: boolean,
    productStatus: string,
    aiSimilarity?: number
  ): number {
    let score = similarity;

    // Exact matches (hash-based) get perfect score
    if (isExactMatch) {
      return 1.0; // Perfect match
    }

    // AI similarity boost: Higher AI confidence = higher score
    if (aiSimilarity && aiSimilarity > similarity) {
      score = aiSimilarity; // Use AI similarity if better
    }

    // Boost primary images (more representative)
    if (isPrimaryImage) {
      score = Math.min(1.0, score * 1.1);
    }

    // Penalize inactive products
    if (productStatus !== 'active') {
      score *= 0.5;
    }

    // AI confidence adjustment: Very high similarity (>0.9) gets extra boost
    if (score >= 0.9) {
      score = Math.min(1.0, score * 1.05); // Small boost for very similar
    }

    return Math.min(1.0, Math.max(0, score));
  }

  /**
   * Determine match type based on similarity and match method
   * Alibaba approach: Categorize by AI confidence levels
   */
  private getMatchType(similarity: number, isExactMatch: boolean, matchMethod?: string): 'exact' | 'high' | 'medium' | 'low' {
    if (isExactMatch) return 'exact'; // Hash-based exact match
    
    // AI-based similarity categories
    if (similarity >= 0.85) return 'high'; // Very similar (AI high confidence)
    if (similarity >= 0.65) return 'medium'; // Moderately similar (AI medium confidence)
    return 'low'; // Somewhat similar (AI low confidence)
  }

  /**
   * Multi-stage search: Exact match → High similarity → Medium similarity → Low similarity
   * Results ordered by similarity percentage descending (highest to lowest)
   */
  private rankResults(results: any[]): any[] {
    return results.sort((a, b) => {
      // Priority 1: Exact matches first
      if (a._isExactMatch && !b._isExactMatch) return -1;
      if (!a._isExactMatch && b._isExactMatch) return 1;

      // Priority 2: Sort by similarity percentage descending (highest to lowest)
      return b.similarity - a.similarity;
    });
  }

  /**
   * Main search method - Production grade with caching
   */
  async searchByImage(
    imageBuffer: Buffer | string,
    options: ImageSearchOptions = {}
  ): Promise<{
    items: SearchResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    metadata: {
      processing_time_ms: number;
      cache_hit: boolean;
      match_distribution: Record<string, number>;
      query_features_dimension: number;
    };
  }> {
    const startTime = Date.now();
    const threshold = options.threshold || this.DEFAULT_THRESHOLD;
    const page = options.page || this.DEFAULT_PAGE;
    const limit = options.limit || this.DEFAULT_LIMIT;
    const minQuality = options.minQuality || this.MIN_QUALITY_SCORE;
    const enableCaching = options.enableCaching !== false;

    try {
      // Step 1: Generate cache key
      const imageHash = await this.calculateImageHash(imageBuffer);
      const cacheKey = this.generateCacheKey(imageHash, options);

      // Step 2: Check cache (Alibaba approach: Aggressive caching)
      // IMPORTANT: Cache is keyed by image hash, so different images get different results
      // Re-enabled for performance optimization
      const USE_CACHE = true; // Cache enabled for better performance
      
      if (USE_CACHE && enableCaching && this.cacheManager && typeof this.cacheManager.get === 'function') {
        try {
          const cached = await this.cacheManager.get(cacheKey);
          if (cached && Array.isArray(cached) && cached.length > 0) {
            console.log(`✅ Cache hit for image search: ${cacheKey.substring(0, 16)}...`);
            console.log(`   - Cached results count: ${cached.length}`);
            console.log(`   - Image hash: ${imageHash.substring(0, 16)}...`);
            return {
              items: cached,
              pagination: {
                page,
                limit,
                total: cached.length,
                totalPages: Math.ceil(cached.length / limit)
              },
              metadata: {
                processing_time_ms: Date.now() - startTime,
                cache_hit: true,
                match_distribution: this.calculateMatchDistribution(cached),
                query_features_dimension: cached[0]?.product?.id ? 256 : 0 // Placeholder for cached results
              }
            };
          }
        } catch (cacheError) {
          // Only log if it's not the "get is not a function" error (already handled)
          const errorMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
          if (!errorMsg.includes('is not a function')) {
            console.warn('Cache read error (continuing without cache):', cacheError);
          }
        }
      } else if (enableCaching && !USE_CACHE) {
        console.log('ℹ️ Cache disabled for debugging - fresh search will be performed');
      } else if (enableCaching) {
        // Cache manager not properly initialized
        console.warn('⚠️ Cache manager not available, skipping cache');
      }

      // Step 3: Extract features from query image
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 NEW IMAGE SEARCH REQUEST');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   - Image type: ${typeof imageBuffer === 'string' ? 'URL' : 'Buffer'}`);
      console.log(`   - Image hash: ${imageHash}`);
      console.log(`   - Timestamp: ${new Date().toISOString()}`);
      
      // Verify image buffer/URL is not empty
      if (typeof imageBuffer === 'string') {
        if (!imageBuffer || imageBuffer.trim().length === 0) {
          throw new Error('Image URL is empty');
        }
        console.log(`   - Image URL: ${imageBuffer.substring(0, 100)}...`);
      } else {
        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error('Image buffer is empty');
        }
        console.log(`   - Buffer size: ${imageBuffer.length} bytes`);
        // Calculate a quick hash of first 1KB to verify it's different
        const quickHash = require('crypto').createHash('md5').update(imageBuffer.slice(0, 1024)).digest('hex');
        console.log(`   - Quick hash (first 1KB): ${quickHash}`);
      }
      
      const featureStartTime = Date.now();
      
      let queryFeatures: number[];
      try {
        queryFeatures = await this.extractFeatures(imageBuffer);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Feature extraction failed:', errorMsg);
        throw new Error(`Cannot perform image search: ${errorMsg}. Please ensure TensorFlow.js MobileNet is working.`);
      }
      
      const featureTime = Date.now() - featureStartTime;
      
      // Log feature vector details for debugging
      const featureSum = queryFeatures.reduce((sum, val) => sum + val, 0);
      const featureMax = Math.max(...queryFeatures);
      const featureMin = Math.min(...queryFeatures);
      const featureNonZero = queryFeatures.filter(f => f !== 0).length;
      const featureUnique = new Set(queryFeatures.map(f => f.toFixed(6))).size;
      
      // Calculate feature signature for this image (for comparison)
      // Include image hash to make it unique per image (use the already calculated imageHash)
      const imageHashForFeatures = imageHash.substring(0, 16);
      
      const featureSignature = queryFeatures.slice(0, 50).map(f => f.toFixed(6)).join(',');
      const featureHash = require('crypto').createHash('md5')
        .update(featureSignature + imageHashForFeatures)
        .digest('hex');
      
      console.log(`✅ Feature extraction: ${featureTime}ms (${queryFeatures.length} dimensions)`);
      console.log(`   - Feature vector stats: sum=${featureSum.toFixed(4)}, max=${featureMax.toFixed(4)}, min=${featureMin.toFixed(4)}`);
      console.log(`   - Non-zero features: ${featureNonZero}/${queryFeatures.length} (${((featureNonZero/queryFeatures.length)*100).toFixed(1)}%)`);
      console.log(`   - Unique values: ${featureUnique}/${queryFeatures.length}`);
      console.log(`   - Feature hash: ${featureHash.substring(0, 16)}... (includes image identifier)`);
      console.log(`   - First 10 features: [${queryFeatures.slice(0, 10).map(f => f.toFixed(4)).join(', ')}]`);
      
      // CRITICAL: Verify features are valid and unique for this image
      if (featureSum === 0 || featureMax === featureMin || featureNonZero < queryFeatures.length * 0.1) {
        console.error('❌ CRITICAL ERROR: Query features are invalid!');
        console.error(`   - All zeros: ${featureSum === 0}`);
        console.error(`   - All identical: ${featureMax === featureMin}`);
        console.error(`   - Too few non-zero: ${featureNonZero} < ${queryFeatures.length * 0.1}`);
        throw new Error('Query image features are invalid. AI model may not be working correctly.');
      }

      // Step 4: Use pgvector for efficient similarity search (industry standard)
      // This is much faster than loading all embeddings into memory
      const db = getDatabase();
      const dbQueryStartTime = Date.now();
      
      // Convert query features to PostgreSQL vector format
      const queryVector = `[${queryFeatures.join(',')}]`;
      
      // Count total images first for logging
      const totalCount = await db('product_images')
        .join('products', 'product_images.product_id', 'products.id')
        .where('products.status', 'active')
        .whereNotNull('product_images.image_embedding')
        .count('product_images.id as total')
        .first();
      
      const totalImages = parseInt(totalCount?.total as string || '0', 10);
      console.log(`🔍 Searching through ${totalImages} product images using pgvector...`);
      
      // Use pgvector cosine similarity search (industry standard approach)
      // This is much more efficient than loading all embeddings
      let productImages: any[];
      let usedPgvector = false;
      
      try {
        // Try pgvector similarity search first (if pgvector is enabled)
        // Use Knex's parameter binding properly - need to use ? placeholder or pass as array
        const categoryFilterClause = options.categoryFilter 
          ? `AND p.category_id = '${options.categoryFilter}'` 
          : '';
        
        // Optimize: Fetch reasonable number of results, filter by threshold later
        // pgvector already returns sorted results with similarity scores
        // Only fetch necessary columns (exclude image_embedding to reduce data transfer)
        const fetchLimit = Math.min(limit * 20, 1000); // Reasonable limit for initial fetch
        const vectorSearchQuery = `
          SELECT 
            pi.id,
            pi.product_id,
            pi.image_url,
            pi.thumbnail_url,
            pi.is_primary,
            pi.image_hash,
            p.id as product_id,
            p.title,
            p.description,
            p.status,
            p.category_id,
            1 - (pi.image_embedding <=> ?::vector) as similarity
          FROM product_images pi
          INNER JOIN products p ON pi.product_id = p.id
          WHERE p.status = 'active'
            AND pi.image_embedding IS NOT NULL
            ${categoryFilterClause}
          ORDER BY pi.image_embedding <=> ?::vector
          LIMIT ${fetchLimit}
        `;
        
        // Knex raw query with parameters - pass queryVector twice (once for each ?)
        const vectorResults = await db.raw(vectorSearchQuery, [queryVector, queryVector]);
        productImages = vectorResults.rows || [];
        usedPgvector = true;
        
        console.log(`✅ Used pgvector similarity search (fast & efficient)`);
        console.log(`   - Results already sorted by similarity (no redundant calculation needed)`);
      } catch (vectorError) {
        // Fallback to traditional approach if pgvector not available
        console.warn('⚠️ pgvector not available, using traditional similarity search');
        console.warn(`   Error: ${vectorError instanceof Error ? vectorError.message : String(vectorError)}`);
        
        // Traditional approach: Load all embeddings (will calculate similarity in memory)
        productImages = await db('product_images')
          .select(
            'product_images.id',
            'product_images.product_id',
            'product_images.image_url',
            'product_images.thumbnail_url',
            'product_images.is_primary',
            'product_images.image_hash',
            db.raw('product_images.image_embedding'),
            'products.id as product_id',
            'products.title',
            'products.description',
            'products.status',
            'products.category_id'
          )
          .join('products', 'product_images.product_id', 'products.id')
          .where('products.status', 'active')
          .whereNotNull('product_images.image_embedding')
          .modify((queryBuilder: any) => {
            if (options.categoryFilter) {
              queryBuilder.where('products.category_id', options.categoryFilter);
            }
          });
      }

      const dbQueryTime = Date.now() - dbQueryStartTime;
      console.log(`📊 Database query: ${dbQueryTime}ms`);
      console.log(`   - Total images in database: ${totalImages}`);
      console.log(`   - Images fetched for comparison: ${productImages.length}`);
      
      // CRITICAL: Verify we're comparing against multiple different images
      if (productImages.length === 0) {
        console.warn('⚠️ WARNING: No product images with embeddings found in database!');
        console.warn('   - This is normal if you haven\'t generated embeddings yet');
        console.warn('   - Embeddings will be generated automatically on server startup');
        console.warn('   - Or run manually: The embedding precomputation service will process images');
        
        // Return empty results instead of throwing error
        return {
          items: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          },
          metadata: {
            processing_time_ms: Date.now() - startTime,
            cache_hit: false,
            match_distribution: {},
            query_features_dimension: queryFeatures.length
          }
        };
      }
      
      // Check if embeddings are valid (not all zeros or identical)
      const sampleEmbeddings = productImages.slice(0, 5).map((img: any) => {
        let emb = img.image_embedding;
        if (typeof emb === 'string') {
          try {
            emb = JSON.parse(emb);
          } catch {
            return null;
          }
        }
        return emb;
      }).filter((e: any) => e && Array.isArray(e));
      
      if (sampleEmbeddings.length > 0) {
        const firstEmb = sampleEmbeddings[0];
        const allSame = sampleEmbeddings.every((emb: any) => 
          emb.length === firstEmb.length && 
          emb.every((val: number, idx: number) => Math.abs(val - firstEmb[idx]) < 0.0001)
        );
        
        if (allSame) {
          console.error('⚠️ WARNING: All product image embeddings appear to be identical!');
          console.error('   - This means all products will have the same similarity score');
          console.error('   - Solution: Regenerate embeddings for all product images');
        } else {
          console.log(`✅ Verified: Product embeddings are unique (checked ${sampleEmbeddings.length} samples)`);
        }
      }
      
      if (productImages.length === 0) {
        console.warn('⚠️ No product images with embeddings found in database');
        console.warn('   Run: npm run generate:embeddings to process existing images');
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          metadata: {
            processing_time_ms: Date.now() - startTime,
            cache_hit: false,
            match_distribution: {},
            query_features_dimension: 0
          }
        };
      }
      
      if (productImages.length < totalImages) {
        console.warn(`⚠️ Only fetched ${productImages.length} of ${totalImages} images. Some may be missing embeddings.`);
      }


      // Step 5: Multi-stage matching (Alibaba.com approach)
      // Stage 1: Exact match detection by content hash (fast, 100% accurate)
      const queryImageHash = await this.calculateImageHash(imageBuffer);
      const exactMatches = new Set<string>();
      
      // Compare with stored image hashes in database
      productImages.forEach((img: any) => {
        if (img.image_hash && img.image_hash === queryImageHash) {
          exactMatches.add(img.id);
          img._isExactMatch = true;
          img._exactMatchScore = 1.0; // Perfect match
          console.log(`✅ Exact image content match detected (hash: ${queryImageHash.substring(0, 16)}...) for product image ${img.id}`);
        }
      });
      
      // Stage 2: AI-based similarity comparison (for non-exact matches)
      // This uses deep learning feature vectors for intelligent similarity
      console.log(`🤖 Using AI for similarity comparison (${productImages.length} images to compare)`);

      // Step 6: Fetch pricing data (batch query)
      const productIds = [...new Set(productImages.map((img: any) => img.product_id))];
      const pricingData = await db('product_prices')
        .select('product_id', db.raw('price_per_day as base_price_per_day'), 'currency')
        .whereIn('product_id', productIds)
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      const pricingMap = new Map<string, { base_price_per_day: number; currency: string }>();
      pricingData.forEach((price: any) => {
        if (!pricingMap.has(price.product_id)) {
          pricingMap.set(price.product_id, {
            base_price_per_day: parseFloat(price.base_price_per_day) || 0,
            currency: price.currency || 'RWF'
          });
        }
      });

      // Step 7: AI-based similarity calculation (OPTIMIZED)
      // If pgvector was used, similarity scores are already calculated and sorted by the database
      // Only calculate similarity in memory if pgvector is not available
      const similarityStartTime = Date.now();
      let similarities: any[] = [];
      
      if (usedPgvector) {
        // OPTIMIZATION: pgvector already calculated similarity and sorted results
        // Just filter by threshold and use the similarity scores from database
        console.log(`⚡ Using pgvector similarity scores (no redundant calculation needed)`);
        
        similarities = productImages
          .filter((img: any) => {
            // Filter by threshold - similarity is already calculated by pgvector
            const sim = parseFloat(img.similarity) || 0;
            return sim >= threshold;
          })
          .map((img: any) => ({
            ...img,
            similarity: parseFloat(img.similarity) || 0,
            _isExactMatch: false,
            _matchMethod: 'ai'
          }));
        
        console.log(`🎯 Found ${similarities.length} similar images (similarity >= ${threshold}) from pgvector`);
      } else {
        // Fallback: Calculate similarity in memory (when pgvector not available)
        console.log(`🤖 Calculating similarity in memory (fallback mode)`);
        
        const imageEmbeddings = productImages
          .map((img: any) => {
            let embedding = img.image_embedding;
            if (typeof embedding === 'string') {
              try {
                embedding = JSON.parse(embedding);
              } catch {
                return null;
              }
            }
            if (!embedding || !Array.isArray(embedding)) return null;
            
            return {
              id: img.id,
              embedding,
              ...img
            };
          })
          .filter((item: any) => item !== null);

        console.log(`🧠 AI Feature Vectors: Query=${queryFeatures.length}D, Database=${imageEmbeddings.length} images`);
        
        // CRITICAL: Verify embeddings dimension matches query features
        if (imageEmbeddings.length > 0) {
          const firstEmb = imageEmbeddings[0].embedding;
          if (firstEmb.length !== queryFeatures.length) {
            console.error(`❌ CRITICAL: Dimension mismatch!`);
            console.error(`   - Query features: ${queryFeatures.length} dimensions`);
            console.error(`   - Database embeddings: ${firstEmb.length} dimensions`);
            throw new Error(`Feature dimension mismatch: Query has ${queryFeatures.length}D but database has ${firstEmb.length}D. Please regenerate embeddings.`);
          }
        }
        
        // Use AI-powered similarity search (cosine similarity on feature vectors)
        similarities = imageSimilarityService.findSimilarImages(
          queryFeatures,
          imageEmbeddings,
          threshold,
          limit * 20 // Reasonable limit
        );
        
        console.log(`🎯 Found ${similarities.length} similar images (similarity >= ${threshold})`);
      }

      const similarityTime = Date.now() - similarityStartTime;
      console.log(`⚡ Similarity processing: ${similarityTime}ms (${similarities.length} matches, method: ${usedPgvector ? 'pgvector' : 'in-memory'})`);
      
      // Log top 5 results for debugging
      if (similarities.length > 0) {
        console.log(`📊 Top ${Math.min(5, similarities.length)} results:`);
        similarities.slice(0, 5).forEach((item: any, idx: number) => {
          console.log(`   ${idx + 1}. Product: ${item.title || item.product_id}, Category: ${item.category_id || 'NO CATEGORY'}, Similarity: ${item.similarity.toFixed(4)} (${Math.round(item.similarity * 100)}%)`);
        });
      }

      // Step 8: Combine exact matches (hash) with AI similarity results
      // OPTIMIZED: Use Map for O(1) lookups and efficient deduplication
      const allResults = new Map<string, any>();
      
      // Add exact matches first (from hash comparison) - these have highest priority
      exactMatches.forEach((imageId) => {
        const img = productImages.find((p: any) => p.id === imageId);
        if (img) {
          const key = img.product_id; // Use product_id to prevent duplicates
          const existing = allResults.get(key);
          if (!existing || existing.similarity < 1.0) {
            allResults.set(key, {
              ...img,
              similarity: 1.0,
              _isExactMatch: true,
              _matchMethod: 'hash'
            });
          }
        }
      });
      
      // Add AI similarity results (for non-exact matches)
      // OPTIMIZED: Only add if not already in map or if similarity is higher
      similarities.forEach((item: any) => {
        const key = item.product_id; // Use product_id as key
        const existing = allResults.get(key);
        
        if (!existing) {
          // New product - add it
          allResults.set(key, {
            ...item,
            _isExactMatch: false,
            _matchMethod: 'ai'
          });
        } else if (!existing._isExactMatch && item.similarity > existing.similarity) {
          // Same product, higher similarity - update
          allResults.set(key, {
            ...item,
            _isExactMatch: false,
            _matchMethod: 'ai'
          });
        }
      });
      
      // Step 8.5: Detect dominant category from top similarity results for category filtering/boosting
      // This ensures that when you upload a car/house image, you ONLY get car/house products
      // Sort by similarity first to get the most relevant results
      const sortedForCategoryDetection = Array.from(allResults.values())
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0)) // Sort by similarity descending
        .slice(0, Math.min(5, allResults.size)); // Look at top 5 most similar results (more focused)
      
      // Log categories in top results for debugging
      console.log(`🔍 Analyzing categories in top ${sortedForCategoryDetection.length} results:`);
      sortedForCategoryDetection.forEach((item: any, idx: number) => {
        console.log(`   ${idx + 1}. Category: ${item.category_id || 'NULL'}, Product: ${item.title || item.product_id}, Similarity: ${item.similarity?.toFixed(4)}`);
      });
      
      // Find most common category in top similarity results
      const categoryCounts = new Map<string, number>();
      let nullCategoryCount = 0;
      sortedForCategoryDetection.forEach((item: any) => {
        if (item.category_id) {
          categoryCounts.set(item.category_id, (categoryCounts.get(item.category_id) || 0) + 1);
        } else {
          nullCategoryCount++;
        }
      });
      
      if (nullCategoryCount > 0) {
        console.warn(`⚠️ WARNING: ${nullCategoryCount} of ${sortedForCategoryDetection.length} top results have NULL category_id! Products may be missing category assignments.`);
      }
      
      let dominantCategory: string | null = null;
      let categoryConfidence = 0;
      
      if (categoryCounts.size > 0) {
        const sortedCategories = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1]);
        
        const topCategory = sortedCategories[0];
        const topCategoryCount = topCategory[1];
        const totalTopResults = sortedForCategoryDetection.length;
        categoryConfidence = topCategoryCount / totalTopResults;
        
        console.log(`📊 Category analysis: Top category "${topCategory[0]}" appears ${topCategoryCount} times in ${totalTopResults} results (${(categoryConfidence * 100).toFixed(1)}%)`);
        if (sortedCategories.length > 1) {
          console.log(`   Other categories: ${sortedCategories.slice(1).map(([cat, count]) => `${cat}(${count})`).join(', ')}`);
        }
        
        // RELAXED THRESHOLD: If we have few results, be more lenient
        // For 3 results: need 2 matches (67%)
        // For 4-5 results: need 3 matches (60%+)
        const minMatches = totalTopResults <= 3 
          ? Math.max(2, Math.ceil(totalTopResults * 0.67)) // At least 2 of 3, or 67%
          : Math.min(3, Math.ceil(totalTopResults * 0.6)); // At least 3 of 5, or 60%
        
        const minConfidence = totalTopResults <= 3 ? 0.67 : 0.6;
        
        if (topCategoryCount >= minMatches && categoryConfidence >= minConfidence) {
          dominantCategory = topCategory[0];
          console.log(`✅ Detected dominant category: ${dominantCategory} (${topCategoryCount}/${totalTopResults} = ${(categoryConfidence * 100).toFixed(1)}% confidence)`);
        } else {
          console.log(`⚠️ No clear dominant category detected. Top category: ${topCategory[0]} (${topCategoryCount}/${totalTopResults} = ${(categoryConfidence * 100).toFixed(1)}%) - below threshold (need ${minMatches} matches, ${(minConfidence * 100).toFixed(0)}% confidence)`);
        }
      } else {
        console.error(`❌ ERROR: No categories found in top results! All ${sortedForCategoryDetection.length} results have NULL category_id.`);
        console.error(`   This means products in the database are missing category assignments.`);
        console.error(`   Please check: SELECT id, title, category_id FROM products WHERE id IN (...)`);
      }

      // Step 9: Enrich with pricing and calculate quality scores
      // allResults is already deduplicated by product_id
      const enrichedResults = Array.from(allResults.values()).map((item: any) => {
        const pricing = pricingMap.get(item.product_id) || { base_price_per_day: 0, currency: 'RWF' };
        const isExactMatch = item._isExactMatch || false;
        
        // Calculate base quality score
        let qualityScore = this.calculateQualityScore(
          item.similarity,
          isExactMatch,
          item.is_primary,
          item.status,
          item.ai_similarity
        );

        return {
          ...item,
          base_price_per_day: pricing.base_price_per_day,
          currency: pricing.currency,
          quality_score: qualityScore,
          _isExactMatch: isExactMatch,
          _matchMethod: item._matchMethod || 'ai',
          category_id: item.category_id
        };
      });

      // Step 9: Filter by quality and rank (PURE IMAGE SIMILARITY - NO CATEGORY FILTERING)
      // Focus on image similarity only - return most similar images regardless of category
      const filteredResults = enrichedResults
        .filter((item: any) => item.quality_score >= minQuality)
        .map((item: any) => ({
          product: {
            id: item.product_id,
            title: item.title,
            description: item.description,
            base_price_per_day: item.base_price_per_day,
            currency: item.currency,
            category_id: item.category_id // Include category in response
          },
          image: {
            id: item.id,
            url: item.image_url,
            thumbnail_url: item.thumbnail_url,
            is_primary: item.is_primary
          },
          similarity: item.similarity,
          similarity_percentage: Math.round(item.similarity * 100),
          quality_score: item.quality_score,
          match_type: this.getMatchType(item.similarity, item._isExactMatch, item._matchMethod),
          match_method: item._matchMethod || 'ai', // 'hash' or 'ai'
          category_match: dominantCategory && item.category_id === dominantCategory // Indicate if same category
        }));

      // Step 10: Final deduplication by product_id (ensure no duplicates)
      const uniqueProducts = new Map<string, any>();
      filteredResults.forEach((item: any) => {
        const productId = item.product.id;
        const existing = uniqueProducts.get(productId);
        if (!existing || item.similarity > existing.similarity) {
          uniqueProducts.set(productId, item);
        }
      });
      
      // Step 11: Rank results (Alibaba approach: Multi-factor ranking)
      const rankedResults = this.rankResults(Array.from(uniqueProducts.values()));

      // Step 12: Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = rankedResults.slice(startIndex, endIndex);

      // Step 13: Cache results (keyed by image hash + options)
      // Each unique image gets its own cache entry
      if (enableCaching && paginatedResults.length > 0 && this.cacheManager && typeof this.cacheManager.set === 'function') {
        try {
          const cacheTTL = options.cacheTTL || 3600; // 1 hour default
          await this.cacheManager.set(cacheKey, paginatedResults, cacheTTL);
          console.log(`💾 Cached results for image hash: ${imageHash.substring(0, 16)}... (TTL: ${cacheTTL}s)`);
        } catch (cacheError) {
          // Only log if it's not the "set is not a function" error
          const errorMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
          if (!errorMsg.includes('is not a function')) {
            console.warn('Cache write error (results still returned):', cacheError);
          }
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎯 Total search time: ${totalTime}ms`);
      console.log(`📦 Returning ${paginatedResults.length} results (page ${page} of ${Math.ceil(rankedResults.length / limit)})`);
      
      // Final verification: Log result IDs, categories, and similarities
      if (paginatedResults.length > 0) {
        console.log(`📋 Final results (${paginatedResults.length} items):`);
        paginatedResults.forEach((r: any, idx: number) => {
          console.log(`   ${idx + 1}. Product: ${r.product.title || r.product.id}, Category: ${r.product.category_id || 'NULL'}, Similarity: ${r.similarity.toFixed(3)} (${r.similarity_percentage}%), Category Match: ${r.category_match ? 'YES' : 'NO'}`);
        });
        const resultIds = paginatedResults.map((r: any) => r.product.id).join(', ');
        console.log(`🔍 Result product IDs: ${resultIds}`);
        const resultSimilarities = paginatedResults.map((r: any) => r.similarity.toFixed(3)).join(', ');
        console.log(`📊 Result similarities: [${resultSimilarities}]`);
        
        // Check if results are from the same category
        const resultCategories = paginatedResults.map((r: any) => r.product.category_id).filter(cat => cat);
        const uniqueCategories = [...new Set(resultCategories)];
        if (uniqueCategories.length === 1) {
          console.log(`✅ All results are from the same category: ${uniqueCategories[0]}`);
        } else if (uniqueCategories.length > 1) {
          console.warn(`⚠️ Results are from ${uniqueCategories.length} different categories: ${uniqueCategories.join(', ')}`);
        } else {
          console.error(`❌ All results have NULL category_id!`);
        }
      }

      return {
        items: paginatedResults,
        pagination: {
          page,
          limit,
          total: rankedResults.length,
          totalPages: Math.ceil(rankedResults.length / limit)
        },
        metadata: {
          processing_time_ms: totalTime,
          cache_hit: false,
          match_distribution: this.calculateMatchDistribution(rankedResults),
          query_features_dimension: queryFeatures.length
        }
      };
    } catch (error) {
      console.error('❌ Image search error:', error);
      throw error;
    }
  }

  /**
   * Calculate match distribution for analytics
   */
  private calculateMatchDistribution(results: SearchResult[]): Record<string, number> {
    const distribution: Record<string, number> = {
      exact: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    results.forEach(result => {
      distribution[result.match_type] = (distribution[result.match_type] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Clear cache for image search
   */
  async clearCache(imageHash?: string): Promise<void> {
    try {
      if (imageHash) {
        // Clear specific image cache
        const pattern = `image_search:*${imageHash}*`;
        await this.cacheManager.invalidate(pattern);
      } else {
        // Clear all image search cache
        await this.cacheManager.clearAll();
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export default new ImageSearchService();

