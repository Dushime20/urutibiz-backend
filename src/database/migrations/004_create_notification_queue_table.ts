import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notification_queue', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Queue details
    table.uuid('notification_id').notNullable();
    table.timestamp('scheduled_at').notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.integer('attempts').defaultTo(0);
    table.integer('max_attempts').defaultTo(3);
    table.timestamp('last_attempt_at').nullable();
    table.text('error_message').nullable();
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('notification_id');
    table.index('scheduled_at');
    table.index('status');
    table.index('attempts');
    
    // Foreign key constraints
    table.foreign('notification_id').references('id').inTable('notifications').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notification_queue');
}
