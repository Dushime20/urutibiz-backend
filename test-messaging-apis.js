const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual admin token

async function testMessagingAPIs() {
  console.log('🧪 Testing Messaging and Notification APIs...\n');

  try {
    // Test 1: Get Chats
    console.log('1. Testing GET /admin/chats');
    const chatsResponse = await axios.get(`${BASE_URL}/admin/chats`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Chats API working:', chatsResponse.data.success);

    // Test 2: Get Message Templates
    console.log('\n2. Testing GET /admin/message-templates');
    const templatesResponse = await axios.get(`${BASE_URL}/admin/message-templates`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Message Templates API working:', templatesResponse.data.success);

    // Test 3: Get System Notifications
    console.log('\n3. Testing GET /admin/notifications/system');
    const notificationsResponse = await axios.get(`${BASE_URL}/admin/notifications/system`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ System Notifications API working:', notificationsResponse.data.success);

    // Test 4: Get Email Templates
    console.log('\n4. Testing GET /admin/notifications/email-templates');
    const emailTemplatesResponse = await axios.get(`${BASE_URL}/admin/notifications/email-templates`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Email Templates API working:', emailTemplatesResponse.data.success);

    // Test 5: Get Scheduled Notifications
    console.log('\n5. Testing GET /admin/notifications/scheduled');
    const scheduledResponse = await axios.get(`${BASE_URL}/admin/notifications/scheduled`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Scheduled Notifications API working:', scheduledResponse.data.success);

    // Test 6: Get Messaging Stats
    console.log('\n6. Testing GET /admin/messaging/stats');
    const statsResponse = await axios.get(`${BASE_URL}/admin/messaging/stats`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Messaging Stats API working:', statsResponse.data.success);

    // Test 7: Get Notification Stats
    console.log('\n7. Testing GET /admin/notifications/stats');
    const notificationStatsResponse = await axios.get(`${BASE_URL}/admin/notifications/stats`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log('✅ Notification Stats API working:', notificationStatsResponse.data.success);

    console.log('\n🎉 All APIs are working correctly!');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection Error: Make sure the server is running on localhost:3000');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
testMessagingAPIs();
