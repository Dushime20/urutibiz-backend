const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token
const TEST_PRODUCT_ID = 'test-product-id'; // Replace with actual product ID
const TEST_USER_ID = 'test-user-id'; // Replace with actual user ID
const TEST_MODERATOR_ID = 'test-moderator-id'; // Replace with actual moderator ID

// Test headers
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testModerationActionsAPI() {
  console.log('🧪 Testing Moderation Actions API...\n');

  try {
    // Test 1: Get all moderation actions
    console.log('1️⃣ Testing GET /admin/moderation/actions');
    const allActions = await axios.get(`${BASE_URL}/admin/moderation/actions`, { headers });
    console.log('✅ Success: Retrieved all moderation actions');
    console.log(`📊 Total actions: ${allActions.data.data?.length || 0}\n`);

    // Test 2: Get moderation actions with filters
    console.log('2️⃣ Testing GET /admin/moderation/actions with filters');
    const filteredActions = await axios.get(`${BASE_URL}/admin/moderation/actions`, {
      headers,
      params: {
        resourceType: 'product',
        action: 'reject',
        limit: 10,
        offset: 0
      }
    });
    console.log('✅ Success: Retrieved filtered moderation actions');
    console.log(`📊 Filtered actions: ${filteredActions.data.data?.length || 0}\n`);

    // Test 3: Get moderation history for a product
    console.log('3️⃣ Testing GET /admin/moderation/actions/product/{id}');
    const productHistory = await axios.get(`${BASE_URL}/admin/moderation/actions/product/${TEST_PRODUCT_ID}`, { headers });
    console.log('✅ Success: Retrieved product moderation history');
    console.log(`📊 History entries: ${productHistory.data.data?.length || 0}\n`);

    // Test 4: Get moderation history for a user
    console.log('4️⃣ Testing GET /admin/moderation/actions/user/{id}');
    const userHistory = await axios.get(`${BASE_URL}/admin/moderation/actions/user/${TEST_USER_ID}`, { headers });
    console.log('✅ Success: Retrieved user moderation history');
    console.log(`📊 History entries: ${userHistory.data.data?.length || 0}\n`);

    // Test 5: Get actions by a specific moderator
    console.log('5️⃣ Testing GET /admin/moderation/actions/moderator/{id}');
    const moderatorActions = await axios.get(`${BASE_URL}/admin/moderation/actions/moderator/${TEST_MODERATOR_ID}`, { headers });
    console.log('✅ Success: Retrieved moderator actions');
    console.log(`📊 Moderator actions: ${moderatorActions.data.data?.length || 0}\n`);

    // Test 6: Get moderation statistics
    console.log('6️⃣ Testing GET /admin/moderation/stats');
    const stats = await axios.get(`${BASE_URL}/admin/moderation/stats`, { headers });
    console.log('✅ Success: Retrieved moderation statistics');
    console.log('📊 Statistics:', JSON.stringify(stats.data.data, null, 2));
    console.log('');

    // Test 7: Test pagination
    console.log('7️⃣ Testing pagination with limit and offset');
    const paginatedActions = await axios.get(`${BASE_URL}/admin/moderation/actions`, {
      headers,
      params: {
        limit: 5,
        offset: 0
      }
    });
    console.log('✅ Success: Retrieved paginated actions');
    console.log(`📊 Page 1 actions: ${paginatedActions.data.data?.length || 0}`);

    const page2Actions = await axios.get(`${BASE_URL}/admin/moderation/actions`, {
      headers,
      params: {
        limit: 5,
        offset: 5
      }
    });
    console.log(`📊 Page 2 actions: ${page2Actions.data.data?.length || 0}\n`);

    // Test 8: Test date filtering
    console.log('8️⃣ Testing date filtering');
    const today = new Date().toISOString().split('T')[0];
    const dateFilteredActions = await axios.get(`${BASE_URL}/admin/moderation/actions`, {
      headers,
      params: {
        dateFrom: today,
        dateTo: today
      }
    });
    console.log('✅ Success: Retrieved date-filtered actions');
    console.log(`📊 Today's actions: ${dateFilteredActions.data.data?.length || 0}\n`);

    console.log('🎯 All moderation actions API tests completed successfully!');

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

// Test moderation action creation (this will create real data)
async function testModerationActionCreation() {
  console.log('\n🧪 Testing Moderation Action Creation...\n');

  try {
    // Test product moderation (this will create a moderation action record)
    console.log('1️⃣ Testing product moderation action creation');
    const productModeration = await axios.post(
      `${BASE_URL}/admin/products/${TEST_PRODUCT_ID}/moderate`,
      {
        action: 'flag',
        reason: 'Testing moderation action creation - product flagged for review'
      },
      { headers }
    );
    console.log('✅ Success: Product moderation action created');
    console.log(`📊 New status: ${productModeration.data.data.status}`);

    // Test user moderation (this will create a moderation action record)
    console.log('\n2️⃣ Testing user moderation action creation');
    const userModeration = await axios.post(
      `${BASE_URL}/admin/users/${TEST_USER_ID}/moderate`,
      {
        action: 'warn',
        reason: 'Testing moderation action creation - user warned for behavior'
      },
      { headers }
    );
    console.log('✅ Success: User moderation action created');

    // Now verify the actions were stored
    console.log('\n3️⃣ Verifying moderation actions were stored');
    const productHistory = await axios.get(`${BASE_URL}/admin/moderation/actions/product/${TEST_PRODUCT_ID}`, { headers });
    const userHistory = await axios.get(`${BASE_URL}/admin/moderation/actions/user/${TEST_USER_ID}`, { headers });

    console.log(`📊 Product moderation actions: ${productHistory.data.data?.length || 0}`);
    console.log(`📊 User moderation actions: ${userHistory.data.data?.length || 0}`);

    if (productHistory.data.data?.length > 0) {
      const latestAction = productHistory.data.data[0];
      console.log(`📝 Latest action: ${latestAction.action} - ${latestAction.reason}`);
    }

    console.log('\n🎯 Moderation action creation tests completed successfully!');

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

// Run the tests
if (require.main === module) {
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️  Please update ADMIN_TOKEN with a valid admin token');
    console.log('⚠️  Please update TEST_PRODUCT_ID with a valid product ID');
    console.log('⚠️  Please update TEST_USER_ID with a valid user ID');
    console.log('⚠️  Please update TEST_MODERATOR_ID with a valid moderator ID');
    process.exit(1);
  }
  
  // Run API tests first
  testModerationActionsAPI()
    .then(() => {
      // Then test action creation
      return testModerationActionCreation();
    })
    .catch(console.error);
}

module.exports = { testModerationActionsAPI, testModerationActionCreation };
