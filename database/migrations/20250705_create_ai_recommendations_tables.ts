import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('ai_recommendations');
  if (exists) return;
  await knex.schema.createTable('ai_recommendations', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.text('recommendation').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // Add other columns as needed
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_recommendations');
}
