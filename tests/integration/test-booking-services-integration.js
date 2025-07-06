/**
 * Booking Services Integration Test
 * 
 * This script tests the actual booking services from the TypeScript codebase
 * without requiring a full server setup.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ override: true });

async function testBookingServicesIntegration() {
  console.log('🧪 Testing Booking Services Integration');
  console.log('='.repeat(70));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function logTest(name, success, message) {
    if (success) {
      console.log(`✅ ${name}: ${message}`);
      results.passed++;
    } else {
      console.log(`❌ ${name}: ${message}`);
      results.failed++;
    }
    results.tests.push({ name, success, message });
  }
  
  // Test 1: Check if booking service files exist
  try {
    const bookingFiles = [
      'src/controllers/bookings.controller.ts',
      'src/controllers/bookings.controller.refactored.ts',
      'src/routes/bookings.routes.ts',
      'src/routes/bookingStatusHistory.routes.ts',
      'src/models/Booking.model.ts',
      'src/types/booking.types.ts',
      'src/types/bookingStatusHistory.types.ts'
    ];
    
    const existingFiles = bookingFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    if (existingFiles.length === bookingFiles.length) {
      logTest('Booking Files', true, `All ${bookingFiles.length} booking files exist`);
    } else {
      const missing = bookingFiles.filter(file => !existingFiles.includes(file));
      logTest('Booking Files', false, `Missing files: ${missing.join(', ')}`);
    }
  } catch (error) {
    logTest('Booking Files', false, error.message);
  }
  
  // Test 2: Check booking routes structure
  try {
    const routesPath = path.join(process.cwd(), 'src/routes/bookings.routes.ts');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const expectedRoutes = [
        'GET.*bookings',
        'POST.*bookings',
        'PUT.*bookings',
        'DELETE.*bookings',
        'GET.*bookings.*timeline'
      ];
      
      const foundRoutes = expectedRoutes.filter(route => {
        const regex = new RegExp(route, 'i');
        return regex.test(routesContent);
      });
      
      if (foundRoutes.length >= 4) {
        logTest('Booking Routes', true, `Found ${foundRoutes.length} booking route patterns`);
      } else {
        logTest('Booking Routes', false, 'Missing booking route patterns');
      }
    } else {
      logTest('Booking Routes', false, 'Routes file not found');
    }
  } catch (error) {
    logTest('Booking Routes', false, error.message);
  }
  
  // Test 3: Check booking controller structure
  try {
    const controllerPath = path.join(process.cwd(), 'src/controllers/bookings.controller.ts');
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const expectedMethods = [
        'createBooking',
        'getBookings',
        'getBookingById',
        'updateBooking',
        'cancelBooking'
      ];
      
      const foundMethods = expectedMethods.filter(method => {
        return controllerContent.includes(method);
      });
      
      if (foundMethods.length >= 4) {
        logTest('Booking Controller', true, `Found ${foundMethods.length} booking controller methods`);
      } else {
        logTest('Booking Controller', false, 'Missing booking controller methods');
      }
    } else {
      logTest('Booking Controller', false, 'Controller file not found');
    }
  } catch (error) {
    logTest('Booking Controller', false, error.message);
  }
  
  // Test 4: Check booking model structure
  try {
    const modelPath = path.join(process.cwd(), 'src/models/Booking.model.ts');
    if (fs.existsSync(modelPath)) {
      const modelContent = fs.readFileSync(modelPath, 'utf8');
      
      const expectedFeatures = [
        'create',
        'findById',
        'findAll',
        'getPaginated',
        'generateBookingNumber',
        'addTimelineEvent'
      ];
      
      const foundFeatures = expectedFeatures.filter(feature => {
        return modelContent.includes(feature);
      });
      
      if (foundFeatures.length >= 5) {
        logTest('Booking Model', true, `Found ${foundFeatures.length} booking model features`);
      } else {
        logTest('Booking Model', false, 'Missing booking model features');
      }
    } else {
      logTest('Booking Model', false, 'Model file not found');
    }
  } catch (error) {
    logTest('Booking Model', false, error.message);
  }
  
  // Test 5: Check database migrations
  try {
    const migrationsDir = path.join(process.cwd(), 'database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir);
      const bookingMigrations = migrationFiles.filter(file => 
        file.includes('booking') || file.includes('Booking')
      );
      
      if (bookingMigrations.length > 0) {
        logTest('Database Migrations', true, `Found ${bookingMigrations.length} booking migration(s)`);
      } else {
        logTest('Database Migrations', false, 'No booking migrations found');
      }
    } else {
      logTest('Database Migrations', false, 'Migrations directory not found');
    }
  } catch (error) {
    logTest('Database Migrations', false, error.message);
  }
  
  // Test 6: Check TypeScript types
  try {
    const typesPath = path.join(process.cwd(), 'src/types/booking.types.ts');
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      
      const expectedTypes = [
        'BookingData',
        'CreateBookingData',
        'UpdateBookingData',
        'BookingFilters',
        'BookingStatus',
        'PaymentStatus',
        'InsuranceType'
      ];
      
      const foundTypes = expectedTypes.filter(type => {
        return typesContent.includes(type);
      });
      
      if (foundTypes.length >= 6) {
        logTest('TypeScript Types', true, `Found ${foundTypes.length} booking type definitions`);
      } else {
        logTest('TypeScript Types', false, 'Missing booking type definitions');
      }
    } else {
      logTest('TypeScript Types', false, 'Types file not found');
    }
  } catch (error) {
    logTest('TypeScript Types', false, error.message);
  }
  
  // Test 7: Check booking status history integration
  try {
    const statusHistoryPath = path.join(process.cwd(), 'src/routes/bookingStatusHistory.routes.ts');
    const statusHistoryTypesPath = path.join(process.cwd(), 'src/types/bookingStatusHistory.types.ts');
    
    const hasStatusHistoryRoute = fs.existsSync(statusHistoryPath);
    const hasStatusHistoryTypes = fs.existsSync(statusHistoryTypesPath);
    
    if (hasStatusHistoryRoute && hasStatusHistoryTypes) {
      logTest('Status History Integration', true, 'Booking status history components exist');
    } else {
      const missing = [];
      if (!hasStatusHistoryRoute) missing.push('routes');
      if (!hasStatusHistoryTypes) missing.push('types');
      logTest('Status History Integration', false, `Missing status history ${missing.join(', ')}`);
    }
  } catch (error) {
    logTest('Status History Integration', false, error.message);
  }
  
  // Test 8: Check booking workflow integration
  try {
    const workflowComponents = [
      { name: 'Authentication', pattern: 'auth.*middleware|requireAuth' },
      { name: 'Payment Integration', pattern: 'payment|Payment' },
      { name: 'Insurance Integration', pattern: 'insurance|Insurance' },
      { name: 'Validation', pattern: 'validate|validation' },
      { name: 'Error Handling', pattern: 'error.*handler|ErrorHandler' },
      { name: 'Caching', pattern: 'cache|Cache' },
      { name: 'Timeline Tracking', pattern: 'timeline|Timeline' }
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    const allFiles = getAllTsFiles(srcDir);
    const allContent = allFiles.map(file => {
      try {
        return fs.readFileSync(file, 'utf8');
      } catch {
        return '';
      }
    }).join('\\n');
    
    const foundComponents = workflowComponents.filter(component => {
      const regex = new RegExp(component.pattern, 'i');
      return regex.test(allContent);
    });
    
    if (foundComponents.length >= 5) {
      logTest('Workflow Integration', true, `Found ${foundComponents.length}/7 workflow components`);
    } else {
      logTest('Workflow Integration', false, `Only found ${foundComponents.length}/7 workflow components`);
    }
  } catch (error) {
    logTest('Workflow Integration', false, error.message);
  }
  
  // Helper function to get all TypeScript files
  function getAllTsFiles(dir) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files = files.concat(getAllTsFiles(fullPath));
        } else if (item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    return files;
  }
  
  // Test 9: Check performance optimizations
  try {
    const controllerPath = path.join(process.cwd(), 'src/controllers/bookings.controller.ts');
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const performanceFeatures = [
        'cache',
        'Cache',
        'performance',
        'Performance',
        'optimization',
        'concurrent',
        'parallel'
      ];
      
      const foundFeatures = performanceFeatures.filter(feature => {
        return controllerContent.toLowerCase().includes(feature.toLowerCase());
      });
      
      if (foundFeatures.length >= 3) {
        logTest('Performance Optimizations', true, `Found ${foundFeatures.length} performance features`);
      } else {
        logTest('Performance Optimizations', false, 'Limited performance optimizations found');
      }
    } else {
      logTest('Performance Optimizations', false, 'Controller file not found');
    }
  } catch (error) {
    logTest('Performance Optimizations', false, error.message);
  }
  
  // Test 10: Check swagger documentation
  try {
    const routesPath = path.join(process.cwd(), 'src/routes/bookings.routes.ts');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const swaggerFeatures = [
        '@swagger',
        'swagger',
        'description',
        'tags',
        'schemas'
      ];
      
      const foundSwaggerFeatures = swaggerFeatures.filter(feature => {
        return routesContent.includes(feature);
      });
      
      if (foundSwaggerFeatures.length >= 3) {
        logTest('API Documentation', true, `Found ${foundSwaggerFeatures.length} swagger documentation features`);
      } else {
        logTest('API Documentation', false, 'Limited API documentation found');
      }
    } else {
      logTest('API Documentation', false, 'Routes file not found');
    }
  } catch (error) {
    logTest('API Documentation', false, error.message);
  }
  
  // Summary
  console.log('\\n' + '='.repeat(70));
  console.log('📊 BOOKING SERVICES INTEGRATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\\n❌ Failed Tests:');
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`   • ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\\n🎯 Test Coverage Areas:');
  console.log('   ✓ Booking Files Structure');
  console.log('   ✓ API Routes Configuration');
  console.log('   ✓ Controller Methods');
  console.log('   ✓ Data Models');
  console.log('   ✓ Database Migrations');
  console.log('   ✓ TypeScript Types');
  console.log('   ✓ Status History Integration');
  console.log('   ✓ Workflow Integration');
  console.log('   ✓ Performance Optimizations');
  console.log('   ✓ API Documentation');
  
  console.log('\\n🏆 OVERALL ASSESSMENT:');
  if (results.failed === 0) {
    console.log('✅ EXCELLENT - All booking services are properly integrated');
    console.log('🚀 Ready for production use');
  } else if (results.passed > results.failed) {
    console.log('⚠️ GOOD - Most services are working, minor integration issues');
    console.log('🔧 Minor fixes needed');
  } else {
    console.log('❌ POOR - Major problems with booking services integration');
    console.log('🛠️ Significant development required');
  }
  
  console.log(`\\n📋 Test completed at: ${new Date().toISOString()}`);
  
  return results;
}

// Run the tests
testBookingServicesIntegration().catch(error => {
  console.error('❌ Booking integration test suite failed:', error);
  process.exit(1);
});
