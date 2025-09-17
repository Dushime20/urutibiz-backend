import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;

  const hasDeliveryFee = await knex.schema.hasColumn('products', 'delivery_fee');
  if (!hasDeliveryFee) {
    await knex.schema.alterTable('products', (table) => {
      table.decimal('delivery_fee', 10, 2).notNullable().defaultTo(0);
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_products_delivery_fee ON products(delivery_fee)`);
    console.log('✅ Added products.delivery_fee with default 0.00');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;
  try { await knex.raw(`DROP INDEX IF EXISTS idx_products_delivery_fee`); } catch {}
  const hasDeliveryFee = await knex.schema.hasColumn('products', 'delivery_fee');
  if (hasDeliveryFee) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('delivery_fee');
    });
  }
}


