const axios = require('axios');

// Simple test for moderation posting
async function testModerationPosting() {
  const BASE_URL = 'http://localhost:3000';
  const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token
  const PRODUCT_ID = 'test-product-id'; // Replace with actual product ID

  console.log('🧪 Testing Basic Moderation Posting...\n');

  try {
    // Test 1: Basic product moderation
    console.log('1️⃣ Testing product moderation (approve)');
    const approveResponse = await axios.post(
      `${BASE_URL}/admin/products/${PRODUCT_ID}/moderate`,
      {
        action: 'approve',
        reason: 'Product meets all community guidelines'
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Approve action successful');
    console.log(`📊 New status: ${approveResponse.data.data.status}`);
    console.log(`📝 Reason stored: ${approveResponse.data.data.moderatorNotes}\n`);

    // Test 2: Test reject action
    console.log('2️⃣ Testing product moderation (reject)');
    const rejectResponse = await axios.post(
      `${BASE_URL}/admin/products/${PRODUCT_ID}/moderate`,
      {
        action: 'reject',
        reason: 'Product violates community guidelines - inappropriate content'
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Reject action successful');
    console.log(`📊 New status: ${rejectResponse.data.data.status}`);
    console.log(`📝 Reason stored: ${rejectResponse.data.data.moderatorNotes}\n`);

    // Test 3: Test flag action
    console.log('3️⃣ Testing product moderation (flag)');
    const flagResponse = await axios.post(
      `${BASE_URL}/admin/products/${PRODUCT_ID}/moderate`,
      {
        action: 'flag',
        reason: 'Product needs review - potential policy violation'
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Flag action successful');
    console.log(`📊 New status: ${flagResponse.data.data.status}`);
    console.log(`📝 Reason stored: ${flagResponse.data.data.moderatorNotes}\n`);

    console.log('🎯 All moderation posting tests completed successfully!');

  } catch (error) {
    console.log('❌ Test failed:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${error.response.data.message || error.response.data}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

// Run the test
if (require.main === module) {
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️  Please update ADMIN_TOKEN with a valid admin token');
    console.log('⚠️  Please update PRODUCT_ID with a valid product ID');
    process.exit(1);
  }
  
  testModerationPosting().catch(console.error);
}

module.exports = { testModerationPosting };
