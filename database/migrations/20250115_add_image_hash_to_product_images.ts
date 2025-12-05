import { Knex } from 'knex';

/**
 * Migration: Add image_hash column to product_images table
 * This enables exact image matching by content hash (not URL)
 * Alibaba.com approach: Compare actual image content, not URLs
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    console.log('product_images table does not exist, skipping migration');
    return;
  }

  // Check if column already exists
  const columnExists = await knex.raw(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'product_images' 
    AND column_name = 'image_hash'
  `);

  if (columnExists.rows && columnExists.rows.length > 0) {
    console.log('image_hash column already exists, skipping');
    return;
  }

  // Add the column
  await knex.schema.alterTable('product_images', (table) => {
    table.string('image_hash', 64).nullable(); // SHA-256 hash = 64 hex characters
  });

  // Add index for fast hash lookups
  try {
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_product_images_hash 
      ON product_images (image_hash)
      WHERE image_hash IS NOT NULL
    `);
    console.log('✅ Created index on image_hash');
  } catch (error) {
    console.warn('⚠️ Failed to create index (non-critical):', error);
  }

  console.log('✅ Added image_hash column to product_images table');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    return;
  }

  try {
    // Drop index first
    await knex.raw('DROP INDEX IF EXISTS idx_product_images_hash');
    
    // Drop column
    await knex.schema.alterTable('product_images', (table) => {
      table.dropColumn('image_hash');
    });
    
    console.log('✅ Removed image_hash column from product_images table');
  } catch (error) {
    console.warn('⚠️ Error removing image_hash column:', error);
  }
}

