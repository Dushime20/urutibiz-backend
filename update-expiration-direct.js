require('dotenv').config();
const { Client } = require('pg');

async function updateExpirationHours() {
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
    console.log('✅ Connected to database');
    
    console.log('🔄 Updating booking expiration hours from 4 to 2...');
    
    // Update the setting
    const updateResult = await client.query(`
      UPDATE system_settings 
      SET value = '2', 
          updated_at = NOW()
      WHERE key = 'booking_expiration_hours' 
        AND category = 'booking'
      RETURNING *;
    `);
    
    if (updateResult.rowCount > 0) {
      console.log('✅ Successfully updated booking expiration to 2 hours');
      console.log('\n📋 Updated setting:');
      console.log(JSON.stringify(updateResult.rows[0], null, 2));
    } else {
      console.log('⚠️  No rows updated. Setting might not exist yet.');
      
      // Try to check if the table exists
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'system_settings'
        );
      `);
      
      if (checkTable.rows[0].exists) {
        console.log('💡 Table exists but setting not found. Checking what settings exist...');
        const settings = await client.query(`
          SELECT key, value, category 
          FROM system_settings 
          WHERE category = 'booking' 
          LIMIT 5;
        `);
        console.log('Booking settings:', settings.rows);
      } else {
        console.log('💡 system_settings table does not exist. Run migrations first.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

updateExpirationHours();
