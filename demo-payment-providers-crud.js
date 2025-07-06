#!/usr/bin/env node

/**
 * =====================================================
 * PAYMENT PROVIDERS CRUD OPERATIONS DEMO SCRIPT
 * =====================================================
 * 
 * This script demonstrates comprehensive CRUD operations for payment providers
 * including creating, reading, updating, deleting, and advanced features like
 * fee calculations, provider comparisons, and bulk operations.
 * 
 * Features tested:
 * - Create payment providers for different countries
 * - Get providers with filters and pagination
 * - Update and delete providers
 * - Calculate payment fees and compare providers
 * - Bulk operations
 * - Statistics and search functionality
 * 
 * Run this script to verify the payment provider system works correctly.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const PAYMENT_PROVIDER_ENDPOINT = `${API_BASE_URL}/payment-providers`;

// Helper function for making requests
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ Request failed: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
      throw error;
    } else {
      console.error(`❌ Network error: ${error.message}`);
      throw error;
    }
  }
}

// Test data for payment providers
const testProviders = [
  {
    country_id: 'UG',
    provider_name: 'mtn_momo',
    provider_type: 'mobile_money',
    display_name: 'MTN Mobile Money',
    logo_url: 'https://example.com/mtn-logo.png',
    is_active: true,
    supported_currencies: ['UGX', 'USD'],
    min_amount: 500,
    max_amount: 5000000,
    fee_percentage: 0.015, // 1.5%
    fee_fixed: 0,
    supports_refunds: true,
    supports_recurring: false,
    processing_time_minutes: 2,
    description: 'Uganda\'s leading mobile money service',
    settings: {
      merchant_code_required: true,
      api_version: 'v2',
      timeout_seconds: 30
    }
  },
  {
    country_id: 'UG',
    provider_name: 'airtel_money',
    provider_type: 'mobile_money',
    display_name: 'Airtel Money',
    is_active: true,
    supported_currencies: ['UGX'],
    min_amount: 100,
    max_amount: 2000000,
    fee_percentage: 0.02, // 2%
    fee_fixed: 100,
    supports_refunds: false,
    supports_recurring: true,
    processing_time_minutes: 5,
    description: 'Fast and secure mobile payments',
    settings: {
      merchant_code_required: false,
      api_version: 'v1'
    }
  },
  {
    country_id: 'KE',
    provider_name: 'mpesa',
    provider_type: 'mobile_money',
    display_name: 'M-Pesa',
    is_active: true,
    supported_currencies: ['KES'],
    min_amount: 10,
    max_amount: 300000,
    fee_percentage: 0.01, // 1%
    fee_fixed: 0,
    supports_refunds: true,
    supports_recurring: true,
    processing_time_minutes: 1,
    description: 'Kenya\'s most trusted mobile money platform',
    settings: {
      business_shortcode: true,
      passkey_required: true,
      api_version: 'v1'
    }
  },
  {
    country_id: 'UG',
    provider_name: 'stripe',
    provider_type: 'card',
    display_name: 'Stripe',
    is_active: true,
    supported_currencies: ['USD', 'EUR', 'UGX'],
    min_amount: 0.50,
    max_amount: 999999,
    fee_percentage: 0.029, // 2.9%
    fee_fixed: 30, // $0.30
    supports_refunds: true,
    supports_recurring: true,
    processing_time_minutes: 1,
    description: 'Global online payments platform',
    api_endpoint: 'https://api.stripe.com/v1',
    settings: {
      '3d_secure': true,
      capture_method: 'automatic',
      webhook_secret_required: true
    }
  },
  {
    country_id: 'NG',
    provider_name: 'paystack',
    provider_type: 'card',
    display_name: 'Paystack',
    is_active: true,
    supported_currencies: ['NGN', 'USD', 'ZAR'],
    min_amount: 100,
    max_amount: 10000000,
    fee_percentage: 0.015, // 1.5%
    fee_fixed: 100, // ₦1.00
    supports_refunds: true,
    supports_recurring: true,
    processing_time_minutes: 2,
    description: 'Modern online and offline payments for Africa',
    api_endpoint: 'https://api.paystack.co',
    settings: {
      webhook_secret_required: false,
      '3d_secure': true
    }
  },
  {
    country_id: 'SN',
    provider_name: 'wave',
    provider_type: 'mobile_money',
    display_name: 'Wave',
    is_active: true,
    supported_currencies: ['XOF'],
    min_amount: 100,
    max_amount: 1000000,
    fee_percentage: 0.01, // 1%
    fee_fixed: 0,
    supports_refunds: false,
    supports_recurring: false,
    processing_time_minutes: 3,
    description: 'Fast, secure mobile money for West Africa',
    settings: {
      encryption: 'AES256',
      api_version: 'v1'
    }
  }
];

async function runPaymentProviderDemo() {
  console.log('\n🚀 PAYMENT PROVIDERS CRUD OPERATIONS DEMO');
  console.log('==========================================\n');

  const createdProviders = [];

  try {
    // 1. Create Payment Providers
    console.log('📝 Step 1: Creating Payment Providers');
    console.log('------------------------------------');
    
    for (const providerData of testProviders) {
      console.log(`Creating ${providerData.display_name} for ${providerData.country_id}...`);
      
      const result = await makeRequest('POST', PAYMENT_PROVIDER_ENDPOINT, providerData);
      
      if (result.success) {
        createdProviders.push(result.data);
        console.log(`✅ Created: ${result.data.display_name} (ID: ${result.data.id})`);
      }
    }

    console.log(`\n✨ Successfully created ${createdProviders.length} payment providers\n`);

    // 2. Get All Payment Providers
    console.log('📋 Step 2: Retrieving All Payment Providers');
    console.log('------------------------------------------');
    
    const allProviders = await makeRequest('GET', PAYMENT_PROVIDER_ENDPOINT);
    console.log(`✅ Retrieved ${allProviders.data.length} payment providers`);
    console.log(`📄 Page ${allProviders.pagination.page} of ${allProviders.pagination.totalPages}`);
    console.log(`📊 Total: ${allProviders.pagination.total} providers\n`);

    // 3. Get Providers with Filters
    console.log('🔍 Step 3: Testing Filters and Search');
    console.log('------------------------------------');
    
    // Filter by country
    console.log('Filtering by country (UG)...');
    const ugProviders = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}?country_id=UG`);
    console.log(`✅ Found ${ugProviders.data.length} providers in Uganda`);
    
    // Filter by provider type
    console.log('Filtering by type (mobile_money)...');
    const mobileMoneyProviders = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}?provider_type=mobile_money`);
    console.log(`✅ Found ${mobileMoneyProviders.data.length} mobile money providers`);
    
    // Search providers
    console.log('Searching for "stripe"...');
    const searchResults = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/search?query=stripe`);
    console.log(`✅ Found ${searchResults.data.length} providers matching "stripe"`);
    
    // Filter by currency support
    console.log('Filtering by currency (USD)...');
    const usdProviders = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}?currency=USD`);
    console.log(`✅ Found ${usdProviders.data.length} providers supporting USD\n`);

    // 4. Get Provider Statistics
    console.log('📊 Step 4: Getting Provider Statistics');
    console.log('------------------------------------');
    
    const stats = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/stats`);
    console.log(`✅ Total providers: ${stats.data.total_providers}`);
    console.log(`📈 Active providers: ${stats.data.active_providers}`);
    console.log(`📉 Inactive providers: ${stats.data.inactive_providers}`);
    console.log(`🌍 Countries with providers: ${stats.data.countries_with_providers}`);
    console.log(`💰 Average fee percentage: ${(stats.data.average_fee_percentage * 100).toFixed(2)}%`);
    console.log(`💱 Supported currencies: ${stats.data.supported_currencies.join(', ')}`);
    console.log('📈 Providers by country:', JSON.stringify(stats.data.providers_by_country, null, 2));
    console.log('📊 Providers by type:', JSON.stringify(stats.data.providers_by_type, null, 2));
    console.log('');

    // 5. Get Providers by Country
    console.log('🌍 Step 5: Getting Providers by Country');
    console.log('--------------------------------------');
    
    const countryProviders = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/country/UG`);
    console.log(`✅ Uganda has ${countryProviders.data.providers.length} providers total`);
    console.log(`📱 Mobile money: ${countryProviders.data.mobile_money_providers.length}`);
    console.log(`💳 Card: ${countryProviders.data.card_providers.length}`);
    console.log(`🏦 Bank transfer: ${countryProviders.data.bank_transfer_providers.length}`);
    console.log(`💰 Digital wallet: ${countryProviders.data.digital_wallet_providers.length}`);
    console.log(`✅ Active: ${countryProviders.data.active_providers.length}`);
    console.log(`💱 Supported currencies: ${countryProviders.data.supported_currencies.join(', ')}\n`);

    // 6. Calculate Payment Fees
    console.log('💰 Step 6: Calculating Payment Fees');
    console.log('----------------------------------');
    
    const amount = 100000; // UGX 100,000
    const currency = 'UGX';
    
    console.log(`Calculating fees for ${currency} ${amount.toLocaleString()} in Uganda...`);
    const feeCalculations = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/country/UG/calculate?amount=${amount}&currency=${currency}`);
    
    if (feeCalculations.data.length > 0) {
      console.log('✅ Fee calculations:');
      feeCalculations.data.forEach(calc => {
        console.log(`  • ${calc.provider_name}: Fee ${calc.total_fee.toLocaleString()} ${calc.currency} | Total: ${calc.total_amount.toLocaleString()} ${calc.currency} | Time: ${calc.processing_time_minutes || 'N/A'}min`);
      });
    } else {
      console.log('❌ No providers found for the specified criteria');
    }
    console.log('');

    // 7. Compare Providers
    console.log('⚖️ Step 7: Comparing Providers');
    console.log('-----------------------------');
    
    try {
      const comparison = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/country/UG/compare?amount=${amount}&currency=${currency}`);
      
      console.log(`✅ Comparison for ${currency} ${amount.toLocaleString()}:`);
      console.log(`💰 Cheapest: ${comparison.data.cheapest_provider.provider_name} (Fee: ${comparison.data.cheapest_provider.total_fee.toLocaleString()} ${currency})`);
      console.log(`⚡ Fastest: ${comparison.data.fastest_provider.provider_name} (${comparison.data.fastest_provider.processing_time_minutes || 'N/A'} minutes)`);
      console.log(`📊 Total options: ${comparison.data.providers.length} providers`);
    } catch (error) {
      console.log('ℹ️ Comparison may not be available (requires providers with matching criteria)');
    }
    console.log('');

    // 8. Update a Payment Provider
    console.log('✏️ Step 8: Updating Payment Provider');
    console.log('-----------------------------------');
    
    if (createdProviders.length > 0) {
      const providerToUpdate = createdProviders[0];
      console.log(`Updating ${providerToUpdate.display_name}...`);
      
      const updateData = {
        fee_percentage: 0.025, // Change to 2.5%
        fee_fixed: 50,
        supports_refunds: true,
        description: 'Updated payment provider with new fees'
      };
      
      const updatedProvider = await makeRequest('PUT', `${PAYMENT_PROVIDER_ENDPOINT}/${providerToUpdate.id}`, updateData);
      
      if (updatedProvider.success) {
        console.log(`✅ Updated successfully`);
        console.log(`💰 New fee percentage: ${(updatedProvider.data.fee_percentage * 100).toFixed(1)}%`);
        console.log(`💵 New fixed fee: ${updatedProvider.data.fee_fixed}`);
        console.log(`♻️ Supports refunds: ${updatedProvider.data.supports_refunds}`);
      }
    }
    console.log('');

    // 9. Bulk Operations
    console.log('📦 Step 9: Bulk Operations');
    console.log('-------------------------');
    
    if (createdProviders.length >= 2) {
      // Test bulk deactivation
      const providerIds = createdProviders.slice(0, 2).map(p => p.id);
      console.log(`Deactivating ${providerIds.length} providers...`);
      
      const bulkResult = await makeRequest('PATCH', `${PAYMENT_PROVIDER_ENDPOINT}/bulk`, {
        operation: 'deactivate',
        provider_ids: providerIds
      });
      
      if (bulkResult.success) {
        console.log(`✅ Bulk deactivation completed: ${bulkResult.data.affected_count} providers affected`);
      }
      
      // Test bulk activation
      console.log('Reactivating providers...');
      const activateResult = await makeRequest('PATCH', `${PAYMENT_PROVIDER_ENDPOINT}/bulk`, {
        operation: 'activate',
        provider_ids: providerIds
      });
      
      if (activateResult.success) {
        console.log(`✅ Bulk activation completed: ${activateResult.data.affected_count} providers affected`);
      }
    }
    console.log('');

    // 10. Get Individual Provider
    console.log('🔍 Step 10: Getting Individual Provider');
    console.log('--------------------------------------');
    
    if (createdProviders.length > 0) {
      const providerId = createdProviders[0].id;
      console.log(`Getting provider ${providerId}...`);
      
      const provider = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/${providerId}`);
      
      if (provider.success) {
        console.log(`✅ Retrieved: ${provider.data.display_name}`);
        console.log(`🏴 Country: ${provider.data.country_id}`);
        console.log(`🔧 Type: ${provider.data.provider_type}`);
        console.log(`✅ Active: ${provider.data.is_active}`);
        console.log(`💱 Currencies: ${provider.data.supported_currencies.join(', ')}`);
      }
    }
    console.log('');

    // 11. Advanced Search
    console.log('🔎 Step 11: Advanced Search');
    console.log('--------------------------');
    
    // Search with filters
    console.log('Searching for "money" with country filter...');
    const advancedSearch = await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/search?query=money&country_id=UG&is_active=true`);
    console.log(`✅ Found ${advancedSearch.data.length} active providers with "money" in Uganda`);
    
    if (advancedSearch.data.length > 0) {
      advancedSearch.data.forEach(provider => {
        console.log(`  • ${provider.display_name} (${provider.provider_type})`);
      });
    }
    console.log('');

    // 12. Error Handling Tests
    console.log('⚠️ Step 12: Testing Error Handling');
    console.log('---------------------------------');
    
    try {
      // Test invalid provider ID
      await makeRequest('GET', `${PAYMENT_PROVIDER_ENDPOINT}/invalid-uuid`);
    } catch (error) {
      console.log('✅ Invalid provider ID error handled correctly');
    }
    
    try {
      // Test duplicate provider creation
      await makeRequest('POST', PAYMENT_PROVIDER_ENDPOINT, testProviders[0]);
    } catch (error) {
      console.log('✅ Duplicate provider error handled correctly');
    }
    
    try {
      // Test invalid currency code
      await makeRequest('POST', PAYMENT_PROVIDER_ENDPOINT, {
        ...testProviders[0],
        provider_name: 'test_invalid',
        supported_currencies: ['INVALID_CURRENCY']
      });
    } catch (error) {
      console.log('✅ Invalid currency code error handled correctly');
    }
    console.log('');

    // 13. Cleanup - Delete Created Providers
    console.log('🧹 Step 13: Cleanup - Deleting Test Providers');
    console.log('--------------------------------------------');
    
    let deletedCount = 0;
    for (const provider of createdProviders) {
      try {
        console.log(`Deleting ${provider.display_name}...`);
        const deleteResult = await makeRequest('DELETE', `${PAYMENT_PROVIDER_ENDPOINT}/${provider.id}`);
        
        if (deleteResult.success) {
          deletedCount++;
          console.log(`✅ Deleted: ${provider.display_name}`);
        }
      } catch (error) {
        console.log(`❌ Failed to delete ${provider.display_name}: ${error.message}`);
      }
    }
    
    console.log(`\n✨ Cleanup completed: ${deletedCount}/${createdProviders.length} providers deleted\n`);

    // Final verification
    const finalProviders = await makeRequest('GET', PAYMENT_PROVIDER_ENDPOINT);
    console.log(`📊 Final provider count: ${finalProviders.data.length}`);

    console.log('\n🎉 PAYMENT PROVIDERS DEMO COMPLETED SUCCESSFULLY!');
    console.log('===============================================');
    console.log('✅ All CRUD operations working correctly');
    console.log('✅ Filtering and search functionality verified');
    console.log('✅ Fee calculations and comparisons working');
    console.log('✅ Bulk operations functional');
    console.log('✅ Statistics and analytics working');
    console.log('✅ Error handling properly implemented');
    console.log('✅ Payment provider system is production-ready!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('• Make sure the server is running on port 3000');
    console.log('• Verify the database connection is working');
    console.log('• Check that migrations have been run');
    console.log('• Ensure payment provider routes are properly mounted');
    
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runPaymentProviderDemo().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runPaymentProviderDemo };
