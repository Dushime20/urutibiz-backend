/**
 * Test script for User Verification Update API
 * 
 * This script demonstrates how to use the new PUT /api/v1/user-verification/{verificationId} endpoint
 * to update user verification data.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual token
const VERIFICATION_ID = 'your-verification-id-here'; // Replace with actual verification ID

async function testUpdateVerificationAPI() {
  console.log('🧪 Testing User Verification Update API...\n');

  try {
    // Test 1: Update with JSON data (no file upload)
    console.log('1. Testing JSON update (no file upload)...');
    
    const jsonUpdateData = {
      verificationType: 'national_id',
      documentNumber: 'ID123456789',
      addressLine: '123 Main Street',
      city: 'Nairobi',
      district: 'Central',
      country: 'Kenya'
    };

    const jsonResponse = await fetch(`${BASE_URL}/user-verification/${VERIFICATION_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonUpdateData)
    });

    const jsonResult = await jsonResponse.json();
    console.log('JSON Update Response:', {
      status: jsonResponse.status,
      success: jsonResult.success,
      message: jsonResult.message,
      data: jsonResult.data
    });

    // Test 2: Update with file upload (multipart/form-data)
    console.log('\n2. Testing file upload update...');
    
    const formData = new FormData();
    formData.append('verificationType', 'passport');
    formData.append('documentNumber', 'PASSPORT987654');
    formData.append('addressLine', '456 Oak Avenue');
    formData.append('city', 'Mombasa');
    formData.append('district', 'Coast');
    formData.append('country', 'Kenya');
    
    // Add file uploads (if you have test files)
    // formData.append('documentImage', fs.createReadStream('./test-document.jpg'));
    // formData.append('selfieImage', fs.createReadStream('./test-selfie.jpg'));

    const fileResponse = await fetch(`${BASE_URL}/user-verification/${VERIFICATION_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const fileResult = await fileResponse.json();
    console.log('File Upload Update Response:', {
      status: fileResponse.status,
      success: fileResult.success,
      message: fileResult.message,
      data: fileResult.data
    });

    // Test 3: Update with direct URLs
    console.log('\n3. Testing direct URL update...');
    
    const urlUpdateData = {
      verificationType: 'driving_license',
      documentNumber: 'DL789012345',
      documentImageUrl: 'https://example.com/document.jpg',
      selfieImageUrl: 'https://example.com/selfie.jpg',
      addressLine: '789 Pine Street',
      city: 'Kisumu',
      district: 'Nyanza',
      country: 'Kenya'
    };

    const urlResponse = await fetch(`${BASE_URL}/user-verification/${VERIFICATION_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(urlUpdateData)
    });

    const urlResult = await urlResponse.json();
    console.log('Direct URL Update Response:', {
      status: urlResponse.status,
      success: urlResult.success,
      message: urlResult.message,
      data: urlResult.data
    });

    // Test 4: Error cases
    console.log('\n4. Testing error cases...');
    
    // Test with invalid verification ID
    const invalidResponse = await fetch(`${BASE_URL}/user-verification/invalid-id`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verificationType: 'national_id' })
    });

    const invalidResult = await invalidResponse.json();
    console.log('Invalid ID Response:', {
      status: invalidResponse.status,
      success: invalidResult.success,
      message: invalidResult.message
    });

    // Test without authentication
    const noAuthResponse = await fetch(`${BASE_URL}/user-verification/${VERIFICATION_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verificationType: 'national_id' })
    });

    const noAuthResult = await noAuthResponse.json();
    console.log('No Auth Response:', {
      status: noAuthResponse.status,
      success: noAuthResult.success,
      message: noAuthResult.message
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Helper function to get verification status
async function getVerificationStatus() {
  try {
    const response = await fetch(`${BASE_URL}/user-verification/status`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const result = await response.json();
    console.log('\n📊 Current Verification Status:', result.data);
  } catch (error) {
    console.error('Failed to get verification status:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting User Verification Update API Tests...\n');
  
  // First, get current verification status
  await getVerificationStatus();
  
  // Run the update tests
  await testUpdateVerificationAPI();
  
  // Get updated verification status
  console.log('\n🔄 Getting updated verification status...');
  await getVerificationStatus();
  
  console.log('\n✅ Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testUpdateVerificationAPI,
  getVerificationStatus
}; 