import { Knex } from 'knex';

/**
 * Migration: Add image embeddings column to product_images table
 * This enables AI-powered image similarity search
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('product_images', 'image_embedding');
    
    if (!hasColumn) {
      await knex.schema.alterTable('product_images', (table) => {
        // Store image embeddings as JSONB array for vector similarity search
        // Embeddings are 128-dimensional vectors from MobileNet feature extraction
        table.jsonb('image_embedding');
      });
      
      // Add GIN index separately using raw SQL (Knex doesn't support GIN index syntax directly)
      await knex.raw(`
        CREATE INDEX IF NOT EXISTS idx_product_images_embedding 
        ON product_images USING gin (image_embedding)
      `);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('product_images', 'image_embedding');
    
    if (hasColumn) {
      // Drop index first
      await knex.raw('DROP INDEX IF EXISTS idx_product_images_embedding');
      
      // Then drop column
      await knex.schema.alterTable('product_images', (table) => {
        table.dropColumn('image_embedding');
      });
    }
  }
}

