#!/usr/bin/env node

/**
 * Direct Server Test
 * Tests server endpoints directly to debug issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testServer() {
  console.log('🔍 Direct Server Test');
  console.log('======================');

  try {
    // Step 1: Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Step 2: Test auth endpoints without authentication
    console.log('\n2. Testing auth endpoint (should fail without auth)...');
    try {
      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, {
        product_id: 'test',
        renter_id: 'test',
        owner_id: 'test',
        start_date: '2025-08-01T10:00:00Z',
        end_date: '2025-08-03T10:00:00Z',
        pickup_time: '10:00',
        return_time: '10:00',
        pickup_method: 'pickup'
      });
      console.log('❌ This should not succeed without auth');
    } catch (authError) {
      console.log('✅ Auth required (as expected):', authError.response?.status, authError.response?.data?.message);
    }

    // Step 3: Try to login/register first
    console.log('\n3. Trying to register/login...');
    let authToken = null;

    try {
      // Try register
      const registerData = {
        email: 'debug-user@test.com',
        password: 'Password123!',
        firstName: 'Debug',
        lastName: 'User'
      };

      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful');
      
      // Check if token is in response
      if (registerResponse.data.token) {
        authToken = registerResponse.data.token;
        console.log('✅ Got token from registration');
      } else {
        console.log('⚠️ No token in registration response, trying login...');
        
        // Try login
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: registerData.email,
          password: registerData.password
        });
        
        if (loginResponse.data.token) {
          authToken = loginResponse.data.token;
          console.log('✅ Got token from login');
        }
      }
    } catch (regError) {
      if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already registered')) {
        console.log('📝 User exists, trying login...');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'debug-user@test.com',
          password: 'Password123!'
        });
        
        if (loginResponse.data.token) {
          authToken = loginResponse.data.token;
          console.log('✅ Got token from login');
        }
      } else {
        console.log('❌ Registration/login failed:', regError.response?.data || regError.message);
      }
    }

    if (!authToken) {
      console.log('❌ Could not get authentication token');
      return;
    }

    // Step 4: Test with authentication
    console.log('\n4. Testing with authentication...');
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // First test a simple authenticated endpoint
    try {
      const simpleResponse = await axios.get(`${API_BASE_URL}/products`, { headers: authHeaders });
      console.log('✅ Authenticated request works - products endpoint accessible');
    } catch (authTestError) {
      console.log('❌ Authentication test failed:', authTestError.response?.data || authTestError.message);
    }

    // Step 5: Test booking creation
    console.log('\n5. Testing booking creation...');
    const bookingData = {
      product_id: '12345678-1234-1234-1234-123456789012', // Dummy UUID
      renter_id: '12345678-1234-1234-1234-123456789012',
      owner_id: '12345678-1234-1234-1234-123456789012',
      start_date: '2025-08-01T10:00:00Z',
      end_date: '2025-08-03T10:00:00Z',
      pickup_time: '10:00',
      return_time: '10:00',
      pickup_method: 'pickup',
      special_instructions: 'Test booking'
    };

    console.log('Booking data:');
    console.log(JSON.stringify(bookingData, null, 2));

    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, { headers: authHeaders });
    console.log('✅ Booking created successfully!');
    console.log('Response:', JSON.stringify(bookingResponse.data, null, 2));

  } catch (error) {
    console.log('\n❌ Final Error Details:');
    console.log('========================');
    console.log('Error Type:', error.constructor.name);
    console.log('Message:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Response Headers:', JSON.stringify(error.response.headers, null, 2));
    }
    
    if (error.request) {
      console.log('Request was made but no response received');
    }

    console.log('\n🔍 Analysis:');
    if (error.response?.status === 500) {
      console.log('500 Internal Server Error detected');
      console.log('This means the request reached the server but there was an internal error');
      console.log('Check the server console for detailed error messages');
    } else if (error.response?.status === 400) {
      console.log('400 Bad Request - validation or data format error');
    } else if (error.response?.status === 401) {
      console.log('401 Unauthorized - authentication issue');
    } else if (error.response?.status === 403) {
      console.log('403 Forbidden - permission issue');
    }
  }
}

// Run the test
testServer(); 