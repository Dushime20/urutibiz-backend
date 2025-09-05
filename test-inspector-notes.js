const axios = require('axios');

async function testInspectorNotes() {
  console.log('🧪 Testing Inspector Notes Update...');
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
      
      if (inspectionsResponse.data.data && inspectionsResponse.data.data.inspections && inspectionsResponse.data.data.inspections.length > 0) {
        const inspectionId = inspectionsResponse.data.data.inspections[0].id;
        console.log(`📋 Found inspection ID: ${inspectionId}`);
        console.log('');

        // Test 3: Update inspection with inspector notes
        console.log('3. Updating inspection with inspector notes...');
        const updateData = {
          inspectorNotes: 'This is a test inspector note from the frontend. The inspection was completed successfully with no major issues found.',
          generalNotes: 'Updated general notes',
          inspectionLocation: 'Updated location'
        };

        const updateResponse = await axios.put(`${baseURL}/inspections/${inspectionId}`, updateData, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Inspection updated successfully:', updateResponse.status);
        console.log('📝 Response data:', JSON.stringify(updateResponse.data, null, 2));
        console.log('');

        // Test 4: Get the updated inspection to verify inspector notes were saved
        console.log('4. Verifying inspector notes were saved...');
        const getResponse = await axios.get(`${baseURL}/inspections/${inspectionId}`, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
          }
        });

        console.log('✅ Inspection retrieved successfully:', getResponse.status);
        const inspection = getResponse.data.data.inspection;
        console.log('📝 Inspector Notes:', inspection.inspectorNotes);
        console.log('📝 General Notes:', inspection.generalNotes);
        console.log('📝 Location:', inspection.inspectionLocation);
        
        if (inspection.inspectorNotes === updateData.inspectorNotes) {
          console.log('✅ SUCCESS: Inspector notes were saved correctly!');
        } else {
          console.log('❌ FAILED: Inspector notes were not saved correctly');
          console.log('Expected:', updateData.inspectorNotes);
          console.log('Actual:', inspection.inspectorNotes);
        }
      } else {
        console.log('⚠️ No inspections found. Create an inspection first.');
      }
    } catch (error) {
      console.log('❌ Error getting inspections:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Instructions for the user
console.log('📋 INSTRUCTIONS:');
console.log('1. Replace "YOUR_TOKEN_HERE" with a valid JWT token');
console.log('2. Make sure the backend server is running on port 5000');
console.log('3. Ensure you have at least one inspection in the database');
console.log('4. Run: node test-inspector-notes.js');
console.log('');

testInspectorNotes();
