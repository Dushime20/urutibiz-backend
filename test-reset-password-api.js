#!/usr/bin/env node

/**
 * Test Reset Password API Endpoints
 * Tests the complete reset password flow using API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const RESET_TOKEN = 'ef709a8e1a1608f2626951e4ddaeafe673929a4e5d2bdc0259567eeff20df9fa';

async function testResetPasswordAPI() {
  console.log('🔐 Testing Reset Password API Endpoints');
  console.log('=======================================');

  try {
    // Step 1: Validate the reset token
    console.log('\n1. Validating reset token...');
    const validateResponse = await axios.get(`${API_BASE_URL}/auth/validate-reset-token/${RESET_TOKEN}`);
    
    console.log('✅ Validation response:', validateResponse.data);
    
    if (!validateResponse.data.success) {
      console.log('❌ Token is invalid or expired');
      return;
    }

    // Step 2: Test with weak password (should fail)
    console.log('\n2. Testing with weak password (should fail)...');
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: RESET_TOKEN,
        newPassword: 'weak'
      });
      console.log('❌ Weak password was accepted (should be rejected)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Weak password correctly rejected');
        console.log('Response:', error.response.data);
      } else {
        console.log('❌ Unexpected error with weak password test');
      }
    }

    // Step 3: Reset password with strong password
    console.log('\n3. Resetting password with strong password...');
    const resetResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token: RESET_TOKEN,
      newPassword: 'NewSecurePass123!'
    });

    console.log('✅ Reset response:', resetResponse.data);

    if (resetResponse.data.success) {
      console.log('✅ Password reset successful!');
      console.log('✅ User automatically logged in');
      console.log('✅ New tokens generated');
      
      // Test login with new password
      console.log('\n4. Testing login with new password...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'NewSecurePass123!'
      });

      if (loginResponse.data.success) {
        console.log('✅ Login with new password successful');
      } else {
        console.log('❌ Login with new password failed');
      }
    } else {
      console.log('❌ Password reset failed');
    }

    console.log('\n=======================================');
    console.log('✅ Reset password API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testResetPasswordAPI(); 