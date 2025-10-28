import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('notifications').del();

  // Insert seed entries
  await knex('notifications').insert([
    {
      id: 'notification-1',
      user_id: 'user-1',
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your booking for Luxury Beach Villa in Miami has been confirmed for Dec 1-3, 2024.',
      data: JSON.stringify({ booking_id: 'booking-1', product_title: 'Luxury Beach Villa in Miami' }),
      is_read: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-2',
      user_id: 'user-2',
      type: 'new_booking',
      title: 'New Booking Received',
      message: 'You have received a new booking for your Luxury Beach Villa in Miami from John Doe.',
      data: JSON.stringify({ booking_id: 'booking-1', renter_name: 'John Doe' }),
      is_read: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-3',
      user_id: 'user-6',
      type: 'payment_pending',
      title: 'Payment Pending',
      message: 'Please complete payment for your booking UR-2024-002 to confirm your reservation.',
      data: JSON.stringify({ booking_id: 'booking-2', amount: 105000 }),
      is_read: false,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-4',
      user_id: 'user-1',
      type: 'booking_completed',
      title: 'Booking Completed',
      message: 'Your booking for Professional Camera Kit has been completed successfully. Thank you for using UrutiBiz!',
      data: JSON.stringify({ booking_id: 'booking-3', product_title: 'Professional Camera Kit' }),
      is_read: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-5',
      user_id: 'user-2',
      type: 'review_received',
      title: 'New Review Received',
      message: 'You received a 5-star review from John Doe for your Luxury Beach Villa in Miami.',
      data: JSON.stringify({ review_id: 'review-1', rating: 5, reviewer_name: 'John Doe' }),
      is_read: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-6',
      user_id: 'user-8',
      type: 'verification_rejected',
      title: 'Verification Rejected',
      message: 'Your KYC verification has been rejected. Please resubmit with clearer document photos.',
      data: JSON.stringify({ verification_id: 'verification-8', reason: 'Document quality insufficient' }),
      is_read: false,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-7',
      user_id: 'user-6',
      type: 'verification_pending',
      title: 'Verification Under Review',
      message: 'Your KYC verification is currently under review. We will notify you once it is processed.',
      data: JSON.stringify({ verification_id: 'verification-6' }),
      is_read: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'notification-8',
      user_id: 'user-1',
      type: 'payment_refund',
      title: 'Refund Processed',
      message: 'Your security deposit refund of 75,000 RWF has been processed for booking UR-2024-003.',
      data: JSON.stringify({ booking_id: 'booking-3', amount: 75000 }),
      is_read: false,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Notifications seeded successfully');
}
