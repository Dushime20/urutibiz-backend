import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create handover_sessions table
  await knex.schema.createTable('handover_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable();
    table.uuid('owner_id').notNullable();
    table.uuid('renter_id').notNullable();
    table.uuid('product_id').notNullable();
    
    // Handover Details
    table.enum('handover_type', ['pickup', 'delivery', 'meetup']).notNullable();
    table.timestamp('scheduled_date_time').notNullable();
    table.timestamp('actual_date_time');
    
    // Location
    table.enum('location_type', ['owner_location', 'renter_location', 'meeting_point']).notNullable();
    table.text('location_address').notNullable();
    table.decimal('location_lat', 10, 8);
    table.decimal('location_lng', 11, 8);
    table.text('location_instructions');
    
    // Status Tracking
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'disputed']).defaultTo('scheduled');
    table.string('handover_code', 6).notNullable(); // 6-digit verification code
    
    // Documentation
    table.json('pre_handover_photos').defaultTo('[]');
    table.json('post_handover_photos').defaultTo('[]');
    table.json('condition_report').defaultTo('{}');
    table.json('accessory_checklist').defaultTo('[]');
    
    // Verification
    table.text('owner_signature');
    table.text('renter_signature');
    table.uuid('witness_id');
    
    // Additional Info
    table.text('notes');
    table.integer('estimated_duration_minutes').defaultTo(30);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    
    // Indexes
    table.index('booking_id');
    table.index('owner_id');
    table.index('renter_id');
    table.index('product_id');
    table.index('status');
    table.index('handover_type');
    table.index('scheduled_date_time');
    table.index('handover_code');
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('witness_id').references('id').inTable('users').onDelete('SET NULL');
  });

  // Create return_sessions table
  await knex.schema.createTable('return_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable();
    table.uuid('handover_session_id').notNullable();
    table.uuid('owner_id').notNullable();
    table.uuid('renter_id').notNullable();
    table.uuid('product_id').notNullable();
    
    // Return Details
    table.enum('return_type', ['pickup', 'delivery', 'meetup']).notNullable();
    table.timestamp('scheduled_date_time').notNullable();
    table.timestamp('actual_date_time');
    
    // Location
    table.enum('location_type', ['owner_location', 'renter_location', 'meeting_point']).notNullable();
    table.text('location_address').notNullable();
    table.decimal('location_lat', 10, 8);
    table.decimal('location_lng', 11, 8);
    table.text('location_instructions');
    
    // Status Tracking
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'disputed']).defaultTo('scheduled');
    table.string('return_code', 6).notNullable(); // 6-digit verification code
    
    // Documentation
    table.json('pre_return_photos').defaultTo('[]');
    table.json('post_return_photos').defaultTo('[]');
    table.json('condition_comparison').defaultTo('{}');
    table.json('accessory_verification').defaultTo('[]');
    
    // Assessment
    table.json('damage_assessment');
    table.json('cleaning_assessment');
    table.json('maintenance_required').defaultTo('[]');
    
    // Verification
    table.text('owner_signature');
    table.text('renter_signature');
    table.uuid('inspector_id');
    
    // Additional Info
    table.text('notes');
    table.integer('estimated_duration_minutes').defaultTo(30);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    
    // Indexes
    table.index('booking_id');
    table.index('handover_session_id');
    table.index('owner_id');
    table.index('renter_id');
    table.index('product_id');
    table.index('status');
    table.index('return_type');
    table.index('scheduled_date_time');
    table.index('return_code');
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('handover_session_id').references('id').inTable('handover_sessions').onDelete('CASCADE');
    table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('inspector_id').references('id').inTable('users').onDelete('SET NULL');
  });

  // Create handover_messages table
  await knex.schema.createTable('handover_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('handover_session_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.enum('sender_type', ['owner', 'renter', 'platform', 'support']).notNullable();
    table.text('message').notNullable();
    table.enum('message_type', ['text', 'image', 'voice', 'video', 'location']).defaultTo('text');
    table.json('attachments').defaultTo('[]');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.json('read_by').defaultTo('[]'); // Array of user IDs who have read the message
    
    // Indexes
    table.index('handover_session_id');
    table.index('sender_id');
    table.index('timestamp');
    
    // Foreign key constraints
    table.foreign('handover_session_id').references('id').inTable('handover_sessions').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create return_messages table
  await knex.schema.createTable('return_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('return_session_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.enum('sender_type', ['owner', 'renter', 'platform', 'support', 'inspector']).notNullable();
    table.text('message').notNullable();
    table.enum('message_type', ['text', 'image', 'voice', 'video', 'location']).defaultTo('text');
    table.json('attachments').defaultTo('[]');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.json('read_by').defaultTo('[]'); // Array of user IDs who have read the message
    
    // Indexes
    table.index('return_session_id');
    table.index('sender_id');
    table.index('timestamp');
    
    // Foreign key constraints
    table.foreign('return_session_id').references('id').inTable('return_sessions').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create handover_notifications table
  await knex.schema.createTable('handover_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('handover_session_id').notNullable();
    table.enum('type', ['reminder', 'confirmation', 'delay', 'completion', 'dispute', 'emergency']).notNullable();
    table.enum('channel', ['email', 'sms', 'push', 'in_app']).notNullable();
    table.text('message').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.timestamp('scheduled_at').notNullable();
    table.timestamp('sent_at');
    table.timestamp('read_at');
    table.enum('status', ['pending', 'sent', 'delivered', 'failed']).defaultTo('pending');
    table.json('metadata').defaultTo('{}');
    
    // Indexes
    table.index('user_id');
    table.index('handover_session_id');
    table.index('type');
    table.index('channel');
    table.index('status');
    table.index('scheduled_at');
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('handover_session_id').references('id').inTable('handover_sessions').onDelete('CASCADE');
  });

  // Create return_notifications table
  await knex.schema.createTable('return_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('return_session_id').notNullable();
    table.enum('type', ['reminder', 'confirmation', 'delay', 'completion', 'dispute', 'damage_alert']).notNullable();
    table.enum('channel', ['email', 'sms', 'push', 'in_app']).notNullable();
    table.text('message').notNullable();
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.timestamp('scheduled_at').notNullable();
    table.timestamp('sent_at');
    table.timestamp('read_at');
    table.enum('status', ['pending', 'sent', 'delivered', 'failed']).defaultTo('pending');
    table.json('metadata').defaultTo('{}');
    
    // Indexes
    table.index('user_id');
    table.index('return_session_id');
    table.index('type');
    table.index('channel');
    table.index('status');
    table.index('scheduled_at');
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('return_session_id').references('id').inTable('return_sessions').onDelete('CASCADE');
  });

  // Create handover_return_stats table for analytics
  await knex.schema.createTable('handover_return_stats', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('date').notNullable();
    table.integer('total_handovers').defaultTo(0);
    table.integer('total_returns').defaultTo(0);
    table.integer('completed_handovers').defaultTo(0);
    table.integer('completed_returns').defaultTo(0);
    table.integer('cancelled_handovers').defaultTo(0);
    table.integer('cancelled_returns').defaultTo(0);
    table.integer('disputed_handovers').defaultTo(0);
    table.integer('disputed_returns').defaultTo(0);
    table.decimal('average_handover_time_minutes', 8, 2).defaultTo(0);
    table.decimal('average_return_time_minutes', 8, 2).defaultTo(0);
    table.decimal('handover_success_rate', 5, 2).defaultTo(0);
    table.decimal('return_on_time_rate', 5, 2).defaultTo(0);
    table.decimal('user_satisfaction_score', 3, 1).defaultTo(0);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('date');
    table.unique(['date']);
  });

  // Create handover_return_settings table for configuration
  await knex.schema.createTable('handover_return_settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('setting_key').notNullable().unique();
    table.text('setting_value').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('setting_key');
    table.index('is_active');
  });

  // Insert default settings
  await knex('handover_return_settings').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'default_handover_duration_minutes',
      setting_value: '30',
      description: 'Default estimated duration for handover sessions in minutes',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'default_return_duration_minutes',
      setting_value: '30',
      description: 'Default estimated duration for return sessions in minutes',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'handover_reminder_hours',
      setting_value: '24',
      description: 'Hours before handover to send reminder notification',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'return_reminder_hours',
      setting_value: '24',
      description: 'Hours before return to send reminder notification',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'max_handover_delay_minutes',
      setting_value: '60',
      description: 'Maximum delay in minutes before marking handover as late',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'max_return_delay_minutes',
      setting_value: '60',
      description: 'Maximum delay in minutes before marking return as late',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'auto_complete_handover_hours',
      setting_value: '2',
      description: 'Hours after scheduled time to auto-complete handover if no action',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'auto_complete_return_hours',
      setting_value: '2',
      description: 'Hours after scheduled time to auto-complete return if no action',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'require_photos_minimum',
      setting_value: '3',
      description: 'Minimum number of photos required for handover/return documentation',
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      setting_key: 'enable_gps_tracking',
      setting_value: 'true',
      description: 'Enable GPS location tracking for handover/return sessions',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('handover_return_settings');
  await knex.schema.dropTableIfExists('handover_return_stats');
  await knex.schema.dropTableIfExists('return_notifications');
  await knex.schema.dropTableIfExists('handover_notifications');
  await knex.schema.dropTableIfExists('return_messages');
  await knex.schema.dropTableIfExists('handover_messages');
  await knex.schema.dropTableIfExists('return_sessions');
  await knex.schema.dropTableIfExists('handover_sessions');
}
