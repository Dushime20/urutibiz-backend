const fetch = require('node-fetch');

async function simpleApiTest() {
  console.log('🔍 Simple API Connectivity Test');
  console.log('==============================\n');

  // Test basic health endpoint
  try {
    console.log('1. Testing basic health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('   ✅ Health endpoint works');
    console.log('   📊 Status:', healthData.status);
    console.log('   🌍 Environment:', healthData.environment);
  } catch (error) {
    console.log('   ❌ Health endpoint failed:', error.message);
    return;
  }

  // Test API health endpoint  
  try {
    console.log('\n2. Testing API health endpoint...');
    const apiHealthResponse = await fetch('http://localhost:3000/api/v1/health');
    const apiHealthData = await apiHealthResponse.json();
    console.log('   ✅ API health endpoint works');
    console.log('   📊 Status:', apiHealthData.success);
    console.log('   📝 Message:', apiHealthData.message);
  } catch (error) {
    console.log('   ❌ API health endpoint failed:', error.message);
  }

  // Test Swagger documentation
  try {
    console.log('\n3. Testing Swagger documentation...');
    const swaggerResponse = await fetch('http://localhost:3000/api-docs');
    console.log('   📋 Swagger Status:', swaggerResponse.status);
    if (swaggerResponse.ok) {
      console.log('   ✅ Swagger documentation accessible');
    } else {
      console.log('   ⚠️ Swagger documentation not accessible');
    }
  } catch (error) {
    console.log('   ❌ Swagger test failed:', error.message);
  }

  // Test simple API route
  try {
    console.log('\n4. Testing simple API routes...');
    const routeTests = [
      'http://localhost:3000/api/v1/products',
      'http://localhost:3000/api/v1/users', 
      'http://localhost:3000/api/v1/bookings',
      'http://localhost:3000/api/v1/auth/login'
    ];

    for (const url of routeTests) {
      try {
        const routeResponse = await fetch(url, {
          method: 'GET',
          timeout: 5000
        });
        console.log(`   📍 ${url.split('/').pop()}: Status ${routeResponse.status}`);
      } catch (routeError) {
        console.log(`   ❌ ${url.split('/').pop()}: Failed - ${routeError.message}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Route testing failed:', error.message);
  }

  // Test with different methods
  try {
    console.log('\n5. Testing POST request to auth/login...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      }),
      timeout: 10000
    });
    
    console.log('   📋 POST Status:', loginResponse.status);
    if (loginResponse.status === 400 || loginResponse.status === 401) {
      console.log('   ✅ Login endpoint responding (expected error)');
    } else {
      console.log('   📝 Response received');
    }
  } catch (error) {
    console.log('   ❌ POST test failed:', error.message);
  }
}

simpleApiTest();
