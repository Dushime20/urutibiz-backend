/**
 * Test script to debug registration issue
 * Run with: npx ts-node test-registration.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testRegistration() {
  console.log('🧪 Testing registration endpoint...');
  
  const testData = {
    email: "john.doe11@example.com",
    password: "SecurePass123!",
    firstName: "John",
    lastName: "Doe"
  };

  console.log('📤 Sending request with data:', JSON.stringify(testData, null, 2));

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Registration successful!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', JSON.stringify(response.headers, null, 2));

  } catch (error: any) {
    console.log('❌ Registration failed!');
    
    if (error.response) {
      console.log('📥 Error Response:', JSON.stringify(error.response.data, null, 2));
      console.log('📊 Status:', error.response.status);
      console.log('📋 Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.log('📤 Request made but no response received:', error.request);
    } else {
      console.log('❌ Error setting up request:', error.message);
    }
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Health check successful!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.log('❌ Health check failed!');
    console.log('Error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting registration test...');
  
  // First test health check
  await testHealthCheck();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then test registration
  await testRegistration();
  
  console.log('\n🏁 Test completed!');
}

main().catch(console.error);