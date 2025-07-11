import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('communication', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.text('message').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // Add other columns as needed
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('communication');
}
