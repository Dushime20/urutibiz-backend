/**
 * Simple Delete Unpaid Bookings Script
 * 
 * Deletes all bookings with payment_status = 'pending' or 'failed'
 * and booking status = 'pending' or 'cancelled'
 * 
 * Usage: node delete-unpaid-bookings-simple.js
 */

require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutibiz_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
});

async function deleteUnpaidBookings() {
  try {
    console.log('🗑️  Deleting unpaid bookings...\n');

    // Find unpaid bookings
    const bookings = await db('bookings')
      .whereIn('payment_status', ['pending', 'failed'])
      .whereIn('status', ['pending', 'cancelled']);

    console.log(`Found ${bookings.length} unpaid booking(s)\n`);

    if (bookings.length === 0) {
      console.log('✅ No unpaid bookings to delete');
      await db.destroy();
      return;
    }

    // Display bookings
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id} | Status: ${b.status} | Payment: ${b.payment_status} | Amount: ${b.total_amount}`);
    });

    const bookingIds = bookings.map(b => b.id);

    // Delete in transaction
    await db.transaction(async (trx) => {
      // Delete related records
      await trx('booking_status_history').whereIn('booking_id', bookingIds).del();
      
      // Delete bookings
      const deleted = await trx('bookings').whereIn('id', bookingIds).del();
      
      console.log(`\n✅ Deleted ${deleted} unpaid booking(s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

deleteUnpaidBookings();
