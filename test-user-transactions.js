#!/usr/bin/env node

const axios = require('axios');

async function testUserTransactions() {
  console.log('👤 Testing User Transaction Fetching');
  console.log('====================================\n');

  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5OTcyMCwiZXhwIjoxNzUzNzg2MTIwfQ.wN58jK71R-9P65AAhH4qXANg_yemiLLpnO29tKxrs9k';
  const userId = '39f22329-d38e-4e0a-a01c-6ae36d911b30';

  try {
    console.log('1. 📋 Testing: Get All User Transactions');
    console.log('   Endpoint: GET /api/v1/payment-transactions/user/:userId\n');
    
    const userTransactions = await axios.get(`http://localhost:3000/api/v1/payment-transactions/user/${userId}`, {
      headers: { 
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! User transactions retrieved:');
    console.log(`   Status: ${userTransactions.status}`);
    console.log(`   Transactions found: ${userTransactions.data.data?.length || 0}`);
    
    if (userTransactions.data.data && userTransactions.data.data.length > 0) {
      const sample = userTransactions.data.data[0];
      console.log(`   Sample: ID=${sample.id}, Amount=$${sample.amount}, Status=${sample.status}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    console.log('2. 📊 Testing: Get User Transaction Summary');
    console.log('   Endpoint: GET /api/v1/payment-transactions/user/:userId/summary\n');
    
    const userSummary = await axios.get(`http://localhost:3000/api/v1/payment-transactions/user/${userId}/summary`, {
      headers: { 
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! User transaction summary retrieved:');
    console.log(`   Status: ${userSummary.status}`);
    if (userSummary.data.data) {
      const summary = userSummary.data.data;
      console.log(`   Total Transactions: ${summary.totalTransactions}`);
      console.log(`   Total Amount: $${summary.totalAmount}`);
      console.log(`   Completed: ${summary.completedTransactions}`);
      console.log(`   Average: $${summary.averageAmount?.toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    console.log('3. 🔍 Testing: Get Filtered Transactions');
    console.log('   Endpoint: GET /api/v1/payment-transactions?userId=:userId&filters\n');
    
    const filteredTransactions = await axios.get(`http://localhost:3000/api/v1/payment-transactions?userId=${userId}&page=1&limit=5&sortBy=created_at&sortOrder=desc`, {
      headers: { 
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! Filtered transactions retrieved:');
    console.log(`   Status: ${filteredTransactions.status}`);
    console.log(`   Transactions: ${filteredTransactions.data.transactions?.length || 0}`);
    console.log(`   Total: ${filteredTransactions.data.total || 'N/A'}`);
    console.log(`   Page: ${filteredTransactions.data.page || 1} of ${filteredTransactions.data.totalPages || 1}`);

    console.log('\n🎉 ALL USER TRANSACTION ENDPOINTS WORKING! 🚀');
    console.log('\n📝 Available endpoints for users:');
    console.log('   • GET /api/v1/payment-transactions/user/:userId');
    console.log('   • GET /api/v1/payment-transactions/user/:userId/summary');
    console.log('   • GET /api/v1/payment-transactions?userId=:userId&filters');
    console.log('   • GET /api/v1/payment-transactions/booking/:bookingId');

  } catch (error) {
    console.log('\n❌ User transaction test failed:');
    console.log(`Status: ${error.response?.status || 'Network'}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('\n🔍 Response details:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserTransactions(); 