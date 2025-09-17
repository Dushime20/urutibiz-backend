import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;

  const info = await knex.raw(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'pickup_methods'
  `);
  const currentType: string | undefined = info.rows?.[0]?.data_type;

  if (!currentType) return;

  if (currentType.toLowerCase() !== 'jsonb') {
    try { await knex.raw(`ALTER TABLE products ALTER COLUMN pickup_methods DROP DEFAULT`); } catch {}
    await knex.raw(`
      ALTER TABLE products
      ALTER COLUMN pickup_methods TYPE jsonb
      USING (
        CASE
          WHEN pg_typeof(pickup_methods)::text = 'jsonb' THEN pickup_methods
          WHEN pg_typeof(pickup_methods)::text = 'text[]' THEN to_jsonb(pickup_methods)
          ELSE to_jsonb(pickup_methods)
        END
      )
    `);
    await knex.raw(`ALTER TABLE products ALTER COLUMN pickup_methods SET DEFAULT '[]'::jsonb`);
    console.log('✅ Coerced products.pickup_methods to jsonb');
  }
}

export async function down(_knex: Knex): Promise<void> {
  // leave as jsonb
}


