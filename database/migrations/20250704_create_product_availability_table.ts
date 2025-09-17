import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('product_availability');
  
  if (!hasTable) {
    // Ensure enum type exists without throwing on re-runs
    await knex.schema.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_type') THEN
          CREATE TYPE availability_type AS ENUM ('available', 'booked', 'maintenance', 'unavailable');
        END IF;
      END$$;
    `);
    await knex.schema.createTable('product_availability', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FK to avoid ordering issues on fresh DBs
      table.uuid('product_id').notNullable();
      table.date('date').notNullable();
      // Reference existing enum type to avoid implicit recreation by Knex
      table.specificType('availability_type', 'availability_type').defaultTo('available');
      table.decimal('price_override', 10, 2);
      table.text('notes');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.unique(['product_id', 'date']);
    });
    // Add FK only if products table exists
    const hasProducts = await knex.schema.hasTable('products');
    if (hasProducts) {
      await knex.schema.alterTable('product_availability', (table) => {
        table.foreign('product_id').references('products.id').onDelete('CASCADE');
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_availability');
}
