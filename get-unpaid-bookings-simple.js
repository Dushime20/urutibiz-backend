#!/usr/bin/env node

/**
 * Simple script to get unpaid bookings
 * 
 * This script identifies bookings that have not been paid for.
 * No external dependencies required - uses only Node.js built-ins and knex.
 * 
 * Usage:
 *   node get-unpaid-bookings-simple.js
 */

const knex = require('knex');

// Database configuration - update these values for your environment
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'urutibiz'
  }
};

// Initialize database connection
const db = knex(dbConfig);

/**
 * Get unpaid bookings from database
 */
async function getUnpaidBookings() {
  try {
    console.log('🔍 Searching for unpaid bookings...\n');
    
    // Get bookings with unpaid status
    const unpaidBookings = await db('bookings')
      .select([
        // Basic booking info
        'bookings.id',
        'bookings.booking_number',
        'bookings.status as booking_status',
        'bookings.payment_status',
        
        // Financial info
        'bookings.total_amount',
        'bookings.base_amount',
        'bookings.platform_fee',
        'bookings.tax_amount',
        'bookings.security_deposit',
        'bookings.insurance_premium',
        
        // Dates and times
        'bookings.start_date',
        'bookings.end_date',
        'bookings.pickup_time',
        'bookings.return_time',
        'bookings.created_at',
        'bookings.updated_at',
        'bookings.confirmed_at',
        'bookings.started_at',
        'bookings.completed_at',
        'bookings.cancelled_at',
        'bookings.expires_at',
        'bookings.expired_at',
        'bookings.actual_return_date',
        
        // Owner confirmation info
        'bookings.owner_confirmed',
        'bookings.owner_confirmation_status',
        'bookings.owner_confirmed_at',
        'bookings.owner_rejection_reason',
        'bookings.owner_confirmation_notes',
        
        // Location and delivery
        'bookings.pickup_method',
        'bookings.pickup_address',
        'bookings.delivery_address',
        'bookings.meet_public_location',
        'bookings.delivery_time_window',
        'bookings.return_location',
        
        // Insurance and risk
        'bookings.insurance_type',
        'bookings.insurance_policy_number',
        'bookings.ai_risk_score',
        
        // Condition and notes
        'bookings.initial_condition',
        'bookings.final_condition',
        'bookings.damage_report',
        'bookings.special_instructions',
        'bookings.renter_notes',
        'bookings.owner_notes',
        'bookings.admin_notes',
        
        // Status flags
        'bookings.is_repeat_booking',
        'bookings.is_expired',
        'bookings.returned_early',
        'bookings.reminders_enabled',
        
        // User info
        'renter.email as renter_email',
        'renter.first_name as renter_first_name',
        'renter.last_name as renter_last_name',
        'renter.phone as renter_phone',
        'owner.email as owner_email',
        'owner.first_name as owner_first_name',
        'owner.last_name as owner_last_name',
        'owner.phone as owner_phone',
        
        // Product info
        'products.title as product_title'
      ])
      .leftJoin('users as renter', 'bookings.renter_id', 'renter.id')
      .leftJoin('users as owner', 'bookings.owner_id', 'owner.id')
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .whereIn('bookings.payment_status', ['pending', 'processing', 'failed'])
      .whereNot('bookings.status', 'cancelled')
      .orderBy('bookings.created_at', 'desc');
    
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
 * Display results with complete booking information
 */
function displayResults(bookings) {
  if (bookings.length === 0) return;
  
  console.log('📊 DETAILED UNPAID BOOKINGS REPORT');
  console.log('='.repeat(120));
  
  bookings.forEach((booking, index) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`\n${index + 1}. 📋 BOOKING DETAILS`);
    console.log('─'.repeat(80));
    
    // Basic Info
    console.log(`   🆔 Booking ID: ${booking.id}`);
    console.log(`   📄 Booking Number: ${booking.booking_number || 'N/A'}`);
    console.log(`   📊 Status: ${booking.booking_status} | Payment: ${booking.payment_status}`);
    
    // Financial Information
    console.log(`\n   💰 FINANCIAL DETAILS:`);
    console.log(`      Total Amount: $${parseFloat(booking.total_amount || 0).toFixed(2)}`);
    console.log(`      Base Amount: $${parseFloat(booking.base_amount || 0).toFixed(2)}`);
    console.log(`      Platform Fee: $${parseFloat(booking.platform_fee || 0).toFixed(2)}`);
    console.log(`      Tax Amount: $${parseFloat(booking.tax_amount || 0).toFixed(2)}`);
    console.log(`      Security Deposit: $${parseFloat(booking.security_deposit || 0).toFixed(2)}`);
    if (booking.insurance_premium) {
      console.log(`      Insurance Premium: $${parseFloat(booking.insurance_premium).toFixed(2)}`);
    }
    
    // Dates and Confirmation Status
    console.log(`\n   📅 DATES & CONFIRMATION:`);
    console.log(`      Rental Period: ${new Date(booking.start_date).toLocaleString()} - ${new Date(booking.end_date).toLocaleString()}`);
    if (booking.pickup_time) console.log(`      Pickup Time: ${booking.pickup_time}`);
    if (booking.return_time) console.log(`      Return Time: ${booking.return_time}`);
    console.log(`      Created: ${new Date(booking.created_at).toLocaleString()} (${daysSinceCreated} days ago)`);
    if (booking.updated_at) console.log(`      Updated: ${new Date(booking.updated_at).toLocaleString()}`);
    if (booking.confirmed_at) console.log(`      ✅ Confirmed: ${new Date(booking.confirmed_at).toLocaleString()}`);
    if (booking.started_at) console.log(`      🚀 Started: ${new Date(booking.started_at).toLocaleString()}`);
    if (booking.completed_at) console.log(`      ✅ Completed: ${new Date(booking.completed_at).toLocaleString()}`);
    if (booking.cancelled_at) console.log(`      ❌ Cancelled: ${new Date(booking.cancelled_at).toLocaleString()}`);
    if (booking.expires_at) console.log(`      ⏰ Expires: ${new Date(booking.expires_at).toLocaleString()}`);
    if (booking.expired_at) console.log(`      ⏰ Expired: ${new Date(booking.expired_at).toLocaleString()}`);
    
    // Owner Confirmation
    console.log(`\n   👤 OWNER CONFIRMATION:`);
    console.log(`      Owner Confirmed: ${booking.owner_confirmed ? 'Yes' : 'No'}`);
    console.log(`      Confirmation Status: ${booking.owner_confirmation_status || 'N/A'}`);
    if (booking.owner_confirmed_at) console.log(`      Confirmed At: ${new Date(booking.owner_confirmed_at).toLocaleString()}`);
    if (booking.owner_rejection_reason) console.log(`      Rejection Reason: ${booking.owner_rejection_reason}`);
    if (booking.owner_confirmation_notes) console.log(`      Owner Notes: ${booking.owner_confirmation_notes}`);
    
    // People Involved
    console.log(`\n   👥 PEOPLE:`);
    console.log(`      Renter: ${booking.renter_first_name} ${booking.renter_last_name}`);
    console.log(`      Renter Email: ${booking.renter_email}`);
    if (booking.renter_phone) console.log(`      Renter Phone: ${booking.renter_phone}`);
    console.log(`      Owner: ${booking.owner_first_name} ${booking.owner_last_name}`);
    console.log(`      Owner Email: ${booking.owner_email}`);
    if (booking.owner_phone) console.log(`      Owner Phone: ${booking.owner_phone}`);
    
    // Product and Location
    console.log(`\n   🏠 PRODUCT & LOCATION:`);
    console.log(`      Product: ${booking.product_title || 'N/A'}`);
    console.log(`      Pickup Method: ${booking.pickup_method || 'N/A'}`);
    if (booking.pickup_address) console.log(`      Pickup Address: ${booking.pickup_address}`);
    if (booking.delivery_address) console.log(`      Delivery Address: ${booking.delivery_address}`);
    if (booking.meet_public_location) console.log(`      Public Meeting Location: ${booking.meet_public_location}`);
    if (booking.delivery_time_window) console.log(`      Delivery Window: ${booking.delivery_time_window}`);
    if (booking.return_location) console.log(`      Return Location: ${booking.return_location}`);
    
    // Insurance and Risk
    if (booking.insurance_type || booking.ai_risk_score) {
      console.log(`\n   🛡️ INSURANCE & RISK:`);
      if (booking.insurance_type) console.log(`      Insurance Type: ${booking.insurance_type}`);
      if (booking.insurance_policy_number) console.log(`      Policy Number: ${booking.insurance_policy_number}`);
      if (booking.ai_risk_score) console.log(`      AI Risk Score: ${booking.ai_risk_score}`);
    }
    
    // Condition and Notes
    if (booking.initial_condition || booking.final_condition || booking.damage_report || 
        booking.special_instructions || booking.renter_notes || booking.owner_notes || booking.admin_notes) {
      console.log(`\n   📝 CONDITION & NOTES:`);
      if (booking.initial_condition) console.log(`      Initial Condition: ${booking.initial_condition}`);
      if (booking.final_condition) console.log(`      Final Condition: ${booking.final_condition}`);
      if (booking.damage_report) console.log(`      Damage Report: ${booking.damage_report}`);
      if (booking.special_instructions) console.log(`      Special Instructions: ${booking.special_instructions}`);
      if (booking.renter_notes) console.log(`      Renter Notes: ${booking.renter_notes}`);
      if (booking.owner_notes) console.log(`      Owner Notes: ${booking.owner_notes}`);
      if (booking.admin_notes) console.log(`      Admin Notes: ${booking.admin_notes}`);
    }
    
    // Status Flags
    const flags = [];
    if (booking.is_repeat_booking) flags.push('Repeat Booking');
    if (booking.is_expired) flags.push('Expired');
    if (booking.returned_early) flags.push('Returned Early');
    if (booking.reminders_enabled) flags.push('Reminders Enabled');
    
    if (flags.length > 0) {
      console.log(`\n   🏷️ FLAGS: ${flags.join(', ')}`);
    }
    
    // Return Information
    if (booking.actual_return_date) {
      console.log(`\n   🔄 RETURN INFO:`);
      console.log(`      Actual Return Date: ${new Date(booking.actual_return_date).toLocaleString()}`);
      if (booking.returned_early) console.log(`      Returned Early: Yes`);
    }
  });
  
  console.log('\n' + '='.repeat(120));
}

/**
 * Get payment transactions for unpaid bookings
 */
async function getPaymentTransactions(bookingIds) {
  if (bookingIds.length === 0) return [];
  
  try {
    const transactions = await db('payment_transactions')
      .select([
        'id',
        'booking_id',
        'transaction_type',
        'amount',
        'currency',
        'status',
        'provider',
        'failure_reason',
        'created_at'
      ])
      .whereIn('booking_id', bookingIds)
      .orderBy('created_at', 'desc');
    
    return transactions;
  } catch (error) {
    console.error('❌ Error fetching payment transactions:', error.message);
    return [];
  }
}

/**
 * Display payment transaction details
 */
function displayTransactions(transactions) {
  if (transactions.length === 0) {
    console.log('📝 No payment transactions found for these bookings.\n');
    return;
  }
  
  console.log(`\n📝 PAYMENT TRANSACTIONS (${transactions.length} found)`);
  console.log('-'.repeat(80));
  
  transactions.forEach((txn, index) => {
    console.log(`\n${index + 1}. Transaction ID: ${txn.id}`);
    console.log(`   Booking ID: ${txn.booking_id}`);
    console.log(`   Type: ${txn.transaction_type} | Status: ${txn.status}`);
    console.log(`   Amount: ${txn.amount} ${txn.currency} | Provider: ${txn.provider}`);
    if (txn.failure_reason) {
      console.log(`   Failure Reason: ${txn.failure_reason}`);
    }
    console.log(`   Created: ${new Date(txn.created_at).toLocaleString()}`);
  });
  
  console.log('\n' + '-'.repeat(80));
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting unpaid bookings analysis...\n');
    
    // Get unpaid bookings
    const unpaidBookings = await getUnpaidBookings();
    
    // Display results
    displayResults(unpaidBookings);
    
    // Get and display payment transactions
    if (unpaidBookings.length > 0) {
      const bookingIds = unpaidBookings.map(b => b.id);
      const transactions = await getPaymentTransactions(bookingIds);
      displayTransactions(transactions);
    }
    
    // Summary statistics
    if (unpaidBookings.length > 0) {
      const statusCounts = unpaidBookings.reduce((acc, booking) => {
        acc[booking.payment_status] = (acc[booking.payment_status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 SUMMARY STATISTICS');
      console.log('-'.repeat(30));
      console.log(`Total unpaid bookings: ${unpaidBookings.length}`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // Age analysis
      const now = Date.now();
      const ageGroups = {
        '< 1 day': 0,
        '1-7 days': 0,
        '1-4 weeks': 0,
        '> 1 month': 0
      };
      
      unpaidBookings.forEach(booking => {
        const ageInDays = (now - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 1) ageGroups['< 1 day']++;
        else if (ageInDays <= 7) ageGroups['1-7 days']++;
        else if (ageInDays <= 28) ageGroups['1-4 weeks']++;
        else ageGroups['> 1 month']++;
      });
      
      console.log('\nAge distribution:');
      Object.entries(ageGroups).forEach(([age, count]) => {
        if (count > 0) console.log(`  ${age}: ${count}`);
      });
    }
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
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
  displayResults,
  getPaymentTransactions
};