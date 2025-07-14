import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('phone_verification_otps', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable();
    table.string('phone_number', 32).notNullable();
    table.string('otp_code', 10).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('phone_verification_otps');
} 