const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testProductViews() {
  try {
    console.log('🧪 Testing Product View Tracking...\n');

    // Test 1: Get a product (should increment view count)
    console.log('1️⃣ Getting product details...');
    const productResponse = await axios.get(`${BASE_URL}/products`);
    
    if (productResponse.data.success && productResponse.data.data.rows.length > 0) {
      const productId = productResponse.data.data.rows[0].id;
      console.log(`   Found product: ${productId}`);
      
      // Get initial view count
      const initialProduct = await axios.get(`${BASE_URL}/products/${productId}`);
      const initialViewCount = initialProduct.data.data.view_count || 0;
      console.log(`   Initial view count: ${initialViewCount}`);
      
      // View the product multiple times
      for (let i = 1; i <= 3; i++) {
        console.log(`   Viewing product (attempt ${i})...`);
        await axios.get(`${BASE_URL}/products/${productId}`);
        
        // Wait a bit between views
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Check final view count
      const finalProduct = await axios.get(`${BASE_URL}/products/${productId}`);
      const finalViewCount = finalProduct.data.data.view_count || 0;
      console.log(`   Final view count: ${finalViewCount}`);
      
      if (finalViewCount > initialViewCount) {
        console.log(`   ✅ SUCCESS: View count increased from ${initialViewCount} to ${finalViewCount}`);
      } else {
        console.log(`   ❌ FAILED: View count did not increase (${initialViewCount} -> ${finalViewCount})`);
      }
      
      // Test 2: Check product_views table
      console.log('\n2️⃣ Checking product_views table...');
      try {
        const viewsResponse = await axios.get(`${BASE_URL}/products/${productId}/analytics`);
        console.log(`   Analytics response:`, viewsResponse.data);
      } catch (error) {
        console.log(`   Analytics endpoint error:`, error.response?.data || error.message);
      }
      
    } else {
      console.log('   ❌ No products found to test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProductViews().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
