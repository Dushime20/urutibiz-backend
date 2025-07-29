#!/usr/bin/env node

/**
 * Complete Booking Debug Script
 * 1. Register/login user
 * 2. Test booking creation
 * 3. Debug any errors
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function debugBookingComplete() {
  console.log('🔍 Complete Booking Debug');
  console.log('==========================');

  try {
    // Step 1: Register a test user
    console.log('\n1. Registering test user...');
    const userData = {
      email: 'testbooking@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Booking'
    };

    let authToken = null;
    let userId = null;

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      console.log('✅ User registered:', registerResponse.data);
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
    } catch (regError) {
      if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already registered')) {
        console.log('📝 User already exists, trying to login...');
        
        // Try to login
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        console.log('✅ User logged in:', loginResponse.data);
        authToken = loginResponse.data.token;
        userId = loginResponse.data.user.id;
      } else {
        throw regError;
      }
    }

    if (!authToken) {
      throw new Error('Failed to get authentication token');
    }

    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Check user profile
    console.log('\n2. Verifying authentication...');
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, { headers: authHeaders });
    console.log('✅ Authentication verified:', profileResponse.data.user?.email);

    // Step 3: Check if we need to create a product first
    console.log('\n3. Getting available products...');
    let productId = null;
    try {
      const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=1`, { headers: authHeaders });
      if (productsResponse.data.data && productsResponse.data.data.length > 0) {
        productId = productsResponse.data.data[0].id;
        console.log('✅ Found product:', productId);
      } else {
        console.log('⚠️ No products found, creating a test product...');
        
        // Create a simple test product
        const productData = {
          name: 'Test Product for Booking',
          description: 'A test product for debugging booking creation',
          category_id: '11111111-1111-1111-1111-111111111111', // Use a default category
          base_price: 50,
          base_currency: 'USD',
          pickup_methods: ['pickup'],
          specifications: {}
        };

        try {
          const createProductResponse = await axios.post(`${API_BASE_URL}/products`, productData, { headers: authHeaders });
          productId = createProductResponse.data.data.id;
          console.log('✅ Created test product:', productId);
        } catch (productError) {
          console.log('❌ Failed to create product:', productError.response?.data || productError.message);
          productId = '02f1e344-c02b-426b-9ab3-c7483d0d6b87'; // Use the one from logs
          console.log('📝 Using existing product ID from logs:', productId);
        }
      }
    } catch (error) {
      console.log('⚠️ Error getting products, using ID from logs');
      productId = '02f1e344-c02b-426b-9ab3-c7483d0d6b87';
    }

    // Step 4: Create booking with minimal required data
    console.log('\n4. Testing booking creation...');
    const bookingData = {
      product_id: productId,
      renter_id: userId,
      owner_id: userId, // For testing, same user as owner
      start_date: '2025-08-01T10:00:00Z',
      end_date: '2025-08-03T10:00:00Z',
      pickup_time: '10:00',
      return_time: '10:00',
      pickup_method: 'pickup',
      special_instructions: 'Test booking for debugging'
    };

    console.log('Booking data:', JSON.stringify(bookingData, null, 2));

    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, { headers: authHeaders });
    console.log('✅ Booking created successfully!');
    console.log('Response:', JSON.stringify(bookingResponse.data, null, 2));

  } catch (error) {
    console.log('\n❌ Error Details:');
    console.log('================');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Specific analysis for 500 errors
      if (error.response.status === 500) {
        console.log('\n🔍 500 Internal Server Error Analysis:');
        console.log('This usually indicates:');
        console.log('1. Database constraint violation (foreign key, unique constraint)');
        console.log('2. Missing required database fields');
        console.log('3. Type conversion errors');
        console.log('4. Server-side validation failures');
        console.log('5. Database connection issues');
        
        console.log('\n📋 Recommendations:');
        console.log('- Check server logs for stack trace');
        console.log('- Verify database schema matches code expectations');
        console.log('- Check if required foreign key records exist');
        console.log('- Validate data types being sent');
      }
    } else {
      console.log('Network/Request Error:', error.message);
    }
  }
}

// Run the complete debug
debugBookingComplete(); 