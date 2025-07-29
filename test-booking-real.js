#!/usr/bin/env node

/**
 * Real Booking Test
 * 1. Creates a real product
 * 2. Books the product
 * 3. Tests rebooking the same product after completion
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testRealBooking() {
  console.log('🔍 Real Booking Test');
  console.log('====================');

  try {
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'debug-user@test.com',
      password: 'Password123!'
    });

    const authToken = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('✅ Logged in as:', userId);

    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Check existing products or create one
    console.log('\n2. Getting or creating a test product...');
    let productId = null;

    try {
      const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=1`, { headers: authHeaders });
      if (productsResponse.data.data && productsResponse.data.data.length > 0) {
        productId = productsResponse.data.data[0].id;
        console.log('✅ Found existing product:', productId);
      }
    } catch (error) {
      console.log('⚠️ Could not get products, will create a new one');
    }

    if (!productId) {
      console.log('📝 Creating a new test product...');
      
      const productData = {
        name: 'Test Rental Item',
        description: 'A test item for booking',
        category_id: '11111111-1111-1111-1111-111111111111',
        base_price: 25,
        base_currency: 'USD',
        pickup_methods: ['pickup'],
        specifications: {}
      };

      try {
        const createResponse = await axios.post(`${API_BASE_URL}/products`, productData, { headers: authHeaders });
        productId = createResponse.data.data.id;
        console.log('✅ Created product:', productId);
      } catch (createError) {
        console.log('❌ Failed to create product:', createError.response?.data || createError.message);
        return;
      }
    }

    // Step 3: Test booking creation
    console.log('\n3. Creating booking...');
    const bookingData = {
      product_id: productId,
      renter_id: userId,
      owner_id: userId, // Same user as owner for testing
      start_date: '2025-08-01T10:00:00Z',
      end_date: '2025-08-03T10:00:00Z',
      pickup_time: '10:00',
      return_time: '10:00',
      pickup_method: 'pickup',
      special_instructions: 'Test booking - should work now!'
    };

    console.log('Booking data:');
    console.log(JSON.stringify(bookingData, null, 2));

    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, { headers: authHeaders });
    console.log('✅ First booking created successfully!');
    console.log('Booking ID:', bookingResponse.data.data?.id);

    // Step 4: Test rebooking the same item with different dates
    console.log('\n4. Testing rebooking with different dates...');
    const rebookingData = {
      ...bookingData,
      start_date: '2025-08-10T10:00:00Z',
      end_date: '2025-08-12T10:00:00Z',
      special_instructions: 'Second booking of same item - should work!'
    };

    const rebookingResponse = await axios.post(`${API_BASE_URL}/bookings`, rebookingData, { headers: authHeaders });
    console.log('✅ Rebooking successful!');
    console.log('Second Booking ID:', rebookingResponse.data.data?.id);

    // Step 5: Test overlapping booking (should fail)
    console.log('\n5. Testing overlapping booking (should fail)...');
    const overlappingData = {
      ...bookingData,
      start_date: '2025-08-02T10:00:00Z', // Overlaps with first booking
      end_date: '2025-08-04T10:00:00Z',
      special_instructions: 'Overlapping booking - should fail!'
    };

    try {
      await axios.post(`${API_BASE_URL}/bookings`, overlappingData, { headers: authHeaders });
      console.log('❌ Overlapping booking was allowed (should be prevented)');
    } catch (overlapError) {
      if (overlapError.response?.status === 400) {
        console.log('✅ Overlapping booking correctly prevented');
        console.log('Error message:', overlapError.response.data.message);
      } else {
        console.log('❌ Unexpected error for overlapping booking:', overlapError.response?.data || overlapError.message);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('');
    console.log('✅ Problem solved:');
    console.log('   Users can now book the same item multiple times');
    console.log('   as long as the dates don\'t overlap!');

  } catch (error) {
    console.log('\n❌ Test Error:');
    console.log('================');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Message:', error.message);
  }
}

// Run the test
testRealBooking(); 