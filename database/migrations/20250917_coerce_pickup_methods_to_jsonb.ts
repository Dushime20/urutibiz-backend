import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;

  // Detect current data type of pickup_methods
  const result = await knex.raw(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'pickup_methods'
  `);
  const currentType: string | undefined = result.rows?.[0]?.data_type;

  // If not jsonb, convert to jsonb to accept JSON arrays like "[\"pickup\"]"
  if (currentType && currentType.toLowerCase() !== 'jsonb') {
    // Drop default if any to avoid cast conflicts
    try { await knex.raw(`ALTER TABLE products ALTER COLUMN pickup_methods DROP DEFAULT`); } catch {}

    // Convert to jsonb using to_jsonb regardless of original type (works for text and text[])
    await knex.raw(`
      ALTER TABLE products
      ALTER COLUMN pickup_methods TYPE jsonb
      USING to_jsonb(pickup_methods)
    `);

    // Set default empty array
    await knex.raw(`ALTER TABLE products ALTER COLUMN pickup_methods SET DEFAULT '[]'::jsonb`);
    console.log('✅ Converted products.pickup_methods to jsonb with default []');
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Non-destructive down; leave as jsonb
}


