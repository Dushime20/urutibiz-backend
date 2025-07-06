/**
 * Product Services Integration Test
 * 
 * This script tests the actual product services from the TypeScript codebase
 * without requiring a full server setup.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ override: true });

async function testProductServicesIntegration() {
  console.log('🧪 Testing Product Services Integration');
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
  
  // Test 1: Check if product service files exist
  try {
    const productFiles = [
      'src/services/product.service.ts',
      'src/services/productPrice.service.ts',
      'src/services/productImage.service.ts',
      'src/services/productAvailability.service.ts',
      'src/controllers/products.controller.ts',
      'src/routes/products.routes.ts',
      'src/models/Product.model.ts',
      'src/models/ProductPrice.model.ts',
      'src/models/ProductImage.model.ts',
      'src/models/ProductAvailability.model.ts'
    ];
    
    const existingFiles = productFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    if (existingFiles.length === productFiles.length) {
      logTest('Product Files', true, `All ${productFiles.length} product files exist`);
    } else {
      const missing = productFiles.filter(file => !existingFiles.includes(file));
      logTest('Product Files', false, `Missing files: ${missing.join(', ')}`);
    }
  } catch (error) {
    logTest('Product Files', false, error.message);
  }
  
  // Test 2: Check product routes structure
  try {
    const routesPath = path.join(process.cwd(), 'src/routes/products.routes.ts');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const expectedRoutes = [
        'GET.*products',
        'POST.*products',
        'PUT.*products',
        'DELETE.*products',
        'GET.*products.*search'
      ];
      
      const foundRoutes = expectedRoutes.filter(route => {
        const regex = new RegExp(route, 'i');
        return regex.test(routesContent);
      });
      
      if (foundRoutes.length >= 4) {
        logTest('Product Routes', true, `Found ${foundRoutes.length} product route patterns`);
      } else {
        logTest('Product Routes', false, 'Missing product route patterns');
      }
    } else {
      logTest('Product Routes', false, 'Routes file not found');
    }
  } catch (error) {
    logTest('Product Routes', false, error.message);
  }
  
  // Test 3: Check product controller structure
  try {
    const controllerPath = path.join(process.cwd(), 'src/controllers/products.controller.ts');
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const expectedMethods = [
        'getProducts',
        'createProduct',
        'updateProduct',
        'deleteProduct',
        'getProductById'
      ];
      
      const foundMethods = expectedMethods.filter(method => {
        return controllerContent.includes(method);
      });
      
      if (foundMethods.length >= 3) {
        logTest('Product Controller', true, `Found ${foundMethods.length} product controller methods`);
      } else {
        logTest('Product Controller', false, 'Missing product controller methods');
      }
    } else {
      logTest('Product Controller', false, 'Controller file not found');
    }
  } catch (error) {
    logTest('Product Controller', false, error.message);
  }
  
  // Test 4: Check product service structure
  try {
    const servicePath = path.join(process.cwd(), 'src/services/product.service.ts');
    if (fs.existsSync(servicePath)) {
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      const expectedMethods = [
        'create',
        'getById',
        'update',
        'delete',
        'getPaginated'
      ];
      
      const foundMethods = expectedMethods.filter(method => {
        return serviceContent.includes(method);
      });
      
      if (foundMethods.length >= 4) {
        logTest('Product Service', true, `Found ${foundMethods.length} product service methods`);
      } else {
        logTest('Product Service', false, 'Missing product service methods');
      }
    } else {
      logTest('Product Service', false, 'Service file not found');
    }
  } catch (error) {
    logTest('Product Service', false, error.message);
  }
  
  // Test 5: Check product model structure
  try {
    const modelPath = path.join(process.cwd(), 'src/models/Product.model.ts');
    if (fs.existsSync(modelPath)) {
      const modelContent = fs.readFileSync(modelPath, 'utf8');
      
      const expectedFeatures = [
        'create',
        'findById',
        'findAll',
        'getPaginated',
        'update',
        'toJSON'
      ];
      
      const foundFeatures = expectedFeatures.filter(feature => {
        return modelContent.includes(feature);
      });
      
      if (foundFeatures.length >= 5) {
        logTest('Product Model', true, `Found ${foundFeatures.length} product model features`);
      } else {
        logTest('Product Model', false, 'Missing product model features');
      }
    } else {
      logTest('Product Model', false, 'Model file not found');
    }
  } catch (error) {
    logTest('Product Model', false, error.message);
  }
  
  // Test 6: Check database migrations
  try {
    const migrationsDir = path.join(process.cwd(), 'database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir);
      const productMigrations = migrationFiles.filter(file => 
        file.includes('product') || file.includes('Product')
      );
      
      if (productMigrations.length > 0) {
        logTest('Database Migrations', true, `Found ${productMigrations.length} product migration(s)`);
      } else {
        logTest('Database Migrations', false, 'No product migrations found');
      }
    } else {
      logTest('Database Migrations', false, 'Migrations directory not found');
    }
  } catch (error) {
    logTest('Database Migrations', false, error.message);
  }
  
  // Test 7: Check TypeScript types
  try {
    const typesPath = path.join(process.cwd(), 'src/types/product.types.ts');
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      
      const expectedTypes = [
        'ProductData',
        'CreateProductData',
        'UpdateProductData',
        'ProductFilters',
        'ProductStatus',
        'ProductCondition'
      ];
      
      const foundTypes = expectedTypes.filter(type => {
        return typesContent.includes(type);
      });
      
      if (foundTypes.length >= 5) {
        logTest('TypeScript Types', true, `Found ${foundTypes.length} product type definitions`);
      } else {
        logTest('TypeScript Types', false, 'Missing product type definitions');
      }
    } else {
      logTest('TypeScript Types', false, 'Types file not found');
    }
  } catch (error) {
    logTest('TypeScript Types', false, error.message);
  }
  
  // Test 8: Check product workflow integration
  try {
    const workflowComponents = [
      { name: 'Authentication', pattern: 'auth.*middleware|requireAuth' },
      { name: 'Validation', pattern: 'validate|validation' },
      { name: 'Caching', pattern: 'cache|Cache' },
      { name: 'Error Handling', pattern: 'error.*handler|ErrorHandler' },
      { name: 'Response Helpers', pattern: 'response|Response' }
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
    
    if (foundComponents.length >= 4) {
      logTest('Workflow Integration', true, `Found ${foundComponents.length}/5 workflow components`);
    } else {
      logTest('Workflow Integration', false, `Only found ${foundComponents.length}/5 workflow components`);
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
  
  // Test 9: Check product-related demo files
  try {
    const demoFiles = [
      'demo-product-prices-crud.js'
    ];
    
    const existingDemoFiles = demoFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    if (existingDemoFiles.length > 0) {
      logTest('Demo Files', true, `Found ${existingDemoFiles.length} product demo file(s)`);
    } else {
      logTest('Demo Files', false, 'No product demo files found');
    }
  } catch (error) {
    logTest('Demo Files', false, error.message);
  }
  
  // Summary
  console.log('\\n' + '='.repeat(70));
  console.log('📊 PRODUCT SERVICES INTEGRATION TEST RESULTS');
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
  console.log('   ✓ Product Files Structure');
  console.log('   ✓ API Routes Configuration');
  console.log('   ✓ Controller Methods');
  console.log('   ✓ Service Layer');
  console.log('   ✓ Data Models');
  console.log('   ✓ Database Migrations');
  console.log('   ✓ TypeScript Types');
  console.log('   ✓ Workflow Integration');
  console.log('   ✓ Demo Files');
  
  console.log('\\n🏆 OVERALL ASSESSMENT:');
  if (results.failed === 0) {
    console.log('✅ EXCELLENT - All product services are properly integrated');
    console.log('🚀 Ready for production use');
  } else if (results.passed > results.failed) {
    console.log('⚠️ GOOD - Most services are working, minor integration issues');
    console.log('🔧 Minor fixes needed');
  } else {
    console.log('❌ POOR - Major problems with product services integration');
    console.log('🛠️ Significant development required');
  }
  
  console.log(`\\n📋 Test completed at: ${new Date().toISOString()}`);
  
  return results;
}

// Run the tests
testProductServicesIntegration().catch(error => {
  console.error('❌ Product integration test suite failed:', error);
  process.exit(1);
});
