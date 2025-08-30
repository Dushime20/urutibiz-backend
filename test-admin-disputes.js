const axios = require('axios');

async function testAdminDisputesAPI() {
  try {
    console.log('🔍 Testing Admin Disputes API endpoint...');
    
    // You'll need to replace this with a valid JWT token from an admin user
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token with a valid JWT token from an admin user');
      console.log('🔍 To get a token, you can:');
      console.log('   1. Login with an admin account');
      console.log('   2. Copy the JWT token from the response');
      console.log('   3. Replace the token in this script');
      console.log('\n🔍 The new admin endpoint is: GET /api/v1/inspections/admin/disputes');
      return;
    }
    
    const response = await axios.get('http://localhost:3000/api/v1/inspections/admin/disputes', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    if (response.data.success && response.data.data.disputes) {
      console.log(`\n📊 Found ${response.data.data.disputes.length} disputes out of ${response.data.data.pagination.total} total`);
      console.log('📄 Pagination:', response.data.data.pagination);
      
      // Show first few disputes
      if (response.data.data.disputes.length > 0) {
        console.log('\n🔍 First dispute details:');
        const firstDispute = response.data.data.disputes[0];
        console.log('  - ID:', firstDispute.id);
        console.log('  - Type:', firstDispute.disputeType);
        console.log('  - Status:', firstDispute.status);
        console.log('  - Raised by:', firstDispute.raisedByUser?.name || firstDispute.raisedBy);
        console.log('  - Reason:', firstDispute.reason);
        console.log('  - Created:', firstDispute.createdAt);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 403) {
        console.log('\n🔍 This endpoint requires admin privileges');
        console.log('Make sure you are logged in with an admin account');
      }
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Test with query parameters
async function testAdminDisputesWithFilters() {
  try {
    console.log('\n🔍 Testing Admin Disputes API with filters...');
    
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token first');
      return;
    }
    
    // Test with status filter
    const response = await axios.get('http://localhost:3000/api/v1/inspections/admin/disputes?status=open', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin API with status=open filter:', {
      status: response.status,
      disputesCount: response.data.data?.disputes?.length || 0,
      total: response.data.data?.pagination?.total || 0
    });
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Filtered API Error:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Run tests
testAdminDisputesAPI();
testAdminDisputesWithFilters();
