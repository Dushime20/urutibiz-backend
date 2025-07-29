#!/usr/bin/env node

const knex = require('knex');
const config = require('./knexfile');

async function checkDatabaseStructure() {
  const db = knex(config.development);
  
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check users table columns
    console.log('📋 Users table columns:');
    const usersColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('\n📋 User_verifications table columns:');
    const verificationsColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_verifications' 
      ORDER BY ordinal_position;
    `);
    
    verificationsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if our target columns exist
    const hasPhoneVerified = usersColumns.rows.some(col => col.column_name === 'phone_verified');
    const hasKycStatus = usersColumns.rows.some(col => col.column_name === 'kyc_status');
    const hasPhoneNumberInVerifications = verificationsColumns.rows.some(col => col.column_name === 'phone_number');
    
    console.log('\n🎯 Target columns status:');
    console.log(`  - phone_verified in users: ${hasPhoneVerified ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - kyc_status in users: ${hasKycStatus ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - phone_number in user_verifications: ${hasPhoneNumberInVerifications ? '✅ EXISTS' : '❌ MISSING'}`);
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabaseStructure(); 