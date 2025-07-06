/**
 * Test Neon Database with Connection String
 */

const { Client } = require('pg');
require('dotenv').config({ override: true });

// Build connection string format that Neon prefers
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

console.log('=== Testing Neon Database with Connection String ===');
console.log('Connection string format (password hidden):');
console.log(connectionString.replace(/:([^:@]+)@/, ':***@'));

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📊 Current database time:', result.rows[0].current_time);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    if (error.message.includes('timeout')) {
      console.error('   💡 This appears to be a timeout. Check:');
      console.error('      - Network connectivity');
      console.error('      - Firewall settings');
      console.error('      - Neon database is active (not sleeping)');
    }
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Connection closed');
    } catch (e) {
      console.log('\n⚠️  Error closing connection:', e.message);
    }
  }
}

// Set a global timeout
setTimeout(() => {
  console.log('\n⏰ Test timed out after 15 seconds');
  process.exit(1);
}, 15000);

testConnection();
