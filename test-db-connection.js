/**
 * Database Connection Test Script
 * Tests if we can connect to the database and perform basic operations
 */

const { getDatabase } = require('./src/config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const db = getDatabase();
    
    // Test basic connection
    console.log('📡 Attempting to connect to database...');
    await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Test if users table exists
    console.log('📋 Checking if users table exists...');
    const tablesResult = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Users table exists');
      
      // Count users
      const userCount = await db('users').count('* as count').first();
      console.log(`👥 Total users: ${userCount.count}`);
    } else {
      console.log('⚠️ Users table does not exist');
    }
    
    // List all tables
    console.log('📊 Available tables:');
    const allTables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection();
