/**
 * Simple User Service Test
 * Tests if UserService can connect and work with real database
 */

// Set up environment first
require('dotenv').config({ override: true });

// Import after setting up environment
const path = require('path');

console.log('🔍 Testing User Service with Real Database');

async function testUserService() {
  try {
    // Import the compiled JavaScript version
    const { getConfig } = require('./dist/config/config.js');
    const database = require('./dist/config/database.js');
    
    console.log('\n📋 Configuration loaded:');
    const config = getConfig();
    console.log('  Database host:', config.database.host);
    console.log('  Database name:', config.database.name);
    console.log('  Database SSL:', config.database.ssl);
    
    console.log('\n🔌 Testing database connection...');
    const db = database.getDatabase();
    
    // Test basic query
    const result = await db.raw('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connected successfully!');
    console.log('  Current time:', result.rows[0].current_time);
    console.log('  PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    // Test if users table exists
    console.log('\n📋 Checking database schema...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Users table exists');
      
      // Check user count
      const userCount = await db('users').count('id as count').first();
      console.log(`  Total users in database: ${userCount.count}`);
      
      // Check recent users
      const recentUsers = await db('users')
        .select('id', 'first_name', 'last_name', 'email', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(3);
        
      console.log('  Recent users:');
      recentUsers.forEach((user, index) => {
        console.log(`    ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      });
    } else {
      console.log('⚠️ Users table does not exist yet');
      console.log('   Run: npm run db:migrate');
    }
    
    console.log('\n🎉 User service database test completed successfully!');
    
    // Close the connection
    await database.closeDatabase();
    
    return { success: true };
    
  } catch (error) {
    console.error('\n❌ User service test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 Database connection timeout. Check:');
      console.error('   - Neon database is active');
      console.error('   - Network connectivity');
      console.error('   - Firewall settings');
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testUserService()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Ready to test user management functionality!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
