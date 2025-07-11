import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('localization_and_business', (table) => {
    table.increments('id').primary();
    // Add your columns here
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('localization_and_business');
}
