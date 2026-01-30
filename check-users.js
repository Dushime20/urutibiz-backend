/**
 * Quick script to check which users exist in the database
 * Run with: node check-users.js
 */

require('dotenv').config();
const { getDatabase, connectDatabase } = require('./dist/config/database');

async function checkUsers() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDatabase();
    
    const db = getDatabase();
    
    console.log('\n📊 Fetching all users from database...\n');
    const users = await db('users').select('id', 'email', 'role', 'kyc_status', 'email_verified', 'phone_verified');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 Run: npm run seed to create test users');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:\n`);
    console.log('═'.repeat(100));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   KYC Status: ${user.kyc_status}`);
      console.log(`   Email Verified: ${user.email_verified ? '✓' : '✗'}`);
      console.log(`   Phone Verified: ${user.phone_verified ? '✓' : '✗'}`);
      console.log('─'.repeat(100));
    });
    
    console.log('\n💡 To login with any of these users:');
    console.log('   1. Go to http://localhost:5173/login');
    console.log('   2. Use the email above');
    console.log('   3. Default password: admin123 (for admin) or password123 (for others)');
    console.log('\n🔧 If you have an old token, clear localStorage in browser DevTools:');
    console.log('   localStorage.clear()');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
