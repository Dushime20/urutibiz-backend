#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testServerConnectivity() {
  console.log('🔗 Testing Server Connectivity');
  console.log('===============================\n');

  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Uptime: ${JSON.parse(healthResponse.data).uptime}s\n`);

    console.log('2. Testing API base endpoint...');
    try {
      const apiResponse = await axios.get(`${BASE_URL}/`);
      console.log('✅ API base accessible');
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        console.log('✅ API base returns 404 (expected)');
      } else {
        throw apiError;
      }
    }

    console.log('\n3. Testing auth endpoints...');
    
    // Test register endpoint with invalid data (should return validation error)
    try {
      await axios.post(`${BASE_URL}/auth/register`, {});
      console.log('❌ Register endpoint should have failed with validation error');
    } catch (regError) {
      if (regError.response?.status === 400) {
        console.log('✅ Register endpoint validation working');
      } else {
        console.log(`⚠️ Register endpoint error: ${regError.response?.status || 'Unknown'}`);
      }
    }

    console.log('\n4. Testing products endpoint...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      console.log('✅ Products endpoint accessible');
      console.log(`   Response size: ${JSON.stringify(productsResponse.data).length} bytes`);
    } catch (prodError) {
      console.log(`⚠️ Products endpoint error: ${prodError.response?.status || 'Unknown'}`);
    }

    console.log('\n🎉 Server connectivity test completed!');
    console.log('Server is responding properly.');

  } catch (error) {
    console.log('\n❌ Server connectivity failed:');
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code || 'Unknown'}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the test
testServerConnectivity(); 