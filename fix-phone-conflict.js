#!/usr/bin/env node

/**
 * Script to fix phone number conflicts
 */

const knex = require('knex');
const config = require('./knexfile');

async function fixPhoneConflict() {
  const db = knex(config.development);

  try {
    console.log('🔧 Fixing phone number conflict...\n');

    const phoneNumber = '+250790838315';
    
    // Find the rightful owner (earliest verification)
    const earliestVerification = await db('user_verifications')
      .where({ phone_number: phoneNumber })
      .orderBy('created_at', 'asc')
      .first();

    if (!earliestVerification) {
      console.log('❌ No verification records found for this phone number');
      return;
    }

    const rightfulOwnerId = earliestVerification.user_id;
    const rightfulOwner = await db('users').where({ id: rightfulOwnerId }).first();
    
    console.log('📅 Determining rightful owner:');
    console.log(`   - user_id: ${rightfulOwnerId}`);
    console.log(`   - email: ${rightfulOwner.email}`);
    console.log(`   - earliest_verification: ${earliestVerification.created_at}\n`);

    // Find all users currently using this phone number
    const usersWithPhone = await db('users')
      .where({ phone: phoneNumber })
      .select('id', 'email', 'phone', 'phone_verified', 'kyc_status');

    console.log('📱 Users currently using this phone number:');
    usersWithPhone.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      console.log(`      - phone_verified: ${user.phone_verified}`);
      console.log(`      - kyc_status: ${user.kyc_status}\n`);
    });

    // Remove phone number from all users except the rightful owner
    for (const user of usersWithPhone) {
      if (user.id !== rightfulOwnerId) {
        console.log(`🗑️ Removing phone number from ${user.email}...`);
        await db('users').where({ id: user.id }).update({
          phone: null,
          phone_verified: false
        });
        console.log(`✅ Removed phone from ${user.email}`);
      }
    }

    // Assign phone number to rightful owner
    if (rightfulOwner.phone !== phoneNumber) {
      console.log(`📱 Assigning phone number to rightful owner ${rightfulOwner.email}...`);
      await db('users').where({ id: rightfulOwnerId }).update({
        phone: phoneNumber,
        phone_verified: true
      });
      console.log(`✅ Assigned phone to ${rightfulOwner.email}`);
    } else {
      console.log(`✅ ${rightfulOwner.email} already has the correct phone number`);
    }

    // Verify the fix
    console.log('\n📊 Verification after fix:');
    
    const updatedRightfulOwner = await db('users').where({ id: rightfulOwnerId }).first();
    console.log(`   - ${rightfulOwner.email}: phone = ${updatedRightfulOwner.phone}, verified = ${updatedRightfulOwner.phone_verified}`);

    const remainingUsersWithPhone = await db('users')
      .where({ phone: phoneNumber })
      .select('id', 'email', 'phone', 'phone_verified');

    console.log(`   - Total users with this phone: ${remainingUsersWithPhone.length}`);
    remainingUsersWithPhone.forEach(user => {
      console.log(`     * ${user.email}: ${user.phone} (verified: ${user.phone_verified})`);
    });

  } catch (error) {
    console.error('❌ Error fixing phone conflict:', error);
  } finally {
    await db.destroy();
  }
}

// Run the fix
fixPhoneConflict().then(() => {
  console.log('\n🏁 Phone conflict fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix crashed:', error);
  process.exit(1);
}); 