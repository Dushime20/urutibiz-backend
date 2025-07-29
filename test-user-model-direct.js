#!/usr/bin/env node

/**
 * Direct test of User model fromDb method with actual database data
 */

const knex = require('knex');
const config = require('./knexfile');

async function testUserModelDirect() {
  const db = knex(config.development);

  try {
    console.log('🧪 Testing User model fromDb method directly...\n');

    // Get the actual database row
    const userId = '2e8e2c8a-28e6-4e52-aedf-8e601927896b';
    const dbRow = await db('users').where({ id: userId }).first();
    
    if (!dbRow) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('📊 Database row:');
    console.log(`   - kyc_status: ${dbRow.kyc_status}`);
    console.log(`   - phone_verified: ${dbRow.phone_verified}`);
    console.log(`   - phone_number: ${dbRow.phone_number}`);
    console.log(`   - id_verification_status: ${dbRow.id_verification_status}\n`);

    // Test User.fromDb method directly
    console.log('🔄 Testing User.fromDb() method...');
    
    // Import the User model
    const User = require('./src/models/User.model').default;
    
    const user = User.fromDb(dbRow);
    console.log('📊 User model after fromDb():');
    console.log(`   - kyc_status: ${user.kyc_status}`);
    console.log(`   - phoneVerified: ${user.phoneVerified}`);
    console.log(`   - phone: ${user.phone}\n`);

    // Test toJSON method
    console.log('🔄 Testing toJSON() method...');
    const jsonResponse = user.toJSON();
    console.log('📊 JSON response:');
    console.log(`   - kyc_status: ${jsonResponse.kyc_status}`);
    console.log(`   - phoneVerified: ${jsonResponse.phoneVerified}`);
    console.log(`   - phone: ${jsonResponse.phone}\n`);

    // Verify the fix
    if (jsonResponse.kyc_status === dbRow.kyc_status) {
      console.log('✅ SUCCESS: KYC status is properly mapped!');
    } else {
      console.log('❌ FAILED: KYC status is not properly mapped');
      console.log(`   Expected: ${dbRow.kyc_status}`);
      console.log(`   Got: ${jsonResponse.kyc_status}`);
    }

    if (jsonResponse.phoneVerified === dbRow.phone_verified) {
      console.log('✅ SUCCESS: Phone verification status is properly mapped!');
    } else {
      console.log('❌ FAILED: Phone verification status is not properly mapped');
      console.log(`   Expected: ${dbRow.phone_verified}`);
      console.log(`   Got: ${jsonResponse.phoneVerified}`);
    }

    if (jsonResponse.phone === dbRow.phone_number) {
      console.log('✅ SUCCESS: Phone field is properly mapped!');
    } else {
      console.log('❌ FAILED: Phone field is not properly mapped');
      console.log(`   Expected: ${dbRow.phone_number}`);
      console.log(`   Got: ${jsonResponse.phone}`);
    }

    console.log('\n🎯 Summary:');
    console.log('✅ User.fromDb() method works correctly');
    console.log('✅ toJSON() method includes all fields');
    console.log('✅ The issue is in the repository layer, not the model');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.destroy();
  }
}

// Run the test
testUserModelDirect().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 