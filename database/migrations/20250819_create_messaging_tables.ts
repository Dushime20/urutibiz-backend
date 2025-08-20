import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create chats table if it doesn't exist
  if (!(await knex.schema.hasTable('chats'))) {
    await knex.schema.createTable('chats', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.jsonb('participant_ids').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.jsonb('metadata');
      table.timestamps(true, true);
    });
  }

  // Create messages table if it doesn't exist
  if (!(await knex.schema.hasTable('messages'))) {
    await knex.schema.createTable('messages', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('chat_id').references('id').inTable('chats').onDelete('CASCADE');
      table.uuid('sender_id').notNullable();
      table.text('content').notNullable();
      table.enum('message_type', ['text', 'image', 'file', 'system']).defaultTo('text');
      table.boolean('is_read').defaultTo(false);
      table.jsonb('metadata');
      table.timestamps(true, true);
      
      table.index(['chat_id']);
      table.index(['sender_id']);
      table.index(['created_at']);
    });
  }

  // Create message_templates table if it doesn't exist
  if (!(await knex.schema.hasTable('message_templates'))) {
    await knex.schema.createTable('message_templates', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('content').notNullable();
      table.string('category').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['category']);
      table.index(['is_active']);
    });
  }

  // Create system_notifications table if it doesn't exist
  if (!(await knex.schema.hasTable('system_notifications'))) {
    await knex.schema.createTable('system_notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.enum('type', ['info', 'warning', 'error', 'success']).defaultTo('info');
      table.boolean('is_read').defaultTo(false);
      table.timestamp('read_at');
      table.jsonb('metadata');
      table.timestamps(true, true);
      
      table.index(['type']);
      table.index(['is_read']);
      table.index(['created_at']);
    });
  }

  // Create email_templates table if it doesn't exist
  if (!(await knex.schema.hasTable('email_templates'))) {
    await knex.schema.createTable('email_templates', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('subject').notNullable();
      table.text('html_content').notNullable();
      table.text('text_content').notNullable();
      table.jsonb('variables').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['name']);
      table.index(['is_active']);
    });
  }

  // Create scheduled_notifications table if it doesn't exist
  if (!(await knex.schema.hasTable('scheduled_notifications'))) {
    await knex.schema.createTable('scheduled_notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.enum('notification_type', ['push', 'email', 'sms']).notNullable();
      table.jsonb('target_users').notNullable();
      table.timestamp('scheduled_at').notNullable();
      table.timestamp('sent_at');
      table.enum('status', ['pending', 'sent', 'failed', 'cancelled']).defaultTo('pending');
      table.jsonb('metadata');
      table.timestamps(true, true);
      
      table.index(['notification_type']);
      table.index(['status']);
      table.index(['scheduled_at']);
    });
  }

  // Create push_notifications table if it doesn't exist
  if (!(await knex.schema.hasTable('push_notifications'))) {
    await knex.schema.createTable('push_notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('body').notNullable();
      table.jsonb('user_ids').notNullable();
      table.jsonb('data');
      table.timestamp('scheduled_at');
      table.timestamp('sent_at');
      table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
      table.timestamps(true, true);
      
      table.index(['status']);
      table.index(['scheduled_at']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('push_notifications');
  await knex.schema.dropTableIfExists('scheduled_notifications');
  await knex.schema.dropTableIfExists('email_templates');
  await knex.schema.dropTableIfExists('system_notifications');
  await knex.schema.dropTableIfExists('message_templates');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('chats');
}
