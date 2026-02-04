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

async function checkExpirationLogic() {
  try {
    console.log('🔍 CHECKING BOOKING EXPIRATION LOGIC...\n');
    
    // 1. Check system settings
    console.log('📋 SYSTEM SETTINGS:');
    const settings = await db('system_settings')
      .select('key', 'value', 'category')
      .where('category', 'booking')
      .whereIn('key', ['booking_expiration_hours', 'booking_expiration_enabled']);
    
    if (settings.length === 0) {
      console.log('   ❌ No booking expiration settings found!');
      console.log('   Creating default settings...');
      
      // Create default settings
      await db('system_settings').insert([
        {
          key: 'booking_expiration_hours',
          value: '2',
          category: 'booking',
          description: 'Hours after confirmation before booking expires',
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        },
        {
          key: 'booking_expiration_enabled',
          value: 'true',
          category: 'booking',
          description: 'Enable automatic booking expiration',
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        }
      ]);
      
      console.log('   ✅ Default settings created');
    } else {
      settings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value}`);
      });
    }
    
    // 2. Check current booking expiration data
    console.log('\n📊 CURRENT BOOKING EXPIRATION DATA:');
    const booking = await db('bookings')
      .select('id', 'booking_number', 'status', 'payment_status', 'confirmed_at', 'expires_at', 'is_expired', 'expired_at')
      .where('payment_status', 'pending')
      .first();
    
    if (booking) {
      console.log(`   Booking ID: ${booking.id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment Status: ${booking.payment_status}`);
      console.log(`   Confirmed At: ${booking.confirmed_at || 'Not confirmed'}`);
      console.log(`   Expires At: ${booking.expires_at || 'Not set'}`);
      console.log(`   Is Expired: ${booking.is_expired}`);
      console.log(`   Expired At: ${booking.expired_at || 'Not expired'}`);
      
      // Check if expiration should be set
      if (booking.status === 'confirmed' && !booking.expires_at) {
        console.log('\n   ⚠️  ISSUE: Confirmed booking has no expiration time set!');
      }
    } else {
      console.log('   No pending bookings found');
    }
    
    // 3. Check if expiration logs table exists
    console.log('\n📝 EXPIRATION LOGS TABLE:');
    try {
      const logCount = await db('booking_expiration_logs').count('* as count').first();
      console.log(`   Total expiration logs: ${logCount.count}`);
    } catch (error) {
      console.log('   ❌ booking_expiration_logs table does not exist');
      console.log('   Creating expiration logs table...');
      
      try {
        await db.schema.createTable('booking_expiration_logs', (table) => {
          table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
          table.uuid('booking_id').notNullable();
          table.string('booking_reference');
          table.uuid('user_id');
          table.string('product_title');
          table.timestamp('booking_created_at');
          table.timestamp('booking_expires_at');
          table.integer('expiration_hours_used');
          table.string('booking_status');
          table.decimal('booking_amount', 10, 2);
          table.text('deletion_reason');
          table.jsonb('booking_data');
          table.timestamp('expired_at').defaultTo(db.fn.now());
          table.string('expired_by').defaultTo('system');
          table.timestamp('created_at').defaultTo(db.fn.now());
          
          table.index(['booking_id']);
          table.index(['expired_at']);
          table.index(['user_id']);
        });
        
        console.log('   ✅ Expiration logs table created');
      } catch (createError) {
        console.log('   ❌ Failed to create expiration logs table:', createError.message);
      }
    }
    
    // 4. Check current time vs booking expiration
    if (booking && booking.expires_at) {
      const now = new Date();
      const expiresAt = new Date(booking.expires_at);
      const isExpired = now > expiresAt;
      const timeUntilExpiry = expiresAt - now;
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
      
      console.log('\n⏰ EXPIRATION TIMING:');
      console.log(`   Current Time: ${now.toISOString()}`);
      console.log(`   Expires At: ${expiresAt.toISOString()}`);
      console.log(`   Is Expired: ${isExpired}`);
      console.log(`   Hours Until Expiry: ${hoursUntilExpiry.toFixed(2)}`);
    }
    
    // 5. Test the expiration service
    console.log('\n🧪 TESTING EXPIRATION SERVICE:');
    try {
      // Import and test the service
      const { BookingExpirationService } = require('./src/services/bookingExpiration.service');
      
      const settings = await BookingExpirationService.getExpirationSettings();
      console.log('   Settings:', settings);
      
      const expiredBookings = await BookingExpirationService.findExpiredBookings();
      console.log(`   Found ${expiredBookings.length} expired bookings`);
      
      if (expiredBookings.length > 0) {
        expiredBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.id} - ${booking.booking_number} (expired: ${booking.expires_at})`);
        });
      }
      
    } catch (serviceError) {
      console.log('   ❌ Error testing expiration service:', serviceError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.destroy();
  }
}

checkExpirationLogic();