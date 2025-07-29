#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testBookingWithVerifiedUser() {
  console.log('🎯 Testing Booking with Verified User');
  console.log('=====================================\n');

  try {
    // Test with the verified user from logs
    const verifiedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5OTcyMCwiZXhwIjoxNzUzNzg2MTIwfQ.wN58jK71R-9P65AAhH4qXANg_yemiLLpnO29tKxrs9k';
    const productId = '314aa77c-b69e-4d9b-83e5-2ad9209b547b'; // From logs

    console.log('1. Getting user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${verifiedToken}` }
    });
    console.log(`✅ User: ${profileResponse.data.firstName} ${profileResponse.data.lastName}`);
    console.log(`   KYC Status: ${profileResponse.data.kyc_status}`);
    console.log(`   User ID: ${profileResponse.data.id}\n`);

    console.log('2. Getting product details...');
    const productResponse = await axios.get(`${BASE_URL}/products/${productId}`);
    console.log(`✅ Product: ${productResponse.data.data.title}`);
    console.log(`   Base Price: $${productResponse.data.data.base_price_per_day}/day`);
    console.log(`   Owner ID: ${productResponse.data.data.owner_id}\n`);

    console.log('3. Testing booking with NON-OVERLAPPING dates...');
    const bookingData = {
      product_id: productId,
      owner_id: productResponse.data.data.owner_id,
      start_date: '2025-08-15', // Different dates that don't overlap
      end_date: '2025-08-18',
      pickup_time: '10:00',
      return_time: '10:00',
      pickup_method: 'pickup',
      special_instructions: 'Testing pricing calculation fix!',
      renter_notes: 'Non-overlapping dates test'
    };

    console.log('Booking data:', JSON.stringify(bookingData, null, 2));

    const bookingResponse = await axios.post(`${BASE_URL}/bookings`, bookingData, {
      headers: { 
        Authorization: `Bearer ${verifiedToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n🎉 SUCCESS! Booking created:');
    console.log(`   Booking ID: ${bookingResponse.data.data.id}`);
    console.log(`   Booking Number: ${bookingResponse.data.data.booking_number}`);
    console.log(`   Status: ${bookingResponse.data.data.status}`);
    console.log(`   Total Amount: $${bookingResponse.data.data.total_amount}`);
    console.log(`   Pricing Details:`, JSON.stringify(bookingResponse.data.data.pricing, null, 4));

  } catch (error) {
    console.log('\n📋 Booking Response:');
    console.log(`Status: ${error.response?.status || 'Unknown'}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data?.errors) {
      console.log('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
    }

    if (error.response?.status === 500) {
      console.log('\n🔍 Server Error Details:');
      console.log('Full Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testBookingWithVerifiedUser(); 