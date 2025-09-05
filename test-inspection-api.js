const axios = require('axios');

async function testInspectionAPI() {
  console.log('🧪 Testing Single Inspection API...');
  console.log('');

  const baseURL = 'http://localhost:5000/api/v1';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${baseURL.replace('/api/v1', '')}/health`);
    console.log('✅ Health check passed:', healthResponse.status);
    console.log('');

    // Test 2: Get inspections list (to find an inspection ID)
    console.log('2. Getting inspections list...');
    try {
      const inspectionsResponse = await axios.get(`${baseURL}/inspections`, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
        }
      });
      console.log('✅ Inspections list retrieved:', inspectionsResponse.data);
      
      if (inspectionsResponse.data.data && inspectionsResponse.data.data.inspections.length > 0) {
        const inspectionId = inspectionsResponse.data.data.inspections[0].id;
        console.log(`📋 Found inspection ID: ${inspectionId}`);
        console.log('');

        // Test 3: Get single inspection
        console.log('3. Getting single inspection...');
        const singleInspectionResponse = await axios.get(`${baseURL}/inspections/${inspectionId}`, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
          }
        });
        console.log('✅ Single inspection retrieved:', singleInspectionResponse.data);
      } else {
        console.log('⚠️ No inspections found in the list');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Authentication required - please provide a valid token');
        console.log('   Update the YOUR_TOKEN_HERE placeholder with a real JWT token');
      } else {
        console.log('❌ Error getting inspections:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check if the server started successfully');
    console.log('   3. Verify the .env file has PORT=5000');
  }
}

testInspectionAPI();
