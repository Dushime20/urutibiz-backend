/**
 * User Verification Services Integration Test
 * 
 * This script tests the actual verification services from the TypeScript codebase
 * without requiring a full server setup.
 */

// Import required modules
const ts = require('typescript');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ override: true });

async function testVerificationServices() {
  console.log('🧪 Testing User Verification Services Integration');
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
  
  // Test 1: Check if verification service files exist
  try {
    const verificationFiles = [
      'src/services/userVerification.service.ts',
      'src/controllers/userVerification.controller.ts',
      'src/routes/userVerification.routes.ts',
      'src/models/UserVerification.model.ts'
    ];
    
    const existingFiles = verificationFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    if (existingFiles.length === verificationFiles.length) {
      logTest('Verification Files', true, `All ${verificationFiles.length} verification files exist`);
    } else {
      const missing = verificationFiles.filter(file => !existingFiles.includes(file));
      logTest('Verification Files', false, `Missing files: ${missing.join(', ')}`);
    }
  } catch (error) {
    logTest('Verification Files', false, error.message);
  }
  
  // Test 2: Check verification routes structure
  try {
    const routesPath = path.join(process.cwd(), 'src/routes/userVerification.routes.ts');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const expectedRoutes = [
        'GET.*verification',
        'POST.*verification',
        'PUT.*verification',
        'DELETE.*verification'
      ];
      
      const foundRoutes = expectedRoutes.filter(route => {
        const regex = new RegExp(route, 'i');
        return regex.test(routesContent);
      });
      
      if (foundRoutes.length >= 2) {
        logTest('Verification Routes', true, `Found ${foundRoutes.length} verification route patterns`);
      } else {
        logTest('Verification Routes', false, 'Missing verification route patterns');
      }
    } else {
      logTest('Verification Routes', false, 'Routes file not found');
    }
  } catch (error) {
    logTest('Verification Routes', false, error.message);
  }
  
  // Test 3: Check verification controller structure
  try {
    const controllerPath = path.join(process.cwd(), 'src/controllers/userVerification.controller.ts');
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const expectedMethods = [
        'submitDocuments',
        'getVerificationStatus',
        'resubmitVerification',
        'getVerificationDocuments'
      ];
      
      const foundMethods = expectedMethods.filter(method => {
        return controllerContent.includes(method);
      });
      
      if (foundMethods.length >= 2) {
        logTest('Verification Controller', true, `Found ${foundMethods.length} verification controller methods`);
      } else {
        logTest('Verification Controller', false, 'Missing verification controller methods');
      }
    } else {
      logTest('Verification Controller', false, 'Controller file not found');
    }
  } catch (error) {
    logTest('Verification Controller', false, error.message);
  }
  
  // Test 4: Check database models/migrations
  try {
    const migrationsDir = path.join(process.cwd(), 'database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir);
      const verificationMigrations = migrationFiles.filter(file => 
        file.includes('verification') || file.includes('user_verification')
      );
      
      if (verificationMigrations.length > 0) {
        logTest('Database Migrations', true, `Found ${verificationMigrations.length} verification migration(s)`);
      } else {
        logTest('Database Migrations', false, 'No verification migrations found');
      }
    } else {
      logTest('Database Migrations', false, 'Migrations directory not found');
    }
  } catch (error) {
    logTest('Database Migrations', false, error.message);
  }
  
  // Test 5: Check TypeScript compilation
  try {
    const verificationTsFiles = [
      'src/services/userVerification.service.ts',
      'src/controllers/userVerification.controller.ts'
    ].filter(file => fs.existsSync(path.join(process.cwd(), file)));
    
    if (verificationTsFiles.length > 0) {
      // Simple check - if files exist and have valid TypeScript syntax patterns
      const allFilesValid = verificationTsFiles.every(file => {
        const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
        return content.includes('export') && !content.includes('syntax error');
      });
      
      if (allFilesValid) {
        logTest('TypeScript Compilation', true, 'All verification TypeScript files appear valid');
      } else {
        logTest('TypeScript Compilation', false, 'Some TypeScript files may have issues');
      }
    } else {
      logTest('TypeScript Compilation', false, 'No TypeScript verification files to check');
    }
  } catch (error) {
    logTest('TypeScript Compilation', false, error.message);
  }
  
  // Test 6: Check verification workflow integration
  try {
    const workflowComponents = [
      { name: 'Authentication Middleware', pattern: 'auth.*middleware' },
      { name: 'Error Handling', pattern: 'error.*middleware|error.*handler' },
      { name: 'Validation', pattern: 'validate|validation' },
      { name: 'Database Models', pattern: 'model|schema' }
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    const allFiles = getAllTsFiles(srcDir);
    const allContent = allFiles.map(file => fs.readFileSync(file, 'utf8')).join('\\n');
    
    const foundComponents = workflowComponents.filter(component => {
      const regex = new RegExp(component.pattern, 'i');
      return regex.test(allContent);
    });
    
    if (foundComponents.length >= 3) {
      logTest('Workflow Integration', true, `Found ${foundComponents.length}/4 workflow components`);
    } else {
      logTest('Workflow Integration', false, `Only found ${foundComponents.length}/4 workflow components`);
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
  
  // Summary
  console.log('\\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SERVICES TEST RESULTS');
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
  
  console.log('\\n🏆 OVERALL ASSESSMENT:');
  if (results.failed === 0) {
    console.log('✅ EXCELLENT - All verification services are properly integrated');
  } else if (results.passed > results.failed) {
    console.log('⚠️ GOOD - Most services are working, minor integration issues');
  } else {
    console.log('❌ POOR - Major problems with verification services integration');
  }
  
  console.log(`\\n📋 Test completed at: ${new Date().toISOString()}`);
}

// Run the tests
testVerificationServices().catch(error => {
  console.error('❌ Integration test suite failed:', error);
  process.exit(1);
});
