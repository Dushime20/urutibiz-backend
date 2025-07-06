import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create notification_templates table
  await knex.schema.createTable('notification_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).unique().notNullable();
    table.string('type', 50).notNullable(); // 'email', 'sms', 'push', 'in_app'
    
    // Content
    table.text('subject_template');
    table.text('body_template');
    
    // Localization
    table.string('language', 10).defaultTo('en');
    
    // Settings
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['type', 'language', 'is_active'], 'idx_templates_lookup');
    table.index('name', 'idx_templates_name');
  });

  // Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.uuid('template_id').nullable();
    
    // Notification details
    table.string('type', 50).notNullable(); // 'booking_confirmed', 'payment_received', etc.
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    
    // Delivery
    table.specificType('channels', 'VARCHAR(20)[]').defaultTo(knex.raw("ARRAY['in_app']"));
    
    // Status
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('sent_at');
    
    // Additional data
    table.jsonb('metadata');
    table.text('action_url');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');
    
    // Indexes
    table.index(['user_id', 'is_read', 'created_at'], 'idx_notifications_user_status');
    table.index(['type', 'created_at'], 'idx_notifications_type');
    table.index('sent_at', 'idx_notifications_sent');
    table.index('expires_at', 'idx_notifications_expires');
  });

  // Insert default notification templates
  await knex('notification_templates').insert([
    {
      name: 'booking_confirmed',
      type: 'email',
      subject_template: 'Booking Confirmed - {{booking_reference}}',
      body_template: `
        <h2>Booking Confirmation</h2>
        <p>Hello {{user_name}},</p>
        <p>Your booking has been confirmed!</p>
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p>Thank you for choosing UrutiBiz!</p>
      `,
      language: 'en',
      is_active: true
    },
    {
      name: 'payment_received',
      type: 'email',
      subject_template: 'Payment Confirmation - {{amount}}',
      body_template: `
        <h2>Payment Received</h2>
        <p>Hello {{user_name}},</p>
        <p>We have received your payment of {{amount}} for booking {{booking_reference}}.</p>
        <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        <p><strong>Payment Method:</strong> {{payment_method}}</p>
        <p>Thank you for your payment!</p>
      `,
      language: 'en',
      is_active: true
    },
    {
      name: 'booking_reminder',
      type: 'push',
      subject_template: 'Booking Reminder',
      body_template: 'Your booking {{booking_reference}} is scheduled for {{booking_date}}. Don\'t forget!',
      language: 'en',
      is_active: true
    },
    {
      name: 'verification_complete',
      type: 'in_app',
      subject_template: 'Account Verified',
      body_template: 'Congratulations! Your account has been successfully verified. You can now access all features.',
      language: 'en',
      is_active: true
    },
    {
      name: 'new_review',
      type: 'email',
      subject_template: 'New Review Received',
      body_template: `
        <h2>New Review</h2>
        <p>Hello {{user_name}},</p>
        <p>You have received a new review for your booking {{booking_reference}}.</p>
        <p><strong>Rating:</strong> {{rating}}/5</p>
        <p><strong>Review:</strong> {{review_text}}</p>
        <p>Check your dashboard for more details.</p>
      `,
      language: 'en',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('notification_templates');
}
