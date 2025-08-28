import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notifications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Notification details
    table.string('notification_type').notNullable();
    table.uuid('recipient_id').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data').nullable();
    table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    table.jsonb('channels').notNullable().defaultTo('[]');
    table.enum('status', [
      'pending',
      'scheduled', 
      'sending',
      'delivered',
      'partially_delivered',
      'failed',
      'cancelled',
      'expired'
    ]).defaultTo('pending');
    
    // Timing
    table.timestamp('scheduled_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('delivered_at').nullable();
    table.timestamp('expires_at').nullable();
    
    // Metadata
    table.jsonb('metadata').nullable();
    table.jsonb('channel_results').nullable();
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('recipient_id');
    table.index('notification_type');
    table.index('status');
    table.index('priority');
    table.index('scheduled_at');
    table.index('created_at');
    
    // Foreign key constraints
    table.foreign('recipient_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notifications');
}
