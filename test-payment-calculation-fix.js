const axios = require('axios');

async function testPaymentCalculationFix() {
  try {
    console.log('🔍 Testing Payment Calculation Endpoint Fix...');
    
    // Test the endpoint that was previously failing
    const url = 'http://localhost:3000/api/v1/payment-providers/country/6aa61018-ad8a-4313-8cb9-a5e0d0ff22a9/calculate';
    const params = {
      amount: 100,
      currency: 'USD'
    };
    
    console.log(`📋 Testing URL: ${url}`);
    console.log(`📋 Parameters: ${JSON.stringify(params)}`);
    
    try {
      const response = await axios.get(url, { params });
      
      console.log('✅ Payment calculation successful!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Response: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.data.success) {
        console.log('\n🎉 The PostgreSQL array error has been fixed!');
        console.log('   - No more "operator does not exist: text[] @> character varying[]" error');
        console.log('   - Payment calculation is working properly');
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`📋 Response Status: ${error.response.status}`);
        console.log(`📋 Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        
        if (error.response.status === 404) {
          console.log('❌ Endpoint not found - check if server is running');
        } else if (error.response.status === 400) {
          console.log('⚠️ Bad request - check your parameters');
        } else if (error.response.status === 500) {
          console.log('❌ Server error - check server logs');
        } else {
          console.log(`⚠️ Unexpected error: ${error.response.status}`);
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaymentCalculationFix();
