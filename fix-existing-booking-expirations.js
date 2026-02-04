#!/usr/bin/env node

/**
 * Fix existing bookings that have owner confirmation but no expiration time set
 */

const knex = require('knex');

const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'urutibiz_db'
  }
});

async function fixExistingBookingExpirations() {
  try {
    console.log('🔧 FIXING EXISTING BOOKING EXPIRATIONS...\n');
    
    // Get expiration hours from settings
    const settingRecord = await db('system_settings')
      .select('value')
      .where('key', 'booking_expiration_hours')
      .where('category', 'booking')
      .first();
    
    const expirationHours = parseInt(settingRecord?.value || '2');
    console.log(`📋 Using expiration hours: ${expirationHours}\n`);
    
    // Find bookings that are owner-confirmed but have no expiration time set
    const bookingsToFix = await db('bookings')
      .select([
        'id', 
        'booking_number', 
        'status', 
        'payment_status', 
        'owner_confirmed', 
        'owner_confirmation_status',
        'confirmed_at',
        'expires_at',
        'created_at'
      ])
      .where('owner_confirmed', true)
      .where('owner_confirmation_status', 'confirmed')
      .whereNotNull('confirmed_at')
      .whereNull('expires_at') // No expiration time set
      .whereIn('payment_status', ['pending', 'failed']); // Only unpaid bookings
    
    console.log(`📊 Found ${bookingsToFix.length} bookings that need expiration times set\n`);
    
    if (bookingsToFix.length === 0) {
      console.log('✅ No bookings need fixing!');
      return;
    }
    
    for (const booking of bookingsToFix) {
      console.log(`🔧 Fixing booking: ${booking.booking_number}`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Status: ${booking.status} | Payment: ${booking.payment_status}`);
      console.log(`   Owner Confirmed: ${booking.owner_confirmed} (${booking.owner_confirmation_status})`);
      console.log(`   Confirmed At: ${new Date(booking.confirmed_at).toLocaleString()}`);
      
      // Calculate expiration time from confirmed_at
      const confirmedAt = new Date(booking.confirmed_at);
      const expiresAt = new Date(confirmedAt);
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      
      console.log(`   Setting Expires At: ${expiresAt.toLocaleString()}`);
      
      // Update the booking with expiration time
      await db('bookings')
        .where('id', booking.id)
        .update({
          expires_at: expiresAt,
          updated_at: db.fn.now()
        });
      
      // Check if already expired
      const now = new Date();
      const isExpired = now > expiresAt;
      const hoursOverdue = isExpired ? (now - expiresAt) / (1000 * 60 * 60) : 0;
      
      if (isExpired) {
        console.log(`   ⚠️  ALREADY EXPIRED by ${hoursOverdue.toFixed(2)} hours!`);
      } else {
        const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
        console.log(`   ⏰ Expires in ${hoursUntilExpiry.toFixed(2)} hours`);
      }
      
      console.log(`   ✅ Fixed!\n`);
    }
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Fixed ${bookingsToFix.length} bookings`);
    
    // Check for any expired bookings after the fix
    const now = new Date();
    const expiredAfterFix = bookingsToFix.filter(booking => {
      const confirmedAt = new Date(booking.confirmed_at);
      const expiresAt = new Date(confirmedAt);
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      return now > expiresAt;
    });
    
    if (expiredAfterFix.length > 0) {
      console.log(`   ⚠️  ${expiredAfterFix.length} bookings are already expired and should be processed`);
      console.log('   💡 Run the expiration service to clean them up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.destroy();
  }
}

fixExistingBookingExpirations();