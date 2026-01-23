import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasStatus = await knex.schema.hasColumn('products', 'status');
  

  // Set default to 'draft' for future inserts
  await knex.raw(`ALTER TABLE products ALTER COLUMN status SET DEFAULT 'draft'`);
  console.log('✅ products.status default set to draft');
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  
  const hasStatus = await knex.schema.hasColumn('products', 'status');
  
  // Restore to active default if needed
  await knex.raw(`ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active'`);
}


