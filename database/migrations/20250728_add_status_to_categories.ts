import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('categories', (table) => {
    // Add status column with default value
    table.string('status', 20).defaultTo('active');
    
    // Add updated_at column
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Add index on status for better performance
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('categories', (table) => {
    table.dropColumn('status');
    table.dropColumn('updated_at');
  });
} 