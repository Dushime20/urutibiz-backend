/**
 * Complete Localization API Usage Example
 * 
 * This example demonstrates how to use the complete localization API
 * for a real-world e-commerce application
 */

// Type definitions for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ConversionData {
  convertedAmount: number;
  rate: number;
  rateDate: string;
}

interface FeeCalculation {
  country_id: string;
  amount: number;
  service_fee: number;
  processing_fee: number;
  total_fees: number;
  total_amount: number;
}

interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  source: string;
}

// Example: Complete checkout flow using the localization API
async function completeCheckoutFlow() {
  const baseUrl = 'http://localhost:3000/api/v1/localization';
  
  // 1. Get country business rules
  console.log('📋 Step 1: Getting country business rules...');
  const rulesResponse = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid`);
  const rules: ApiResponse = await rulesResponse.json();
  
  if (rules.success) {
    console.log('✅ Business rules loaded:', rules.data);
  }
  
  // 2. Check if user meets age requirement
  console.log('👤 Step 2: Checking user age requirement...');
  const ageResponse = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid/min-age`);
  const ageRequirement: ApiResponse<{ country_id: string; min_user_age: number }> = await ageResponse.json();
  
  const userAge = 25; // Example user age
  if (ageRequirement.success && ageRequirement.data && userAge >= ageRequirement.data.min_user_age) {
    console.log('✅ User meets age requirement');
  } else {
    console.log('❌ User does not meet age requirement');
    return;
  }
  
  // 3. Validate booking amount
  console.log('💰 Step 3: Validating booking amount...');
  const bookingAmount = 150000; // 150,000 RWF
  const amountValidation = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid/validate-amount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: bookingAmount })
  });
  const validation: ApiResponse<{ country_id: string; amount: number; is_valid: boolean }> = await amountValidation.json();
  
  if (validation.success && validation.data && validation.data.is_valid) {
    console.log('✅ Booking amount is valid');
  } else {
    console.log('❌ Booking amount exceeds country limits');
    return;
  }
  
  // 4. Calculate fees
  console.log('🧮 Step 4: Calculating fees...');
  const feesResponse = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid/calculate-fees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: bookingAmount })
  });
  const fees: ApiResponse<FeeCalculation> = await feesResponse.json();
  
  if (!fees.success || !fees.data) {
    console.log('❌ Failed to calculate fees');
    return;
  }
  
  console.log('💳 Fee breakdown:', {
    serviceFee: fees.data.service_fee,
    processingFee: fees.data.processing_fee,
    totalFees: fees.data.total_fees,
    totalAmount: fees.data.total_amount
  });
  
  // 5. Convert to different currencies for display
  console.log('🌍 Step 5: Converting to multiple currencies...');
  const currencies = ['USD', 'EUR', 'KES'];
  const conversions: Record<string, { amount: number; rate: number }> = {};
  
  for (const currency of currencies) {
    const conversionResponse = await fetch(`${baseUrl}/exchange-rates/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: fees.data.total_amount,
        from_currency: 'RWF',
        to_currency: currency
      })
    });
    const conversion: ApiResponse<ConversionData> = await conversionResponse.json();
    
    if (conversion.success && conversion.data) {
      conversions[currency] = {
        amount: conversion.data.convertedAmount,
        rate: conversion.data.rate
      };
    }
  }
  
  console.log('💱 Currency conversions:', conversions);
  
  // 6. Check support availability
  console.log('🆘 Step 6: Checking support availability...');
  const supportResponse = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid/support-availability`);
  const support = await supportResponse.json();
  
  if (support.data.support_available) {
    console.log('✅ Customer support is available');
  } else {
    console.log('⏰ Customer support is currently unavailable');
  }
  
  // 7. Check KYC requirement
  console.log('🔍 Step 7: Checking KYC requirement...');
  const kycResponse = await fetch(`${baseUrl}/country-business-rules/country/rwanda-uuid/kyc-required`);
  const kyc = await kycResponse.json();
  
  if (kyc.data.kyc_required) {
    console.log('📋 KYC verification required for this country');
  } else {
    console.log('✅ No KYC verification required');
  }
  
  // Final checkout summary
  console.log('\n🎉 Checkout Summary:');
  console.log('==================');
  console.log(`Original Amount: ${bookingAmount.toLocaleString()} RWF`);
  console.log(`Service Fee: ${fees.data.service_fee.toLocaleString()} RWF`);
  console.log(`Processing Fee: ${fees.data.processing_fee.toLocaleString()} RWF`);
  console.log(`Total Amount: ${fees.data.total_amount.toLocaleString()} RWF`);
  console.log(`Equivalent in USD: $${conversions.USD?.amount.toFixed(2) || 'N/A'}`);
  console.log(`KYC Required: ${kyc.data.kyc_required ? 'Yes' : 'No'}`);
  console.log(`Support Available: ${support.data.support_available ? 'Yes' : 'No'}`);
}

// Example: Managing exchange rates
async function manageExchangeRates() {
  const baseUrl = 'http://localhost:3000/api/v1/localization/exchange-rates';
  
  console.log('📈 Managing Exchange Rates...');
  
  // 1. Create new exchange rates
  console.log('➕ Creating new exchange rates...');
  const newRates = [
    {
      from_currency: 'USD',
      to_currency: 'RWF',
      rate: 1350.50,
      rate_date: '2025-07-05',
      source: 'central_bank'
    },
    {
      from_currency: 'EUR',
      to_currency: 'RWF',
      rate: 1420.75,
      rate_date: '2025-07-05',
      source: 'central_bank'
    }
  ];
  
  const bulkResponse = await fetch(`${baseUrl}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rates: newRates })
  });
  const bulk = await bulkResponse.json();
  
  if (bulk.success) {
    console.log(`✅ Created ${bulk.data.length} exchange rates`);
  }
  
  // 2. Get latest rate
  console.log('🔍 Getting latest USD to RWF rate...');
  const latestResponse = await fetch(`${baseUrl}/latest/USD/RWF`);
  const latest = await latestResponse.json();
  
  if (latest.success) {
    console.log(`💱 Latest USD to RWF rate: ${latest.data.rate} (${latest.data.rate_date})`);
  }
  
  // 3. Get historical rates
  console.log('📊 Getting 7-day historical rates...');
  const historyResponse = await fetch(`${baseUrl}/history/USD/RWF?days=7`);
  const history = await historyResponse.json();
  
  if (history.success) {
    console.log(`📈 Found ${history.data.length} historical rates`);
    history.data.forEach(rate => {
      console.log(`  ${rate.rate_date}: ${rate.rate} (${rate.source})`);
    });
  }
  
  // 4. Get available currency pairs
  console.log('🌐 Getting available currency pairs...');
  const pairsResponse = await fetch(`${baseUrl}/currency-pairs`);
  const pairs = await pairsResponse.json();
  
  if (pairs.success) {
    console.log(`🔗 Available currency pairs: ${pairs.data.length}`);
    pairs.data.slice(0, 5).forEach(pair => {
      console.log(`  ${pair.from_currency} → ${pair.to_currency}`);
    });
  }
}

// Example: Setting up country business rules
async function setupCountryBusinessRules() {
  const baseUrl = 'http://localhost:3000/api/v1/localization/country-business-rules';
  
  console.log('🏛️ Setting up Country Business Rules...');
  
  // 1. Create business rules for Rwanda
  const rwandaRules = {
    country_id: 'rwanda-uuid-12345',
    min_user_age: 18,
    kyc_required: true,
    max_booking_value: 2000000, // 2M RWF
    support_hours_start: '08:00',
    support_hours_end: '18:00',
    support_days: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    terms_of_service_url: 'https://urutibiz.com/terms-rw',
    privacy_policy_url: 'https://urutibiz.com/privacy-rw',
    service_fee_percentage: 3.5,
    payment_processing_fee: 2.9,
    min_payout_amount: 50000 // 50K RWF
  };
  
  const createResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rwandaRules)
  });
  const created = await createResponse.json();
  
  if (created.success) {
    console.log('✅ Rwanda business rules created');
    
    // 2. Test the rules
    console.log('🧪 Testing business rules...');
    
    // Test fee calculation
    const testAmount = 100000;
    const feesResponse = await fetch(`${baseUrl}/country/${rwandaRules.country_id}/calculate-fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: testAmount })
    });
    const fees = await feesResponse.json();
    
    console.log(`💰 For ${testAmount} RWF:`);
    console.log(`  Service fee: ${fees.data.service_fee} RWF`);
    console.log(`  Processing fee: ${fees.data.processing_fee} RWF`);
    console.log(`  Total: ${fees.data.total_amount} RWF`);
  }
}

// Health check example
async function checkServiceHealth() {
  const healthUrl = 'http://localhost:3000/api/v1/localization/health';
  
  console.log('🏥 Checking service health...');
  
  const healthResponse = await fetch(healthUrl);
  const health = await healthResponse.json();
  
  if (health.success) {
    console.log('✅ All localization services are running');
    console.log('📊 Service status:', health.services);
  } else {
    console.log('❌ Some services may be down');
  }
}

// Main execution function
async function runExamples() {
  console.log('🚀 UrutiBiz Localization API Examples\n');
  
  try {
    // Check service health first
    await checkServiceHealth();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Setup country business rules
    await setupCountryBusinessRules();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Manage exchange rates
    await manageExchangeRates();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Complete checkout flow
    await completeCheckoutFlow();
    
    console.log('\n🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export functions for use in other modules
export {
  completeCheckoutFlow,
  manageExchangeRates,
  setupCountryBusinessRules,
  checkServiceHealth,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
