import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add missing columns to category_regulations table
  await knex.schema.alterTable('category_regulations', (table) => {
    // Add missing columns that are defined in the Sequelize model
    table.decimal('max_liability_amount', 10, 2);
    table.boolean('requires_background_check').defaultTo(false);
    table.text('prohibited_activities');
    table.jsonb('seasonal_restrictions').defaultTo('{}');
    table.jsonb('documentation_required').defaultTo('[]');
    table.enum('compliance_level', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).defaultTo('MEDIUM');
    
    // Add indexes for better performance
    table.index('max_liability_amount');
    table.index('requires_background_check');
    table.index('compliance_level');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('category_regulations', (table) => {
    // Remove the columns we added
    table.dropColumn('max_liability_amount');
    table.dropColumn('requires_background_check');
    table.dropColumn('prohibited_activities');
    table.dropColumn('seasonal_restrictions');
    table.dropColumn('documentation_required');
    table.dropColumn('compliance_level');
  });
}
