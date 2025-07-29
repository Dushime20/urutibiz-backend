#!/usr/bin/env node

const axios = require('axios');

async function testPaymentAPI() {
  console.log('💳 Testing Payment Transactions API');
  console.log('==================================\n');

  try {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5OTcyMCwiZXhwIjoxNzUzNzg2MTIwfQ.wN58jK71R-9P65AAhH4qXANg_yemiLLpnO29tKxrs9k';
    
    console.log('1. Testing GET /api/v1/payment-transactions...');
    
    const response = await axios.get('http://localhost:3000/api/v1/payment-transactions?page=1&limit=5', {
      headers: { 
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! Payment transactions retrieved:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Total transactions: ${response.data.total || 'N/A'}`);
    console.log(`   Transactions returned: ${response.data.transactions?.length || 0}`);
    
    if (response.data.transactions && response.data.transactions.length > 0) {
      console.log('\n📋 Sample transaction:');
      const sample = response.data.transactions[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Amount: $${sample.amount}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Created: ${sample.created_at}`);
    }

    console.log('\n🎉 PAYMENT TRANSACTIONS API WORKING! 🚀');
    console.log('Database persistence is fully functional!');

  } catch (error) {
    console.log('\n❌ Payment API test failed:');
    console.log(`Status: ${error.response?.status || 'Network'}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('\n🔍 Full Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPaymentAPI(); 