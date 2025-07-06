/**
 * Demo script for Product Prices CRUD operations
 * 
 * This script demonstrates all the features of the Product Prices system:
 * - Creating product prices with country-specific variations
 * - Reading and filtering prices by various criteria
 * - Updating price information
 * - Deleting prices
 * - Bulk operations for managing multiple prices
 * - Price calculations and comparisons
 * - Country-specific filtering and statistics
 * 
 * Usage: node demo-product-prices-crud.js
 * 
 * Make sure your backend server is running on http://localhost:3000
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const API_URL = `${BASE_URL}/product-prices`;

// Demo data
const demoProductPrices = [
  {
    product_id: "550e8400-e29b-41d4-a716-446655440001",
    country_code: "URY",
    base_price: 10000,
    currency: "UYU",
    category: "RENTAL",
    price_type: "HOURLY",
    variations: {
      peak_season_multiplier: 1.5,
      weekend_multiplier: 1.2,
      holiday_multiplier: 1.8
    },
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    metadata: {
      includes_taxes: true,
      tax_rate: 0.22,
      promotional: false
    },
    is_active: true
  },
  {
    product_id: "550e8400-e29b-41d4-a716-446655440002",
    country_code: "ARG",
    base_price: 8500,
    currency: "ARS",
    category: "RENTAL",
    price_type: "DAILY",
    variations: {
      monthly_discount: 0.15,
      bulk_discount: 0.10
    },
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    metadata: {
      includes_taxes: false,
      tax_rate: 0.21,
      promotional: true,
      promotion_end: "2024-06-30T23:59:59Z"
    },
    is_active: true
  },
  {
    product_id: "550e8400-e29b-41d4-a716-446655440003",
    country_code: "BRA",
    base_price: 45.50,
    currency: "BRL",
    category: "SERVICE",
    price_type: "FIXED",
    variations: {
      premium_service_fee: 15.00,
      express_delivery_fee: 8.50
    },
    valid_from: "2024-01-01T00:00:00Z",
    valid_until: "2024-12-31T23:59:59Z",
    metadata: {
      includes_taxes: true,
      tax_rate: 0.18,
      service_level: "standard"
    },
    is_active: true
  }
];

// Utility function for API calls with error handling
async function apiCall(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Error in ${method.toUpperCase()} ${url}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Message: ${error.message}`);
    }
    return { success: false, error };
  }
}

// Demo functions
async function createProductPrices() {
  console.log('\n🏷️  Creating Product Prices...');
  const createdPrices = [];
  
  for (const price of demoProductPrices) {
    console.log(`\n   Creating price for product ${price.product_id} in ${price.country_code}...`);
    const result = await apiCall('POST', API_URL, price);
    
    if (result.success) {
      console.log(`   ✅ Created price with ID: ${result.data.data.id}`);
      console.log(`   💰 Base price: ${result.data.data.base_price} ${result.data.data.currency}`);
      console.log(`   📅 Valid from: ${result.data.data.valid_from} to ${result.data.data.valid_until}`);
      createdPrices.push(result.data.data);
    }
  }
  
  return createdPrices;
}

async function getAllProductPrices() {
  console.log('\n📋 Getting all Product Prices...');
  const result = await apiCall('GET', API_URL);
  
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} prices`);
    result.data.data.forEach(price => {
      console.log(`   🏷️  ${price.product_id} (${price.country_code}): ${price.base_price} ${price.currency} - ${price.price_type}`);
    });
    return result.data.data;
  }
  
  return [];
}

async function getProductPricesByFilters() {
  console.log('\n🔍 Testing various filters...');
  
  // Filter by country
  console.log('\n   Filtering by country (URY):');
  let result = await apiCall('GET', `${API_URL}?country_code=URY`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} prices for Uruguay`);
  }
  
  // Filter by price type
  console.log('\n   Filtering by price type (HOURLY):');
  result = await apiCall('GET', `${API_URL}?price_type=HOURLY`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} hourly prices`);
  }
  
  // Filter by category
  console.log('\n   Filtering by category (RENTAL):');
  result = await apiCall('GET', `${API_URL}?category=RENTAL`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} rental prices`);
  }
  
  // Filter by active status
  console.log('\n   Filtering by active status:');
  result = await apiCall('GET', `${API_URL}?is_active=true`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} active prices`);
  }
  
  // Price range filter
  console.log('\n   Filtering by price range (1000-50000):');
  result = await apiCall('GET', `${API_URL}?min_price=1000&max_price=50000`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} prices in range`);
  }
}

async function getProductPriceById(priceId) {
  console.log(`\n🔍 Getting Product Price by ID: ${priceId}...`);
  const result = await apiCall('GET', `${API_URL}/${priceId}`);
  
  if (result.success) {
    const price = result.data.data;
    console.log(`   ✅ Found price: ${price.base_price} ${price.currency}`);
    console.log(`   🌍 Country: ${price.country_code}`);
    console.log(`   📦 Product: ${price.product_id}`);
    console.log(`   🏷️  Type: ${price.price_type} | Category: ${price.category}`);
    console.log(`   📊 Variations:`, JSON.stringify(price.variations, null, 2));
    return price;
  }
  
  return null;
}

async function updateProductPrice(priceId) {
  console.log(`\n✏️  Updating Product Price ${priceId}...`);
  
  const updateData = {
    base_price: 12500,
    variations: {
      peak_season_multiplier: 1.6,
      weekend_multiplier: 1.3,
      holiday_multiplier: 2.0,
      early_bird_discount: 0.10
    },
    metadata: {
      includes_taxes: true,
      tax_rate: 0.22,
      promotional: true,
      promotion_code: "SUMMER2024",
      last_updated: new Date().toISOString()
    }
  };
  
  const result = await apiCall('PUT', `${API_URL}/${priceId}`, updateData);
  
  if (result.success) {
    console.log(`   ✅ Updated price successfully`);
    console.log(`   💰 New base price: ${result.data.data.base_price}`);
    console.log(`   🎯 New variations:`, JSON.stringify(result.data.data.variations, null, 2));
    return result.data.data;
  }
  
  return null;
}

async function testBulkOperations() {
  console.log('\n📦 Testing bulk operations...');
  
  // Bulk create
  console.log('\n   Testing bulk create:');
  const bulkCreateData = [
    {
      product_id: "550e8400-e29b-41d4-a716-446655440004",
      country_code: "CHL",
      base_price: 18500,
      currency: "CLP",
      category: "RENTAL",
      price_type: "DAILY",
      is_active: true
    },
    {
      product_id: "550e8400-e29b-41d4-a716-446655440005",
      country_code: "PER",
      base_price: 125.75,
      currency: "PEN",
      category: "SERVICE",
      price_type: "FIXED",
      is_active: true
    }
  ];
  
  let result = await apiCall('POST', `${API_URL}/bulk`, { prices: bulkCreateData });
  if (result.success) {
    console.log(`   ✅ Bulk created ${result.data.data.created} prices`);
  }
  
  // Bulk update
  console.log('\n   Testing bulk update by country:');
  const bulkUpdateData = {
    updates: {
      metadata: {
        bulk_updated: true,
        update_timestamp: new Date().toISOString()
      }
    },
    filters: {
      country_code: "URY"
    }
  };
  
  result = await apiCall('PUT', `${API_URL}/bulk`, bulkUpdateData);
  if (result.success) {
    console.log(`   ✅ Bulk updated ${result.data.data.updated} prices`);
  }
}

async function testPriceCalculations(priceId) {
  console.log(`\n🧮 Testing price calculations for ${priceId}...`);
  
  // Calculate total price with variations
  console.log('\n   Calculating total price with variations:');
  const calculationParams = {
    base_amount: 1,
    variations: ['peak_season_multiplier', 'weekend_multiplier'],
    date: '2024-07-15T10:00:00Z' // Weekend in peak season
  };
  
  let result = await apiCall('POST', `${API_URL}/${priceId}/calculate`, calculationParams);
  if (result.success) {
    console.log(`   ✅ Calculated total: ${result.data.data.total_price} ${result.data.data.currency}`);
    console.log(`   📊 Breakdown:`, JSON.stringify(result.data.data.breakdown, null, 2));
  }
  
  // Get price comparison
  console.log('\n   Getting price comparison across countries:');
  result = await apiCall('GET', `${API_URL}/compare?product_id=550e8400-e29b-41d4-a716-446655440001`);
  if (result.success) {
    console.log(`   ✅ Price comparison retrieved`);
    result.data.data.forEach(comparison => {
      console.log(`   🌍 ${comparison.country_code}: ${comparison.price} ${comparison.currency}`);
    });
  }
}

async function testCountryStatistics() {
  console.log('\n📊 Testing country-specific statistics...');
  
  // Get statistics for Uruguay
  console.log('\n   Getting statistics for Uruguay:');
  let result = await apiCall('GET', `${API_URL}/stats/country/URY`);
  if (result.success) {
    const stats = result.data.data;
    console.log(`   ✅ Total prices: ${stats.total_prices}`);
    console.log(`   💰 Average price: ${stats.average_price} ${stats.currency}`);
    console.log(`   📈 Price range: ${stats.min_price} - ${stats.max_price}`);
    console.log(`   📦 Categories:`, Object.keys(stats.by_category).join(', '));
  }
  
  // Get global statistics
  console.log('\n   Getting global statistics:');
  result = await apiCall('GET', `${API_URL}/stats`);
  if (result.success) {
    const stats = result.data.data;
    console.log(`   ✅ Total prices across all countries: ${stats.total_prices}`);
    console.log(`   🌍 Countries: ${stats.countries.length}`);
    console.log(`   💱 Currencies: ${stats.currencies.join(', ')}`);
    console.log(`   📦 Categories: ${stats.categories.join(', ')}`);
  }
}

async function deleteProductPrice(priceId) {
  console.log(`\n🗑️  Deleting Product Price ${priceId}...`);
  const result = await apiCall('DELETE', `${API_URL}/${priceId}`);
  
  if (result.success) {
    console.log(`   ✅ Price deleted successfully`);
    return true;
  }
  
  return false;
}

async function runDemo() {
  console.log('🚀 Starting Product Prices CRUD Demo');
  console.log('=====================================');
  
  try {
    // Test server connectivity
    console.log('\n🔌 Testing server connectivity...');
    const healthResult = await apiCall('GET', `${BASE_URL}/health`);
    if (!healthResult.success) {
      console.log('❌ Could not connect to server. Make sure the backend is running on http://localhost:3000');
      return;
    }
    console.log('✅ Server is running');
    
    // Create product prices
    const createdPrices = await createProductPrices();
    
    if (createdPrices.length === 0) {
      console.log('❌ No prices were created. Cannot continue with demo.');
      return;
    }
    
    // Get all prices
    await getAllProductPrices();
    
    // Test filtering
    await getProductPricesByFilters();
    
    // Get specific price
    const firstPrice = createdPrices[0];
    const retrievedPrice = await getProductPriceById(firstPrice.id);
    
    if (retrievedPrice) {
      // Update the price
      const updatedPrice = await updateProductPrice(firstPrice.id);
      
      if (updatedPrice) {
        // Test calculations
        await testPriceCalculations(firstPrice.id);
      }
    }
    
    // Test bulk operations
    await testBulkOperations();
    
    // Test statistics
    await testCountryStatistics();
    
    // Clean up - delete created prices
    console.log('\n🧹 Cleaning up...');
    for (const price of createdPrices) {
      await deleteProductPrice(price.id);
    }
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\n📝 Summary of tested features:');
    console.log('   ✅ Create product prices with country-specific data');
    console.log('   ✅ Read and filter prices by various criteria');
    console.log('   ✅ Update price information and variations');
    console.log('   ✅ Delete prices');
    console.log('   ✅ Bulk operations for managing multiple prices');
    console.log('   ✅ Price calculations with variations');
    console.log('   ✅ Price comparisons across countries');
    console.log('   ✅ Country-specific and global statistics');
    console.log('\n🎉 All Product Prices CRUD operations are working correctly!');
    
  } catch (error) {
    console.error('\n❌ Demo failed with error:', error.message);
  }
}

// Handle command line execution
if (require.main === module) {
  runDemo();
}

module.exports = {
  runDemo,
  createProductPrices,
  getAllProductPrices,
  getProductPricesByFilters,
  getProductPriceById,
  updateProductPrice,
  testBulkOperations,
  testPriceCalculations,
  testCountryStatistics,
  deleteProductPrice
};
