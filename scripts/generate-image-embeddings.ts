/**
 * Script to generate image embeddings for existing product images
 * Run this after adding the image_embedding column to populate embeddings for existing images
 * 
 * Usage: ts-node -r tsconfig-paths/register scripts/generate-image-embeddings.ts
 */

import { getDatabase } from '../src/config/database';
import imageSimilarityService from '../src/services/imageSimilarity.service';
import knex from 'knex';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

async function generateEmbeddingsForExistingImages() {
  // Create database connection directly for script
  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urutibiz_db',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
    },
  });
  
  console.log('🔄 Starting image embedding generation for existing product images...\n');
  
  try {
    // Get all product images without embeddings OR without hash
    const imagesWithoutEmbeddings = await db('product_images')
      .select('id', 'image_url', 'product_id', 'image_hash')
      .where((builder) => {
        builder.whereNull('image_embedding')
          .orWhere('image_embedding', '[]')
          .orWhereNull('image_hash');
      })
      .limit(1000); // Process in batches
    
    if (imagesWithoutEmbeddings.length === 0) {
      console.log('✅ All product images already have embeddings and hashes!');
      return;
    }
    
    console.log(`📸 Found ${imagesWithoutEmbeddings.length} images needing processing (embedding or hash)\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process images in batches of 10 to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < imagesWithoutEmbeddings.length; i += batchSize) {
      const batch = imagesWithoutEmbeddings.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, imagesWithoutEmbeddings.length)} of ${imagesWithoutEmbeddings.length})...`);
      
      await Promise.all(
        batch.map(async (image: any) => {
          try {
            // Download image to calculate hash from actual content
            const response = await axios.get(image.image_url, {
              responseType: 'arraybuffer',
              timeout: 30000, // Increased timeout for slow connections
              maxContentLength: 10 * 1024 * 1024
            });
            const imageBuffer = Buffer.from(response.data);
            
            // Calculate SHA-256 hash from actual image content (Alibaba.com approach)
            const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
            
            // Extract features from image buffer
            const embedding = await imageSimilarityService.extractFeaturesFromBuffer(imageBuffer);
            
            // Update database with both embedding and hash
            await db('product_images')
              .where('id', image.id)
              .update({
                image_embedding: JSON.stringify(embedding),
                image_hash: imageHash // Store hash for exact matching
              });
            
            successCount++;
            if (successCount % 10 === 0) {
              process.stdout.write(`\r✅ Processed ${successCount} images (hash + embedding)...`);
            }
          } catch (error) {
            errorCount++;
            console.error(`\n❌ Failed to process image ${image.id} (${image.image_url}):`, error instanceof Error ? error.message : String(error));
          }
        })
      );
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < imagesWithoutEmbeddings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n\n✅ Embedding generation complete!`);
    console.log(`   Success: ${successCount} images`);
    console.log(`   Errors: ${errorCount} images`);
    console.log(`   Total: ${imagesWithoutEmbeddings.length} images`);
    
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

// Run the script
generateEmbeddingsForExistingImages()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

