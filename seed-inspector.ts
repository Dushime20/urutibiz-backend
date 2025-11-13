#!/usr/bin/env ts-node

/**
 * Inspector User Seeding Script
 * Creates a new inspector user with the specified details
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, connectDatabase } from './src/config/database';

async function seedInspector() {
  try {
    console.log('🌱 Starting inspector user seeding...');
    
    // Connect to database
    await connectDatabase();
    const db = getDatabase();
    
    // Inspector user details
    const inspectorData = {
      firstName: 'Inspector',
      lastName: 'User',
      email: 'inspecteor@gmail.com', // Note: keeping the typo as specified
      password: 'Inspector123@'
    };
    
    console.log(`📧 Creating inspector user: ${inspectorData.email}`);
    
    // Check if user already exists
    const existingUser = await db('users')
      .where({ email: inspectorData.email })
      .first();
    
    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📋 Existing User Details:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.first_name} ${existingUser.last_name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Email Verified: ${existingUser.email_verified}`);
      
      // Check if password needs to be updated
      const passwordMatch = await bcrypt.compare(inspectorData.password, existingUser.password_hash);
      if (!passwordMatch) {
        console.log('\n🔄 Updating password...');
        const passwordHash = await bcrypt.hash(inspectorData.password, 10);
        await db('users')
          .where({ id: existingUser.id })
          .update({
            password_hash: passwordHash,
            email_verified: true,
            role: 'inspector',
            is_active: true,
            status: 'active',
            updated_at: new Date()
          });
        console.log('✅ Password and verification status updated!');
      }
      
      return;
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(inspectorData.password, 10);
    
    // Generate UUID for the user
    const userId = uuidv4();
    
    // Insert user into database
    const [newUser] = await db('users').insert({
      id: userId,
      email: inspectorData.email,
      password_hash: passwordHash,
      first_name: inspectorData.firstName,
      last_name: inspectorData.lastName,
      role: 'inspector', // Inspector role
      status: 'active', // Active status
      is_active: true,
      email_verified: true, // Auto-verify for seeded users
      phone_verified: false,
      kyc_status: 'unverified',
      two_factor_enabled: false,
      two_factor_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }, ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'email_verified', 'created_at']);
    
    console.log('✅ Inspector user created successfully!');
    console.log('📋 User Details:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.first_name} ${newUser.last_name}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Status: ${newUser.status}`);
    console.log(`   Email Verified: ${newUser.email_verified}`);
    console.log(`   Created: ${newUser.created_at}`);
    
    // Test login
    console.log('\n🔐 Testing login...');
    const testUser = await db('users')
      .where({ email: inspectorData.email })
      .first();
    
    if (testUser) {
      const passwordMatch = await bcrypt.compare(inspectorData.password, testUser.password_hash);
      if (passwordMatch) {
        console.log('✅ Login test successful!');
        console.log('\n📝 Login Credentials:');
        console.log(`   Email: ${inspectorData.email}`);
        console.log(`   Password: ${inspectorData.password}`);
      } else {
        console.log('❌ Login test failed - password mismatch');
      }
    }
    
  } catch (error) {
    console.error('❌ Error seeding inspector user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
seedInspector();

