import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notification_preferences', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // User reference
    table.uuid('user_id').notNullable().unique();
    
    // Channel preferences
    table.boolean('email').defaultTo(true);
    table.boolean('sms').defaultTo(false);
    table.boolean('push').defaultTo(true);
    table.boolean('webhook').defaultTo(false);
    table.boolean('in_app').defaultTo(true);
    
    // Quiet hours
    table.boolean('quiet_hours_enabled').defaultTo(false);
    table.string('quiet_hours_start').nullable(); // HH:mm format
    table.string('quiet_hours_end').nullable();   // HH:mm format
    table.string('timezone').defaultTo('UTC');
    
    // Type-specific preferences (stored as JSONB)
    table.jsonb('type_preferences').nullable();
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notification_preferences');
}
