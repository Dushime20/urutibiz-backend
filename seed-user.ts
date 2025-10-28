#!/usr/bin/env ts-node

/**
 * User Seeding Script
 * Creates a new user with the specified details
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, connectDatabase } from './src/config/database';

async function seedUser() {
  try {
    console.log('🌱 Starting user seeding...');
    
    // Connect to database
    await connectDatabase();
    const db = getDatabase();
    
    // User details
    const userData = {
      firstName: 'Dushimimana',
      lastName: 'Fabrice',
      email: 'fabdushime20@gmail.com',
      password: 'Dushimimana20@'
    };
    
    console.log(`📧 Creating user: ${userData.email}`);
    
    // Check if user already exists
    const existingUser = await db('users')
      .where({ email: userData.email })
      .first();
    
    if (existingUser) {
      console.log('❌ User already exists with this email');
      return;
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // Generate UUID for the user
    const userId = uuidv4();
    
    // Insert user into database
    const [newUser] = await db('users').insert({
      id: userId,
      email: userData.email,
      password_hash: passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: 'admin', // Admin role
      status: 'active', // Active status
      email_verified: true, // Auto-verify for seeded users
      phone_verified: false,
      kyc_status: 'unverified',
      two_factor_enabled: false,
      two_factor_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }, ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'email_verified', 'created_at']);
    
    console.log('✅ User created successfully!');
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
      .where({ email: userData.email })
      .first();
    
    if (testUser) {
      const passwordMatch = await bcrypt.compare(userData.password, testUser.password_hash);
      if (passwordMatch) {
        console.log('✅ Login test successful!');
      } else {
        console.log('❌ Login test failed - password mismatch');
      }
    }
    
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeding function
seedUser();
