/**
 * Embedding Precomputation Service
 * Precomputes embeddings for all product images on server startup
 * This ensures fast image search without real-time computation
 */

import { getDatabase } from '../config/database';
import pythonImageService from './pythonImageService';
import imageSimilarityService from './imageSimilarity.service';
import axios from 'axios';
import logger from '../utils/logger';

class EmbeddingPrecomputationService {
  private isProcessing = false;
  private modelLoaded = false;

  /**
   * Load the AI model on startup
   * Checks if Python CLIP service is available
   */
  async loadModel(): Promise<boolean> {
    if (this.modelLoaded) {
      return true;
    }

    try {
      logger.info('🔄 Checking Python CLIP service availability...');
      
      // Check if Python service is available
      const isAvailable = pythonImageService.isServiceAvailable();
      
      if (!isAvailable) {
        // Try to reconnect
        logger.info('   - Service not available, attempting to reconnect...');
        const reconnected = await pythonImageService.reconnect();
        
        if (reconnected) {
          logger.info('✅ Successfully reconnected to Python CLIP service');
          this.modelLoaded = true;
          return true;
        } else {
          const status = pythonImageService.getStatus();
          logger.warn('⚠️ Python CLIP service not available - will use fallback methods');
          logger.warn(`   - Service URL: ${status.url}`);
          logger.warn(`   - Circuit breaker state: ${status.circuitBreakerState}`);
          logger.warn(`   - Failures: ${status.failures}`);
          logger.warn('   💡 To start Python service: npm run python:service');
          return false;
        }
      }
      
      if (pythonImageService.isServiceAvailable()) {
        this.modelLoaded = true;
        logger.info('✅ Python CLIP service is available');
        return true;
      } else {
        logger.warn('⚠️ Python CLIP service not available - will use fallback methods');
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      logger.error('❌ Failed to check Python service:', errorMsg);
      if (errorStack && errorStack.length < 300) {
        logger.error('   Stack:', errorStack);
      }
      return false;
    }
  }

  /**
   * Precompute embeddings for all product images without embeddings
   */
  async precomputeEmbeddings(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isProcessing) {
      logger.warn('⚠️ Embedding precomputation already in progress');
      return { success: false, processed: 0, failed: 0, errors: ['Already processing'] };
    }

    this.isProcessing = true;
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      logger.info('🔄 Starting embedding precomputation for product images...');

      const db = getDatabase();

      // First, check total number of product images
      const totalImagesCount = await db('product_images')
        .join('products', 'product_images.product_id', 'products.id')
        .where('products.status', 'active')
        .count('product_images.id as total')
        .first();
      
      const totalImagesInDb = parseInt(totalImagesCount?.total as string || '0', 10);
      logger.info(`📊 Total active product images in database: ${totalImagesInDb}`);

      if (totalImagesInDb === 0) {
        logger.warn('⚠️ No product images found in database');
        logger.warn('   - Add product images first before generating embeddings');
        this.isProcessing = false;
        return { success: true, processed: 0, failed: 0, errors: ['No product images in database'] };
      }

      // Get all product images without embeddings or with null/empty embeddings
      // Handle both vector and jsonb types - use raw SQL for better type handling
      const imagesWithoutEmbeddings = await db.raw(`
        SELECT 
          pi.id,
          pi.image_url,
          pi.product_id
        FROM product_images pi
        INNER JOIN products p ON pi.product_id = p.id
        WHERE p.status = 'active'
          AND (
            pi.image_embedding IS NULL
            OR pi.image_embedding::text = '[]'
            OR pi.image_embedding::text = 'null'
            OR pi.image_embedding::text = ''
            OR LENGTH(pi.image_embedding::text) < 10
          )
      `);

      const imagesArray = imagesWithoutEmbeddings.rows || imagesWithoutEmbeddings || [];
      const totalImages = Array.isArray(imagesArray) ? imagesArray.length : 0;

      if (totalImages === 0) {
        logger.info('✅ All product images already have embeddings');
        this.isProcessing = false;
        return { success: true, processed: 0, failed: 0, errors: [] };
      }

      logger.info(`📊 Found ${totalImages} product images without embeddings (out of ${totalImagesInDb} total)`);

      // Process images in batches to avoid memory issues
      const batchSize = 5;
      for (let i = 0; i < totalImages; i += batchSize) {
        const batch = imagesArray.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (image: any) => {
            try {
              // Download image
              const response = await axios.get(image.image_url, {
                responseType: 'arraybuffer',
                timeout: 10000,
                maxContentLength: 10 * 1024 * 1024
              });
              const imageBuffer = Buffer.from(response.data);

              // Extract features using Python CLIP service (industry standard)
              let embedding: number[] | null = null;
              
              // Try Python service first
              if (pythonImageService.isServiceAvailable()) {
                try {
                  embedding = await pythonImageService.extractFeaturesFromBuffer(imageBuffer);
                  logger.debug(`✅ Python CLIP service extracted features for image ${image.id}`);
                } catch (pythonError) {
                  const pythonErrorMsg = pythonError instanceof Error ? pythonError.message : String(pythonError);
                  logger.warn(`⚠️ Python service failed for image ${image.id}: ${pythonErrorMsg}`);
                  logger.warn(`   - Falling back to TensorFlow.js/ONNX for this image`);
                  // Continue to fallback below
                }
              }
              
              // Fallback to imageSimilarityService if Python service unavailable or failed
              if (!embedding) {
                try {
                  embedding = await imageSimilarityService.extractFeaturesFromBuffer(imageBuffer);
                  logger.debug(`✅ Fallback method extracted features for image ${image.id}`);
                } catch (fallbackError) {
                  const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                  throw new Error(`Both Python service and fallback methods failed: ${fallbackErrorMsg}`);
                }
              }
              
              if (!embedding || embedding.length === 0) {
                throw new Error('Feature extraction returned empty embedding');
              }

              // Update database - store as vector if pgvector is enabled, otherwise as JSONB
              // Try to store as vector first
              try {
                const vectorString = `[${embedding.join(',')}]`;
                await db.raw(`
                  UPDATE product_images 
                  SET image_embedding = $1::vector, updated_at = NOW()
                  WHERE id = $2
                `, [vectorString, image.id]);
              } catch (vectorError) {
                // Fallback to JSONB if vector type not available
                await db('product_images')
                  .where('id', image.id)
                  .update({
                    image_embedding: JSON.stringify(embedding),
                    updated_at: db.fn.now()
                  });
              }

              processed++;
              
              if (processed % 10 === 0) {
                logger.info(`   Progress: ${processed}/${totalImages} images processed`);
              }
            } catch (error) {
              failed++;
              const errorMsg = error instanceof Error ? error.message : String(error);
              errors.push(`Image ${image.id}: ${errorMsg}`);
              logger.warn(`⚠️ Failed to process image ${image.id}: ${errorMsg}`);
            }
          })
        );
      }

      logger.info(`✅ Embedding precomputation complete: ${processed} processed, ${failed} failed`);
      
      if (errors.length > 0 && errors.length <= 10) {
        logger.warn('⚠️ Some errors occurred:', errors);
      } else if (errors.length > 10) {
        logger.warn(`⚠️ ${errors.length} errors occurred (showing first 10):`, errors.slice(0, 10));
      }

      this.isProcessing = false;
      return { success: true, processed, failed, errors };
    } catch (error) {
      this.isProcessing = false;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      
      logger.error('❌ Embedding precomputation failed:', errorMsg);
      if (errorStack && errorStack.length < 500) {
        logger.error('   Stack trace:', errorStack);
      }
      
      // Provide helpful error message
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection refused')) {
        logger.error('   💡 The Python CLIP service is not running.');
        logger.error('      Start it with: npm run python:service');
        logger.error('      Or manually: cd python-service && python main.py');
      } else if (errorMsg.includes('No AI model available')) {
        logger.error('   💡 No AI model is available for feature extraction.');
        logger.error('      Ensure either:');
        logger.error('      1. Python CLIP service is running, OR');
        logger.error('      2. TensorFlow.js/ONNX models are properly installed');
      }
      
      return { 
        success: false, 
        processed, 
        failed, 
        errors: [errorMsg, ...errors] 
      };
    }
  }

  /**
   * Recompute embeddings for all images (force update)
   */
  async recomputeAllEmbeddings(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
  }> {
    logger.info('🔄 Starting full embedding recomputation...');
    
    const db = getDatabase();
    
    // Clear all existing embeddings
    await db('product_images').update({
      image_embedding: null,
      updated_at: db.fn.now()
    });

    // Recompute all
    return await this.precomputeEmbeddings();
  }
}

export default new EmbeddingPrecomputationService();

