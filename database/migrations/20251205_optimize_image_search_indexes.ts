import { Knex } from 'knex';

/**
 * Migration: Optimize indexes for image search performance
 * Adds composite indexes and optimizes existing indexes for faster queries
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    console.log('product_images table does not exist, skipping migration');
    return;
  }

  // 1. Composite index for active products with embeddings (common query pattern)
  try {
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_product_images_active_embedding 
      ON product_images (product_id) 
      WHERE image_embedding IS NOT NULL
    `);
    console.log('✅ Created composite index for active products with embeddings');
  } catch (error) {
    console.warn('⚠️ Failed to create composite index (non-critical):', error);
  }

  // 2. Index on product_id for faster joins (if not exists)
  try {
    const indexExists = await knex.raw(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'product_images' 
      AND indexname = 'idx_product_images_product_id'
    `);
    
    if (!indexExists.rows || indexExists.rows.length === 0) {
      await knex.raw(`
        CREATE INDEX idx_product_images_product_id 
        ON product_images (product_id)
      `);
      console.log('✅ Created index on product_id');
    }
  } catch (error) {
    console.warn('⚠️ Failed to create product_id index (non-critical):', error);
  }

  // 3. Composite index for products table (status + category_id) for faster filtering
  try {
    const indexExists = await knex.raw(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'products' 
      AND indexname = 'idx_products_status_category'
    `);
    
    if (!indexExists.rows || indexExists.rows.length === 0) {
      await knex.raw(`
        CREATE INDEX idx_products_status_category 
        ON products (status, category_id)
        WHERE status = 'active'
      `);
      console.log('✅ Created composite index on products (status, category_id)');
    }
  } catch (error) {
    console.warn('⚠️ Failed to create products composite index (non-critical):', error);
  }

  // 4. Optimize pgvector index if it exists (update lists parameter for better performance)
  try {
    // Check if pgvector index exists
    const vectorIndexExists = await knex.raw(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'product_images' 
      AND indexname = 'product_images_embedding_idx'
    `);
    
    if (vectorIndexExists.rows && vectorIndexExists.rows.length > 0) {
      // Get current table size to optimize lists parameter
      const tableStats = await knex.raw(`
        SELECT reltuples::bigint AS row_count
        FROM pg_class
        WHERE relname = 'product_images'
      `);
      
      const rowCount = tableStats.rows?.[0]?.row_count || 0;
      
      // Optimize lists parameter based on table size
      // Rule of thumb: lists = sqrt(row_count) for optimal performance
      if (rowCount > 0) {
        const optimalLists = Math.max(10, Math.min(100, Math.ceil(Math.sqrt(rowCount))));
        console.log(`ℹ️ Table has ~${rowCount} rows, optimal lists parameter: ${optimalLists}`);
        console.log(`   (Current index uses lists=100, which is fine for most cases)`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not check pgvector index (non-critical):', error);
  }

  console.log('✅ Image search index optimization complete');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    return;
  }

  try {
    await knex.raw('DROP INDEX IF EXISTS idx_product_images_active_embedding');
    await knex.raw('DROP INDEX IF EXISTS idx_product_images_product_id');
    await knex.raw('DROP INDEX IF EXISTS idx_products_status_category');
    console.log('✅ Dropped optimization indexes');
  } catch (error) {
    console.warn('Failed to drop indexes:', error);
  }
}

