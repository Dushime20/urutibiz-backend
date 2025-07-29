#!/usr/bin/env node

/**
 * Script to check user phone number status
 */

const knex = require('knex');
const config = require('./knexfile');

async function checkUserPhone() {
  const db = knex(config.development);

  try {
    console.log('🔍 Checking user phone number status...\n');

    const userId = '39f22329-d38e-4e0a-a01c-6ae36d911b30';
    
    // Get user's current data
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📊 User data:');
    console.log(`   - id: ${user.id}`);
    console.log(`   - email: ${user.email}`);
    console.log(`   - phone: ${user.phone}`);
    console.log(`   - phone_verified: ${user.phone_verified}`);
    console.log(`   - kyc_status: ${user.kyc_status}`);
    console.log(`   - id_verification_status: ${user.id_verification_status}\n`);

    // Get verification records
    const verifications = await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    console.log(`📋 Verification records (${verifications.length}):`);
    verifications.forEach((verification, index) => {
      console.log(`   ${index + 1}. ${verification.verification_type} - ${verification.verification_status}`);
      console.log(`      - phone_number: ${verification.phone_number}`);
      console.log(`      - created_at: ${verification.created_at}`);
      console.log(`      - updated_at: ${verification.updated_at}\n`);
    });

    // Get phone verification OTPs
    const phoneOtps = await db('phone_verification_otps')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    console.log(`📱 Phone verification OTPs (${phoneOtps.length}):`);
    phoneOtps.forEach((otp, index) => {
      console.log(`   ${index + 1}. phone: ${otp.phone_number}`);
      console.log(`      - status: ${otp.status}`);
      console.log(`      - created_at: ${otp.created_at}`);
      console.log(`      - expires_at: ${otp.expires_at}\n`);
    });

    // Check if we need to update phone number
    if (!user.phone && verifications.length > 0) {
      const latestVerification = verifications[0];
      if (latestVerification.phone_number) {
        console.log('🔧 Found phone number in verification record, updating user...');
        
        await db('users').where({ id: userId }).update({
          phone: latestVerification.phone_number,
          phone_verified: true
        });

        console.log('✅ Updated user phone number');
        
        // Verify the update
        const updatedUser = await db('users').where({ id: userId }).first();
        console.log(`\n📊 Updated user data:`);
        console.log(`   - phone: ${updatedUser.phone}`);
        console.log(`   - phone_verified: ${updatedUser.phone_verified}`);
      } else {
        console.log('❌ No phone number found in verification records');
      }
    } else if (user.phone) {
      console.log('✅ User already has phone number');
    } else {
      console.log('❌ No phone number found anywhere');
    }

  } catch (error) {
    console.error('❌ Error checking user phone:', error);
  } finally {
    await db.destroy();
  }
}

// Run the check
checkUserPhone().then(() => {
  console.log('\n🏁 Phone check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check crashed:', error);
  process.exit(1);
}); 