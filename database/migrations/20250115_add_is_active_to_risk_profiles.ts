import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if product_risk_profiles table exists before altering it
  const tableExists = await knex.schema.hasTable('product_risk_profiles');
  
  if (!tableExists) {
    console.log('product_risk_profiles table does not exist, skipping migration');
    return;
  }

  // Check if is_active column already exists
  const hasColumn = await knex.schema.hasColumn('product_risk_profiles', 'is_active');
  
  if (hasColumn) {
    console.log('is_active column already exists in product_risk_profiles table, skipping migration');
    return;
  }

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
  // Check if product_risk_profiles table exists
  const tableExists = await knex.schema.hasTable('product_risk_profiles');
  
  if (!tableExists) {
    console.log('product_risk_profiles table does not exist, skipping rollback');
    return;
  }

  // Check if is_active column exists before trying to drop it
  const hasColumn = await knex.schema.hasColumn('product_risk_profiles', 'is_active');
  
  if (!hasColumn) {
    console.log('is_active column does not exist in product_risk_profiles table, skipping rollback');
    return;
  }

  // Remove is_active column
  await knex.schema.alterTable('product_risk_profiles', (table) => {
    table.dropIndex('is_active');
    table.dropColumn('is_active');
  });
}

