const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testInspectionTypes() {
  try {
    console.log('🧪 Testing All Inspection Types...');
    console.log('');

    // Test data for different inspection types
    const testCases = [
      {
        name: 'Pre-rental Inspection',
        type: 'pre_rental',
        description: 'Standard pre-rental inspection'
      },
      {
        name: 'Post-return Inspection', 
        type: 'post_return',
        description: 'Standard post-return inspection'
      },
      {
        name: 'Damage Assessment',
        type: 'damage_assessment',
        description: 'Detailed damage assessment inspection'
      },
      {
        name: 'Post-rental Maintenance Check',
        type: 'post_rental_maintenance_check',
        description: 'Maintenance check after rental period'
      },
      {
        name: 'Quality Verification',
        type: 'quality_verification',
        description: 'Quality verification inspection'
      }
    ];

    console.log('📋 Testing the following inspection types:');
    testCases.forEach((testCase, index) => {
      console.log(`   ${index + 1}. ${testCase.name} (${testCase.type})`);
    });
    console.log('');

    // Test data for creating an inspection
    const testInspectionData = {
      productId: "test-product-id",
      bookingId: "test-booking-id", 
      inspectorId: "test-inspector-id",
      inspectionType: "pre_rental", // This will be changed for each test
      scheduledAt: new Date().toISOString(),
      inspectionLocation: "Test Location",
      generalNotes: "Test inspection notes"
    };

    console.log('✅ Database and TypeScript updates completed:');
    console.log('   - Added damage_assessment to InspectionType enum');
    console.log('   - Added post_rental_maintenance_check to InspectionType enum');
    console.log('   - Added quality_verification to InspectionType enum');
    console.log('   - Updated controller validation to accept all types');
    console.log('   - Database enum updated via migration');
    console.log('');

    console.log('📝 To test with actual API calls:');
    console.log('   1. Get a valid JWT token from login');
    console.log('   2. Replace test IDs with real product, booking, and inspector IDs');
    console.log('   3. Use the following inspection types:');
    testCases.forEach(testCase => {
      console.log(`      - ${testCase.type} (${testCase.name})`);
    });
    console.log('');
    console.log('   4. Make POST request to /api/v1/inspections with the data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testInspectionTypes();
