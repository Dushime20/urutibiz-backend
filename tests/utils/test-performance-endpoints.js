/**
 * Test Performance Routes After Fixes
 * 
 * This test validates that all performance monitoring endpoints are working
 * correctly after fixing the TypeScript errors.
 */

const BASE_URL = 'http://localhost:3000';

const testEndpoints = [
  '/api/performance/health',
  '/api/performance/metrics', 
  '/api/performance/database',
  '/api/performance/queries',
  '/api/performance/recommendations'
];

async function testPerformanceEndpoints() {
  console.log('🧪 Testing Performance Endpoints...\n');

  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint} - Network error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🏁 Performance endpoint testing completed!');
}

// Run the test
testPerformanceEndpoints().catch(console.error);
