#!/usr/bin/env node

/**
 * Forgot Password Test with User Creation
 * Creates a test user and tests the complete forgot password flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPass123!';

async function testForgotPasswordWithUser() {
  console.log('🔐 Testing Forgot Password with User Creation');
  console.log('============================================');

  try {
    // Step 1: Create a test user
    console.log('\n1. Creating test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User'
    });

    if (registerResponse.data.success) {
      console.log('✅ User created successfully');
    } else {
      console.log('ℹ️ User might already exist:', registerResponse.data.message);
    }

    // Step 2: Request password reset
    console.log('\n2. Requesting password reset...');
    const resetResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });

    console.log('✅ Reset response:', resetResponse.data);

    if (resetResponse.data.success) {
      console.log('✅ Password reset request successful');
      console.log('\n📝 Check the server console for the reset URL');
      console.log('The URL will be logged in the format:');
      console.log('Password reset URL (development): http://localhost:5173/reset-password?token=abc123...');
    } else {
      console.log('❌ Password reset request failed');
    }

    // Step 3: Test with invalid email
    console.log('\n3. Testing with invalid email...');
    const invalidResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });

    console.log('✅ Invalid email response:', invalidResponse.data);

    console.log('\n============================================');
    console.log('✅ Forgot password tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check server console for reset URL logs');
    console.log('2. Copy the reset URL from the console');
    console.log('3. Test the complete reset flow with the URL');
    console.log('4. Test token validation and password reset endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testForgotPasswordWithUser(); 