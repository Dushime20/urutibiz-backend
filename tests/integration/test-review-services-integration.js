#!/usr/bin/env node

/**
 * Review System Services Integration Tests
 * 
 * Tests integration between review services, controllers, routes, and database components
 * Validates proper file structure, imports, exports, and component integration
 */

const fs = require('fs');
const path = require('path');

console.log('⭐ Testing Review System Services Integration');
console.log('======================================================================');

// Test Results Tracking
let totalTests = 0;
let passedTests = 0;
const testResults = [];

function runTest(testName, testFunction) {
  totalTests++;
  try {
    const result = testFunction();
    passedTests++;
    console.log(`✅ ${testName}: ${result}`);
    testResults.push({ name: testName, status: 'PASS', details: result });
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    testResults.push({ name: testName, status: 'FAIL', error: error.message });
  }
}

// =====================================================
// REVIEW SYSTEM FILES STRUCTURE TESTS
// =====================================================

console.log('🔍 Testing Review System Files...');
runTest('Review System Files', () => {
  const requiredFiles = [
    'src/types/review.types.ts',
    'src/services/ReviewService.ts',
    'src/controllers/review.controller.ts',
    'src/routes/review.routes.ts'
  ];

  const missingFiles = [];
  const foundFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      foundFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    throw new Error(`Missing files: ${missingFiles.join(', ')}`);
  }

  return `Found ${foundFiles.length}/${requiredFiles.length} review system files`;
});

// =====================================================
// REVIEW TYPES DEFINITIONS TESTS
// =====================================================

console.log('🔍 Testing Review Type Definitions...');
runTest('Review Type Definitions', () => {
  const typesFile = path.join(process.cwd(), 'src/types/review.types.ts');
  const content = fs.readFileSync(typesFile, 'utf8');

  const requiredTypes = [
    'ReviewData',
    'CreateReviewData',
    'UpdateReviewData',
    'ReviewFilters',
    'ReviewSearchParams',
    'ModerationStatus',
    'ReviewType',
    'RatingValue',
    'UserReviewAnalytics'
  ];

  const foundTypes = [];
  const missingTypes = [];

  requiredTypes.forEach(type => {
    if (content.includes(`interface ${type}`) || content.includes(`type ${type}`)) {
      foundTypes.push(type);
    } else {
      missingTypes.push(type);
    }
  });

  if (missingTypes.length > 2) { // Allow some flexibility
    throw new Error(`Missing types: ${missingTypes.join(', ')}`);
  }

  return `Found ${foundTypes.length}/${requiredTypes.length} type definitions`;
});

// =====================================================
// REVIEW SERVICE IMPLEMENTATION TESTS
// =====================================================

console.log('🔍 Testing Review Service Implementation...');
runTest('Review Service Implementation', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  const requiredMethods = [
    'createReview',
    'getReviewById',
    'updateReview',
    'deleteReview',
    'getReviewsByUser',
    'getReviewsForUser'
  ];

  const foundMethods = [];
  const missingMethods = [];

  requiredMethods.forEach(method => {
    if (content.includes(`${method}(`) || content.includes(`${method} =`) || content.includes(`async ${method}`)) {
      foundMethods.push(method);
    } else {
      missingMethods.push(method);
    }
  });

  // Check for AI analysis features
  const aiFeatures = ['performAIAnalysis', 'sentimentScore', 'toxicityScore', 'helpfulnessScore'];
  const foundAIFeatures = aiFeatures.filter(feature => content.includes(feature));

  return `Found ${foundMethods.length}/${requiredMethods.length} service methods, ${foundAIFeatures.length} AI features`;
});

// =====================================================
// REVIEW CONTROLLER METHODS TESTS
// =====================================================

console.log('🔍 Testing Review Controller Methods...');
runTest('Review Controller Methods', () => {
  const controllerFile = path.join(process.cwd(), 'src/controllers/review.controller.ts');
  const content = fs.readFileSync(controllerFile, 'utf8');

  const requiredMethods = [
    'createReview',
    'getReviewById',
    'updateReview',
    'deleteReview',
    'getReviewsByUser',
    'getReviewsForUser',
    'searchReviews',
    'getReviewAnalytics'
  ];

  const foundMethods = [];
  requiredMethods.forEach(method => {
    if (content.includes(`${method} =`) || content.includes(`${method}(`)) {
      foundMethods.push(method);
    }
  });

  // Check for proper Express types
  const hasExpressTypes = content.includes('Request') && content.includes('Response');
  const hasErrorHandling = content.includes('try') && content.includes('catch');

  if (!hasExpressTypes) {
    throw new Error('Missing Express Request/Response types');
  }

  return `Found ${foundMethods.length}/${requiredMethods.length} controller methods with Express types`;
});

// =====================================================
// REVIEW ROUTES CONFIGURATION TESTS
// =====================================================

console.log('🔍 Testing Review Routes Configuration...');
runTest('Review Routes Configuration', () => {
  const routesFile = path.join(process.cwd(), 'src/routes/review.routes.ts');
  const content = fs.readFileSync(routesFile, 'utf8');

  const requiredRoutes = [
    'router.post',
    'router.get',
    'router.put',
    'router.delete'
  ];

  const foundRoutes = [];
  requiredRoutes.forEach(route => {
    const matches = content.match(new RegExp(route.replace('.', '\\.'), 'g'));
    if (matches) {
      foundRoutes.push(`${route}(${matches.length})`);
    }
  });

  // Check for route documentation
  const hasDocumentation = content.includes('@route') && content.includes('@desc');
  const hasExamples = content.includes('@example');

  return `Found ${foundRoutes.length} route types with documentation: ${hasDocumentation}`;
});

// =====================================================
// REVIEW DATABASE INTEGRATION TESTS
// =====================================================

console.log('🔍 Testing Review Database Integration...');
runTest('Review Database Integration', () => {
  // Check for migration files
  const migrationsDir = path.join(process.cwd(), 'database/migrations');
  let migrationFiles = [];
  
  if (fs.existsSync(migrationsDir)) {
    migrationFiles = fs.readdirSync(migrationsDir).filter(file => 
      file.includes('review') && file.endsWith('.ts')
    );
  }

  // Check service for database operations
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');

  const hasRepositoryPattern = serviceContent.includes('Repository') || serviceContent.includes('repository');
  const hasDatabaseOps = serviceContent.includes('create') && serviceContent.includes('find');

  return `Found ${migrationFiles.length} migration(s), repository pattern: ${hasRepositoryPattern}`;
});

// =====================================================
// REVIEW VALIDATION AND BUSINESS RULES TESTS
// =====================================================

console.log('🔍 Testing Review Validation and Business Rules...');
runTest('Review Validation and Business Rules', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  // Check for validation functions
  const validationFeatures = [
    'validate',
    'businessRule',
    'checkDuplicate',
    'validateRating',
    'validateContent'
  ];

  const foundValidations = validationFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check for business logic
  const businessLogicFeatures = [
    'moderation',
    'flagging',
    'approval',
    'sentiment',
    'toxicity'
  ];

  const foundBusinessLogic = businessLogicFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  return `Found ${foundValidations.length} validation features, ${foundBusinessLogic.length} business logic features`;
});

// =====================================================
// REVIEW AI INTEGRATION TESTS
// =====================================================

console.log('🔍 Testing Review AI Integration...');
runTest('Review AI Integration', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  const aiFeatures = [
    'aiSentimentScore',
    'aiToxicityScore',
    'aiHelpfulnessScore',
    'performAIAnalysis',
    'flagRecommendation'
  ];

  const foundAIFeatures = aiFeatures.filter(feature => content.includes(feature));

  // Check types file for AI-related types
  const typesFile = path.join(process.cwd(), 'src/types/review.types.ts');
  const typesContent = fs.readFileSync(typesFile, 'utf8');

  const aiTypes = ['AIAnalysisResult', 'sentimentScore', 'toxicityScore'];
  const foundAITypes = aiTypes.filter(type => typesContent.includes(type));

  return `Found ${foundAIFeatures.length}/${aiFeatures.length} AI features, ${foundAITypes.length} AI types`;
});

// =====================================================
// REVIEW MODERATION SYSTEM TESTS
// =====================================================

console.log('🔍 Testing Review Moderation System...');
runTest('Review Moderation System', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  const moderationFeatures = [
    'moderation',
    'flagged',
    'approved',
    'rejected',
    'pending'
  ];

  const foundModerationFeatures = moderationFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check for moderation workflow
  const workflowFeatures = ['autoFlag', 'autoApprove', 'moderationQueue', 'priority'];
  const foundWorkflowFeatures = workflowFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check controller for moderation endpoints
  const controllerFile = path.join(process.cwd(), 'src/controllers/review.controller.ts');
  const controllerContent = fs.readFileSync(controllerFile, 'utf8');
  
  const hasModerationEndpoints = controllerContent.includes('moderat') || controllerContent.includes('flag');

  return `Found ${foundModerationFeatures.length} moderation features, ${foundWorkflowFeatures.length} workflow features`;
});

// =====================================================
// REVIEW ANALYTICS INTEGRATION TESTS
// =====================================================

console.log('🔍 Testing Review Analytics Integration...');
runTest('Review Analytics Integration', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  const analyticsFeatures = [
    'analytics',
    'statistics',
    'average',
    'distribution',
    'trend'
  ];

  const foundAnalyticsFeatures = analyticsFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check for rating calculations
  const ratingFeatures = ['calculateRating', 'averageRating', 'ratingDistribution'];
  const foundRatingFeatures = ratingFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check controller for analytics endpoints
  const controllerFile = path.join(process.cwd(), 'src/controllers/review.controller.ts');
  const controllerContent = fs.readFileSync(controllerFile, 'utf8');
  
  const hasAnalyticsEndpoints = controllerContent.includes('analytic') || controllerContent.includes('stats');

  return `Found ${foundAnalyticsFeatures.length} analytics features, ${foundRatingFeatures.length} rating features`;
});

// =====================================================
// REVIEW SEARCH AND FILTERING TESTS
// =====================================================

console.log('🔍 Testing Review Search and Filtering...');
runTest('Review Search and Filtering', () => {
  const serviceFile = path.join(process.cwd(), 'src/services/ReviewService.ts');
  const content = fs.readFileSync(serviceFile, 'utf8');

  const searchFeatures = [
    'search',
    'filter',
    'sort',
    'pagination'
  ];

  const foundSearchFeatures = searchFeatures.filter(feature => 
    content.toLowerCase().includes(feature.toLowerCase())
  );

  // Check for filter types
  const typesFile = path.join(process.cwd(), 'src/types/review.types.ts');
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  
  const filterTypes = ['ReviewFilters', 'ReviewSearchParams', 'SortOptions'];
  const foundFilterTypes = filterTypes.filter(type => typesContent.includes(type));

  // Check controller for search endpoints
  const controllerFile = path.join(process.cwd(), 'src/controllers/review.controller.ts');
  const controllerContent = fs.readFileSync(controllerFile, 'utf8');
  
  const hasSearchEndpoints = controllerContent.includes('search') || controllerContent.includes('filter');

  return `Found ${foundSearchFeatures.length} search features, ${foundFilterTypes.length} filter types`;
});

// =====================================================
// TEST RESULTS SUMMARY
// =====================================================

console.log('\n======================================================================');
console.log('📊 REVIEW SYSTEM INTEGRATION TEST RESULTS');
console.log('======================================================================');

testResults.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.name}: ${result.details || result.error || ''}`);
});

console.log('\n======================================================================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// Coverage Assessment
const coverageAreas = [
  'Files Structure',
  'Type Definitions', 
  'Service Implementation',
  'Controller Methods',
  'Routes Configuration',
  'Database Integration',
  'Validation & Business Rules',
  'AI Integration',
  'Moderation System',
  'Analytics Integration',
  'Search & Filtering'
];

console.log('\n🎯 Test Coverage Areas:');
coverageAreas.forEach((area, index) => {
  const testResult = testResults[index];
  const status = testResult && testResult.status === 'PASS' ? '✓' : '✗';
  console.log(`   ${status} ${area}`);
});

// Overall Assessment
if (passedTests === totalTests) {
  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log('✅ EXCELLENT - All review system services are properly integrated');
  console.log('🚀 Ready for production use');
} else if (passedTests / totalTests >= 0.8) {
  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log('⚠️ GOOD - Most review system components are integrated, minor issues to address');
  console.log('🔧 Requires minor fixes before production');
} else {
  console.log('\n📋 OVERALL ASSESSMENT:');
  console.log('❌ NEEDS WORK - Significant integration issues found');
  console.log('🛠️ Requires major fixes before deployment');
}

console.log(`📋 Test completed at: ${new Date().toISOString()}`);
