import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('user_verifications');
  if (!exists) {
    await knex.schema.createTable('user_verifications', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('verification_type', 255).notNullable();
      table.string('status', 255).notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_verifications');
}
