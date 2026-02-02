require('dotenv').config();
const { Client } = require('pg');

async function checkBookingTimestamps() {
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
    
    // Check bookings table structure
    console.log('📋 Checking bookings table columns related to timestamps...\n');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
        AND column_name LIKE '%at%'
      ORDER BY ordinal_position;
    `);
    
    console.log('Timestamp columns in bookings table:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check confirmed bookings with expiration info
    console.log('\n📊 Checking confirmed bookings with expiration data...\n');
    const bookings = await client.query(`
      SELECT 
        id,
        booking_number,
        status,
        payment_status,
        created_at,
        updated_at,
        expires_at,
        is_expired,
        expired_at,
        EXTRACT(EPOCH FROM (expires_at - created_at))/3600 as hours_from_creation,
        EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_creation,
        EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 as hours_until_expiration
      FROM bookings
      WHERE status = 'confirmed'
        AND payment_status IN ('pending', 'failed')
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    if (bookings.rows.length > 0) {
      console.log('Recent confirmed bookings with pending/failed payment:');
      bookings.rows.forEach(b => {
        console.log(`\n  Booking: ${b.booking_number || b.id}`);
        console.log(`  Status: ${b.status} | Payment: ${b.payment_status}`);
        console.log(`  Created: ${b.created_at}`);
        console.log(`  Expires: ${b.expires_at}`);
        console.log(`  Hours from creation to expiration: ${b.hours_from_creation?.toFixed(2) || 'N/A'}`);
        console.log(`  Hours since creation: ${b.hours_since_creation?.toFixed(2) || 'N/A'}`);
        console.log(`  Hours until expiration: ${b.hours_until_expiration?.toFixed(2) || 'N/A'}`);
        console.log(`  Is expired: ${b.is_expired}`);
      });
    } else {
      console.log('No confirmed bookings with pending/failed payment found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done');
    process.exit(0);
  }
}

checkBookingTimestamps();
