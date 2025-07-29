#!/usr/bin/env node

const axios = require('axios');

async function testTransactionCreation() {
  console.log('🔄 Testing Booking Transaction Creation');
  console.log('======================================\n');

  try {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5OTcyMCwiZXhwIjoxNzUzNzg2MTIwfQ.wN58jK71R-9P65AAhH4qXANg_yemiLLpnO29tKxrs9k';
    const productId = '314aa77c-b69e-4d9b-83e5-2ad9209b547b';
    
    console.log('1. Getting product details...');
    const productResponse = await axios.get(`http://localhost:3000/api/v1/products/${productId}`);
    const product = productResponse.data.data;
    
    console.log(`✅ Product: ${product.title}`);
    console.log(`   Owner ID: ${product.owner_id}`);
    console.log(`   Status: ${product.status}`);

    console.log('\n2. Testing booking with complete data...');
    const bookingData = {
      product_id: productId,
      owner_id: product.owner_id, // Use actual owner ID from product
      start_date: '2025-09-01',
      end_date: '2025-09-05',
      pickup_time: '10:00',
      return_time: '18:00',
      pickup_method: 'pickup',
      pickup_address: '123 Test Street, City',
      special_instructions: 'Complete transaction creation test',
      renter_notes: 'Testing with all required fields',
      insurance_type: 'none'
    };

    console.log('📋 Complete booking data:');
    console.log(JSON.stringify(bookingData, null, 2));

    const bookingResponse = await axios.post('http://localhost:3000/api/v1/bookings', bookingData, {
      headers: { 
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('\n🎉 SUCCESS! Booking transaction created:');
    console.log(`   Booking ID: ${bookingResponse.data.data.id}`);
    console.log(`   Booking Number: ${bookingResponse.data.data.booking_number}`);
    console.log(`   Status: ${bookingResponse.data.data.status}`);
    console.log(`   Total Amount: $${bookingResponse.data.data.total_amount}`);
    
    if (bookingResponse.data.data.pricing) {
      console.log('\n💰 Transaction Details:');
      const p = bookingResponse.data.data.pricing;
      console.log(`   Base Price: $${p.base_price}/day × ${p.total_days} days = $${p.subtotal}`);
      console.log(`   Platform Fee: $${p.platform_fee}`);
      console.log(`   Tax: $${p.tax_amount}`);
      console.log(`   Total: $${p.total_amount}`);
    }

    console.log('\n✅ TRANSACTION CREATION FIXED! 🚀');
    console.log('The booking system is now creating transactions successfully!');

  } catch (error) {
    console.log('\n❌ Transaction creation failed:');
    console.log(`Status: ${error.response?.status || 'Network'}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 Validation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`   ${err.field}: ${err.message}`);
      });
    }

    if (error.response?.data) {
      console.log('\n🔍 Full Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTransactionCreation(); 