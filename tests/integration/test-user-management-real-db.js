/**
 * User Management Test with Real Database
 * Tests user CRUD operations with Neon database
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ override: true });

// Database connection
const client = new Client({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`,
  connectionTimeoutMillis: 15000,
});

console.log('🔗 Testing User Management with Real Database');
console.log('📍 Database:', process.env.DB_NAME, 'on', process.env.DB_HOST);

async function createUsersTable() {
  try {
    console.log('\n📋 Creating users table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        profile_image_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active',
        role VARCHAR(20) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT false,
        phone_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
  } catch (error) {
    console.error('❌ Error creating users table:', error.message);
    throw error;
  }
}

async function testUserOperations() {
  try {
    // 1. Create a test user
    console.log('\n👤 Testing user creation...');
    const testEmail = `test.user.${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('testpassword123', 12);
    
    const createResult = await client.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, role, created_at
    `, ['John', 'Doe', testEmail, passwordHash, '+1234567890', 'user']);
    
    const newUser = createResult.rows[0];
    console.log('✅ User created:', {
      id: newUser.id,
      name: `${newUser.first_name} ${newUser.last_name}`,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    });

    // 2. Read the user
    console.log('\n📖 Testing user retrieval...');
    const readResult = await client.query(
      'SELECT id, first_name, last_name, email, role, status, created_at FROM users WHERE id = $1',
      [newUser.id]
    );
    
    if (readResult.rows.length > 0) {
      console.log('✅ User retrieved successfully');
    } else {
      console.log('❌ User not found');
    }

    // 3. Update the user
    console.log('\n✏️ Testing user update...');
    await client.query(`
      UPDATE users 
      SET first_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, ['Jane', '+0987654321', newUser.id]);
    
    const updatedResult = await client.query(
      'SELECT first_name, phone, updated_at FROM users WHERE id = $1',
      [newUser.id]
    );
    
    console.log('✅ User updated:', updatedResult.rows[0]);

    // 4. List users with pagination
    console.log('\n📋 Testing user listing...');
    const listResult = await client.query(`
      SELECT id, first_name, last_name, email, role, status, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`✅ Found ${listResult.rows.length} users:`);
    listResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });

    // 5. Test user search
    console.log('\n🔍 Testing user search...');
    const searchResult = await client.query(`
      SELECT id, first_name, last_name, email
      FROM users 
      WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
      LIMIT 3
    `, ['%jane%']);
    
    console.log(`✅ Search results: ${searchResult.rows.length} users found`);

    // 6. Test password verification
    console.log('\n🔐 Testing password verification...');
    const userWithPassword = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [newUser.id]
    );
    
    const isValidPassword = await bcrypt.compare('testpassword123', userWithPassword.rows[0].password_hash);
    console.log('✅ Password verification:', isValidPassword ? 'PASSED' : 'FAILED');

    // 7. Clean up - Delete test user
    console.log('\n🗑️ Cleaning up test data...');
    await client.query('DELETE FROM users WHERE id = $1', [newUser.id]);
    console.log('✅ Test user deleted');

    return {
      success: true,
      userId: newUser.id,
      operations: ['create', 'read', 'update', 'list', 'search', 'password_verify', 'delete']
    };

  } catch (error) {
    console.error('❌ Error in user operations:', error.message);
    throw error;
  }
}

async function getDatabaseStats() {
  try {
    console.log('\n📊 Database Statistics:');
    
    // Check total users
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Total users: ${userCount.rows[0].count}`);
    
    // Check user roles distribution
    const roleStats = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    console.log('   User roles:');
    roleStats.rows.forEach(role => {
      console.log(`     ${role.role}: ${role.count}`);
    });

    // Check recent users
    const recentUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    console.log(`   Users created in last 7 days: ${recentUsers.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
  }
}

async function runUserManagementTest() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Neon database!');

    // Create table
    await createUsersTable();

    // Get initial stats
    await getDatabaseStats();

    // Run user management tests
    const testResult = await testUserOperations();

    // Get final stats
    await getDatabaseStats();

    console.log('\n🎉 User Management Test Completed Successfully!');
    console.log('✅ All operations working with real database');
    
    return testResult;

  } catch (error) {
    console.error('\n💥 User Management Test Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   - Check if Neon database is active (not sleeping)');
      console.error('   - Verify network connectivity');
      console.error('   - Check firewall settings');
    }
    
    return { success: false, error: error.message };
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (e) {
      console.log('⚠️ Error closing connection:', e.message);
    }
  }
}

// Set global timeout
setTimeout(() => {
  console.log('\n⏰ Test timed out after 30 seconds');
  console.log('💡 This usually indicates network connectivity issues');
  process.exit(1);
}, 30000);

// Run the test
runUserManagementTest()
  .then((result) => {
    if (result.success) {
      console.log('\n🚀 Ready to test user management endpoints!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
