const axios = require('axios');

async function testBulkReviewAPI() {
  try {
    console.log('🔍 Testing Bulk Review API endpoint...');
    
    // You'll need to replace this with a valid JWT token from an admin user
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token with a valid JWT token from an admin user');
      console.log('🔍 To get a token, you can:');
      console.log('   1. Login with an admin account');
      console.log('   2. Copy the JWT token from the response');
      console.log('   3. Replace the token in this script');
      console.log('\n🔍 The bulk review endpoint is: POST /api/v1/admin/verifications/bulk-review');
      return;
    }
    
    // Test data for bulk review
    const bulkReviewData = {
      verificationIds: [
        'verification-id-1', // Replace with actual verification IDs
        'verification-id-2',
        'verification-id-3'
      ],
      status: 'verified', // or 'rejected'
      notes: 'Bulk approval for compliance review'
    };
    
    console.log('📝 Bulk Review Request Data:', bulkReviewData);
    
    const response = await axios.post('http://localhost:3000/api/v1/admin/verifications/bulk-review', 
      bulkReviewData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Bulk Review API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    if (response.data.success) {
      console.log(`\n📊 Bulk Review Summary:`);
      console.log(`  - Total Processed: ${response.data.data.total}`);
      console.log(`  - Successful: ${response.data.data.successful}`);
      console.log(`  - Failed: ${response.data.data.failed}`);
      console.log(`  - Status: ${response.data.data.summary.status}`);
      console.log(`  - Processed At: ${response.data.data.summary.processedAt}`);
      
      if (response.data.data.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        response.data.data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. Verification ID: ${error.verificationId}`);
          console.log(`     Error: ${error.error}`);
        });
      }
      
      if (response.data.data.results.length > 0) {
        console.log('\n✅ Successful verifications:');
        response.data.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. Verification ID: ${result.verificationId}`);
          console.log(`     Status: ${result.status}`);
        });
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 400) {
        console.log('\n🔍 Validation Error - Check your request data:');
        console.log('  - verificationIds must be an array of valid verification IDs');
        console.log('  - status must be either "verified" or "rejected"');
        console.log('  - notes must be a string (optional)');
      } else if (error.response.status === 401) {
        console.log('\n🔍 Authentication required');
        console.log('Make sure you provide a valid JWT token');
      } else if (error.response.status === 403) {
        console.log('\n🔍 Admin privileges required');
        console.log('Make sure you are logged in with an admin account');
      }
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Test different scenarios
async function testBulkReviewScenarios() {
  try {
    console.log('\n🔍 Testing Bulk Review Scenarios...');
    
    const token = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
    
    if (token === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
      console.log('❌ Please replace the token first');
      return;
    }
    
    // Test 1: Bulk reject
    console.log('\n📝 Test 1: Bulk Reject');
    const rejectData = {
      verificationIds: ['verification-id-1', 'verification-id-2'],
      status: 'rejected',
      notes: 'Bulk rejection - documents do not meet requirements'
    };
    
    try {
      const response = await axios.post('http://localhost:3000/api/v1/admin/verifications/bulk-review', 
        rejectData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Bulk Reject Response:', {
        status: response.status,
        successful: response.data.data?.successful || 0,
        failed: response.data.data?.failed || 0
      });
    } catch (error) {
      console.error('❌ Bulk Reject Failed:', error.response?.data || error.message);
    }
    
    // Test 2: Empty array (should fail validation)
    console.log('\n📝 Test 2: Empty Verification IDs (Validation Error)');
    const emptyData = {
      verificationIds: [],
      status: 'verified',
      notes: 'This should fail validation'
    };
    
    try {
      const response = await axios.post('http://localhost:3000/api/v1/admin/verifications/bulk-review', 
        emptyData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Empty IDs Response:', response.data);
    } catch (error) {
      console.log('❌ Empty IDs Validation Error (Expected):', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Scenario Testing Error:', error.message);
  }
}

// Run tests
testBulkReviewAPI();
testBulkReviewScenarios();
