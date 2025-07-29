#!/usr/bin/env node

/**
 * Test script to verify KYC verification properly updates phone_verified
 * This tests the fix where KYC verification now sets phone_verified = true
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

async function testKycPhoneVerificationFix() {
  console.log('🧪 Testing KYC verification phone_verified fix...\n');

  try {
    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test-kyc-phone@example.com',
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
      phone_number: '+250788123456'
    });

    const { user, token } = registerResponse.data.data;
    console.log(`✅ User registered: ${user.id}`);
    console.log(`📱 Phone number: ${user.phone_number}`);
    console.log(`🔒 Phone verified: ${user.phone_verified}`);
    console.log(`🆔 KYC status: ${user.kyc_status}\n`);

    // Step 2: Submit KYC verification
    console.log('2️⃣ Submitting KYC verification...');
    const verificationResponse = await axios.post(`${BASE_URL}/user-verifications`, {
      verificationType: 'national_id',
      documentNumber: '1234567890123456',
      documentImageUrl: 'https://example.com/test-id.jpg',
      selfieImageUrl: 'https://example.com/test-selfie.jpg',
      addressLine: '123 Test Street',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'Rwanda'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const verification = verificationResponse.data.data;
    console.log(`✅ Verification submitted: ${verification.id}`);
    console.log(`📊 Status: ${verification.verificationStatus}\n`);

    // Step 3: Simulate admin approval (or AI auto-verification)
    console.log('3️⃣ Simulating KYC approval...');
    
    // First, let's check current user status
    const userResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentUser = userResponse.data.data;
    console.log(`📊 Before approval:`);
    console.log(`   - Phone verified: ${currentUser.phone_verified}`);
    console.log(`   - KYC status: ${currentUser.kyc_status}`);
    console.log(`   - Phone number: ${currentUser.phone_number}\n`);

    // Simulate admin approval by directly updating verification status
    // In real scenario, this would be done by admin through admin panel
    console.log('4️⃣ Simulating admin approval of verification...');
    
    // Note: In real implementation, this would be done through admin API
    // For testing, we'll simulate the database update that happens in reviewVerification
    const adminToken = 'admin-token'; // In real scenario, this would be admin's token
    
    // This simulates what happens when admin approves verification
    const approvalResponse = await axios.patch(`${BASE_URL}/admin/verifications/${verification.id}/review`, {
      status: 'verified',
      notes: 'Test approval - phone verification should be updated'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log(`✅ Verification approved: ${approvalResponse.data.success}\n`);

    // Step 5: Check user status after approval
    console.log('5️⃣ Checking user status after approval...');
    const updatedUserResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedUser = updatedUserResponse.data.data;
    console.log(`📊 After approval:`);
    console.log(`   - Phone verified: ${updatedUser.phone_verified}`);
    console.log(`   - KYC status: ${updatedUser.kyc_status}`);
    console.log(`   - Phone number: ${updatedUser.phone_number}\n`);

    // Step 6: Verify the fix worked
    console.log('6️⃣ Verifying the fix...');
    const fixWorked = updatedUser.phone_verified === true && 
                     updatedUser.kyc_status === 'verified' &&
                     updatedUser.phone_number === '+250788123456';
    
    if (fixWorked) {
      console.log('✅ SUCCESS: KYC verification now properly updates phone_verified!');
      console.log('✅ Phone number is preserved and phone_verified is set to true');
    } else {
      console.log('❌ FAILED: Phone verification not properly updated');
      console.log(`   Expected: phone_verified=true, kyc_status=verified`);
      console.log(`   Actual: phone_verified=${updatedUser.phone_verified}, kyc_status=${updatedUser.kyc_status}`);
    }

    // Step 7: Test the helper method directly
    console.log('\n7️⃣ Testing helper method directly...');
    const helperTestResponse = await axios.post(`${BASE_URL}/admin/users/${user.id}/update-phone-verification`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Helper method test: ${helperTestResponse.data.success}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testKycPhoneVerificationFix().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 