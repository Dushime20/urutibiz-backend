import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add is_active column to product_risk_profiles table
  await knex.schema.alterTable('product_risk_profiles', (table) => {
    table.boolean('is_active').defaultTo(true).notNullable();
  });

  // Add index for is_active
  await knex.schema.alterTable('product_risk_profiles', (table) => {
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove is_active column
  await knex.schema.alterTable('product_risk_profiles', (table) => {
    table.dropIndex('is_active');
    table.dropColumn('is_active');
  });
}

