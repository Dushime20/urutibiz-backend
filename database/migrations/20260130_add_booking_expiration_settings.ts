import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add booking expiration settings to system_settings table
  await knex.schema.alterTable('system_settings', (table) => {
    table.integer('booking_expiration_hours').defaultTo(2).comment('Hours after which unbooked confirmed bookings expire');
    table.boolean('booking_expiration_enabled').defaultTo(true).comment('Enable/disable booking expiration');
    table.timestamp('booking_expiration_last_run').nullable().comment('Last time expiration cleanup was run');
  });

  // Add expiration tracking to bookings table
  await knex.schema.alterTable('bookings', (table) => {
    table.timestamp('expires_at').nullable().comment('When this booking expires if not completed');
    table.boolean('is_expired').defaultTo(false).comment('Whether this booking has been marked as expired');
    table.timestamp('expired_at').nullable().comment('When this booking was expired');
  });

  // Create booking expiration logs table for auditing
  await knex.schema.createTable('booking_expiration_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable().comment('ID of the expired booking');
    table.string('booking_reference').nullable().comment('Reference number of expired booking');
    table.uuid('user_id').nullable().comment('User who made the booking');
    table.string('product_title').nullable().comment('Product that was booked');
    table.timestamp('booking_created_at').nullable().comment('When the booking was originally created');
    table.timestamp('booking_expires_at').nullable().comment('When the booking was set to expire');
    table.integer('expiration_hours_used').nullable().comment('Expiration hours setting used');
    table.string('booking_status').nullable().comment('Status of booking when expired');
    table.decimal('booking_amount', 10, 2).nullable().comment('Amount of the expired booking');
    table.text('deletion_reason').nullable().comment('Reason for deletion');
    table.jsonb('booking_data').nullable().comment('Full booking data before deletion');
    table.timestamp('expired_at').defaultTo(knex.fn.now()).comment('When the expiration occurred');
    table.string('expired_by').defaultTo('system').comment('Who/what triggered the expiration');
    
    table.index(['booking_id']);
    table.index(['user_id']);
    table.index(['expired_at']);
    table.index(['booking_created_at']);
  });

  // Insert default booking expiration settings as separate records
  const existingSettings = await knex('system_settings')
    .where('key', 'booking_expiration_hours')
    .where('category', 'booking')
    .first();

  if (!existingSettings) {
    await knex('system_settings').insert([
      {
        key: 'booking_expiration_hours',
        value: '2',
        type: 'integer',
        category: 'booking',
        description: 'Hours after which unbooked confirmed bookings expire',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      },
      {
        key: 'booking_expiration_enabled',
        value: 'true',
        type: 'boolean',
        category: 'booking',
        description: 'Enable/disable booking expiration system',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }
    ]);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove booking expiration settings from system_settings
  await knex.schema.alterTable('system_settings', (table) => {
    table.dropColumn('booking_expiration_hours');
    table.dropColumn('booking_expiration_enabled');
    table.dropColumn('booking_expiration_last_run');
  });

  // Remove expiration tracking from bookings
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('expires_at');
    table.dropColumn('is_expired');
    table.dropColumn('expired_at');
  });

  // Drop booking expiration logs table
  await knex.schema.dropTableIfExists('booking_expiration_logs');

  // Remove booking expiration settings records
  await knex('system_settings')
    .where('category', 'booking')
    .whereIn('key', ['booking_expiration_hours', 'booking_expiration_enabled'])
    .del();
}