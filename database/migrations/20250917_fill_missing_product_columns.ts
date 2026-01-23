import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  // Ensure PostGIS for geometry
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');

  // Helper to check and add columns
  const addIfMissing = async (name: string, adder: (table: Knex.AlterTableBuilder) => void) => {
    const exists = await knex.schema.hasColumn('products', name);
    if (!exists) {
      await knex.schema.alterTable('products', adder);
      console.log(`✅ Added products.${name}`);
    }
  };

  await addIfMissing('brand', (t) => t.string('brand', 100));
  await addIfMissing('model', (t) => t.string('model', 100));
  await addIfMissing('country_id', (t) => t.uuid('country_id'));
  await addIfMissing('pickup_methods', (t) => t.specificType('pickup_methods', 'text[]'));
  await addIfMissing('slug', (t) => t.string('slug', 255));
  await addIfMissing('specifications', (t) => t.jsonb('specifications'));
  await addIfMissing('included_accessories', (t) => t.specificType('included_accessories', 'text[]'));
  await addIfMissing('features', (t) => t.specificType('features', 'text[]'));
  await addIfMissing('location', (t) => t.specificType('location', 'geometry(POINT,4326)'));

  // Indexes and constraints (best-effort, idempotent)
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx ON products(slug)`);
  const hasCountries = await knex.schema.hasTable('countries');
  if (hasCountries) {
    try {
      await knex.schema.alterTable('products', (table) => {
        table.foreign('country_id').references('countries.id').onDelete('SET NULL');
      });
    } catch {}
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  
  // Non-destructive down; leave columns as they may be in use
}


