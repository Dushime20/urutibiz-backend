/**
 * API Endpoint Testing Script
 * Tests major API endpoints to verify everything is working
 */

const BASE_URL = 'http://localhost:4000/api/v1';

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (!response.ok) {
      console.log(`   Error: ${result.message || 'Unknown error'}`);
    }
    
    return { success: response.ok, data: result };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing UrutiBiz API Endpoints...\n');

  // Test health endpoint
  console.log('🏥 Health Check:');
  await testEndpoint('GET', '/../../health');
  
  console.log('\n📊 API Endpoints:');
  
  // Test various endpoints
  const tests = [
    ['GET', '/users'],
    ['GET', '/products'],
    ['GET', '/bookings'],
    ['GET', '/insurance/types'],
    ['GET', '/ai/interactions/types'],
    ['GET', '/performance/metrics']
  ];

  for (const [method, endpoint] of tests) {
    await testEndpoint(method, endpoint);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  console.log('\n🎉 API testing completed!');
  console.log('📖 Full API docs: http://localhost:4000/api-docs');
}

// Node.js compatibility check
if (typeof fetch === 'undefined') {
  console.log('⚠️ This script requires Node.js 18+ or install node-fetch');
  console.log('Alternative: Test manually with curl or Postman');
  process.exit(1);
}

runTests().catch(console.error);
