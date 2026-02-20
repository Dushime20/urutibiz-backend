/**
 * Seed notification templates
 * This is a JavaScript file that works in production without TypeScript
 */

exports.seed = async function(knex) {
  // Delete existing entries (optional)
  // await knex('notification_templates').del();
  
  // Insert notification templates
  await knex('notification_templates').insert([
    {
      name: 'welcome_email',
      type: 'email',
      subject_template: 'Welcome to UrutiBiz!',
      body_template: 'Hello {{name}}, welcome to UrutiBiz! We\'re excited to have you.',
      language: 'en',
      channels: ['email'],
      priority: 'normal',
      is_active: true
    },
    {
      name: 'booking_confirmed',
      type: 'email',
      subject_template: 'Booking Confirmed - #{{bookingId}}',
      body_template: 'Your booking #{{bookingId}} has been confirmed. Details: {{details}}',
      language: 'en',
      channels: ['email', 'push'],
      priority: 'high',
      is_active: true
    },
    {
      name: 'booking_reminder',
      type: 'email',
      subject_template: 'Booking Reminder',
      body_template: 'Reminder: Your booking is scheduled for {{date}}.',
      language: 'en',
      channels: ['email', 'push'],
      priority: 'normal',
      is_active: true
    },
    {
      name: 'payment_received',
      type: 'email',
      subject_template: 'Payment Received',
      body_template: 'We have received your payment of {{amount}} {{currency}}.',
      language: 'en',
      channels: ['email'],
      priority: 'high',
      is_active: true
    },
    {
      name: 'booking_cancelled',
      type: 'email',
      subject_template: 'Booking Cancelled',
      body_template: 'Your booking #{{bookingId}} has been cancelled.',
      language: 'en',
      channels: ['email', 'push'],
      priority: 'high',
      is_active: true
    }
  ]).onConflict('name').ignore();
  
  console.log('✓ Notification templates seeded');
};
