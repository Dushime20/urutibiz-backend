const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testProductBrowsing() {
  try {
    console.log('🧪 Testing Product Browsing (Multiple Products)...\n');

    // Test 1: Get multiple products
    console.log('1️⃣ Getting list of products...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    
    if (productsResponse.data.success && productsResponse.data.data.rows.length >= 3) {
      const products = productsResponse.data.data.rows.slice(0, 3);
      console.log(`   Found ${products.length} products to test with`);
      
      // Test browsing between different products
      console.log('\n2️⃣ Testing browsing between different products...');
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`   📱 Viewing product ${i + 1}: ${product.title} (ID: ${product.id})`);
        
        const productResponse = await axios.get(`${BASE_URL}/products/${product.id}`);
        const viewCount = productResponse.data.data.view_count || 0;
        console.log(`   ✅ View count: ${viewCount}`);
        
        // Small delay between products
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Test rapid browsing (should all work)
      console.log('\n3️⃣ Testing rapid browsing between products...');
      
      for (let i = 0; i < 2; i++) {
        for (const product of products) {
          console.log(`   🔄 Rapid view: ${product.title}`);
          await axios.get(`${BASE_URL}/products/${product.id}`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Very short delay
        }
      }
      
      // Test same product multiple times (should have cooldown)
      console.log('\n4️⃣ Testing same product multiple times (should have 10s cooldown)...');
      const testProduct = products[0];
      
      for (let i = 1; i <= 3; i++) {
        console.log(`   🔁 Viewing same product (attempt ${i}): ${testProduct.title}`);
        await axios.get(`${BASE_URL}/products/${testProduct.id}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      // Final check of view counts
      console.log('\n5️⃣ Final view counts:');
      for (const product of products) {
        const finalResponse = await axios.get(`${BASE_URL}/products/${product.id}`);
        const finalViewCount = finalResponse.data.data.view_count || 0;
        console.log(`   📊 ${product.title}: ${finalViewCount} views`);
      }
      
    } else {
      console.log('   ❌ Need at least 3 products to test browsing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProductBrowsing().then(() => {
  console.log('\n🏁 Browsing test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
