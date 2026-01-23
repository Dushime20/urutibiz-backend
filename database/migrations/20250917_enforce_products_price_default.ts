import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasPrice = await knex.schema.hasColumn('products', 'price');
  

  // Ensure a sane default and not-null with backfill
  await knex.raw(`ALTER TABLE products ALTER COLUMN price SET DEFAULT 0`);
  await knex.raw(`UPDATE products SET price = 0 WHERE price IS NULL`);
  await knex.raw(`ALTER TABLE products ALTER COLUMN price SET NOT NULL`);
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  
  const hasPrice = await knex.schema.hasColumn('products', 'price');
  
  // Drop default only; keep not-null
  await knex.raw(`ALTER TABLE products ALTER COLUMN price DROP DEFAULT`);
}


