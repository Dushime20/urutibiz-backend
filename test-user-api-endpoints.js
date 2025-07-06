/**
 * User Management API Test
 * Tests user endpoints with real database
 */

const axios = require('axios');
require('dotenv').config({ override: true });

const BASE_URL = 'http://localhost:4000/api/v1';
let authToken = '';
let testUserId = '';

console.log('🚀 Testing User Management API with Real Database');

// Helper function to make authenticated requests
function createAuthHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function testHealthCheck() {
  try {
    console.log('\n❤️ Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    console.log('\n👤 Testing user registration...');
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      phone: '+1234567890'
    };

    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    console.log('✅ User registered:', {
      id: response.data.data?.user?.id,
      email: response.data.data?.user?.email,
      token: response.data.data?.token ? '***TOKEN***' : 'NO TOKEN'
    });

    if (response.data.data?.token) {
      authToken = response.data.data.token;
    }
    if (response.data.data?.user?.id) {
      testUserId = response.data.data.user.id;
    }

    return response.data;
  } catch (error) {
    console.log('❌ User registration failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUserLogin() {
  try {
    console.log('\n🔐 Testing user login...');
    const loginData = {
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };

    // First register a user to login with
    await testUserRegistration();

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: userData.email,
      password: userData.password
    });

    console.log('✅ User logged in successfully');
    return response.data;
  } catch (error) {
    console.log('❌ User login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetUserProfile() {
  try {
    console.log('\n👤 Testing get user profile...');
    if (!authToken || !testUserId) {
      console.log('⚠️ No auth token or user ID, skipping profile test');
      return null;
    }

    const response = await axios.get(`${BASE_URL}/users/${testUserId}`, {
      headers: createAuthHeaders()
    });

    console.log('✅ User profile retrieved:', {
      id: response.data.data?.id,
      name: response.data.data?.firstName + ' ' + response.data.data?.lastName,
      email: response.data.data?.email
    });

    return response.data;
  } catch (error) {
    console.log('❌ Get user profile failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateUserProfile() {
  try {
    console.log('\n✏️ Testing update user profile...');
    if (!authToken || !testUserId) {
      console.log('⚠️ No auth token or user ID, skipping update test');
      return null;
    }

    const updateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const response = await axios.put(`${BASE_URL}/users/${testUserId}`, updateData, {
      headers: createAuthHeaders()
    });

    console.log('✅ User profile updated:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Update user profile failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetUsersList() {
  try {
    console.log('\n📋 Testing get users list...');
    if (!authToken) {
      console.log('⚠️ No auth token, skipping users list test');
      return null;
    }

    const response = await axios.get(`${BASE_URL}/users?page=1&limit=5`, {
      headers: createAuthHeaders()
    });

    console.log('✅ Users list retrieved:', {
      total: response.data.data?.total || 0,
      count: response.data.data?.data?.length || 0
    });

    return response.data;
  } catch (error) {
    console.log('❌ Get users list failed:', error.response?.data || error.message);
    return null;
  }
}

async function runUserManagementAPITest() {
  console.log(`📡 Testing API endpoints at: ${BASE_URL}`);
  
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  totalTests++;
  const healthOk = await testHealthCheck();
  if (healthOk) passedTests++;

  // Test 2: User Registration
  totalTests++;
  const registrationResult = await testUserRegistration();
  if (registrationResult) passedTests++;

  // Test 3: Get User Profile
  totalTests++;
  const profileResult = await testGetUserProfile();
  if (profileResult) passedTests++;

  // Test 4: Update User Profile
  totalTests++;
  const updateResult = await testUpdateUserProfile();
  if (updateResult) passedTests++;

  // Test 5: Get Users List
  totalTests++;
  const usersListResult = await testGetUsersList();
  if (usersListResult) passedTests++;

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All user management tests passed!');
    console.log('✅ User management is working with real database');
  } else {
    console.log('\n⚠️ Some tests failed. Check server logs for details.');
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

// Wait for server to be ready, then run tests
setTimeout(() => {
  runUserManagementAPITest()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test runner error:', error.message);
      process.exit(1);
    });
}, 2000); // Wait 2 seconds for server to start

console.log('\n⏳ Waiting for server to be ready...');
