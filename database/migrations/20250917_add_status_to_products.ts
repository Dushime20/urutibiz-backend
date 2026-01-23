import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasStatus = await knex.schema.hasColumn('products', 'status');
  if (!hasStatus) {
    // Ensure product_status enum exists with expected values
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
          CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'suspended', 'deleted');
        END IF;
      END$$;
    `);

    await knex.schema.alterTable('products', (table) => {
      table.specificType('status', 'product_status').defaultTo('active');
    });

    // Backfill nulls to active for safety
    await knex.raw(`UPDATE products SET status = 'active' WHERE status IS NULL`);

    // Index for filters
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
    console.log('✅ Added products.status column with default and index');
  } else {
    console.log('⚠️ products.status already exists, ensuring index');
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  try { await knex.raw(`DROP INDEX IF EXISTS idx_products_status`); } catch {}

  const hasStatus = await knex.schema.hasColumn('products', 'status');
  if (hasStatus) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('status');
    });
  }
}


