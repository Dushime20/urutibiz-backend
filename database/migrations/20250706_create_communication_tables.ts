import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enum types
  await knex.raw(`CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system', 'ai', 'other')`);
  await knex.raw(`CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent')`);
  await knex.raw(`CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed', 'archived')`);

  // Conversations table
  await knex.schema.createTable('conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings');
    table.uuid('participant_1_id').notNullable().references('id').inTable('users');
    table.uuid('participant_2_id').notNullable().references('id').inTable('users');
    table.string('subject', 255);
    table.string('status', 20).defaultTo('active');
    table.boolean('ai_moderation_enabled').defaultTo(true);
    table.boolean('ai_translation_enabled').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Messages table
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users');
    table.enu('message_type', ['text', 'image', 'file', 'system', 'ai', 'other'], { useNative: true, enumName: 'message_type' }).defaultTo('text');
    table.text('content');
    table.text('file_url');
    table.string('file_name', 255);
    table.integer('file_size');
    table.decimal('ai_sentiment_score', 3, 2);
    table.string('ai_language_detected', 10);
    table.jsonb('ai_translation');
    table.boolean('is_flagged').defaultTo(false);
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Support tickets table
  await knex.schema.createTable('support_tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('ticket_number', 20).unique().notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('booking_id').references('id').inTable('bookings');
    table.string('subject', 255).notNullable();
    table.text('description').notNullable();
    table.string('category', 50);
    table.enu('priority', ['low', 'medium', 'high', 'urgent'], { useNative: true, enumName: 'ticket_priority' }).defaultTo('medium');
    table.enu('status', ['open', 'pending', 'resolved', 'closed', 'archived'], { useNative: true, enumName: 'ticket_status' }).defaultTo('open');
    table.uuid('assigned_to').references('id').inTable('users');
    table.timestamp('assigned_at');
    table.string('ai_category', 50);
    table.decimal('ai_urgency_score', 3, 2);
    table.text('ai_suggested_response');
    table.text('resolution');
    table.timestamp('resolved_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Support ticket messages table
  await knex.schema.createTable('support_ticket_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('ticket_id').notNullable().references('id').inTable('support_tickets').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users');
    table.text('message').notNullable();
    table.specificType('attachments', 'TEXT[]');
    table.boolean('is_internal').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // AI chat logs table
  await knex.schema.createTable('ai_chat_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users');
    table.string('session_id', 255).notNullable();
    table.text('user_message').notNullable();
    table.text('ai_response').notNullable();
    table.string('intent_detected', 100);
    table.decimal('confidence_score', 3, 2);
    table.jsonb('context');
    table.integer('processing_time_ms');
    table.boolean('escalated_to_human').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_chat_logs');
  await knex.schema.dropTableIfExists('support_ticket_messages');
  await knex.schema.dropTableIfExists('support_tickets');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversations');
  await knex.raw('DROP TYPE IF EXISTS message_type');
  await knex.raw('DROP TYPE IF EXISTS ticket_priority');
  await knex.raw('DROP TYPE IF EXISTS ticket_status');
}
