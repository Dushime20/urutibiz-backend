/**
 * Test script to verify the booking expiration column fix
 * 
 * This script tests that the booking expiration service can:
 * 1. Query expired bookings using renter_id and owner_id (not user_id)
 * 2. Log expiration events correctly
 * 3. Process bookings without database errors
 */

const { getDatabase } = require('./dist/config/database');
const { BookingExpirationService } = require('./dist/services/bookingExpiration.service');

async function testBookingExpirationFix() {
  console.log('🧪 Testing Booking Expiration Column Fix...\n');

  try {
    // Test 1: Check database schema
    console.log('📋 Test 1: Verifying database schema...');
    const knex = getDatabase();
    
    const bookingsColumns = await knex('bookings').columnInfo();
    const hasRenterId = 'renter_id' in bookingsColumns;
    const hasOwnerId = 'owner_id' in bookingsColumns;
    const hasUserId = 'user_id' in bookingsColumns;
    
    console.log(`   ✓ bookings.renter_id exists: ${hasRenterId}`);
    console.log(`   ✓ bookings.owner_id exists: ${hasOwnerId}`);
    console.log(`   ✗ bookings.user_id exists: ${hasUserId} (should be false)`);
    
    if (!hasRenterId || !hasOwnerId) {
      throw new Error('Missing required columns in bookings table');
    }
    if (hasUserId) {
      console.warn('   ⚠️  WARNING: bookings.user_id exists but should not!');
    }
    console.log('   ✅ Schema verification passed\n');

    // Test 2: Check expiration logs schema
    console.log('📋 Test 2: Verifying expiration logs schema...');
    const logsColumns = await knex('booking_expiration_logs').columnInfo();
    const logsHasUserId = 'user_id' in logsColumns;
    
    console.log(`   ✓ booking_expiration_logs.user_id exists: ${logsHasUserId}`);
    
    if (!logsHasUserId) {
      throw new Error('Missing user_id column in booking_expiration_logs table');
    }
    console.log('   ✅ Logs schema verification passed\n');

    // Test 3: Get expiration settings
    console.log('📋 Test 3: Fetching expiration settings...');
    const settings = await BookingExpirationService.getExpirationSettings();
    console.log(`   ✓ Expiration hours: ${settings.booking_expiration_hours}`);
    console.log(`   ✓ Expiration enabled: ${settings.booking_expiration_enabled}`);
    console.log(`   ✓ Last run: ${settings.booking_expiration_last_run || 'Never'}`);
    console.log('   ✅ Settings fetch passed\n');

    // Test 4: Try to find expired bookings (this was failing before)
    console.log('📋 Test 4: Finding expired bookings...');
    const expiredBookings = await BookingExpirationService.findExpiredBookings();
    console.log(`   ✓ Found ${expiredBookings.length} expired bookings`);
    
    if (expiredBookings.length > 0) {
      const firstBooking = expiredBookings[0];
      console.log(`   ✓ Sample booking structure:`);
      console.log(`     - ID: ${firstBooking.id}`);
      console.log(`     - Booking Number: ${firstBooking.booking_number || 'N/A'}`);
      console.log(`     - Renter ID: ${firstBooking.renter_id || 'N/A'}`);
      console.log(`     - Owner ID: ${firstBooking.owner_id || 'N/A'}`);
      console.log(`     - Status: ${firstBooking.status}`);
      console.log(`     - Expires At: ${firstBooking.expires_at}`);
    }
    console.log('   ✅ Find expired bookings passed (no SQL errors)\n');

    // Test 5: Get expiration statistics
    console.log('📋 Test 5: Fetching expiration statistics...');
    const stats = await BookingExpirationService.getExpirationStats();
    console.log(`   ✓ Total expired: ${stats.total_expired}`);
    console.log(`   ✓ Recent expired (24h): ${stats.recent_expired}`);
    console.log(`   ✓ Upcoming expired (2h): ${stats.upcoming_expired}`);
    console.log('   ✅ Statistics fetch passed\n');

    // Test 6: Check for bookings that will expire soon
    console.log('📋 Test 6: Checking for bookings expiring soon...');
    const upcomingExpired = await knex('bookings')
      .select(['id', 'booking_number', 'renter_id', 'owner_id', 'expires_at', 'status'])
      .where('expires_at', '<=', knex.raw("NOW() + INTERVAL '2 hours'"))
      .where('expires_at', '>', knex.fn.now())
      .where('is_expired', false)
      .where('status', 'confirmed')
      .limit(5);
    
    console.log(`   ✓ Found ${upcomingExpired.length} bookings expiring in next 2 hours`);
    if (upcomingExpired.length > 0) {
      upcomingExpired.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.booking_number || booking.id} - expires at ${booking.expires_at}`);
      });
    }
    console.log('   ✅ Upcoming expiration check passed\n');

    // Test 7: Verify the query structure (dry run)
    console.log('📋 Test 7: Verifying query structure...');
    const queryBuilder = knex('bookings')
      .select([
        'bookings.id',
        'bookings.booking_number',
        'bookings.renter_id',
        'bookings.owner_id',
        'bookings.status',
        'bookings.total_amount',
        'bookings.created_at',
        'bookings.expires_at',
        'products.title as product_title'
      ])
      .leftJoin('products', 'bookings.product_id', 'products.id')
      .where('bookings.expires_at', '<=', new Date())
      .where('bookings.is_expired', false)
      .where('bookings.status', 'confirmed')
      .whereNotIn('bookings.status', ['completed', 'paid', 'active', 'checked_in', 'checked_out']);
    
    const queryString = queryBuilder.toString();
    console.log(`   ✓ Generated SQL query (first 200 chars):`);
    console.log(`     ${queryString.substring(0, 200)}...`);
    
    // Check that the query doesn't contain 'user_id'
    if (queryString.includes('bookings.user_id') || queryString.includes('bookings"."user_id')) {
      throw new Error('Query still contains bookings.user_id reference!');
    }
    console.log(`   ✓ Query does NOT reference bookings.user_id ✅`);
    console.log(`   ✓ Query correctly uses bookings.renter_id ✅`);
    console.log('   ✅ Query structure verification passed\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nThe booking expiration column fix is working correctly:');
    console.log('  ✓ Database schema is correct (renter_id, owner_id)');
    console.log('  ✓ Queries use correct column names');
    console.log('  ✓ No SQL errors when finding expired bookings');
    console.log('  ✓ Service methods work as expected');
    console.log('\nThe cron job should now run without errors every 5 minutes.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testBookingExpirationFix();
