import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Ensure pgvector extension exists (already added in image migration, but for safety)
    await knex.raw('CREATE EXTENSION IF NOT EXISTS vector;');

    // Add text_embedding column to products
    // 768 is the dimension size for Gemini text-embedding-004
    await knex.schema.alterTable('products', (table) => {
        table.specificType('text_embedding', 'vector(768)').nullable();
    });

    // Create an HNSW index for high-performance semantic search
    // HNSW is better than IVFFlat for production semantic search
    await knex.raw(`
    CREATE INDEX IF NOT EXISTS products_text_embedding_idx 
    ON products 
    USING hnsw (text_embedding vector_cosine_ops);
  `);

    console.log('✅ Added text_embedding column and HNSW index to products table');
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('DROP INDEX IF EXISTS products_text_embedding_idx;');
    await knex.schema.alterTable('products', (table) => {
        table.dropColumn('text_embedding');
    });
}
