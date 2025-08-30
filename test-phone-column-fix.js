const knex = require('knex');

// Database configuration
const db = knex({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2001',
    database: 'rent_db',
    ssl: false
  }
});

async function testPhoneColumnFix() {
  try {
    console.log('🔍 Testing phone column fix...');
    
    // Test 1: Check if users table has phone column
    console.log('\n📋 Test 1: Checking users table structure...');
    const usersColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone', 'phone_number', 'phone_verified')
      ORDER BY column_name
    `);
    
    console.log('Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Test 2: Check if we can update phone_verified without errors
    console.log('\n📋 Test 2: Testing phone_verified update...');
    
    // Get a sample user
    const sampleUser = await db('users').first();
    if (!sampleUser) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found sample user: ${sampleUser.email}`);
    
    // Test updating phone_verified (this should work now)
    const updateResult = await db('users')
      .where({ id: sampleUser.id })
      .update({ 
        phone_verified: true,
        updated_at: new Date()
      });
    
    console.log(`✅ Successfully updated phone_verified for user ${sampleUser.id}`);
    console.log(`   - Rows affected: ${updateResult}`);
    
    // Test 3: Check if we can update phone field
    console.log('\n📋 Test 3: Testing phone field update...');
    
    const phoneUpdateResult = await db('users')
      .where({ id: sampleUser.id })
      .update({ 
        phone: '+250788123456',
        updated_at: new Date()
      });
    
    console.log(`✅ Successfully updated phone field for user ${sampleUser.id}`);
    console.log(`   - Rows affected: ${phoneUpdateResult}`);
    
    // Test 4: Verify the update worked
    const updatedUser = await db('users').where({ id: sampleUser.id }).first();
    console.log(`✅ Verification - Updated user:`);
    console.log(`   - phone: ${updatedUser.phone}`);
    console.log(`   - phone_verified: ${updatedUser.phone_verified}`);
    
    console.log('\n🎉 All tests passed! The phone column issue has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('phone_number')) {
      console.log('🔍 The phone_number column issue still exists');
    } else if (error.message.includes('phone')) {
      console.log('🔍 There might be an issue with the phone column');
    } else {
      console.log('🔍 Unexpected error occurred');
    }
  } finally {
    await db.destroy();
  }
}

// Run the test
testPhoneColumnFix();
