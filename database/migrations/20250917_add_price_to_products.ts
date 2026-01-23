import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  

  const hasPrice = await knex.schema.hasColumn('products', 'price');
  if (!hasPrice) {
    await knex.schema.alterTable('products', (table) => {
      table.decimal('price', 10, 2).notNullable().defaultTo(0);
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`);
    console.log('✅ Added products.price with default 0.00');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_products_price`); } catch {}
  const hasPrice = await knex.schema.hasColumn('products', 'price');
  if (hasPrice) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('price');
    });
  }
}


