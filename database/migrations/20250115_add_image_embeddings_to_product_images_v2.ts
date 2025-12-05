import { Knex } from 'knex';

/**
 * Migration: Add image embeddings column to product_images table (v2 - fixed)
 * This enables AI-powered image similarity search
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    console.log('product_images table does not exist, skipping migration');
    return;
  }

  // Check if column already exists using raw query
  const columnExists = await knex.raw(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'product_images' 
    AND column_name = 'image_embedding'
  `);

  if (columnExists.rows && columnExists.rows.length > 0) {
    console.log('image_embedding column already exists, skipping');
    return;
  }

  // Add the column
  await knex.schema.alterTable('product_images', (table) => {
    table.jsonb('image_embedding').nullable();
  });

  // Add GIN index using raw SQL (Knex doesn't support GIN index syntax directly)
  try {
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_product_images_embedding 
      ON product_images USING gin (image_embedding)
    `);
    console.log('✅ Created GIN index on image_embedding');
  } catch (error) {
    console.warn('⚠️ Failed to create GIN index (non-critical):', error);
    // Index creation failure is non-critical, continue
  }

  console.log('✅ Added image_embedding column to product_images table');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    return;
  }

  // Check if column exists
  const columnExists = await knex.raw(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'product_images' 
    AND column_name = 'image_embedding'
  `);

  if (!columnExists.rows || columnExists.rows.length === 0) {
    return;
  }

  // Drop index first
  try {
    await knex.raw('DROP INDEX IF EXISTS idx_product_images_embedding');
  } catch (error) {
    console.warn('Failed to drop index:', error);
  }

  // Then drop column
  await knex.schema.alterTable('product_images', (table) => {
    table.dropColumn('image_embedding');
  });

  console.log('✅ Removed image_embedding column from product_images table');
}

