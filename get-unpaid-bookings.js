#!/usr/bin/env node

/**
 * Script to get unpaid bookings
 * 
 * This script identifies bookings that have not been paid for based on:
 * - payment_status is 'pending', 'processing', or 'failed'
 * - booking status is not 'cancelled'
 * - created more than X hours ago (configurable)
 * 
 * Usage:
 *   node get-unpaid-bookings.js [options]
 * 
 * Options:
 *   --hours <number>     Only show bookings older than X hours (default: 24)
 *   --limit <number>     Limit number of results (default: 50)
 *   --format <format>    Output format: table, json, csv (default: table)
 *   --export <file>      Export results to file
 *   --delete             Delete unpaid bookings (DANGEROUS - use with caution)
 *   --dry-run            Show what would be deleted without actually deleting
 */

const { program } = require('commander');
const knex = require('knex');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'urutibiz'
  },
  pool: {
    min: 2,
    max: 10
  }
};

// Initialize database connection
const db = knex(dbConfig);

// Configure command line options
program
  .option('--hours <number>', 'Only show bookings older than X hours', '24')
  .option('--limit <number>', 'Limit number of results', '50')
  .option('--format <format>', 'Output format: table, json, csv', 'table')
  .option('--export <file>', 'Export results to file')
  .option('--delete', 'Delete unpaid bookings (DANGEROUS)')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .option('--status <status>', 'Filter by specific payment status (pending,processing,failed)', 'pending,processing,failed')
  .parse();

const options = program.opts();

/**
 * Get unpaid bookings from database
 */
async function getUnpaidBookings() {
  try {
    console.log('🔍 Searching for unpaid bookings...\n');
    
    // Calculate cutoff time
    const hoursAgo = parseInt(options.hours);
    const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
    
    // Parse payment status filter
    const paymentStatuses = options.status.split(',').map(s => s.trim());
    
    console.log(`📅 Looking for bookings older than ${hoursAgo} hours (before ${cutoffTime.toISOString()})`);
    console.log(`💳 Payment statuses: ${paymentStatuses.join(', ')}`);
    console.log(`📊 Limit: ${options.limit} results\n`);
    
    // Query unpaid bookings with related data
    const unpaidBookings = await db('bookings')
      .select([
        'bookings.id',
        'bookings.booking_number',
        'bookings.status as booking_status',
        'bookings.payment_status',
        'bookings.total_amount',
        'bookings.platform_fee',
        'bookings.tax_amount',
        'bookings.security_deposit',
        'bookings.start_date',
        'bookings.end_date',
        'bookings.created_at',
        'bookings.updated_at',
        'renter.email as renter_email',
        'renter.first_name as renter_first_name',
        'renter.last_name as renter_last_name',
        'renter.phone as renter_phone',
        'owner.email as owner_email',
        'owner.first_name as owner_first_name',
        'owner.last_name as owner_last_name',
        'products.title as product_title',
        'products.price_per_day as product_price_per_day'
      ])
      .leftJoin('users as renter', 'bookings.renter_id', 'renter.id')
      .leftJoin('users as owner', 'bookings.owner_id', 'owner.id')
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .whereIn('bookings.payment_status', paymentStatuses)
      .whereNot('bookings.status', 'cancelled')
      .where('bookings.created_at', '<', cutoffTime)
      .orderBy('bookings.created_at', 'desc')
      .limit(parseInt(options.limit));
    
    console.log(`📋 Found ${unpaidBookings.length} unpaid bookings\n`);
    
    if (unpaidBookings.length === 0) {
      console.log('✅ No unpaid bookings found!');
      return [];
    }
    
    // Calculate totals
    const totalAmount = unpaidBookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.total_amount) || 0);
    }, 0);
    
    const totalPlatformFees = unpaidBookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.platform_fee) || 0);
    }, 0);
    
    console.log(`💰 Total unpaid amount: $${totalAmount.toFixed(2)}`);
    console.log(`🏢 Total platform fees at risk: $${totalPlatformFees.toFixed(2)}\n`);
    
    return unpaidBookings;
    
  } catch (error) {
    console.error('❌ Error fetching unpaid bookings:', error.message);
    throw error;
  }
}

/**
 * Format booking data for display
 */
function formatBookingData(booking) {
  const daysSinceCreated = Math.floor((Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    id: booking.id,
    booking_number: booking.booking_number || 'N/A',
    booking_status: booking.booking_status,
    payment_status: booking.payment_status,
    total_amount: `$${parseFloat(booking.total_amount || 0).toFixed(2)}`,
    platform_fee: `$${parseFloat(booking.platform_fee || 0).toFixed(2)}`,
    renter: `${booking.renter_first_name} ${booking.renter_last_name} (${booking.renter_email})`,
    owner: `${booking.owner_first_name} ${booking.owner_last_name} (${booking.owner_email})`,
    product: booking.product_title || 'N/A',
    rental_period: `${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()}`,
    days_since_created: daysSinceCreated,
    created_at: new Date(booking.created_at).toLocaleString()
  };
}

/**
 * Display results in table format
 */
function displayTable(bookings) {
  console.log('📊 UNPAID BOOKINGS REPORT');
  console.log('=' .repeat(120));
  
  // Table headers
  const headers = [
    'ID'.padEnd(8),
    'Booking #'.padEnd(12),
    'Payment Status'.padEnd(15),
    'Amount'.padEnd(10),
    'Platform Fee'.padEnd(12),
    'Days Old'.padEnd(8),
    'Renter'.padEnd(25),
    'Product'.padEnd(20)
  ];
  
  console.log(headers.join(' | '));
  console.log('-'.repeat(120));
  
  bookings.forEach(booking => {
    const formatted = formatBookingData(booking);
    const row = [
      booking.id.substring(0, 8).padEnd(8),
      formatted.booking_number.padEnd(12),
      booking.payment_status.padEnd(15),
      formatted.total_amount.padEnd(10),
      formatted.platform_fee.padEnd(12),
      formatted.days_since_created.toString().padEnd(8),
      formatted.renter.substring(0, 25).padEnd(25),
      (formatted.product || 'N/A').substring(0, 20).padEnd(20)
    ];
    console.log(row.join(' | '));
  });
  
  console.log('-'.repeat(120));
}

/**
 * Export results to file
 */
async function exportResults(bookings, filename) {
  const ext = path.extname(filename).toLowerCase();
  const formatted = bookings.map(formatBookingData);
  
  try {
    if (ext === '.json') {
      fs.writeFileSync(filename, JSON.stringify(formatted, null, 2));
    } else if (ext === '.csv') {
      const headers = Object.keys(formatted[0]).join(',');
      const rows = formatted.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      fs.writeFileSync(filename, csv);
    } else {
      // Default to JSON
      fs.writeFileSync(filename, JSON.stringify(formatted, null, 2));
    }
    
    console.log(`📁 Results exported to: ${filename}`);
  } catch (error) {
    console.error(`❌ Error exporting to ${filename}:`, error.message);
  }
}

/**
 * Delete unpaid bookings (DANGEROUS)
 */
async function deleteUnpaidBookings(bookings, dryRun = false) {
  if (bookings.length === 0) {
    console.log('✅ No bookings to delete.');
    return;
  }
  
  console.log(`${dryRun ? '🔍 DRY RUN:' : '⚠️  DANGER:'} ${dryRun ? 'Would delete' : 'Deleting'} ${bookings.length} unpaid bookings...\n`);
  
  const bookingIds = bookings.map(b => b.id);
  
  if (dryRun) {
    console.log('📋 Bookings that would be deleted:');
    bookings.forEach(booking => {
      const formatted = formatBookingData(booking);
      console.log(`  - ${booking.id} (${formatted.booking_number}) - ${formatted.total_amount} - ${formatted.renter}`);
    });
    console.log('\n✅ Dry run complete. No bookings were actually deleted.');
    return;
  }
  
  // Confirm deletion
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question(`⚠️  Are you sure you want to DELETE ${bookings.length} unpaid bookings? This cannot be undone! (yes/no): `, resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Deletion cancelled.');
    return;
  }
  
  try {
    // Start transaction
    await db.transaction(async (trx) => {
      // Delete related payment transactions first
      await trx('payment_transactions')
        .whereIn('booking_id', bookingIds)
        .del();
      
      // Delete booking status history
      await trx('booking_status_history')
        .whereIn('booking_id', bookingIds)
        .del();
      
      // Delete bookings
      const deletedCount = await trx('bookings')
        .whereIn('id', bookingIds)
        .del();
      
      console.log(`✅ Successfully deleted ${deletedCount} unpaid bookings and related data.`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting bookings:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get unpaid bookings
    const unpaidBookings = await getUnpaidBookings();
    
    if (unpaidBookings.length === 0) {
      await db.destroy();
      return;
    }
    
    // Display results based on format
    if (options.format === 'json') {
      console.log(JSON.stringify(unpaidBookings.map(formatBookingData), null, 2));
    } else if (options.format === 'csv') {
      const formatted = unpaidBookings.map(formatBookingData);
      const headers = Object.keys(formatted[0]).join(',');
      const rows = formatted.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      console.log([headers, ...rows].join('\n'));
    } else {
      displayTable(unpaidBookings);
    }
    
    // Export if requested
    if (options.export) {
      await exportResults(unpaidBookings, options.export);
    }
    
    // Delete if requested
    if (options.delete || options.dryRun) {
      await deleteUnpaidBookings(unpaidBookings, options.dryRun);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await db.destroy();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getUnpaidBookings,
  formatBookingData,
  deleteUnpaidBookings
};