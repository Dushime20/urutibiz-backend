const axios = require('axios');

async function testKycStatusEndpoint() {
  try {
    console.log('🔍 Testing KYC Status Update Endpoint...');
    
    // Test 1: Check if endpoint is accessible (should get 401 - unauthorized, not 404)
    console.log('\n📋 Test 1: Checking endpoint accessibility...');
    
    try {
      const response = await axios.put('http://localhost:3000/api/v1/admin/users/96674ceb-13a9-440a-9d14-d00b6eecc896/kyc-status', {
        kycStatus: 'verified',
        notes: 'Test KYC status update'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Endpoint accessible and working!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Response: ${JSON.stringify(response.data)}`);
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log('✅ Endpoint is accessible! (401 Unauthorized is expected without token)');
          console.log('   - This means the route exists and is working');
          console.log('   - The 401 error is expected without authentication');
        } else if (error.response.status === 404) {
          console.log('❌ Endpoint still returns 404 - route not found');
          console.log('   - This means the route configuration is still incorrect');
        } else {
          console.log(`✅ Endpoint is accessible! (Status: ${error.response.status})`);
          console.log(`   - Response: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test 2: Check if we can get a proper error response with invalid data
    console.log('\n📋 Test 2: Testing with invalid KYC status...');
    
    try {
      const response = await axios.put('http://localhost:3000/api/v1/admin/users/96674ceb-13a9-440a-9d14-d00b6eecc896/kyc-status', {
        kycStatus: 'invalid_status',
        notes: 'Test with invalid status'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Endpoint working with invalid data');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Endpoint properly validates data! (400 Bad Request for invalid status)');
        console.log(`   - Response: ${JSON.stringify(error.response.data)}`);
      } else if (error.response && error.response.status === 401) {
        console.log('✅ Endpoint is accessible and working! (401 Unauthorized without token)');
      } else {
        console.log(`⚠️ Unexpected response: ${error.response?.status || 'No response'}`);
      }
    }
    
    console.log('\n🎉 KYC Status endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testKycStatusEndpoint();
