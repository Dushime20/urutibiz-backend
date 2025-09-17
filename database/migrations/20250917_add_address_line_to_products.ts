import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;

  const hasAddressLine = await knex.schema.hasColumn('products', 'address_line');
  if (!hasAddressLine) {
    await knex.schema.alterTable('products', (table) => {
      table.text('address_line');
    });
    console.log('✅ Added products.address_line');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) return;
  const hasAddressLine = await knex.schema.hasColumn('products', 'address_line');
  if (hasAddressLine) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('address_line');
    });
  }
}


