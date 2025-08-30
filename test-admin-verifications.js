const axios = require('axios');

async function testAdminVerifications() {
  try {
    console.log('🔍 Testing Admin Verifications API endpoint...');
    
    // You'll need to replace this with a valid JWT token from an admin user
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token with a valid JWT token from an admin user');
      console.log('🔍 To get a token, you can:');
      console.log('   1. Login with an admin account');
      console.log('   2. Copy the JWT token from the response');
      console.log('   3. Replace the token in this script');
      console.log('\n🔍 The admin verifications endpoint is: GET /api/v1/admin/verifications');
      return;
    }
    
    const response = await axios.get('http://localhost:3000/api/v1/admin/verifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin Verifications API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    if (response.data.success && response.data.data) {
      console.log(`\n📊 Found ${response.data.data.length || 0} verifications`);
      
      // Show first few verifications if any exist
      if (response.data.data.length > 0) {
        console.log('\n🔍 First verification details:');
        const firstVerification = response.data.data[0];
        console.log('  - ID:', firstVerification.id);
        console.log('  - Type:', firstVerification.verificationType);
        console.log('  - Status:', firstVerification.verificationStatus);
        console.log('  - User ID:', firstVerification.userId);
        console.log('  - Created:', firstVerification.createdAt);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        console.log('\n🔍 This endpoint requires authentication');
        console.log('Make sure you provide a valid JWT token');
      } else if (error.response.status === 403) {
        console.log('\n🔍 This endpoint requires admin privileges');
        console.log('Make sure you are logged in with an admin account');
      }
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Test with query parameters
async function testAdminVerificationsWithFilters() {
  try {
    console.log('\n🔍 Testing Admin Verifications API with filters...');
    
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token first');
      return;
    }
    
    // Test with status filter
    const response = await axios.get('http://localhost:3000/api/v1/admin/verifications?status=pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin Verifications with status=pending filter:', {
      status: response.status,
      verificationsCount: response.data.data?.length || 0
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
testAdminVerifications();
testAdminVerificationsWithFilters();
