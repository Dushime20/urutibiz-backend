import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('moderation_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('resource_type', 50).notNullable().comment('Type of resource: product, user, review, etc.');
    table.uuid('resource_id').notNullable().comment('ID of the moderated resource');
    table.string('action', 50).notNullable().comment('Moderation action: approve, reject, flag, etc.');
    table.text('reason').comment('Reason for the moderation action');
    table.uuid('moderator_id').notNullable().references('id').inTable('users').comment('Admin who performed the action');
    table.jsonb('metadata').comment('Additional context like previous status, new status, etc.');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['resource_type', 'resource_id'], 'idx_moderation_actions_resource');
    table.index(['moderator_id'], 'idx_moderation_actions_moderator');
    table.index(['created_at'], 'idx_moderation_actions_created');
    table.index(['action'], 'idx_moderation_actions_action');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('moderation_actions');
}
