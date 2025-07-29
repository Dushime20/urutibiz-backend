#!/usr/bin/env node

/**
 * Forgot Password Test Script
 * Tests the complete forgot password flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'test@example.com';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testForgotPassword() {
  log('🚀 Starting Forgot Password Tests', 'blue');
  log('=====================================', 'blue');

  try {
    // Test 1: Request password reset
    logInfo('Test 1: Requesting password reset...');
    const resetResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });

    if (resetResponse.data.success) {
      logSuccess('Password reset request successful');
      logInfo(`Response: ${resetResponse.data.message}`);
    } else {
      logError('Password reset request failed');
      return;
    }

    // In a real scenario, you would get the token from email
    // For testing, we'll simulate by checking the database or logs
    logWarning('Note: In development, check console logs for reset URL');
    logInfo('You can manually test the reset flow using the URL from logs');

    // Test 2: Test with invalid email
    logInfo('Test 2: Testing with invalid email...');
    const invalidResponse = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });

    if (invalidResponse.data.success) {
      logSuccess('Invalid email handled correctly (security through obscurity)');
    } else {
      logError('Invalid email not handled correctly');
    }

    // Test 3: Test rate limiting (if configured)
    logInfo('Test 3: Testing rate limiting...');
    try {
      for (let i = 0; i < 5; i++) {
        await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
          email: TEST_EMAIL
        });
      }
      logWarning('Rate limiting may not be configured or working');
    } catch (error) {
      if (error.response && error.response.status === 429) {
        logSuccess('Rate limiting is working correctly');
      } else {
        logError('Rate limiting test failed');
      }
    }

    log('=====================================', 'blue');
    logSuccess('Basic forgot password tests completed!');
    logInfo('To test the complete flow:');
    logInfo('1. Check server console for reset URL');
    logInfo('2. Use the URL to test password reset');
    logInfo('3. Verify token validation and password reset');

  } catch (error) {
    logError('Test failed with error:');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      logError(error.message);
    }
  }
}

async function testWithToken(token) {
  if (!token) {
    logError('No token provided for testing');
    return;
  }

  log('🔐 Testing with provided token', 'blue');
  log('=====================================', 'blue');

  try {
    // Test 1: Validate token
    logInfo('Test 1: Validating reset token...');
    const validateResponse = await axios.get(`${API_BASE_URL}/auth/validate-reset-token/${token}`);

    if (validateResponse.data.success) {
      logSuccess('Token is valid');
    } else {
      logError('Token is invalid or expired');
      return;
    }

    // Test 2: Reset password with weak password
    logInfo('Test 2: Testing weak password rejection...');
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: token,
        newPassword: 'weak'
      });
      logError('Weak password was accepted (should be rejected)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Weak password correctly rejected');
      } else {
        logError('Unexpected error with weak password test');
      }
    }

    // Test 3: Reset password with strong password
    logInfo('Test 3: Testing password reset with strong password...');
    const resetResponse = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token: token,
      newPassword: 'NewSecurePass123!'
    });

    if (resetResponse.data.success) {
      logSuccess('Password reset successful');
      logInfo('User automatically logged in');
      logInfo(`User ID: ${resetResponse.data.data.user.id}`);
    } else {
      logError('Password reset failed');
    }

    log('=====================================', 'blue');
    logSuccess('Token-based tests completed!');

  } catch (error) {
    logError('Token test failed with error:');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      logError(error.message);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const token = args[0];

  if (token) {
    await testWithToken(token);
  } else {
    await testForgotPassword();
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testForgotPassword,
  testWithToken
}; 