#!/usr/bin/env node

const axios = require('axios');

async function debugAvailability() {
  console.log('🔍 Debugging Product Availability Issue');
  console.log('======================================\n');

  try {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5OTcyMCwiZXhwIjoxNzUzNzg2MTIwfQ.wN58jK71R-9P65AAhH4qXANg_yemiLLpnO29tKxrs9k';
    const productId = '314aa77c-b69e-4d9b-83e5-2ad9209b547b';
    
    console.log('1. Testing product availability endpoint...');
    try {
      // Check if there's an availability endpoint
      const availabilityResponse = await axios.get(`http://localhost:3000/api/v1/products/${productId}/availability`, {
        headers: { Authorization: `Bearer ${testToken}` },
        timeout: 5000
      });
      
      console.log('✅ Product availability data:');
      console.log(JSON.stringify(availabilityResponse.data, null, 2));
      
    } catch (availError) {
      if (availError.response?.status === 404) {
        console.log('❌ No availability endpoint found');
      } else {
        console.log(`⚠️ Availability endpoint error: ${availError.response?.status || 'Network'}`);
      }
    }

    console.log('\n2. Testing product details...');
    const productResponse = await axios.get(`http://localhost:3000/api/v1/products/${productId}`, {
      timeout: 5000
    });
    
    const product = productResponse.data.data;
    console.log(`✅ Product: ${product.title}`);
    console.log(`   Status: ${product.status}`);
    console.log(`   Availability Array: ${JSON.stringify(product.availability || [])}`);
    
    console.log('\n3. Testing booking with detailed error info...');
    const bookingData = {
      product_id: productId,
      start_date: '2025-09-01',
      end_date: '2025-09-05',
      pickup_time: '10:00',
      return_time: '18:00',
      pickup_method: 'pickup',
      special_instructions: 'Debug test'
    };

    try {
      const bookingResponse = await axios.post('http://localhost:3000/api/v1/bookings', bookingData, {
        headers: { 
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('🎉 Booking succeeded!');
      console.log(JSON.stringify(bookingResponse.data, null, 2));

    } catch (bookingError) {
      console.log('❌ Booking failed:');
      console.log(`   Status: ${bookingError.response?.status}`);
      console.log(`   Message: ${bookingError.response?.data?.message}`);
      console.log(`   Full Error:`, JSON.stringify(bookingError.response?.data, null, 2));
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('The issue is likely in the `isProductAvailable` method checking the `product_availability` table.');
    console.log('This table might have records marking dates as "unavailable" or "booked".');
    console.log('The fix is to either:');
    console.log('1. Clear the product_availability table for demo products');
    console.log('2. Modify the availability checking logic');
    console.log('3. Set proper availability status for demo products');

  } catch (error) {
    console.log('\n❌ Debug failed:');
    console.log(`Error: ${error.message}`);
  }
}

debugAvailability(); 