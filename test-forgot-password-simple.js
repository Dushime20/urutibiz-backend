#!/usr/bin/env node

/**
 * Simple Forgot Password Test
 * Tests the basic forgot password flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testForgotPassword() {
  console.log('🔐 Testing Forgot Password Functionality');
  console.log('=====================================');

  try {
    // Test 1: Request password reset
    console.log('\n1. Testing password reset request...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'test@example.com'
    });

    console.log('✅ Response:', response.data);

    if (response.data.success) {
      console.log('✅ Password reset request successful');
    } else {
      console.log('❌ Password reset request failed');
    }

    // Test 2: Test with invalid email
    console.log('\n2. Testing with invalid email...');
    const invalidResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });

    console.log('✅ Invalid email response:', invalidResponse.data);

    console.log('\n=====================================');
    console.log('✅ Basic forgot password tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check server console for reset URL logs');
    console.log('2. Use the URL to test the complete reset flow');
    console.log('3. Test token validation and password reset endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testForgotPassword(); 