const axios = require('axios');

async function checkProductsExist() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🔍 Checking what products actually exist in your database...\n');

  try {
    // Check products endpoint
    console.log('1️⃣ Getting products from API...');
    const productsResponse = await axios.get(`${BASE_URL}/admin/products`);
    
    if (productsResponse.data.success) {
      const products = productsResponse.data.data;
      console.log(`✅ Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log('\n📦 Product Details:');
        products.forEach((product, index) => {
          console.log(`${index + 1}. ID: ${product.id}`);
          console.log(`   Title: ${product.title || 'No title'}`);
          console.log(`   Status: ${product.status || 'No status'}`);
          console.log(`   Created: ${product.created_at || 'No date'}`);
          console.log('');
        });
        
        // Test if we can get a specific product by ID
        const firstProduct = products[0];
        console.log(`2️⃣ Testing if we can get product by ID: ${firstProduct.id}`);
        
        try {
          const singleProductResponse = await axios.get(`${BASE_URL}/admin/products/${firstProduct.id}`);
          if (singleProductResponse.data.success) {
            console.log('✅ Product lookup by ID works');
            console.log(`📊 Product: ${singleProductResponse.data.data.title}`);
          } else {
            console.log('❌ Product lookup by ID failed');
            console.log(`Error: ${singleProductResponse.data.message}`);
          }
        } catch (error) {
          console.log('❌ Error getting single product:');
          if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Error: ${error.response.data.message || error.response.data}`);
          } else {
            console.log(`Error: ${error.message}`);
          }
        }
        
      } else {
        console.log('⚠️ No products found in database');
        console.log('This explains why moderation fails - there are no products to moderate!');
      }
    } else {
      console.log('❌ Failed to get products');
      console.log(`Error: ${productsResponse.data.message}`);
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
checkProductsExist().catch(console.error);

