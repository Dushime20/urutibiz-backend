/**
 * Delete Unpaid Bookings Script
 * 
 * This script deletes all bookings with payment_status = 'pending' or 'failed'
 * and optionally filters by booking age, status, and other criteria.
 * 
 * Usage:
 *   node delete-unpaid-bookings.js [options]
 * 
 * Options:
 *   --dry-run          Show what would be deleted without actually deleting
 *   --status=pending   Only delete bookings with specific status (default: pending,cancelled)
 *   --days=7           Only delete bookings older than X days (default: no age filter)
 *   --force            Skip confirmation prompt
 *   --help             Show this help message
 * 
 * Examples:
 *   node delete-unpaid-bookings.js --dry-run
 *   node delete-unpaid-bookings.js --days=30 --force
 *   node delete-unpaid-bookings.js --status=pending --days=7
 */

require('dotenv').config();
const knex = require('knex');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  help: args.includes('--help'),
  status: null,
  days: null,
};

// Parse status option
const statusArg = args.find(arg => arg.startsWith('--status='));
if (statusArg) {
  options.status = statusArg.split('=')[1].split(',');
}

// Parse days option
const daysArg = args.find(arg => arg.startsWith('--days='));
if (daysArg) {
  options.days = parseInt(daysArg.split('=')[1], 10);
}

// Show help
if (options.help) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Delete Unpaid Bookings Script - Help                ║
╚════════════════════════════════════════════════════════════════╝

This script deletes bookings with unpaid payment status.

USAGE:
  node delete-unpaid-bookings.js [options]

OPTIONS:
  --dry-run          Show what would be deleted without deleting
  --status=STATUS    Only delete bookings with specific status
                     (comma-separated: pending,cancelled)
                     Default: pending,cancelled
  --days=N           Only delete bookings older than N days
  --force            Skip confirmation prompt
  --help             Show this help message

EXAMPLES:
  # Preview what would be deleted
  node delete-unpaid-bookings.js --dry-run

  # Delete unpaid bookings older than 30 days
  node delete-unpaid-bookings.js --days=30

  # Delete only pending bookings without confirmation
  node delete-unpaid-bookings.js --status=pending --force

  # Delete cancelled unpaid bookings older than 7 days
  node delete-unpaid-bookings.js --status=cancelled --days=7 --dry-run

PAYMENT STATUSES:
  - pending: Payment not yet initiated
  - processing: Payment in progress
  - completed: Payment successful (NOT deleted)
  - failed: Payment failed
  - refunded: Payment refunded (NOT deleted)
  - partially_refunded: Partial refund (NOT deleted)

BOOKING STATUSES:
  - pending: Awaiting confirmation
  - confirmed: Booking confirmed
  - in_progress: Currently active
  - completed: Finished
  - cancelled: Cancelled by user
  - disputed: Under dispute
  - cancellation_requested: Cancellation pending

SAFETY:
  - Always run with --dry-run first to preview
  - Completed payments are never deleted
  - Refunded bookings are preserved
  - Backup your database before running
  `);
  process.exit(0);
}

// Database configuration
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutibiz_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  pool: {
    min: 2,
    max: 10,
  },
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

/**
 * Calculate days ago
 */
function daysAgo(date) {
  if (!date) return 'N/A';
  const now = new Date();
  const then = new Date(date);
  const diffTime = Math.abs(now - then);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Main function to delete unpaid bookings
 */
async function deleteUnpaidBookings() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         Delete Unpaid Bookings Script                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Test database connection
    console.log('🔌 Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully\n');

    // Build query to find unpaid bookings
    let query = db('bookings')
      .select(
        'bookings.*',
        'products.name as product_name',
        'renter.first_name as renter_first_name',
        'renter.last_name as renter_last_name',
        'owner.first_name as owner_first_name',
        'owner.last_name as owner_last_name'
      )
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .leftJoin('users as renter', 'bookings.renter_id', 'renter.id')
      .leftJoin('users as owner', 'bookings.owner_id', 'owner.id')
      .whereIn('bookings.payment_status', ['pending', 'failed']);

    // Apply status filter
    if (options.status && options.status.length > 0) {
      query = query.whereIn('bookings.status', options.status);
      console.log(`📋 Filter: Booking status = ${options.status.join(', ')}`);
    } else {
      // Default: only delete pending or cancelled bookings
      query = query.whereIn('bookings.status', ['pending', 'cancelled']);
      console.log('📋 Filter: Booking status = pending, cancelled (default)');
    }

    // Apply age filter
    if (options.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.days);
      query = query.where('bookings.created_at', '<', cutoffDate);
      console.log(`📅 Filter: Older than ${options.days} days (before ${formatDate(cutoffDate)})`);
    }

    // Fetch bookings to delete
    console.log('\n🔍 Searching for unpaid bookings...\n');
    const bookings = await query;

    if (bookings.length === 0) {
      console.log('✅ No unpaid bookings found matching the criteria.');
      console.log('   All bookings are either paid or don\'t match the filters.\n');
      await db.destroy();
      rl.close();
      return;
    }

    // Display summary
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log(`║  Found ${bookings.length} unpaid booking(s) to delete`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Group by payment status
    const byPaymentStatus = bookings.reduce((acc, b) => {
      acc[b.payment_status] = (acc[b.payment_status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Payment Status Breakdown:');
    Object.entries(byPaymentStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} booking(s)`);
    });

    // Group by booking status
    const byBookingStatus = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Booking Status Breakdown:');
    Object.entries(byBookingStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} booking(s)`);
    });

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    console.log(`\n💰 Total Amount: ${totalAmount.toFixed(2)} ${bookings[0]?.currency || 'RWF'}`);

    // Display detailed list
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Detailed Booking List                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Product: ${booking.product_name || 'N/A'}`);
      console.log(`   Renter: ${booking.renter_first_name} ${booking.renter_last_name}`);
      console.log(`   Owner: ${booking.owner_first_name} ${booking.owner_last_name}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment Status: ${booking.payment_status}`);
      console.log(`   Amount: ${parseFloat(booking.total_amount || 0).toFixed(2)} ${booking.currency || 'RWF'}`);
      console.log(`   Created: ${formatDate(booking.created_at)} (${daysAgo(booking.created_at)} days ago)`);
      console.log(`   Dates: ${booking.start_date} to ${booking.end_date}`);
      console.log('');
    });

    // Dry run mode
    if (options.dryRun) {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  DRY RUN MODE - No bookings were deleted                      ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      console.log('ℹ️  This was a preview. Run without --dry-run to actually delete.\n');
      await db.destroy();
      rl.close();
      return;
    }

    // Confirmation prompt
    if (!options.force) {
      console.log('⚠️  WARNING: This action cannot be undone!\n');
      const confirmed = await askConfirmation(
        `Are you sure you want to delete ${bookings.length} unpaid booking(s)? (y/N): `
      );

      if (!confirmed) {
        console.log('\n❌ Operation cancelled by user.\n');
        await db.destroy();
        rl.close();
        return;
      }
    }

    // Delete bookings
    console.log('\n🗑️  Deleting unpaid bookings...\n');

    const bookingIds = bookings.map(b => b.id);

    // Start transaction
    await db.transaction(async (trx) => {
      // Delete related records first (if any)
      
      // Delete booking status history
      const historyDeleted = await trx('booking_status_history')
        .whereIn('booking_id', bookingIds)
        .del();
      if (historyDeleted > 0) {
        console.log(`   ✅ Deleted ${historyDeleted} status history record(s)`);
      }

      // Delete booking messages (if table exists)
      try {
        const messagesDeleted = await trx('booking_messages')
          .whereIn('booking_id', bookingIds)
          .del();
        if (messagesDeleted > 0) {
          console.log(`   ✅ Deleted ${messagesDeleted} message(s)`);
        }
      } catch (err) {
        // Table might not exist, skip
      }

      // Delete inspections related to bookings (if table exists)
      try {
        const inspectionsDeleted = await trx('inspections')
          .whereIn('booking_id', bookingIds)
          .del();
        if (inspectionsDeleted > 0) {
          console.log(`   ✅ Deleted ${inspectionsDeleted} inspection(s)`);
        }
      } catch (err) {
        // Table might not exist, skip
      }

      // Delete the bookings
      const deleted = await trx('bookings')
        .whereIn('id', bookingIds)
        .del();

      console.log(`\n   ✅ Deleted ${deleted} booking(s)`);
    });

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Unpaid bookings deleted successfully!                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   - Bookings deleted: ${bookings.length}`);
    console.log(`   - Total amount cleared: ${totalAmount.toFixed(2)} ${bookings[0]?.currency || 'RWF'}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await db.destroy();
    rl.close();
  }
}

// Run the script
deleteUnpaidBookings();
