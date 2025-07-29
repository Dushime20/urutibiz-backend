#!/usr/bin/env node

/**
 * Script to check phone number conflicts
 */

const knex = require('knex');
const config = require('./knexfile');

async function checkPhoneConflict() {
  const db = knex(config.development);

  try {
    console.log('🔍 Checking phone number conflicts...\n');

    const phoneNumber = '+250790838315';
    
    // Find all users with this phone number
    const usersWithPhone = await db('users')
      .where({ phone: phoneNumber })
      .select('id', 'email', 'phone', 'phone_verified', 'kyc_status', 'created_at');

    console.log(`📱 Users with phone number ${phoneNumber}:`);
    usersWithPhone.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      console.log(`      - phone_verified: ${user.phone_verified}`);
      console.log(`      - kyc_status: ${user.kyc_status}`);
      console.log(`      - created_at: ${user.created_at}\n`);
    });

    // Check the specific user we're investigating
    const targetUserId = '39f22329-d38e-4e0a-a01c-6ae36d911b30';
    const targetUser = await db('users').where({ id: targetUserId }).first();
    
    console.log(`🎯 Target user (${targetUserId}):`);
    console.log(`   - email: ${targetUser.email}`);
    console.log(`   - phone: ${targetUser.phone}`);
    console.log(`   - phone_verified: ${targetUser.phone_verified}`);
    console.log(`   - kyc_status: ${targetUser.kyc_status}\n`);

    // Check if this phone number belongs to the target user
    const targetUserVerifications = await db('user_verifications')
      .where({ user_id: targetUserId, phone_number: phoneNumber })
      .orderBy('created_at', 'desc');

    console.log(`📋 Target user's verification records with this phone: ${targetUserVerifications.length}`);
    targetUserVerifications.forEach((verification, index) => {
      console.log(`   ${index + 1}. ${verification.verification_type} - ${verification.verification_status}`);
      console.log(`      - created_at: ${verification.created_at}\n`);
    });

    // Check other users' verification records
    for (const user of usersWithPhone) {
      if (user.id !== targetUserId) {
        const otherUserVerifications = await db('user_verifications')
          .where({ user_id: user.id, phone_number: phoneNumber })
          .orderBy('created_at', 'desc');

        console.log(`📋 User ${user.email} verification records with this phone: ${otherUserVerifications.length}`);
        otherUserVerifications.forEach((verification, index) => {
          console.log(`   ${index + 1}. ${verification.verification_type} - ${verification.verification_status}`);
          console.log(`      - created_at: ${verification.created_at}\n`);
        });
      }
    }

    // Determine the rightful owner
    console.log('🔍 Determining rightful phone number owner...');
    
    // Get the earliest verification record for this phone number
    const earliestVerification = await db('user_verifications')
      .where({ phone_number: phoneNumber })
      .orderBy('created_at', 'asc')
      .first();

    if (earliestVerification) {
      console.log(`📅 Earliest verification record:`);
      console.log(`   - user_id: ${earliestVerification.user_id}`);
      console.log(`   - phone_number: ${earliestVerification.phone_number}`);
      console.log(`   - created_at: ${earliestVerification.created_at}`);
      
      const earliestUser = await db('users').where({ id: earliestVerification.user_id }).first();
      console.log(`   - user_email: ${earliestUser.email}`);
    }

  } catch (error) {
    console.error('❌ Error checking phone conflict:', error);
  } finally {
    await db.destroy();
  }
}

// Run the check
checkPhoneConflict().then(() => {
  console.log('\n🏁 Phone conflict check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check crashed:', error);
  process.exit(1);
}); 