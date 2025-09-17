import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Update product_status enum to include 'suspended' and 'deleted' instead of 'archived'
  await knex.schema.raw(`
    ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'suspended';
    ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'deleted';
  `);
  
  // For product_condition, we need to drop and recreate since the values are completely different
  // First check if the products table exists and has data
  const tableExists = await knex.schema.hasTable('products');
  
  if (tableExists) {
    // Drop the condition column temporarily
    await knex.schema.raw(`
      ALTER TABLE products DROP COLUMN IF EXISTS condition
    `);
  }
  
  // Ensure the product_condition enum exists with desired values without erroring on re-runs
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
        CREATE TYPE product_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
      END IF;
    END$$;
  `);
  
  if (tableExists) {
    // Add the condition column back referencing the existing enum type directly
    await knex.schema.alterTable('products', (table) => {
      table.specificType('condition', 'product_condition').notNullable().defaultTo('good');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert product_condition enum
  const tableExists = await knex.schema.hasTable('products');
  
  if (tableExists) {
    await knex.schema.raw(`ALTER TABLE products DROP COLUMN IF EXISTS condition`);
  }
  
  // Recreate legacy enum if not exists
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
        DROP TYPE product_condition CASCADE;
      END IF;
      CREATE TYPE product_condition AS ENUM ('new', 'used', 'refurbished');
    END$$;
  `);
  
  if (tableExists) {
    await knex.schema.alterTable('products', (table) => {
      table.specificType('condition', 'product_condition').notNullable().defaultTo('used');
    });
  }
  
  // Note: Cannot easily remove enum values from product_status, would need to recreate
  // For safety, leaving the additional values ('suspended', 'deleted') in place
}
