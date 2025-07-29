#!/usr/bin/env node

/**
 * Debug Booking Creation Error
 * This script helps identify the specific error in booking creation
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Sample booking data based on the request structure
const sampleBookingData = {
  product_id: "02f1e344-c02b-426b-9ab3-c7483d0d6b87",
  renter_id: "39f22329-d38e-4e0a-a01c-6ae36d911b30",
  owner_id: "some-owner-id",
  start_date: "2025-08-01T10:00:00Z",
  end_date: "2025-08-03T10:00:00Z",
  pickup_time: "10:00",
  return_time: "10:00",
  pickup_method: "pickup",
  pickup_address: "123 Main St",
  special_instructions: "Please handle with care",
  insurance_type: "basic",
  security_deposit: 100
};

async function debugBookingCreation() {
  console.log('🔍 Debugging Booking Creation Error');
  console.log('====================================');

  try {
    // First, test if the server is running
    console.log('\n1. Testing server connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data);

    // Test with the token from the logs
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM5ZjIyMzI5LWQzOGUtNGUwYS1hMDFjLTZhZTM2ZDkxMWIzMCIsImVtYWlsIjoiZW1teWtlZW4yMDAxQGdtYWlsLmNvbSIsImlhdCI6MTc1MzY5NzY3MiwiZXhwIjoxNzUzNzg0MDcyfQ.txzgDBfUv1hKBAqdbbhAlB_ZwsrWILG-Rhyw9omo5u0';

    console.log('\n2. Testing authentication...');
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Test a simple authenticated endpoint first
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/users/profile`, { headers: authHeaders });
      console.log('✅ Authentication working');
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.response?.data || authError.message);
      return;
    }

    console.log('\n3. Testing booking creation...');
    console.log('Booking data:', JSON.stringify(sampleBookingData, null, 2));

    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, sampleBookingData, { headers: authHeaders });
    console.log('✅ Booking created successfully:', bookingResponse.data);

  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Message:', error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 This is a 500 Internal Server Error.');
      console.log('Check the server logs for more details.');
      console.log('Common causes:');
      console.log('- Database connection issues');
      console.log('- Missing required fields');
      console.log('- Data type mismatches');
      console.log('- Foreign key constraint violations');
    }
  }
}

// Run the debug
debugBookingCreation(); 