/**
 * Database Configuration Test Script
 * Tests if environment variables are being loaded correctly
 */

// Load environment variables and override system env vars
require('dotenv').config({ override: true });

console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT SET');
console.log('DB_SSL:', process.env.DB_SSL);

console.log('\n=== Testing Database Connection ===');

// Test with raw pg client
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

console.log('Attempting to connect with parameters:');
console.log('- Host:', client.host);
console.log('- Port:', client.port);
console.log('- Database:', client.database);
console.log('- User:', client.user);
console.log('- Password:', client.password ? '***HIDDEN***' : 'NOT SET');

client.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL successfully!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('📊 Database version:', result.rows[0].version);
    return client.query('SELECT current_database(), current_user');
  })
  .then(result => {
    console.log('🗃️  Current database:', result.rows[0].current_database);
    console.log('👤 Current user:', result.rows[0].current_user);
  })
  .catch(err => {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check if the port 5432 is correct');
      console.log('3. Verify the host is accessible');
    } else if (err.code === '28P01') {
      console.log('\n💡 Suggestions:');
      console.log('1. Check your username and password');
      console.log('2. Verify the user has access to the database');
    } else if (err.code === '3D000') {
      console.log('\n💡 Suggestions:');
      console.log('1. The database does not exist');
      console.log('2. Create the database first');
    }
  })
  .finally(() => {
    client.end();
  });
