#!/usr/bin/env node

// Database Connection Test Script
import dotenv from 'dotenv';
import knex from 'knex';

// Load environment variables
dotenv.config();

// Set environment variables if not already set
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5433';
process.env.DB_NAME = process.env.DB_NAME || 'urutibiz_db';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'dushimimana20';

console.log('🔍 Testing database connection...');
console.log(`📊 Host: ${process.env.DB_HOST}`);
console.log(`📊 Port: ${process.env.DB_PORT}`);
console.log(`📊 Database: ${process.env.DB_NAME}`);
console.log(`📊 User: ${process.env.DB_USER}`);
console.log(`📊 Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    min: 1,
    max: 5,
    createTimeoutMillis: 5000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
};

async function testConnection() {
  let db = null;
  
  try {
    console.log('\n🚀 Creating database connection...');
    db = knex(dbConfig);
    
    console.log('✅ Database instance created');
    
    // Test basic connectivity
    console.log('\n🔍 Testing basic connectivity...');
    const result = await db.raw('SELECT 1+1 as result, NOW() as timestamp');
    console.log('✅ Basic query successful:', result.rows[0]);
    
    // Test users table existence
    console.log('\n🔍 Checking users table...');
    const tableCheck = await db.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Test users table structure
      console.log('\n🔍 Checking users table structure...');
      const columns = await db.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Users table columns:');
      columns.rows.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Test a simple query on users table
      console.log('\n🔍 Testing users table query...');
      const userCount = await db.raw('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table query successful. Total users: ${userCount.rows[0].count}`);
      
    } else {
      console.log('⚠️ Users table does not exist');
      console.log('💡 You may need to run database migrations');
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check if the port 5433 is correct');
      console.error('3. Verify the database name exists');
      console.error('4. Check username and password');
    }
    
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testConnection();