/**
 * Simple Performance Endpoint Test using http module
 */

const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data.length > 0 ? data : 'No data',
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        data: error.message,
        success: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        data: 'Request timeout',
        success: false
      });
    });

    req.end();
  });
};

async function testPerformanceEndpoints() {
  console.log('🧪 Testing Performance Endpoints...\n');

  const endpoints = [
    '/health',
    '/api/performance/health'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - Status: ${result.status}`);
      try {
        const parsed = JSON.parse(result.data);
        console.log(`   Response: ${parsed.success ? 'Success' : 'Error'} - ${parsed.message || 'No message'}`);
      } catch {
        console.log(`   Response: ${result.data.substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ ${endpoint} - Status: ${result.status || 'Network Error'}`);
      console.log(`   Error: ${result.data}`);
    }
    console.log('');
  }

  console.log('🏁 Testing completed!');
}

testPerformanceEndpoints().catch(console.error);
