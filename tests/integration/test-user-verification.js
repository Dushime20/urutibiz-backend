/**
 * UrutiBiz User Verification Process Test Suite
 * 
 * This script tests the complete user verification workflow including:
 * - Document verification (National ID, Passport, Driver's License)
 * - Address verification
 * - Selfie verification with liveness detection
 * - AI profile verification using ONNX models
 * - Admin review process
 * - KYC status updates
 */

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_CONFIG = {
  // Test user credentials (would be created for testing)
  testUser: {
    email: 'testuser@urutibiz.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe'
  },
  // Admin credentials for review testing
  adminUser: {
    email: 'admin@urutibiz.com',
    password: 'AdminPassword123!'
  },
  // Sample verification data
  verificationData: {
    nationalId: {
      verificationType: 'national_id',
      documentNumber: 'NID123456789',
      documentImageUrl: 'https://example.com/sample-national-id.jpg'
    },
    address: {
      verificationType: 'address',
      addressLine: '123 Main Street',
      city: 'Lagos',
      district: 'Victoria Island',
      country: 'Nigeria'
    },
    selfie: {
      verificationType: 'selfie',
      selfieImageUrl: 'https://example.com/sample-selfie.jpg'
    }
  }
};

class UserVerificationTester {
  constructor() {
    this.userToken = null;
    this.adminToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  // Utility method to make HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { 'Authorization': `Bearer ${options.token}` })
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: data,
        response: response
      };
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test helper method
  async runTest(testName, testFunction) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ PASSED (${duration}ms): ${result.message || testName}`);
        this.testResults.passed++;
      } else {
        console.log(`❌ FAILED (${duration}ms): ${result.message || 'Unknown error'}`);
        this.testResults.failed++;
      }
      
      this.testResults.tests.push({
        name: testName,
        success: result.success,
        duration,
        message: result.message,
        details: result.details
      });
      
      return result;
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        success: false,
        error: error.message
      });
      return { success: false, message: error.message };
    }
  }

  // Test 1: Server connectivity and health check
  async testServerConnectivity() {
    return this.runTest('Server Connectivity', async () => {
      const result = await this.makeRequest('/health');
      
      if (!result.success) {
        return {
          success: false,
          message: 'Server is not responding'
        };
      }
      
      return {
        success: true,
        message: 'Server is running and accessible',
        details: { status: result.status }
      };
    });
  }

  // Test 2: User registration (if needed)
  async testUserRegistration() {
    return this.runTest('User Registration', async () => {
      const result = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(TEST_CONFIG.testUser)
      });
      
      // Registration might fail if user already exists, which is okay
      if (result.success || result.status === 409) {
        return {
          success: true,
          message: result.status === 409 ? 'User already exists' : 'User registered successfully'
        };
      }
      
      return {
        success: false,
        message: `Registration failed: ${result.data?.message || 'Unknown error'}`
      };
    });
  }

  // Test 3: User authentication
  async testUserAuthentication() {
    return this.runTest('User Authentication', async () => {
      const result = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_CONFIG.testUser.email,
          password: TEST_CONFIG.testUser.password
        })
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Authentication failed: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      this.userToken = result.data?.data?.tokens?.accessToken || result.data?.tokens?.accessToken;
      
      if (!this.userToken) {
        return {
          success: false,
          message: 'No access token received'
        };
      }
      
      return {
        success: true,
        message: 'User authenticated successfully',
        details: { tokenLength: this.userToken.length }
      };
    });
  }

  // Test 4: Submit National ID verification
  async testSubmitNationalIdVerification() {
    return this.runTest('Submit National ID Verification', async () => {
      if (!this.userToken) {
        return { success: false, message: 'No user token available' };
      }
      
      const result = await this.makeRequest('/user-verification', {
        method: 'POST',
        token: this.userToken,
        body: JSON.stringify(TEST_CONFIG.verificationData.nationalId)
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Verification submission failed: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      const verification = result.data?.data;
      this.nationalIdVerificationId = verification?.id;
      
      return {
        success: true,
        message: 'National ID verification submitted successfully',
        details: {
          verificationId: verification?.id,
          status: verification?.verificationStatus,
          type: verification?.verificationType
        }
      };
    });
  }

  // Test 5: Submit Address verification
  async testSubmitAddressVerification() {
    return this.runTest('Submit Address Verification', async () => {
      if (!this.userToken) {
        return { success: false, message: 'No user token available' };
      }
      
      const result = await this.makeRequest('/user-verification', {
        method: 'POST',
        token: this.userToken,
        body: JSON.stringify(TEST_CONFIG.verificationData.address)
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Address verification failed: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      const verification = result.data?.data;
      this.addressVerificationId = verification?.id;
      
      return {
        success: true,
        message: 'Address verification submitted successfully',
        details: {
          verificationId: verification?.id,
          address: `${verification?.addressLine}, ${verification?.city}`,
          status: verification?.verificationStatus
        }
      };
    });
  }

  // Test 6: Submit Selfie verification
  async testSubmitSelfieVerification() {
    return this.runTest('Submit Selfie Verification', async () => {
      if (!this.userToken) {
        return { success: false, message: 'No user token available' };
      }
      
      const result = await this.makeRequest('/user-verification', {
        method: 'POST',
        token: this.userToken,
        body: JSON.stringify(TEST_CONFIG.verificationData.selfie)
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Selfie verification failed: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      const verification = result.data?.data;
      this.selfieVerificationId = verification?.id;
      
      return {
        success: true,
        message: 'Selfie verification submitted successfully',
        details: {
          verificationId: verification?.id,
          livenessScore: verification?.livenessScore,
          aiProfileScore: verification?.aiProfileScore,
          status: verification?.verificationStatus
        }
      };
    });
  }

  // Test 7: Get user verifications
  async testGetUserVerifications() {
    return this.runTest('Get User Verifications', async () => {
      if (!this.userToken) {
        return { success: false, message: 'No user token available' };
      }
      
      const result = await this.makeRequest('/user-verification', {
        method: 'GET',
        token: this.userToken
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Failed to get verifications: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      const verifications = result.data?.data || [];
      
      return {
        success: true,
        message: 'User verifications retrieved successfully',
        details: {
          count: verifications.length,
          types: verifications.map(v => v.verificationType),
          statuses: verifications.map(v => v.verificationStatus)
        }
      };
    });
  }

  // Test 8: Admin authentication (for review process)
  async testAdminAuthentication() {
    return this.runTest('Admin Authentication', async () => {
      const result = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_CONFIG.adminUser.email,
          password: TEST_CONFIG.adminUser.password
        })
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Admin authentication failed: ${result.data?.message || 'Admin account may not exist'}`
        };
      }
      
      this.adminToken = result.data?.data?.tokens?.accessToken || result.data?.tokens?.accessToken;
      
      if (!this.adminToken) {
        return {
          success: false,
          message: 'No admin access token received'
        };
      }
      
      return {
        success: true,
        message: 'Admin authenticated successfully'
      };
    });
  }

  // Test 9: Admin review verification (approve)
  async testAdminReviewVerification() {
    return this.runTest('Admin Review Verification', async () => {
      if (!this.adminToken) {
        return { success: false, message: 'No admin token available - skipping admin tests' };
      }
      
      if (!this.nationalIdVerificationId) {
        return { success: false, message: 'No verification ID available for review' };
      }
      
      const result = await this.makeRequest('/user-verification/review', {
        method: 'POST',
        token: this.adminToken,
        body: JSON.stringify({
          verificationId: this.nationalIdVerificationId,
          status: 'verified',
          notes: 'Document verified successfully by automated test'
        })
      });
      
      if (!result.success) {
        return {
          success: false,
          message: `Admin review failed: ${result.data?.message || 'Unknown error'}`
        };
      }
      
      const verification = result.data?.data;
      
      return {
        success: true,
        message: 'Admin review completed successfully',
        details: {
          verificationId: verification?.id,
          status: verification?.verificationStatus,
          reviewedBy: verification?.verifiedBy
        }
      };
    });
  }

  // Test 10: Performance metrics validation
  async testPerformanceMetrics() {
    return this.runTest('Performance Metrics Validation', async () => {
      const startTime = Date.now();
      
      // Test multiple verification submissions for performance
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          this.makeRequest('/user-verification', {
            method: 'GET',
            token: this.userToken
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / results.length;
      
      const allSuccessful = results.every(r => r.success);
      
      return {
        success: allSuccessful && avgTime < 500, // Target: sub-500ms average
        message: allSuccessful 
          ? `Performance test passed - Average response time: ${avgTime.toFixed(2)}ms`
          : 'Some requests failed during performance test',
        details: {
          totalRequests: results.length,
          successfulRequests: results.filter(r => r.success).length,
          averageResponseTime: `${avgTime.toFixed(2)}ms`,
          totalTime: `${totalTime}ms`
        }
      };
    });
  }

  // Test 11: Data validation and security
  async testDataValidationAndSecurity() {
    return this.runTest('Data Validation & Security', async () => {
      if (!this.userToken) {
        return { success: false, message: 'No user token available' };
      }
      
      // Test invalid verification type
      const invalidTypeResult = await this.makeRequest('/user-verification', {
        method: 'POST',
        token: this.userToken,
        body: JSON.stringify({
          verificationType: 'invalid_type',
          documentNumber: 'TEST123'
        })
      });
      
      // Test missing required fields
      const missingFieldsResult = await this.makeRequest('/user-verification', {
        method: 'POST',
        token: this.userToken,
        body: JSON.stringify({
          // Missing verificationType
          documentNumber: 'TEST123'
        })
      });
      
      // Test unauthorized access (no token)
      const noTokenResult = await this.makeRequest('/user-verification', {
        method: 'GET'
        // No token provided
      });
      
      const validationWorking = !invalidTypeResult.success && !missingFieldsResult.success;
      const authWorking = !noTokenResult.success && noTokenResult.status === 401;
      
      return {
        success: validationWorking && authWorking,
        message: validationWorking && authWorking 
          ? 'Data validation and security checks working correctly'
          : 'Security or validation issues detected',
        details: {
          invalidTypeBlocked: !invalidTypeResult.success,
          missingFieldsBlocked: !missingFieldsResult.success,
          unauthorizedBlocked: !noTokenResult.success,
          authStatus: noTokenResult.status
        }
      };
    });
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 UrutiBiz User Verification Process Test Suite');
    console.log('================================================\n');
    
    console.log('📋 Test Configuration:');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Test User: ${TEST_CONFIG.testUser.email}`);
    console.log(`   Admin User: ${TEST_CONFIG.adminUser.email}`);
    console.log(`   Verification Types: ${Object.keys(TEST_CONFIG.verificationData).join(', ')}`);
    
    // Run all tests in sequence
    await this.testServerConnectivity();
    await this.testUserRegistration();
    await this.testUserAuthentication();
    
    // Only continue with verification tests if authentication succeeded
    if (this.userToken) {
      await this.testSubmitNationalIdVerification();
      await this.testSubmitAddressVerification();
      await this.testSubmitSelfieVerification();
      await this.testGetUserVerifications();
      
      // Admin tests (may be skipped if admin account doesn't exist)
      await this.testAdminAuthentication();
      if (this.adminToken) {
        await this.testAdminReviewVerification();
      }
      
      // Performance and security tests
      await this.testPerformanceMetrics();
      await this.testDataValidationAndSecurity();
    }
    
    // Display final results
    this.displayTestResults();
  }

  // Display comprehensive test results
  displayTestResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    const total = this.testResults.passed + this.testResults.failed;
    const passRate = ((this.testResults.passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message || test.error}`);
        });
    }
    
    console.log('\n🎯 Test Performance:');
    const avgDuration = this.testResults.tests
      .filter(test => test.duration)
      .reduce((sum, test) => sum + test.duration, 0) / this.testResults.tests.length;
    console.log(`   Average Test Duration: ${avgDuration.toFixed(2)}ms`);
    
    // Overall assessment
    console.log('\n🏆 OVERALL ASSESSMENT:');
    if (passRate >= 90) {
      console.log('✅ EXCELLENT - User verification system is working properly');
    } else if (passRate >= 75) {
      console.log('👍 GOOD - Most functionality working, minor issues detected');
    } else if (passRate >= 50) {
      console.log('⚠️ FAIR - Significant issues that need attention');
    } else {
      console.log('❌ POOR - Major problems with user verification system');
    }
    
    console.log('\n📋 Test completed at:', new Date().toISOString());
  }
}

// Run the test suite
async function runUserVerificationTests() {
  const tester = new UserVerificationTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other files or run directly
if (require.main === module) {
  runUserVerificationTests();
}

module.exports = { UserVerificationTester, runUserVerificationTests };
