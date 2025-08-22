const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token
const TEST_PRODUCT_ID = 'test-product-id'; // Replace with actual product ID

// Test all moderation actions
const moderationActions = [
  { action: 'approve', reason: 'Product meets guidelines' },
  { action: 'reject', reason: 'Product violates community standards' },
  { action: 'flag', reason: 'Product needs review' },
  { action: 'quarantine', reason: 'Product under investigation' },
  { action: 'delete', reason: 'Product removed permanently' },
  { action: 'draft', reason: 'Product set to draft status' }
];

async function testProductModeration() {
  console.log('🧪 Testing Product Moderation Actions...\n');
  
  for (const { action, reason } of moderationActions) {
    try {
      console.log(`Testing action: ${action.toUpperCase()}`);
      console.log(`Reason: ${reason}`);
      
      const response = await axios.post(
        `${BASE_URL}/admin/products/${TEST_PRODUCT_ID}/moderate`,
        { action, reason },
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ SUCCESS: ${action} action completed`);
      console.log(`Status: ${response.data.data.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}\n`);
      
    } catch (error) {
      console.log(`❌ FAILED: ${action} action failed`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.response.data.message || error.response.data}`);
      } else {
        console.log(`Error: ${error.message}`);
      }
      console.log('');
    }
  }
  
  console.log('🎯 Product moderation testing completed!');
}

// Run the test
if (require.main === module) {
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️  Please update ADMIN_TOKEN with a valid admin token');
    console.log('⚠️  Please update TEST_PRODUCT_ID with a valid product ID');
    process.exit(1);
  }
  
  testProductModeration().catch(console.error);
}

module.exports = { testProductModeration };
