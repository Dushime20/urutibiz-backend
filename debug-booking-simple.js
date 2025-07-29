#!/usr/bin/env node

/**
 * Simple Booking Debug Script
 * Uses the working token from server logs to debug booking creation
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Working token from the server logs
const WORKING_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5NzY3MiwiZXhwIjoxNzUzNzg0MDcyfQ.txzgDBfUv1hKBAqdbbhAlB_ZwsrWILG-Rhyw9omo5u0';

async function debugBookingSimple() {
  console.log('🔍 Simple Booking Debug');
  console.log('========================');

  const authHeaders = {
    'Authorization': `Bearer ${WORKING_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Step 1: Test authentication
    console.log('\n1. Testing authentication...');
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, { headers: authHeaders });
    console.log('✅ Authentication working');
    console.log('User:', {
      id: profileResponse.data.user.id,
      email: profileResponse.data.user.email,
      name: `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`
    });

    const userId = profileResponse.data.user.id;

    // Step 2: Get the product from logs
    console.log('\n2. Using product from logs...');
    const productId = '02f1e344-c02b-426b-9ab3-c7483d0d6b87';
    console.log('Product ID:', productId);

    // Step 3: Try to get product details to see if it exists
    console.log('\n3. Checking product existence...');
    try {
      const productResponse = await axios.get(`${API_BASE_URL}/products/${productId}`, { headers: authHeaders });
      console.log('✅ Product exists:', {
        id: productResponse.data.data.id,
        name: productResponse.data.data.name,
        owner_id: productResponse.data.data.owner_id
      });

      // Use the actual owner_id from the product
      const ownerId = productResponse.data.data.owner_id;

      // Step 4: Create booking with the actual owner
      console.log('\n4. Creating booking...');
      const bookingData = {
        product_id: productId,
        renter_id: userId,
        owner_id: ownerId, // Use the real owner
        start_date: '2025-08-01T10:00:00Z',
        end_date: '2025-08-03T10:00:00Z',
        pickup_time: '10:00',
        return_time: '10:00',
        pickup_method: 'pickup',
        special_instructions: 'Debug test booking'
      };

      console.log('Booking data:');
      console.log(JSON.stringify(bookingData, null, 2));

      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, { headers: authHeaders });
      console.log('✅ Booking created successfully!');
      console.log('Response:', JSON.stringify(bookingResponse.data, null, 2));

    } catch (productError) {
      console.log('❌ Product not found or error:', productError.response?.data || productError.message);
      
      // Try with a simpler booking anyway
      console.log('\n4. Trying with minimal booking data...');
      const minimalBookingData = {
        product_id: productId,
        renter_id: userId,
        owner_id: userId, // Use same user as owner for testing
        start_date: '2025-08-01T10:00:00Z',
        end_date: '2025-08-03T10:00:00Z',
        pickup_time: '10:00',
        return_time: '10:00',
        pickup_method: 'pickup'
      };

      console.log('Minimal booking data:');
      console.log(JSON.stringify(minimalBookingData, null, 2));

      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, minimalBookingData, { headers: authHeaders });
      console.log('✅ Booking created successfully!');
      console.log('Response:', JSON.stringify(bookingResponse.data, null, 2));
    }

  } catch (error) {
    console.log('\n❌ Error Details:');
    console.log('================');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.log('\n🔍 500 Internal Server Error - Common Causes:');
        console.log('1. Database constraint violation');
        console.log('2. Missing required database fields');
        console.log('3. Foreign key constraint failure');
        console.log('4. Data type mismatch');
        console.log('5. Null value in non-nullable field');
        
        console.log('\n📋 Next Steps:');
        console.log('1. Check server console for detailed error stack trace');
        console.log('2. Check database logs');
        console.log('3. Verify booking table schema');
        console.log('4. Check if all foreign keys (product_id, renter_id, owner_id) exist');
      }
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Run the debug
debugBookingSimple(); 