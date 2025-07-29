#!/usr/bin/env node

/**
 * Test Password Reset URL Generation
 * This script tests the password reset URL generation logic
 */

// Simulate the environment variable
process.env.FRONTEND_URL = 'http://localhost:5173';

// Simulate the password reset URL generation logic
function generateResetUrl(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/reset-password?token=${token}`;
}

// Test with a sample token
const testToken = '1403c2a0075260f598ede1a1bb5f9c3545f28032caf5b601becc243203e26ce5';
const resetUrl = generateResetUrl(testToken);

console.log('🔐 Password Reset URL Test');
console.log('==========================');
console.log('Environment FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Generated Reset URL:', resetUrl);
console.log('');

// Test different scenarios
console.log('🧪 Testing different scenarios:');
console.log('');

// Scenario 1: With FRONTEND_URL set
process.env.FRONTEND_URL = 'http://localhost:5173';
console.log('1. With FRONTEND_URL=http://localhost:5173:');
console.log('   URL:', generateResetUrl(testToken));
console.log('');

// Scenario 2: Without FRONTEND_URL (should use default)
delete process.env.FRONTEND_URL;
console.log('2. Without FRONTEND_URL (using default):');
console.log('   URL:', generateResetUrl(testToken));
console.log('');

// Scenario 3: With different frontend URL
process.env.FRONTEND_URL = 'https://myapp.com';
console.log('3. With FRONTEND_URL=https://myapp.com:');
console.log('   URL:', generateResetUrl(testToken));
console.log('');

console.log('✅ Test completed!');
console.log('');
console.log('📝 To fix your issue:');
console.log('1. Add FRONTEND_URL=http://localhost:5173 to your .env file');
console.log('2. Restart your server');
console.log('3. Request a new password reset');
console.log('4. The URL should now point to your frontend'); 