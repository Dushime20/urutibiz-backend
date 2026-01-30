import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create reminder configurations table
  await knex.schema.createTable('reminder_configurations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().comment('Configuration name (e.g., "24h_before", "6h_before", "same_day")');
    table.integer('hours_before').notNullable().comment('Hours before return date to send reminder');
    table.boolean('enabled').defaultTo(true).comment('Whether this reminder is active');
    table.text('email_template').nullable().comment('Email template content');
    table.text('sms_template').nullable().comment('SMS template content');
    table.text('in_app_template').nullable().comment('In-app notification template');
    table.timestamps(true, true);
    
    table.unique(['name']);
    table.index(['enabled']);
  });

  // Create reminder tracking table for idempotency
  await knex.schema.createTable('rental_reminder_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable().comment('Booking/rental ID');
    table.string('reminder_type').notNullable().comment('Type of reminder (24h_before, 6h_before, same_day)');
    table.string('channel').notNullable().comment('Notification channel (email, sms, in_app)');
    table.string('status').notNullable().defaultTo('pending').comment('Status: pending, sent, failed, cancelled');
    table.timestamp('scheduled_at').notNullable().comment('When reminder was scheduled to be sent');
    table.timestamp('sent_at').nullable().comment('When reminder was actually sent');
    table.text('recipient').nullable().comment('Email address or phone number');
    table.text('message_content').nullable().comment('Actual message sent');
    table.text('error_message').nullable().comment('Error details if failed');
    table.jsonb('metadata').nullable().comment('Additional data (template variables, etc.)');
    table.timestamps(true, true);
    
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.index(['booking_id']);
    table.index(['reminder_type']);
    table.index(['channel']);
    table.index(['status']);
    table.index(['scheduled_at']);
    table.unique(['booking_id', 'reminder_type', 'channel'], 'unique_reminder_per_booking_type_channel');
  });

  // Add reminder tracking columns to bookings table
  await knex.schema.alterTable('bookings', (table) => {
    table.timestamp('return_date').nullable().comment('Expected return date and time');
    table.string('return_location').nullable().comment('Where product should be returned');
    table.boolean('reminders_enabled').defaultTo(true).comment('Whether reminders are enabled for this booking');
    table.timestamp('reminders_reset_at').nullable().comment('When reminder schedule was last reset');
    table.boolean('returned_early').defaultTo(false).comment('Whether product was returned before return_date');
    table.timestamp('actual_return_date').nullable().comment('When product was actually returned');
  });

  // Insert default reminder configurations
  await knex('reminder_configurations').insert([
    {
      name: '24h_before',
      hours_before: 24,
      enabled: true,
      email_template: `
        <h2>Rental Return Reminder - 24 Hours</h2>
        <p>Hi {{renter_name}},</p>
        <p>This is a friendly reminder that your rental <strong>{{product_name}}</strong> (Booking #{{booking_reference}}) is due for return tomorrow.</p>
        <p><strong>Return Details:</strong></p>
        <ul>
          <li>Return Date: {{return_date}}</li>
          <li>Return Time: {{return_time}}</li>
          {{#if return_location}}<li>Return Location: {{return_location}}</li>{{/if}}
        </ul>
        <p>Please ensure the product is returned on time and in good condition to avoid any additional charges.</p>
        <p>Thank you for using our platform!</p>
      `,
      sms_template: 'Reminder: Your rental {{product_name}} ({{booking_reference}}) is due tomorrow {{return_date}} at {{return_time}}. Please return on time.',
      in_app_template: 'Your rental "{{product_name}}" is due for return tomorrow ({{return_date}} at {{return_time}}). Please return on time to avoid additional charges.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: '6h_before',
      hours_before: 6,
      enabled: true,
      email_template: `
        <h2>Rental Return Reminder - 6 Hours</h2>
        <p>Hi {{renter_name}},</p>
        <p>Your rental <strong>{{product_name}}</strong> (Booking #{{booking_reference}}) is due for return in 6 hours.</p>
        <p><strong>Return Details:</strong></p>
        <ul>
          <li>Return Date: {{return_date}}</li>
          <li>Return Time: {{return_time}}</li>
          {{#if return_location}}<li>Return Location: {{return_location}}</li>{{/if}}
        </ul>
        <p>Please start preparing for the return to ensure you're not late.</p>
        <p>Thank you!</p>
      `,
      sms_template: 'Urgent: Your rental {{product_name}} ({{booking_reference}}) is due in 6 hours at {{return_time}}. Please prepare for return.',
      in_app_template: 'Urgent: Your rental "{{product_name}}" is due for return in 6 hours ({{return_time}}). Please prepare for return.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'same_day',
      hours_before: 0,
      enabled: true,
      email_template: `
        <h2>Rental Return Due Today</h2>
        <p>Hi {{renter_name}},</p>
        <p>Your rental <strong>{{product_name}}</strong> (Booking #{{booking_reference}}) is due for return TODAY.</p>
        <p><strong>Return Details:</strong></p>
        <ul>
          <li>Return Date: {{return_date}}</li>
          <li>Return Time: {{return_time}}</li>
          {{#if return_location}}<li>Return Location: {{return_location}}</li>{{/if}}
        </ul>
        <p><strong>Important:</strong> Please return the product on time to avoid late fees and maintain your good standing.</p>
        <p>Thank you!</p>
      `,
      sms_template: 'FINAL REMINDER: Your rental {{product_name}} ({{booking_reference}}) is due TODAY at {{return_time}}. Return now to avoid late fees.',
      in_app_template: 'FINAL REMINDER: Your rental "{{product_name}}" is due for return TODAY at {{return_time}}. Return now to avoid late fees.',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  // Remove columns from bookings table
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('return_date');
    table.dropColumn('return_location');
    table.dropColumn('reminders_enabled');
    table.dropColumn('reminders_reset_at');
    table.dropColumn('returned_early');
    table.dropColumn('actual_return_date');
  });

  // Drop tables
  await knex.schema.dropTableIfExists('rental_reminder_logs');
  await knex.schema.dropTableIfExists('reminder_configurations');
}