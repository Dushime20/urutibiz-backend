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

async function fixBookingExpiration() {
  try {
    console.log('🔧 FIXING BOOKING EXPIRATION LOGIC...\n');
    
    // 1. Find bookings that should be confirmed but aren't
    console.log('📋 FINDING BOOKINGS WITH CONFIRMATION ISSUES:');
    const problematicBookings = await db('bookings')
      .select('id', 'booking_number', 'status', 'payment_status', 'confirmed_at', 'expires_at', 'owner_confirmed', 'owner_confirmation_status')
      .where('confirmed_at', '!=', null)
      .where('status', '!=', 'confirmed')
      .where('payment_status', 'pending');
    
    console.log(`   Found ${problematicBookings.length} bookings with confirmation issues`);
    
    for (const booking of problematicBookings) {
      console.log(`\n   📄 Booking: ${booking.booking_number}`);
      console.log(`      Status: ${booking.status} (should be 'confirmed')`);
      console.log(`      Owner Confirmed: ${booking.owner_confirmed}`);
      console.log(`      Owner Status: ${booking.owner_confirmation_status}`);
      console.log(`      Confirmed At: ${booking.confirmed_at}`);
      console.log(`      Expires At: ${booking.expires_at || 'Not set'}`);
      
      // Fix 1: Update status to confirmed if owner has confirmed
      if (booking.owner_confirmed && booking.owner_confirmation_status === 'confirmed') {
        console.log('      🔧 Updating status to confirmed...');
        await db('bookings')
          .where('id', booking.id)
          .update({
            status: 'confirmed',
            updated_at: db.fn.now()
          });
        console.log('      ✅ Status updated to confirmed');
      }
      
      // Fix 2: Set expiration time if not set
      if (!booking.expires_at && booking.confirmed_at) {
        console.log('      🔧 Setting expiration time...');
        
        // Get expiration hours from settings (default 2 hours)
        const settingRecord = await db('system_settings')
          .select('value')
          .where('key', 'booking_expiration_hours')
          .where('category', 'booking')
          .first();
        
        const expirationHours = parseInt(settingRecord?.value || '2');
        const confirmedAt = new Date(booking.confirmed_at);
        const expiresAt = new Date(confirmedAt);
        expiresAt.setHours(expiresAt.getHours() + expirationHours);
        
        await db('bookings')
          .where('id', booking.id)
          .update({
            expires_at: expiresAt,
            updated_at: db.fn.now()
          });
        
        console.log(`      ✅ Expiration set to: ${expiresAt.toISOString()}`);
      }
    }
    
    // 2. Check for expired bookings that should be processed
    console.log('\n⏰ CHECKING FOR EXPIRED BOOKINGS:');
    const now = new Date();
    const expiredBookings = await db('bookings')
      .select('id', 'booking_number', 'status', 'payment_status', 'expires_at', 'is_expired')
      .where('expires_at', '<=', now)
      .where('is_expired', false)
      .where('status', 'confirmed')
      .whereIn('payment_status', ['pending', 'failed']);
    
    console.log(`   Found ${expiredBookings.length} expired bookings`);
    
    for (const booking of expiredBookings) {
      console.log(`\n   📄 Expired Booking: ${booking.booking_number}`);
      console.log(`      Expired At: ${booking.expires_at}`);
      console.log(`      Current Time: ${now.toISOString()}`);
      
      const hoursOverdue = (now - new Date(booking.expires_at)) / (1000 * 60 * 60);
      console.log(`      Hours Overdue: ${hoursOverdue.toFixed(2)}`);
      
      // Mark as expired (soft delete approach)
      console.log('      🔧 Marking as expired...');
      await db('bookings')
        .where('id', booking.id)
        .update({
          is_expired: true,
          expired_at: db.fn.now(),
          status: 'expired',
          updated_at: db.fn.now()
        });
      
      console.log('      ✅ Marked as expired');
    }
    
    // 3. Test the cron service status
    console.log('\n🤖 CHECKING CRON SERVICE:');
    try {
      // Check if the server is running the cron service
      const { BookingExpirationCronService } = require('./src/services/bookingExpirationCron.service');
      const status = BookingExpirationCronService.getStatus();
      console.log('   Cron Status:', status);
      
      if (!status.isActive) {
        console.log('   ⚠️  Cron service is not active!');
        console.log('   💡 To fix: Restart the server or manually start the cron service');
      }
    } catch (error) {
      console.log('   ❌ Cannot check cron service:', error.message);
    }
    
    // 4. Manual expiration test
    console.log('\n🧪 MANUAL EXPIRATION TEST:');
    try {
      const { BookingExpirationService } = require('./src/services/bookingExpiration.service');
      
      console.log('   Running manual expiration check...');
      const result = await BookingExpirationService.processExpiredBookings();
      
      console.log(`   ✅ Manual check completed:`);
      console.log(`      Expired: ${result.expired_count}`);
      console.log(`      Processed: ${result.processed_bookings.length}`);
      console.log(`      Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('   ❌ Errors:', result.errors);
      }
      
    } catch (error) {
      console.log('   ❌ Manual test failed:', error.message);
    }
    
    // 5. Summary and recommendations
    console.log('\n📊 SUMMARY & RECOMMENDATIONS:');
    
    const currentBookings = await db('bookings')
      .select('status', 'payment_status', 'expires_at', 'is_expired')
      .count('* as count')
      .groupBy('status', 'payment_status', 'is_expired')
      .having('expires_at', '!=', null);
    
    console.log('   Current booking status distribution:');
    for (const booking of currentBookings) {
      console.log(`      ${booking.status}/${booking.payment_status} (expired: ${booking.is_expired}): ${booking.count}`);
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Ensure booking status is updated to "confirmed" when owner confirms');
    console.log('   2. Set expires_at timestamp when booking is confirmed');
    console.log('   3. Make sure the cron service is running (every 5 minutes)');
    console.log('   4. Monitor expired bookings regularly');
    console.log('   5. Consider sending payment reminders before expiration');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.destroy();
  }
}

fixBookingExpiration();