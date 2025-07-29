#!/usr/bin/env node

/**
 * Test to verify the user fix worked
 */

const knex = require('knex');
const config = require('./knexfile');

async function testUserFix() {
  const db = knex(config.development);

  try {
    console.log('🧪 Testing user fix...\n');

    const userId = '39f22329-d38e-4e0a-a01c-6ae36d911b30';
    
    // Get user's current data
    const user = await db('users').where({ id: userId }).first();
    
    console.log('📊 User data after fix:');
    console.log(`   - id: ${user.id}`);
    console.log(`   - email: ${user.email}`);
    console.log(`   - phone: ${user.phone}`);
    console.log(`   - phone_verified: ${user.phone_verified}`);
    console.log(`   - kyc_status: ${user.kyc_status}`);
    console.log(`   - id_verification_status: ${user.id_verification_status}\n`);

    // Check if the fix worked
    if (user.phone === '+250790838315' && user.phone_verified === true) {
      console.log('✅ SUCCESS: User now has the correct phone number!');
      console.log('   - Phone field is present and correct');
      console.log('   - Phone verification is true');
      console.log('   - This user is the rightful owner of the phone number');
    } else {
      console.log('❌ FAILED: User still missing phone number');
      console.log(`   - Expected phone: +250790838315, Got: ${user.phone}`);
      console.log(`   - Expected phone_verified: true, Got: ${user.phone_verified}`);
    }

    // Check the other user to make sure they no longer have this phone
    const otherUserId = '2e8e2c8a-28e6-4e52-aedf-8e601927896b';
    const otherUser = await db('users').where({ id: otherUserId }).first();
    
    console.log('\n📊 Other user data:');
    console.log(`   - email: ${otherUser.email}`);
    console.log(`   - phone: ${otherUser.phone}`);
    console.log(`   - phone_verified: ${otherUser.phone_verified}\n`);

    if (otherUser.phone === null || otherUser.phone !== '+250790838315') {
      console.log('✅ SUCCESS: Other user no longer has the phone number');
    } else {
      console.log('❌ FAILED: Other user still has the phone number');
    }

  } catch (error) {
    console.error('❌ Error testing user fix:', error);
  } finally {
    await db.destroy();
  }
}

// Run the test
testUserFix().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 