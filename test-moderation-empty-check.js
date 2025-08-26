const axios = require('axios');

async function testModerationEmptyCheck() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🔍 Testing why moderation API returns empty results...\n');

  try {
    // Test 1: Check if moderation actions endpoint exists
    console.log('1️⃣ Testing moderation actions endpoint...');
    const actionsResponse = await axios.get(`${BASE_URL}/admin/moderation/actions`);
    console.log('✅ Endpoint exists');
    console.log(`📊 Response: ${JSON.stringify(actionsResponse.data, null, 2)}\n`);

    // Test 2: Check moderation stats
    console.log('2️⃣ Testing moderation stats endpoint...');
    const statsResponse = await axios.get(`${BASE_URL}/admin/moderation/stats`);
    console.log('✅ Stats endpoint exists');
    console.log(`📊 Response: ${JSON.stringify(statsResponse.data, null, 2)}\n`);

    // Test 3: Check if there are any products to moderate
    console.log('3️⃣ Checking if there are products to moderate...');
    const productsResponse = await axios.get(`${BASE_URL}/admin/products`);
    console.log('✅ Products endpoint exists');
    if (productsResponse.data.data && productsResponse.data.data.length > 0) {
      console.log(`📦 Found ${productsResponse.data.data.length} products`);
      console.log(`🔑 First product ID: ${productsResponse.data.data[0].id}`);
    } else {
      console.log('⚠️ No products found');
    }

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
testModerationEmptyCheck().catch(console.error);

