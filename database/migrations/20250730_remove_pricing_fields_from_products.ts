import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Remove redundant pricing fields from products table
  // These fields are now handled by the dedicated product_prices table
  
  await knex.schema.alterTable('products', (table) => {
    // Remove pricing-related columns
    table.dropColumn('base_price_per_day');
    table.dropColumn('base_price_per_week');
    table.dropColumn('base_price_per_month');
    table.dropColumn('security_deposit');
    table.dropColumn('currency');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Add back the pricing fields if needed to rollback
  await knex.schema.alterTable('products', (table) => {
    table.decimal('base_price_per_day', 10, 2);
    table.decimal('base_price_per_week', 10, 2);
    table.decimal('base_price_per_month', 10, 2);
    table.decimal('security_deposit', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('RWF');
  });
} 