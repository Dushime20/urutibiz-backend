const fetch = require('node-fetch');

async function testUserVerificationEndpoints() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  console.log('🧪 Testing UrutiBiz User Verification Endpoints...\n');

  // Test auth endpoints to get a token first
  console.log('1. Testing Authentication...');
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    console.log(`   Login Status: ${loginResponse.status}`);
    
    let authToken = null;
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      authToken = loginData.data?.token;
      console.log(`   ✅ Login successful, token obtained`);
    } else if (loginResponse.status === 404) {
      console.log(`   ⚠️ Login endpoint not found, will test without auth`);
    } else {
      console.log(`   ⚠️ Login failed with status ${loginResponse.status}`);
    }

    // Test the missing user verification endpoints
    console.log('\n2. Testing User Verification Endpoints...');
    
    const endpoints = [
      { method: 'POST', path: '/user-verification/submit-documents', requiresAuth: true },
      { method: 'GET', path: '/user-verification/status', requiresAuth: true },
      { method: 'PUT', path: '/user-verification/resubmit', requiresAuth: true },
      { method: 'GET', path: '/user-verification/documents', requiresAuth: true },
      { method: 'GET', path: '/user-verification/history', requiresAuth: true }
    ];

    for (const endpoint of endpoints) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (endpoint.requiresAuth && authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        let body = null;
        if (endpoint.method === 'POST') {
          body = JSON.stringify({
            verificationType: 'national_id',
            documentNumber: 'TEST123456',
            documentImageUrl: 'https://example.com/doc.jpg'
          });
        } else if (endpoint.method === 'PUT') {
          body = JSON.stringify({
            verificationId: 'test-id',
            verificationType: 'national_id',
            documentNumber: 'TEST123456',
            documentImageUrl: 'https://example.com/doc.jpg'
          });
        }

        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers,
          body
        });

        console.log(`   ${endpoint.method} ${endpoint.path}: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`      ✅ SUCCESS - Endpoint working correctly`);
        } else if (response.status === 401) {
          console.log(`      🔐 UNAUTHORIZED - Authentication required (expected)`);
        } else if (response.status === 404) {
          console.log(`      ❌ NOT FOUND - Endpoint missing`);
        } else if (response.status === 500) {
          console.log(`      ⚠️ SERVER ERROR - Internal error`);
        } else {
          console.log(`      ⚠️ Unexpected status: ${response.status}`);
        }

        // Try to get response body for debugging
        try {
          const responseText = await response.text();
          if (responseText && responseText.length < 500) {
            console.log(`      Response: ${responseText.substring(0, 200)}...`);
          }
        } catch (e) {
          // Ignore response parsing errors
        }

      } catch (error) {
        console.log(`   ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
      }
    }

    // Test health endpoint
    console.log('\n3. Testing Health Endpoint...');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      console.log(`   GET /health: ${healthResponse.status}`);
      if (healthResponse.status === 200) {
        const healthData = await healthResponse.json();
        console.log(`   ✅ Health check passed: ${healthData.message}`);
      }
    } catch (error) {
      console.log(`   GET /health: ERROR - ${error.message}`);
    }

    // Test Swagger documentation
    console.log('\n4. Testing Swagger Documentation...');
    try {
      const swaggerResponse = await fetch('http://localhost:3000/api-docs');
      console.log(`   GET /api-docs: ${swaggerResponse.status}`);
      if (swaggerResponse.status === 200) {
        console.log(`   ✅ Swagger UI accessible`);
      }

      const swaggerJsonResponse = await fetch('http://localhost:3000/api-docs.json');
      console.log(`   GET /api-docs.json: ${swaggerJsonResponse.status}`);
      if (swaggerJsonResponse.status === 200) {
        console.log(`   ✅ Swagger JSON accessible`);
      }
    } catch (error) {
      console.log(`   Swagger documentation: ERROR - ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 User Verification Endpoint Testing Complete!');
}

testUserVerificationEndpoints();
