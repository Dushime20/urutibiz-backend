require('dotenv').config();
const { Client } = require('pg');

async function fixExistingBookingExpirations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'urutibiz_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');
    
    // Get expiration hours setting
    const settingResult = await client.query(`
      SELECT value FROM system_settings 
      WHERE key = 'booking_expiration_hours' 
        AND category = 'booking'
    `);
    const expirationHours = parseInt(settingResult.rows[0]?.value || '2');
    console.log(`📋 Using expiration hours: ${expirationHours}\n`);
    
    // Find confirmed bookings with pending/failed payment that need expiration fix
    console.log('🔍 Finding confirmed bookings that need expiration fix...\n');
    const bookingsToFix = await client.query(`
      SELECT 
        id,
        booking_number,
        status,
        payment_status,
        created_at,
        confirmed_at,
        expires_at,
        EXTRACT(EPOCH FROM (expires_at - COALESCE(confirmed_at, created_at)))/3600 as current_hours_from_confirmation
      FROM bookings
      WHERE status = 'confirmed'
        AND payment_status IN ('pending', 'failed')
        AND expires_at IS NOT NULL
        AND (
          confirmed_at IS NULL 
          OR EXTRACT(EPOCH FROM (expires_at - confirmed_at))/3600 != $1
        )
      ORDER BY created_at DESC;
    `, [expirationHours]);
    
    if (bookingsToFix.rows.length === 0) {
      console.log('✅ No bookings need fixing. All expiration times are correct!');
      return;
    }
    
    console.log(`Found ${bookingsToFix.rows.length} bookings to fix:\n`);
    
    for (const booking of bookingsToFix.rows) {
      console.log(`  Booking: ${booking.booking_number || booking.id}`);
      console.log(`  Current expires_at: ${booking.expires_at}`);
      console.log(`  Confirmed at: ${booking.confirmed_at || 'NOT SET'}`);
      console.log(`  Hours from confirmation: ${booking.current_hours_from_confirmation?.toFixed(2) || 'N/A'}`);
      
      // Calculate correct expiration time
      const baseTime = booking.confirmed_at || booking.created_at;
      const correctExpiresAt = new Date(baseTime);
      correctExpiresAt.setHours(correctExpiresAt.getHours() + expirationHours);
      
      console.log(`  Should expire at: ${correctExpiresAt.toISOString()}`);
      
      // Update the booking
      await client.query(`
        UPDATE bookings 
        SET expires_at = $1,
            confirmed_at = COALESCE(confirmed_at, created_at),
            updated_at = NOW()
        WHERE id = $2
      `, [correctExpiresAt, booking.id]);
      
      console.log(`  ✅ Fixed!\n`);
    }
    
    console.log(`\n✅ Successfully fixed ${bookingsToFix.rows.length} bookings`);
    
    // Show summary
    console.log('\n📊 Summary of confirmed bookings with pending payment:');
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as already_expired,
        COUNT(CASE WHEN expires_at >= NOW() THEN 1 END) as still_active
      FROM bookings
      WHERE status = 'confirmed'
        AND payment_status IN ('pending', 'failed');
    `);
    
    console.log(`  Total: ${summary.rows[0].total}`);
    console.log(`  Already expired: ${summary.rows[0].already_expired}`);
    console.log(`  Still active: ${summary.rows[0].still_active}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done');
    process.exit(0);
  }
}

fixExistingBookingExpirations();
