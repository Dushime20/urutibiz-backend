import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notification_templates', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Template details
    table.string('name').notNullable().unique();
    table.string('notification_type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('channels').notNullable().defaultTo('[]');
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.jsonb('variables').nullable(); // Array of variable names
    table.boolean('is_active').defaultTo(true);
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('name');
    table.index('notification_type');
    table.index('is_active');
    
    // Foreign key constraints (if you want to enforce notification type validation)
    // table.foreign('notification_type').references('notification_type').inTable('notifications');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notification_templates');
}
