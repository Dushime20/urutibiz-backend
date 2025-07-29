import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action_type').notNullable();
    table.string('entity_type').notNullable();
    table.uuid('entity_id');
    table.jsonb('details');
    table.string('status');
    table.string('ip_address');
    table.string('user_agent', 1000);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['action_type']);
    table.index(['entity_type', 'entity_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
} 