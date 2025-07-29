#!/usr/bin/env node

/**
 * Script to fix user phone number from verification records
 */

const knex = require('knex');
const config = require('./knexfile');

async function fixUserPhone() {
  const db = knex(config.development);

  try {
    console.log('🔧 Fixing user phone number from verification records...\n');

    const userId = '2e8e2c8a-28e6-4e52-aedf-8e601927896b';
    
    // Get user's current data
    const user = await db('users').where({ id: userId }).first();
    console.log('📊 Current user data:');
    console.log(`   - phone: ${user.phone}`);
    console.log(`   - phone_verified: ${user.phone_verified}`);
    console.log(`   - kyc_status: ${user.kyc_status}\n`);

    // Get latest verification record
    const latestVerification = await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    if (latestVerification && latestVerification.phone_number) {
      console.log('📱 Found phone number in verification record:');
      console.log(`   - phone_number: ${latestVerification.phone_number}`);
      console.log(`   - verification_type: ${latestVerification.verification_type}`);
      console.log(`   - verification_status: ${latestVerification.verification_status}\n`);

      // Update user's phone number
      await db('users').where({ id: userId }).update({
        phone: latestVerification.phone_number,
        phone_verified: true
      });

      console.log('✅ Updated user phone number in database');
      
      // Verify the update
      const updatedUser = await db('users').where({ id: userId }).first();
      console.log('\n📊 Updated user data:');
      console.log(`   - phone: ${updatedUser.phone}`);
      console.log(`   - phone_verified: ${updatedUser.phone_verified}`);
      console.log(`   - kyc_status: ${updatedUser.kyc_status}`);

    } else {
      console.log('❌ No phone number found in verification records');
    }

  } catch (error) {
    console.error('❌ Error fixing user phone:', error);
  } finally {
    await db.destroy();
  }
}

// Run the fix
fixUserPhone().then(() => {
  console.log('\n🏁 Phone fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix crashed:', error);
  process.exit(1);
}); 