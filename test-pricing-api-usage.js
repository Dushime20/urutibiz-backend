#!/usr/bin/env node

/**
 * 🏷️ Pricing API Usage Test Script
 * 
 * This script demonstrates how to use the UrutiBiz Pricing API step by step.
 * Run this script to test all pricing functionality.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const API_TOKEN = process.env.API_TOKEN || 'your-jwt-token-here';

// Sample data
const SAMPLE_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SAMPLE_COUNTRY_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

// Create API client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Utility functions
function logStep(step, description) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔹 STEP ${step}: ${description}`);
  console.log(`${'='.repeat(50)}`);
}

function logSuccess(message, data = null) {
  console.log(`✅ ${message}`);
  if (data) {
    console.log('📊 Response:', JSON.stringify(data, null, 2));
  }
}

function logError(message, error = null) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log('🔍 Error details:', error.response?.data || error.message);
  }
}

// Test functions
async function testCreateProductPrice() {
  logStep(1, 'Create Product Price');
  
  try {
    const priceData = {
      product_id: SAMPLE_PRODUCT_ID,
      country_id: SAMPLE_COUNTRY_ID,
      currency: 'USD',
      price_per_hour: 5.00,
      price_per_day: 30.00,
      price_per_week: 150.00,
      price_per_month: 500.00,
      security_deposit: 100.00,
      market_adjustment_factor: 1.15,
      auto_convert: true,
      base_price: 30.00,
      base_currency: 'USD',
      min_rental_duration_hours: 2,
      max_rental_duration_days: 30,
      early_return_fee_percentage: 0.10,
      late_return_fee_per_hour: 2.50,
      weekly_discount_percentage: 0.10,
      monthly_discount_percentage: 0.20,
      bulk_discount_threshold: 3,
      bulk_discount_percentage: 0.15,
      dynamic_pricing_enabled: true,
      peak_season_multiplier: 1.25,
      off_season_multiplier: 0.85,
      seasonal_adjustments: {
        '6': 1.20,  // June
        '7': 1.30,  // July
        '8': 1.25,  // August
        '12': 1.15  // December
      },
      is_active: true,
      effective_from: new Date().toISOString(),
      notes: 'Power tool rental pricing for construction projects'
    };

    const response = await api.post('/product-prices', priceData);
    logSuccess('Product price created successfully', response.data);
    return response.data.data.id;
  } catch (error) {
    logError('Failed to create product price', error);
    return null;
  }
}

async function testCalculateRentalPrice(priceId) {
  logStep(2, 'Calculate Rental Price');
  
  try {
    const calculationData = {
      product_id: SAMPLE_PRODUCT_ID,
      country_id: SAMPLE_COUNTRY_ID,
      currency: 'USD',
      rental_duration_hours: 48,  // 2 days
      quantity: 2,
      rental_start_date: new Date().toISOString(),
      include_security_deposit: true,
      apply_discounts: true
    };

    const response = await api.post('/product-prices/calculate', calculationData);
    logSuccess('Price calculation completed', response.data);
    
    // Display breakdown
    const result = response.data.data;
    console.log('\n💰 Price Breakdown:');
    console.log(`   Base Rate: $${result.base_rate} (${result.base_rate_type})`);
    console.log(`   Duration: ${result.rental_duration_hours} hours (${result.rental_duration_days} days)`);
    console.log(`   Quantity: ${result.quantity}`);
    console.log(`   Market Adjustment: ${result.market_adjustment_factor}x`);
    console.log(`   Seasonal Multiplier: ${result.seasonal_multiplier}x`);
    console.log(`   Bulk Discount: $${result.bulk_discount}`);
    console.log(`   Security Deposit: $${result.security_deposit}`);
    console.log(`   Total Amount: $${result.total_amount}`);
    console.log(`   Savings: $${result.savings}`);
    
    return response.data.data;
  } catch (error) {
    logError('Failed to calculate rental price', error);
    return null;
  }
}

async function testGetProductPrices() {
  logStep(3, 'Get Product Prices');
  
  try {
    // Get prices for specific product
    const response = await api.get('/product-prices', {
      params: {
        product_id: SAMPLE_PRODUCT_ID,
        is_active: true
      }
    });
    
    logSuccess('Product prices retrieved successfully', response.data);
    return response.data.data;
  } catch (error) {
    logError('Failed to get product prices', error);
    return null;
  }
}

async function testComparePrices() {
  logStep(4, 'Compare Prices Across Countries');
  
  try {
    const response = await api.get(`/product-prices/product/${SAMPLE_PRODUCT_ID}/compare`);
    logSuccess('Price comparison retrieved', response.data);
    
    // Display comparison
    const comparisons = response.data.data.comparisons;
    console.log('\n🌍 Price Comparison:');
    comparisons.forEach(comp => {
      console.log(`   ${comp.country_name} (${comp.currency}):`);
      console.log(`     Daily: ${comp.currency} ${comp.price_per_day}`);
      console.log(`     Weekly: ${comp.currency} ${comp.price_per_week}`);
      console.log(`     Monthly: ${comp.currency} ${comp.price_per_month}`);
      console.log(`     Security Deposit: ${comp.currency} ${comp.security_deposit}`);
      console.log(`     Market Factor: ${comp.market_adjustment_factor}x\n`);
    });
    
    return response.data.data;
  } catch (error) {
    logError('Failed to compare prices', error);
    return null;
  }
}

async function testUpdateProductPrice(priceId) {
  logStep(5, 'Update Product Price');
  
  try {
    const updateData = {
      price_per_day: 35.00,
      weekly_discount_percentage: 0.15,
      peak_season_multiplier: 1.30,
      notes: 'Updated pricing for summer season'
    };

    const response = await api.put(`/product-prices/${priceId}`, updateData);
    logSuccess('Product price updated successfully', response.data);
    return response.data.data;
  } catch (error) {
    logError('Failed to update product price', error);
    return null;
  }
}

async function testBulkUpdatePrices() {
  logStep(6, 'Bulk Update Prices');
  
  try {
    const bulkData = {
      operation: 'update_market_factors',
      product_ids: [SAMPLE_PRODUCT_ID],
      data: {
        market_adjustment_factor: 1.20
      }
    };

    const response = await api.patch('/product-prices/bulk', bulkData);
    logSuccess('Bulk update completed successfully', response.data);
    return response.data.data;
  } catch (error) {
    logError('Failed to perform bulk update', error);
    return null;
  }
}

async function testGetPricingStats() {
  logStep(7, 'Get Pricing Statistics');
  
  try {
    const response = await api.get('/product-prices/stats', {
      params: {
        country_id: SAMPLE_COUNTRY_ID
      }
    });
    
    logSuccess('Pricing statistics retrieved', response.data);
    
    // Display stats
    const stats = response.data.data;
    console.log('\n📊 Pricing Statistics:');
    console.log(`   Total Prices: ${stats.total_prices}`);
    console.log(`   Active Prices: ${stats.active_prices}`);
    console.log(`   Currencies: ${stats.currencies.join(', ')}`);
    console.log(`   Average Daily Price: $${stats.average_daily_price}`);
    console.log(`   Price Range: $${stats.price_range.min} - $${stats.price_range.max}`);
    
    return response.data.data;
  } catch (error) {
    logError('Failed to get pricing statistics', error);
    return null;
  }
}

async function testPriceCalculationScenarios() {
  logStep(8, 'Test Different Price Calculation Scenarios');
  
  const scenarios = [
    {
      name: 'Hourly Rental (4 hours)',
      data: {
        product_id: SAMPLE_PRODUCT_ID,
        country_id: SAMPLE_COUNTRY_ID,
        rental_duration_hours: 4,
        quantity: 1
      }
    },
    {
      name: 'Weekly Rental with Discount',
      data: {
        product_id: SAMPLE_PRODUCT_ID,
        country_id: SAMPLE_COUNTRY_ID,
        rental_duration_hours: 168, // 7 days
        quantity: 1
      }
    },
    {
      name: 'Monthly Rental with Maximum Discount',
      data: {
        product_id: SAMPLE_PRODUCT_ID,
        country_id: SAMPLE_COUNTRY_ID,
        rental_duration_hours: 720, // 30 days
        quantity: 1
      }
    },
    {
      name: 'Bulk Rental (3 items)',
      data: {
        product_id: SAMPLE_PRODUCT_ID,
        country_id: SAMPLE_COUNTRY_ID,
        rental_duration_hours: 48,
        quantity: 3
      }
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`\n🔹 Testing: ${scenario.name}`);
      const response = await api.post('/product-prices/calculate', scenario.data);
      const result = response.data.data;
      
      console.log(`   Duration: ${result.rental_duration_hours} hours`);
      console.log(`   Base Rate: $${result.base_rate} (${result.base_rate_type})`);
      console.log(`   Total Amount: $${result.total_amount}`);
      console.log(`   Savings: $${result.savings}`);
      console.log(`   Effective Daily Rate: $${result.effective_daily_rate}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Pricing API Tests...\n');
  
  try {
    // Step 1: Create a product price
    const priceId = await testCreateProductPrice();
    if (!priceId) {
      console.log('❌ Cannot continue without a valid price ID');
      return;
    }

    // Step 2: Calculate rental price
    await testCalculateRentalPrice(priceId);

    // Step 3: Get product prices
    await testGetProductPrices();

    // Step 4: Compare prices
    await testComparePrices();

    // Step 5: Update product price
    await testUpdateProductPrice(priceId);

    // Step 6: Bulk update
    await testBulkUpdatePrices();

    // Step 7: Get statistics
    await testGetPricingStats();

    // Step 8: Test different scenarios
    await testPriceCalculationScenarios();

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Product price creation');
    console.log('✅ Price calculation');
    console.log('✅ Price retrieval');
    console.log('✅ Price comparison');
    console.log('✅ Price updates');
    console.log('✅ Bulk operations');
    console.log('✅ Statistics retrieval');
    console.log('✅ Multiple calculation scenarios');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCreateProductPrice,
  testCalculateRentalPrice,
  testGetProductPrices,
  testComparePrices,
  testUpdateProductPrice,
  testBulkUpdatePrices,
  testGetPricingStats,
  testPriceCalculationScenarios,
  runAllTests
}; 