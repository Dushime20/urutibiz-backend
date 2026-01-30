/**
 * Quick script to add a new verified user
 * Run with: node add-verified-user.js
 */

require('dotenv').config();
const { getDatabase, connectDatabase } = require('./dist/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addVerifiedUser() {
  try {
    console.log('🌱 Add New Verified User\n');
    console.log('This will add a new fully verified user to the database.');
    console.log('Existing users will NOT be affected.\n');

    // Get user input
    const email = await question('📧 Email address: ');
    const phone = await question('📱 Phone number (e.g., +250788123456): ');
    const firstName = await question('👤 First name: ');
    const lastName = await question('👤 Last name: ');
    
    console.log('\n👥 Available roles:');
    console.log('  1. owner (can list products)');
    console.log('  2. renter (can rent products)');
    console.log('  3. admin (full access)');
    console.log('  4. moderator (content moderation)');
    console.log('  5. inspector (inspections)');
    const roleChoice = await question('\nSelect role (1-5): ');
    
    const roles = ['owner', 'renter', 'admin', 'moderator', 'inspector'];
    const role = roles[parseInt(roleChoice) - 1] || 'renter';

    const password = await question('\n🔑 Password (press Enter for "password123"): ') || 'password123';

    console.log('\n🔍 Connecting to database...');
    await connectDatabase();
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists!`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}`);
      rl.close();
      process.exit(1);
    }

    // Check if phone already exists
    const existingPhone = await db('users').where('phone', phone).orWhere('phone_number', phone).first();
    if (existingPhone) {
      console.log(`\n❌ User with phone ${phone} already exists!`);
      console.log(`   Email: ${existingPhone.email}`);
      rl.close();
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID
    const userId = uuidv4();

    // Insert user
    console.log('💾 Creating user...');
    await db('users').insert({
      id: userId,
      email: email,
      phone_number: phone,
      phone: phone,
      password_hash: hashedPassword,
      role: role,
      is_active: true,
      first_name: firstName,
      last_name: lastName,
      preferred_currency: 'USD',
      date_of_birth: '1990-01-01',
      gender: 'other',
      
      // Global address fields
      street_address: '123 Main Street',
      city: 'Kigali',
      state_province: 'Kigali City',
      postal_code: '10001',
      country: 'Rwanda',
      
      // Legacy fields
      province: 'rw-kigali',
      address_line: '123 Main Street',
      district: 'rw-kigali-gasabo',
      sector: 'Remera',
      cell: 'Remera',
      village: 'Remera',
      
      // ✅ FULLY VERIFIED STATUS
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      id_verification_status: 'verified',
      
      bio: `Verified ${role} user`,
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('\n✅ User created successfully!\n');
    console.log('═'.repeat(60));
    console.log('📋 User Details:');
    console.log('═'.repeat(60));
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: ${role}`);
    console.log(`   Email Verified: ✓`);
    console.log(`   Phone Verified: ✓`);
    console.log(`   KYC Status: verified`);
    console.log('═'.repeat(60));
    console.log('\n💡 You can now login with these credentials!');
    console.log(`   Login URL: http://localhost:5173/login\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

addVerifiedUser();
