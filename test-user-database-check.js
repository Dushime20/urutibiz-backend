#!/usr/bin/env node

/**
 * Test to check actual database values for a specific user
 */

const knex = require('knex');
const config = require('./knexfile');

async function checkUserDatabaseValues() {
  const db = knex(config.development);

  try {
    console.log('🔍 Checking actual database values for user...\n');

    // Check the specific user from your response
    const userId = '2e8e2c8a-28e6-4e52-aedf-8e601927896b';
    
    console.log(`📊 Checking user: ${userId}\n`);

    // Get the actual database row
    const user = await db('users').where({ id: userId }).first();
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('📋 Actual database values:');
    console.log(`   - id: ${user.id}`);
    console.log(`   - email: ${user.email}`);
    console.log(`   - first_name: ${user.first_name}`);
    console.log(`   - last_name: ${user.last_name}`);
    console.log(`   - role: ${user.role}`);
    console.log(`   - status: ${user.status}`);
    console.log(`   - phone_number: ${user.phone_number}`);
    console.log(`   - phone_verified: ${user.phone_verified}`);
    console.log(`   - email_verified: ${user.email_verified}`);
    console.log(`   - kyc_status: ${user.kyc_status}`);
    console.log(`   - id_verification_status: ${user.id_verification_status}`);
    console.log(`   - created_at: ${user.created_at}`);
    console.log(`   - updated_at: ${user.updated_at}\n`);

    // Check if there are any verification records
    const verifications = await db('user_verifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    console.log(`📋 Verification records (${verifications.length}):`);
    verifications.forEach((v, i) => {
      console.log(`   Record ${i + 1}:`);
      console.log(`     - verification_type: ${v.verification_type}`);
      console.log(`     - verification_status: ${v.verification_status}`);
      console.log(`     - phone_number: ${v.phone_number}`);
      console.log(`     - created_at: ${v.created_at}`);
      console.log(`     - updated_at: ${v.updated_at}`);
    });

    // Check if there are any phone verification OTPs
    const phoneOtps = await db('phone_verification_otps')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    console.log(`\n📋 Phone verification OTPs (${phoneOtps.length}):`);
    phoneOtps.forEach((otp, i) => {
      console.log(`   OTP ${i + 1}:`);
      console.log(`     - phone_number: ${otp.phone_number}`);
      console.log(`     - otp: ${otp.otp}`);
      console.log(`     - is_used: ${otp.is_used}`);
      console.log(`     - expires_at: ${otp.expires_at}`);
      console.log(`     - created_at: ${otp.created_at}`);
    });

    // Check all columns in users table
    console.log('\n📋 All columns in users table:');
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    console.log('\n🎯 Analysis:');
    console.log(`   - Database kyc_status: ${user.kyc_status}`);
    console.log(`   - Database phone_verified: ${user.phone_verified}`);
    console.log(`   - Database id_verification_status: ${user.id_verification_status}`);
    console.log(`   - API shows kyc_status: "unverified"`);
    console.log(`   - API shows phoneVerified: false`);
    console.log(`   - API shows no phone field`);

    if (user.kyc_status === 'verified' && user.phone_verified === true) {
      console.log('\n❌ ISSUE: Database shows verified but API shows unverified!');
      console.log('🔧 This suggests the User model mapping is not working correctly.');
    } else {
      console.log('\n✅ Database values match API response');
      console.log('🔧 The user is actually unverified in the database.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await db.destroy();
  }
}

// Run the check
checkUserDatabaseValues().then(() => {
  console.log('\n🏁 Database check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check crashed:', error);
  process.exit(1);
}); 