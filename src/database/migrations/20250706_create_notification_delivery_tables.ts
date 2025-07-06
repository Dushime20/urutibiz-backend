import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create notification_delivery_attempts table
  await knex.schema.createTable('notification_delivery_attempts', (table) => {
    table.string('id').primary(); // composite ID: notification_id + channel + timestamp
    table.uuid('notification_id').notNullable();
    table.string('channel', 20).notNullable(); // 'email', 'sms', 'push', 'in_app'
    table.string('provider', 50).notNullable(); // provider name
    table.string('status', 20).notNullable().defaultTo('pending'); // 'pending', 'sent', 'failed', 'retry'
    table.string('message_id'); // external provider message ID
    table.text('error_message');
    table.integer('attempts').defaultTo(1);
    table.timestamp('last_attempted_at').defaultTo(knex.fn.now());
    table.timestamp('sent_at');
    table.jsonb('metadata'); // additional delivery details

    // Foreign key
    table.foreign('notification_id').references('id').inTable('notifications').onDelete('CASCADE');

    // Indexes
    table.index(['notification_id', 'channel'], 'idx_delivery_attempts_notification');
    table.index(['status', 'attempts', 'last_attempted_at'], 'idx_delivery_attempts_retry');
    table.index('sent_at', 'idx_delivery_attempts_sent');
  });

  // Create notification_delivery_status table
  await knex.schema.createTable('notification_delivery_status', (table) => {
    table.uuid('notification_id').notNullable();
    table.string('channel', 20).notNullable();
    table.string('status', 20).notNullable(); // 'pending', 'sent', 'failed'
    table.string('message_id'); // external provider message ID
    table.timestamp('delivered_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Composite primary key
    table.primary(['notification_id', 'channel']);

    // Foreign key
    table.foreign('notification_id').references('id').inTable('notifications').onDelete('CASCADE');

    // Indexes
    table.index(['status', 'delivered_at'], 'idx_delivery_status_lookup');
  });

  // Create user_notification_preferences table
  await knex.schema.createTable('user_notification_preferences', (table) => {
    table.uuid('user_id').primary();
    table.specificType('enabled_channels', 'VARCHAR(20)[]').defaultTo(knex.raw("ARRAY['in_app', 'email']"));
    table.jsonb('preferences').defaultTo('{}'); // per-type preferences, quiet hours, etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create user_devices table for push notifications
  await knex.schema.createTable('user_devices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.string('device_type', 20).notNullable(); // 'ios', 'android', 'web'
    table.string('device_id').notNullable(); // unique device identifier
    table.text('push_token'); // FCM/APNS token
    table.string('app_version', 20);
    table.string('os_version', 20);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_used_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['user_id', 'is_active', 'last_used_at'], 'idx_user_devices_active');
    table.index('device_id', 'idx_user_devices_device_id');
    table.unique(['user_id', 'device_id'], 'unique_user_device');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_devices');
  await knex.schema.dropTableIfExists('user_notification_preferences');
  await knex.schema.dropTableIfExists('notification_delivery_status');
  await knex.schema.dropTableIfExists('notification_delivery_attempts');
}
