import { Knex } from 'knex';

/**
 * Migration: Create user_favorites table
 * This table stores user favorite products with optimized indexing
 */
export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Creating user_favorites table...');
  
  await knex.schema.createTable('user_favorites', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign keys
    table.uuid('user_id').notNullable()
      .references('id').inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    
    table.uuid('product_id').notNullable()
      .references('id').inTable('products')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    
    // Metadata
    table.jsonb('metadata').nullable().comment('Additional favorite metadata like tags, notes, etc.');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes for performance
    table.index(['user_id'], 'idx_user_favorites_user_id');
    table.index(['product_id'], 'idx_user_favorites_product_id');
    table.index(['created_at'], 'idx_user_favorites_created_at');
    
    // Unique constraint - user can only favorite a product once
    table.unique(['user_id', 'product_id'], 'uk_user_product_favorite');
    
    // Table comments
    table.comment('User favorite products with optimized querying');
  });

  console.log('✅ user_favorites table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔧 Dropping user_favorites table...');
  await knex.schema.dropTableIfExists('user_favorites');
  console.log('✅ user_favorites table dropped successfully');
}
