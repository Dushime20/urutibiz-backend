/**
 * Simple Neon Database Connection Test
 */

const { Client } = require('pg');
require('dotenv').config({ override: true });

console.log('=== Testing Neon Database Connection ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_SSL:', process.env.DB_SSL);

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds
});

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📊 Database info:');
    console.log('  Current time:', result.rows[0].current_time);
    console.log('  PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    // Test if any tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 Found ${tablesResult.rows.length} tables in the database`);
    if (tablesResult.rows.length > 0) {
      console.log('  Tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Full error:', error);
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Connection closed');
    } catch (e) {
      console.log('\n⚠️  Error closing connection:', e.message);
    }
  }
}

testConnection();
