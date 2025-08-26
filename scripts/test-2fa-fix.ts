// Simple test to verify 2FA JSON parsing fix
import { User } from '../src/models/User.model';

// Test data that might cause issues
const testData = {
  id: 'test-id',
  email: 'test@example.com',
  two_factor_backup_codes: '[object Object]', // This was causing the error
  two_factor_secret: 'test-secret',
  two_factor_enabled: false,
  two_factor_verified: false
};

try {
  console.log('🧪 Testing 2FA JSON parsing fix...');
  
  // This should not throw an error now
  const user = User.fromDb(testData);
  
  console.log('✅ Success! User model can handle corrupted backup codes data');
  console.log('📊 User backup codes:', user.twoFactorBackupCodes);
  
} catch (error) {
  console.error('❌ Error still exists:', error);
}

console.log('🎯 Test completed!');
