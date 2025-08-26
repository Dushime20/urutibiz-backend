const axios = require('axios');

async function checkRealProductId() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🔍 Checking the REAL product ID format...\n');

  try {
    // Get products to see the actual ID format
    console.log('1️⃣ Getting products to see actual ID format...');
    const productsResponse = await axios.get(`${BASE_URL}/admin/products`);
    
    if (productsResponse.data.success && productsResponse.data.data.length > 0) {
      const products = productsResponse.data.data;
      console.log(`✅ Found ${products.length} products\n`);
      
      // Show the first few products with their ID lengths
      products.slice(0, 3).forEach((product, index) => {
        console.log(`📦 Product ${index + 1}:`);
        console.log(`   ID: ${product.id}`);
        console.log(`   ID Length: ${product.id.length} characters`);
        console.log(`   Title: ${product.title || 'No title'}`);
        console.log('');
      });
      
      // Check if the problematic ID exists
      const problematicId = '6250a8bc-6198-4545-a51d-7b5a964c400';
      const fullId = '6250a8bc-6198-4545-a51d-7b5a964c4000';
      
      console.log('🔍 Checking ID formats:');
      console.log(`❌ Problematic ID: ${problematicId} (${problematicId.length} chars)`);
      console.log(`✅ Full UUID format: ${fullId} (${fullId.length} chars)`);
      console.log(`📏 Expected length: 36 characters`);
      
      // Try to find a product with similar ID
      const similarProduct = products.find(p => p.id.startsWith('6250a8bc-6198-4545-a51d-7b5a964c4'));
      if (similarProduct) {
        console.log(`\n🎯 Found similar product:`);
        console.log(`   Actual ID: ${similarProduct.id}`);
        console.log(`   Title: ${similarProduct.title}`);
      }
      
    } else {
      console.log('❌ No products found or API error');
      console.log(`Response: ${JSON.stringify(productsResponse.data, null, 2)}`);
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

checkRealProductId();


