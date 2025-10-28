import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if products table exists
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    console.log('⚠️ products table does not exist, skipping...');
    return;
  }

  // Check if view_count column already exists
  const hasViewCount = await knex.schema.hasColumn('products', 'view_count');
  if (!hasViewCount) {
    await knex.schema.alterTable('products', (table) => {
      table.integer('view_count').defaultTo(0).comment('Number of views for this product');
    });
    console.log('✅ Added view_count column to products table');
  } else {
    console.log('⚠️ view_count column already exists, skipping...');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Check if products table exists
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    console.log('⚠️ products table does not exist, skipping...');
    return;
  }

  // Check if view_count column exists
  const hasViewCount = await knex.schema.hasColumn('products', 'view_count');
  if (hasViewCount) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('view_count');
    });
    console.log('✅ Removed view_count column from products table');
  } else {
    console.log('⚠️ view_count column does not exist, skipping...');
  }
}
