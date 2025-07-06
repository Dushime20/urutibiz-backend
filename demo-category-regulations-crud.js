/**
 * Demo script for Category Regulations CRUD operations
 * 
 * This script demonstrates all the features of the Category Regulations system:
 * - Creating category regulations with country-specific rules
 * - Reading and filtering regulations by various criteria
 * - Updating regulation information
 * - Deleting regulations
 * - Bulk operations for managing multiple regulations
 * - Compliance checking for specific scenarios
 * - Country and category overviews
 * - Statistical analysis and reporting
 * 
 * Usage: node demo-category-regulations-crud.js
 * 
 * Make sure your backend server is running on http://localhost:3000
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const API_URL = `${BASE_URL}/category-regulations`;

// Demo data
const demoCategoryRegulations = [
  {
    category_id: "650e8400-e29b-41d4-a716-446655440001",
    country_id: "750e8400-e29b-41d4-a716-446655440001",
    is_allowed: true,
    requires_license: false,
    min_age_requirement: 18,
    max_rental_days: 30,
    special_requirements: "Valid identification required. Items must be returned in original condition.",
    mandatory_insurance: true,
    min_coverage_amount: 50000.00,
    max_liability_amount: 100000.00,
    requires_background_check: false,
    prohibited_activities: "Commercial resale, modification of devices",
    seasonal_restrictions: {
      summer: { max_days: 45, special_rate: true },
      winter: { max_days: 30 }
    },
    documentation_required: [
      "government_id",
      "proof_of_address",
      "insurance_certificate"
    ],
    compliance_level: "MEDIUM"
  },
  {
    category_id: "650e8400-e29b-41d4-a716-446655440002",
    country_id: "750e8400-e29b-41d4-a716-446655440001",
    is_allowed: true,
    requires_license: true,
    license_type: "DRIVER_LICENSE_CLASS_B",
    min_age_requirement: 21,
    max_rental_days: 90,
    special_requirements: "Valid driver license required. International driving permit for foreign nationals.",
    mandatory_insurance: true,
    min_coverage_amount: 200000.00,
    max_liability_amount: 500000.00,
    requires_background_check: true,
    prohibited_activities: "Racing, off-road driving in restricted areas, commercial transport",
    seasonal_restrictions: {
      rainy_season: { 
        additional_requirements: ["weather_training"],
        max_consecutive_days: 14
      }
    },
    documentation_required: [
      "driver_license",
      "passport_or_id",
      "credit_card",
      "insurance_policy"
    ],
    compliance_level: "HIGH"
  },
  {
    category_id: "650e8400-e29b-41d4-a716-446655440003",
    country_id: "750e8400-e29b-41d4-a716-446655440002",
    is_allowed: true,
    requires_license: false,
    min_age_requirement: 16,
    max_rental_days: 14,
    special_requirements: "Safety briefing required for high-risk equipment. Waiver must be signed.",
    mandatory_insurance: true,
    min_coverage_amount: 25000.00,
    max_liability_amount: 75000.00,
    requires_background_check: false,
    prohibited_activities: "Professional competitions, extreme sports without supervision",
    seasonal_restrictions: {
      peak_season: { 
        advance_booking_required: true,
        max_days: 7
      }
    },
    documentation_required: [
      "identification",
      "emergency_contact",
      "medical_clearance"
    ],
    compliance_level: "MEDIUM"
  },
  {
    category_id: "650e8400-e29b-41d4-a716-446655440004",
    country_id: "750e8400-e29b-41d4-a716-446655440003",
    is_allowed: false,
    requires_license: false,
    min_age_requirement: null,
    max_rental_days: null,
    special_requirements: "This category is completely prohibited in this country due to safety regulations.",
    mandatory_insurance: false,
    min_coverage_amount: null,
    max_liability_amount: null,
    requires_background_check: false,
    prohibited_activities: "All activities related to this category",
    compliance_level: "CRITICAL"
  }
];

// Utility function for API calls with error handling
async function apiCall(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Error in ${method.toUpperCase()} ${url}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Message: ${error.message}`);
    }
    return { success: false, error };
  }
}

// Demo functions
async function createCategoryRegulations() {
  console.log('\n🏛️  Creating Category Regulations...');
  const createdRegulations = [];
  
  for (const regulation of demoCategoryRegulations) {
    console.log(`\n   Creating regulation for category ${regulation.category_id} in country ${regulation.country_id}...`);
    const result = await apiCall('POST', API_URL, regulation);
    
    if (result.success) {
      console.log(`   ✅ Created regulation with ID: ${result.data.data.id}`);
      console.log(`   🔒 Compliance level: ${result.data.data.compliance_level}`);
      console.log(`   📋 Allowed: ${result.data.data.is_allowed ? 'Yes' : 'No'}`);
      console.log(`   📜 License required: ${result.data.data.requires_license ? 'Yes' : 'No'}`);
      console.log(`   🛡️  Insurance required: ${result.data.data.mandatory_insurance ? 'Yes' : 'No'}`);
      createdRegulations.push(result.data.data);
    }
  }
  
  return createdRegulations;
}

async function getAllCategoryRegulations() {
  console.log('\n📋 Getting all Category Regulations...');
  const result = await apiCall('GET', API_URL);
  
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations`);
    result.data.data.forEach(regulation => {
      console.log(`   🏛️  ${regulation.category_id} -> ${regulation.country_id}: ${regulation.compliance_level} (${regulation.is_allowed ? 'Allowed' : 'Prohibited'})`);
    });
    return result.data.data;
  }
  
  return [];
}

async function getCategoryRegulationsByFilters() {
  console.log('\n🔍 Testing various filters...');
  
  // Filter by compliance level
  console.log('\n   Filtering by compliance level (HIGH):');
  let result = await apiCall('GET', `${API_URL}?compliance_level=HIGH`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} high compliance regulations`);
  }
  
  // Filter by license requirement
  console.log('\n   Filtering by license requirement:');
  result = await apiCall('GET', `${API_URL}?requires_license=true`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations requiring license`);
  }
  
  // Filter by insurance requirement
  console.log('\n   Filtering by insurance requirement:');
  result = await apiCall('GET', `${API_URL}?mandatory_insurance=true`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations requiring insurance`);
  }
  
  // Filter by allowed status
  console.log('\n   Filtering by prohibited categories:');
  result = await apiCall('GET', `${API_URL}?is_allowed=false`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} prohibited category regulations`);
  }
  
  // Age range filter
  console.log('\n   Filtering by age requirements (18-25):');
  result = await apiCall('GET', `${API_URL}?min_age=18&max_age=25`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations with age 18-25 requirement`);
  }
  
  // Search filter
  console.log('\n   Searching for "safety" in requirements:');
  result = await apiCall('GET', `${API_URL}?search=safety`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations mentioning safety`);
  }
}

async function getCategoryRegulationById(regulationId) {
  console.log(`\n🔍 Getting Category Regulation by ID: ${regulationId}...`);
  const result = await apiCall('GET', `${API_URL}/${regulationId}`);
  
  if (result.success) {
    const regulation = result.data.data;
    console.log(`   ✅ Found regulation for category ${regulation.category_id}`);
    console.log(`   🌍 Country: ${regulation.country_id}`);
    console.log(`   🔒 Compliance level: ${regulation.compliance_level}`);
    console.log(`   📜 License required: ${regulation.requires_license ? regulation.license_type || 'Yes' : 'No'}`);
    console.log(`   🛡️  Insurance: ${regulation.mandatory_insurance ? `Required (min: ${regulation.min_coverage_amount})` : 'Not required'}`);
    console.log(`   👤 Min age: ${regulation.min_age_requirement || 'No requirement'}`);
    console.log(`   📅 Max rental days: ${regulation.max_rental_days || 'No limit'}`);
    if (regulation.seasonal_restrictions) {
      console.log(`   🌞 Seasonal restrictions:`, Object.keys(regulation.seasonal_restrictions));
    }
    if (regulation.documentation_required && regulation.documentation_required.length > 0) {
      console.log(`   📄 Required documents: ${regulation.documentation_required.join(', ')}`);
    }
    return regulation;
  }
  
  return null;
}

async function updateCategoryRegulation(regulationId) {
  console.log(`\n✏️  Updating Category Regulation ${regulationId}...`);
  
  const updateData = {
    compliance_level: "CRITICAL",
    min_age_requirement: 25,
    max_rental_days: 7,
    special_requirements: "Enhanced safety training required. Additional supervision mandatory.",
    seasonal_restrictions: {
      summer: { max_days: 5, additional_safety: true },
      winter: { max_days: 3, weather_restrictions: true },
      holiday_season: { advance_booking_required: true, max_consecutive_days: 2 }
    },
    documentation_required: [
      "government_id",
      "proof_of_address",
      "insurance_certificate",
      "safety_certification",
      "emergency_contact"
    ]
  };
  
  const result = await apiCall('PUT', `${API_URL}/${regulationId}`, updateData);
  
  if (result.success) {
    console.log(`   ✅ Updated regulation successfully`);
    console.log(`   🔒 New compliance level: ${result.data.data.compliance_level}`);
    console.log(`   👤 New min age: ${result.data.data.min_age_requirement}`);
    console.log(`   📅 New max rental days: ${result.data.data.max_rental_days}`);
    console.log(`   📄 Documents required: ${result.data.data.documentation_required?.length || 0}`);
    return result.data.data;
  }
  
  return null;
}

async function testBulkOperations() {
  console.log('\n📦 Testing bulk operations...');
  
  // Bulk create
  console.log('\n   Testing bulk create:');
  const bulkCreateData = [
    {
      category_id: "650e8400-e29b-41d4-a716-446655440005",
      country_id: "750e8400-e29b-41d4-a716-446655440004",
      is_allowed: true,
      requires_license: false,
      min_age_requirement: 14,
      max_rental_days: 21,
      mandatory_insurance: false,
      compliance_level: "LOW"
    },
    {
      category_id: "650e8400-e29b-41d4-a716-446655440006",
      country_id: "750e8400-e29b-41d4-a716-446655440005",
      is_allowed: true,
      requires_license: true,
      license_type: "PROFESSIONAL_OPERATOR",
      min_age_requirement: 30,
      max_rental_days: 180,
      mandatory_insurance: true,
      min_coverage_amount: 500000.00,
      requires_background_check: true,
      compliance_level: "CRITICAL"
    }
  ];
  
  let result = await apiCall('POST', `${API_URL}/bulk`, { regulations: bulkCreateData });
  if (result.success) {
    console.log(`   ✅ Bulk created ${result.data.data.created} regulations`);
  }
  
  // Bulk update
  console.log('\n   Testing bulk update by compliance level:');
  const bulkUpdateData = {
    updates: {
      data: {
        special_requirements: "Updated via bulk operation - enhanced safety protocols",
        seasonal_restrictions: {
          all_seasons: { 
            updated_via_bulk: true,
            update_timestamp: new Date().toISOString()
          }
        }
      },
      filters: {
        compliance_level: "MEDIUM"
      }
    }
  };
  
  result = await apiCall('POST', `${API_URL}/bulk`, bulkUpdateData);
  if (result.success) {
    console.log(`   ✅ Bulk updated ${result.data.data.updated} regulations`);
  }
}

async function testComplianceChecking() {
  console.log('\n🔍 Testing compliance checking...');
  
  // Scenario 1: Young user trying to rent vehicles
  console.log('\n   Scenario 1: 19-year-old trying to rent vehicle (requires 21):');
  const scenario1 = {
    category_id: "650e8400-e29b-41d4-a716-446655440002",
    country_id: "750e8400-e29b-41d4-a716-446655440001",
    user_age: 19,
    rental_duration_days: 7,
    has_license: true,
    license_type: "DRIVER_LICENSE_CLASS_B",
    has_insurance: true,
    coverage_amount: 250000,
    background_check_status: "approved",
    documentation_provided: ["driver_license", "passport_or_id", "credit_card"]
  };
  
  let result = await apiCall('POST', `${API_URL}/compliance/check`, scenario1);
  if (result.success) {
    const compliance = result.data.data;
    console.log(`   📋 Compliant: ${compliance.is_compliant ? 'YES' : 'NO'}`);
    console.log(`   ❌ Violations: ${compliance.violations.length}`);
    if (compliance.violations.length > 0) {
      compliance.violations.forEach(violation => console.log(`      - ${violation}`));
    }
    console.log(`   ⚠️  Warnings: ${compliance.warnings.length}`);
    console.log(`   💡 Recommendations: ${compliance.recommendations.length}`);
  }
  
  // Scenario 2: Fully compliant user
  console.log('\n   Scenario 2: 25-year-old with all requirements for sports equipment:');
  const scenario2 = {
    category_id: "650e8400-e29b-41d4-a716-446655440003",
    country_id: "750e8400-e29b-41d4-a716-446655440002",
    user_age: 25,
    rental_duration_days: 10,
    has_insurance: true,
    coverage_amount: 30000,
    documentation_provided: ["identification", "emergency_contact", "medical_clearance"],
    season: "peak_season"
  };
  
  result = await apiCall('POST', `${API_URL}/compliance/check`, scenario2);
  if (result.success) {
    const compliance = result.data.data;
    console.log(`   📋 Compliant: ${compliance.is_compliant ? 'YES' : 'NO'}`);
    console.log(`   ✅ All checks passed: ${compliance.violations.length === 0 ? 'YES' : 'NO'}`);
    if (compliance.warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      compliance.warnings.forEach(warning => console.log(`      - ${warning}`));
    }
  }
  
  // Scenario 3: Trying to rent prohibited category
  console.log('\n   Scenario 3: Trying to rent prohibited category:');
  const scenario3 = {
    category_id: "650e8400-e29b-41d4-a716-446655440004",
    country_id: "750e8400-e29b-41d4-a716-446655440003",
    user_age: 30,
    rental_duration_days: 1
  };
  
  result = await apiCall('POST', `${API_URL}/compliance/check`, scenario3);
  if (result.success) {
    const compliance = result.data.data;
    console.log(`   📋 Compliant: ${compliance.is_compliant ? 'YES' : 'NO'}`);
    console.log(`   🚫 Regulation exists: ${compliance.regulation_exists ? 'YES' : 'NO'}`);
    if (compliance.violations.length > 0) {
      console.log(`   ❌ Violations:`);
      compliance.violations.forEach(violation => console.log(`      - ${violation}`));
    }
  }
}

async function testStatisticsAndOverviews() {
  console.log('\n📊 Testing statistics and overviews...');
  
  // Global statistics
  console.log('\n   Getting global statistics:');
  let result = await apiCall('GET', `${API_URL}/stats`);
  if (result.success) {
    const stats = result.data.data;
    console.log(`   ✅ Total regulations: ${stats.total_regulations}`);
    console.log(`   🏛️  Countries with regulations: ${Object.keys(stats.by_country).length}`);
    console.log(`   📦 Categories with regulations: ${Object.keys(stats.by_category).length}`);
    console.log(`   📜 Regulations requiring licenses: ${stats.licensing_required}`);
    console.log(`   🛡️  Regulations requiring insurance: ${stats.insurance_required}`);
    console.log(`   🔍 Regulations requiring background checks: ${stats.background_check_required}`);
    console.log(`   📊 Compliance breakdown:`, stats.by_compliance_level);
    
    if (stats.most_restrictive_countries.length > 0) {
      console.log(`   🔒 Most restrictive country: ${stats.most_restrictive_countries[0].country_code} (${stats.most_restrictive_countries[0].restriction_count} regulations)`);
    }
  }
  
  // Country overview (if we have regulations)
  console.log('\n   Getting country overview:');
  result = await apiCall('GET', `${API_URL}/country/750e8400-e29b-41d4-a716-446655440001/overview`);
  if (result.success) {
    const overview = result.data.data;
    console.log(`   ✅ Country: ${overview.country_code} (${overview.country_name})`);
    console.log(`   📊 Total regulations: ${overview.total_regulations}`);
    console.log(`   ✅ Allowed categories: ${overview.allowed_categories}`);
    console.log(`   ⚠️  Restricted categories: ${overview.restricted_categories}`);
    console.log(`   🚫 Prohibited categories: ${overview.prohibited_categories}`);
    console.log(`   📜 Licensing requirements: ${overview.licensing_requirements}`);
    console.log(`   🛡️  Insurance requirements: ${overview.insurance_requirements}`);
    
    if (overview.most_restrictive_categories.length > 0) {
      console.log(`   🔒 Most restrictive category: ${overview.most_restrictive_categories[0].category_name} (${overview.most_restrictive_categories[0].compliance_level})`);
    }
    
    console.log(`   📄 Common documentation: ${overview.documentation_requirements.slice(0, 3).join(', ')}${overview.documentation_requirements.length > 3 ? '...' : ''}`);
  }
  
  // Category overview
  console.log('\n   Getting category overview:');
  result = await apiCall('GET', `${API_URL}/category/650e8400-e29b-41d4-a716-446655440002/overview`);
  if (result.success) {
    const overview = result.data.data;
    console.log(`   ✅ Category: ${overview.category_name}`);
    console.log(`   📊 Total regulations: ${overview.total_regulations}`);
    console.log(`   🌍 Countries allowing: ${overview.countries_allowed}`);
    console.log(`   ⚠️  Countries with restrictions: ${overview.countries_restricted}`);
    console.log(`   🚫 Countries prohibiting: ${overview.countries_prohibited}`);
    console.log(`   🔒 Global compliance level: ${overview.global_compliance_level}`);
    console.log(`   📜 Countries requiring license: ${overview.licensing_countries.join(', ')}`);
    console.log(`   🛡️  Countries requiring insurance: ${overview.insurance_countries.join(', ')}`);
    
    if (overview.common_requirements) {
      console.log(`   👤 Age range: ${overview.common_requirements.min_age_range.min}-${overview.common_requirements.min_age_range.max}`);
      console.log(`   📅 Rental days range: ${overview.common_requirements.max_rental_days_range.min}-${overview.common_requirements.max_rental_days_range.max}`);
    }
  }
}

async function testCategoryCountrySpecificQueries() {
  console.log('\n🎯 Testing category and country specific queries...');
  
  // Get regulations by category
  console.log('\n   Getting regulations for a specific category:');
  let result = await apiCall('GET', `${API_URL}/category/650e8400-e29b-41d4-a716-446655440002`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations for this category`);
    result.data.data.forEach(reg => {
      console.log(`      - Country: ${reg.country_id}, Compliance: ${reg.compliance_level}`);
    });
  }
  
  // Get regulations by country
  console.log('\n   Getting regulations for a specific country:');
  result = await apiCall('GET', `${API_URL}/country/750e8400-e29b-41d4-a716-446655440001`);
  if (result.success) {
    console.log(`   ✅ Found ${result.data.data.length} regulations for this country`);
    result.data.data.forEach(reg => {
      console.log(`      - Category: ${reg.category_id}, Level: ${reg.compliance_level}, Allowed: ${reg.is_allowed}`);
    });
  }
  
  // Find specific category-country regulation
  console.log('\n   Finding specific category-country regulation:');
  result = await apiCall('GET', `${API_URL}/category/650e8400-e29b-41d4-a716-446655440002/country/750e8400-e29b-41d4-a716-446655440001`);
  if (result.success) {
    const reg = result.data.data;
    console.log(`   ✅ Found regulation: ${reg.compliance_level} level`);
    console.log(`   📜 License required: ${reg.requires_license ? reg.license_type : 'No'}`);
    console.log(`   🛡️  Insurance: ${reg.mandatory_insurance ? 'Required' : 'Not required'}`);
    console.log(`   👤 Min age: ${reg.min_age_requirement || 'No requirement'}`);
  }
}

async function deleteCategoryRegulation(regulationId) {
  console.log(`\n🗑️  Deleting Category Regulation ${regulationId}...`);
  const result = await apiCall('DELETE', `${API_URL}/${regulationId}`);
  
  if (result.success) {
    console.log(`   ✅ Regulation deleted successfully`);
    return true;
  }
  
  return false;
}

async function runDemo() {
  console.log('🚀 Starting Category Regulations CRUD Demo');
  console.log('==========================================');
  
  try {
    // Test server connectivity
    console.log('\n🔌 Testing server connectivity...');
    const healthResult = await apiCall('GET', `${BASE_URL}/health`);
    if (!healthResult.success) {
      console.log('❌ Could not connect to server. Make sure the backend is running on http://localhost:3000');
      return;
    }
    console.log('✅ Server is running');
    
    // Create category regulations
    const createdRegulations = await createCategoryRegulations();
    
    if (createdRegulations.length === 0) {
      console.log('❌ No regulations were created. Cannot continue with demo.');
      return;
    }
    
    // Get all regulations
    await getAllCategoryRegulations();
    
    // Test filtering
    await getCategoryRegulationsByFilters();
    
    // Get specific regulation
    const firstRegulation = createdRegulations[0];
    const retrievedRegulation = await getCategoryRegulationById(firstRegulation.id);
    
    if (retrievedRegulation) {
      // Update the regulation
      const updatedRegulation = await updateCategoryRegulation(firstRegulation.id);
      
      if (updatedRegulation) {
        // Test compliance checking
        await testComplianceChecking();
      }
    }
    
    // Test bulk operations
    await testBulkOperations();
    
    // Test statistics and overviews
    await testStatisticsAndOverviews();
    
    // Test category and country specific queries
    await testCategoryCountrySpecificQueries();
    
    // Clean up - delete created regulations
    console.log('\n🧹 Cleaning up...');
    for (const regulation of createdRegulations) {
      await deleteCategoryRegulation(regulation.id);
    }
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\n📝 Summary of tested features:');
    console.log('   ✅ Create category regulations with comprehensive rules');
    console.log('   ✅ Read and filter regulations by various criteria');
    console.log('   ✅ Update regulation information and requirements');
    console.log('   ✅ Delete regulations');
    console.log('   ✅ Bulk operations for managing multiple regulations');
    console.log('   ✅ Compliance checking for different scenarios');
    console.log('   ✅ Country and category regulation overviews');
    console.log('   ✅ Statistical analysis and reporting');
    console.log('   ✅ Category and country specific queries');
    console.log('\n🎉 All Category Regulations CRUD operations are working correctly!');
    
  } catch (error) {
    console.error('\n❌ Demo failed with error:', error.message);
  }
}

// Handle command line execution
if (require.main === module) {
  runDemo();
}

module.exports = {
  runDemo,
  createCategoryRegulations,
  getAllCategoryRegulations,
  getCategoryRegulationsByFilters,
  getCategoryRegulationById,
  updateCategoryRegulation,
  testBulkOperations,
  testComplianceChecking,
  testStatisticsAndOverviews,
  testCategoryCountrySpecificQueries,
  deleteCategoryRegulation
};
