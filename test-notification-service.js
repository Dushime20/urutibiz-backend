const { NotificationService } = require('./src/services/notification.service');

async function testNotificationService() {
  try {
    console.log('🔍 Testing NotificationService import...');
    
    // Test 1: Check if NotificationService is properly imported
    if (NotificationService) {
      console.log('✅ NotificationService imported successfully');
      console.log(`   - Type: ${typeof NotificationService}`);
      console.log(`   - Constructor: ${NotificationService.constructor.name}`);
    } else {
      console.log('❌ NotificationService is undefined');
      return;
    }
    
    // Test 2: Check if sendKycStatusChange method exists
    if (typeof NotificationService.sendKycStatusChange === 'function') {
      console.log('✅ sendKycStatusChange method exists');
    } else {
      console.log('❌ sendKycStatusChange method not found');
      console.log(`   - Available methods: ${Object.getOwnPropertyNames(NotificationService).filter(name => typeof NotificationService[name] === 'function').join(', ')}`);
      return;
    }
    
    // Test 3: Test calling the method (this should not throw an error)
    console.log('\n📋 Test 3: Testing sendKycStatusChange method call...');
    try {
      const result = await NotificationService.sendKycStatusChange('test-user-id', 'verified');
      console.log('✅ sendKycStatusChange method called successfully');
      console.log(`   - Result: ${JSON.stringify(result)}`);
    } catch (error) {
      console.log('❌ sendKycStatusChange method call failed:', error.message);
      return;
    }
    
    console.log('\n🎉 All tests passed! The NotificationService import issue has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.log('🔍 Module import issue still exists');
    } else if (error.message.includes('Cannot read properties of undefined')) {
      console.log('🔍 NotificationService is still undefined');
    } else {
      console.log('🔍 Unexpected error occurred');
    }
  }
}

// Run the test
testNotificationService();
