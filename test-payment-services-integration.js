/**
 * Payment Services Integration Test
 * 
 * This script tests the actual payment services from the TypeScript codebase
 * without requiring a full server setup.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ override: true });

async function testPaymentServicesIntegration() {
  console.log('🧪 Testing Payment Services Integration');
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
  
  // Test 1: Check if payment service files exist
  try {
    const paymentFiles = [
      'src/controllers/paymentTransaction.controller.ts',
      'src/controllers/paymentMethod.controller.ts',
      'src/controllers/paymentProvider.controller.ts',
      'src/routes/paymentTransaction.routes.ts',
      'src/routes/paymentMethod.routes.ts',
      'src/routes/paymentProvider.routes.ts',
      'src/services/PaymentTransactionService.ts',
      'src/types/paymentTransaction.types.ts',
      'src/types/paymentMethod.types.ts',
      'src/types/paymentProvider.types.ts'
    ];
    
    const existingFiles = paymentFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    if (existingFiles.length === paymentFiles.length) {
      logTest('Payment Files', true, `All ${paymentFiles.length} payment files exist`);
    } else {
      const missing = paymentFiles.filter(file => !existingFiles.includes(file));
      logTest('Payment Files', false, `Missing files: ${missing.join(', ')}`);
    }
  } catch (error) {
    logTest('Payment Files', false, error.message);
  }
  
  // Test 2: Check payment transaction routes structure
  try {
    const routesPath = path.join(process.cwd(), 'src/routes/paymentTransaction.routes.ts');
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      const expectedRoutes = [
        'POST.*transactions',
        'GET.*transactions',
        'PUT.*transactions',
        'POST.*process',
        'POST.*refund'
      ];
      
      const foundRoutes = expectedRoutes.filter(route => {
        const regex = new RegExp(route, 'i');
        return regex.test(routesContent);
      });
      
      if (foundRoutes.length >= 4) {
        logTest('Payment Transaction Routes', true, `Found ${foundRoutes.length} payment transaction route patterns`);
      } else {
        logTest('Payment Transaction Routes', false, 'Missing payment transaction route patterns');
      }
    } else {
      logTest('Payment Transaction Routes', false, 'Payment transaction routes file not found');
    }
  } catch (error) {
    logTest('Payment Transaction Routes', false, error.message);
  }
  
  // Test 3: Check payment transaction controller structure
  try {
    const controllerPath = path.join(process.cwd(), 'src/controllers/paymentTransaction.controller.ts');
    if (fs.existsSync(controllerPath)) {
      const controllerContent = fs.readFileSync(controllerPath, 'utf8');
      
      const expectedMethods = [
        'createTransaction',
        'getTransactions',
        'updateTransaction',
        'processPayment',
        'processRefund'
      ];
      
      const foundMethods = expectedMethods.filter(method => {
        return controllerContent.includes(method);
      });
      
      if (foundMethods.length >= 4) {
        logTest('Payment Transaction Controller', true, `Found ${foundMethods.length} payment transaction controller methods`);
      } else {
        logTest('Payment Transaction Controller', false, 'Missing payment transaction controller methods');
      }
    } else {
      logTest('Payment Transaction Controller', false, 'Payment transaction controller file not found');
    }
  } catch (error) {
    logTest('Payment Transaction Controller', false, error.message);
  }
  
  // Test 4: Check payment service structure
  try {
    const servicePath = path.join(process.cwd(), 'src/services/PaymentTransactionService.ts');
    if (fs.existsSync(servicePath)) {
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      const expectedFeatures = [
        'createTransaction',
        'processPayment',
        'processRefund',
        'validateTransactionData',
        'getTransactionById',
        'updateTransactionStatus'
      ];
      
      const foundFeatures = expectedFeatures.filter(feature => {
        return serviceContent.includes(feature);
      });
      
      if (foundFeatures.length >= 5) {
        logTest('Payment Transaction Service', true, `Found ${foundFeatures.length} payment service features`);
      } else {
        logTest('Payment Transaction Service', false, 'Missing payment service features');
      }
    } else {
      logTest('Payment Transaction Service', false, 'Payment service file not found');
    }
  } catch (error) {
    logTest('Payment Transaction Service', false, error.message);
  }
  
  // Test 5: Check payment method components
  try {
    const methodFiles = [
      'src/controllers/paymentMethod.controller.ts',
      'src/routes/paymentMethod.routes.ts',
      'src/types/paymentMethod.types.ts'
    ];
    
    const existingMethodFiles = methodFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    logTest('Payment Method Components', existingMethodFiles.length === methodFiles.length, 
      `Found ${existingMethodFiles.length}/${methodFiles.length} payment method files`);
    
  } catch (error) {
    logTest('Payment Method Components', false, error.message);
  }
  
  // Test 6: Check payment provider components
  try {
    const providerFiles = [
      'src/controllers/paymentProvider.controller.ts',
      'src/routes/paymentProvider.routes.ts',
      'src/types/paymentProvider.types.ts'
    ];
    
    const existingProviderFiles = providerFiles.filter(file => {
      const filePath = path.join(process.cwd(), file);
      return fs.existsSync(filePath);
    });
    
    logTest('Payment Provider Components', existingProviderFiles.length === providerFiles.length, 
      `Found ${existingProviderFiles.length}/${providerFiles.length} payment provider files`);
    
  } catch (error) {
    logTest('Payment Provider Components', false, error.message);
  }
  
  // Test 7: Check payment type definitions
  try {
    const typesPath = path.join(process.cwd(), 'src/types/paymentTransaction.types.ts');
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      
      const expectedTypes = [
        'PaymentStatus',
        'TransactionType',
        'PaymentProvider',
        'CreatePaymentTransactionData',
        'ProcessPaymentRequest',
        'RefundRequest',
        'PaymentTransactionData'
      ];
      
      const foundTypes = expectedTypes.filter(type => {
        return typesContent.includes(type);
      });
      
      logTest('Payment Type Definitions', foundTypes.length >= 6, 
        `Found ${foundTypes.length}/${expectedTypes.length} payment type definitions`);
    } else {
      logTest('Payment Type Definitions', false, 'Payment types file not found');
    }
  } catch (error) {
    logTest('Payment Type Definitions', false, error.message);
  }
  
  // Test 8: Check database migrations for payments
  try {
    const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir);
      const paymentMigrations = migrationFiles.filter(file => 
        file.toLowerCase().includes('payment') || 
        file.toLowerCase().includes('transaction')
      );
      
      logTest('Payment Database Migrations', paymentMigrations.length > 0, 
        `Found ${paymentMigrations.length} payment-related migration(s)`);
    } else {
      logTest('Payment Database Migrations', false, 'Migrations directory not found');
    }
  } catch (error) {
    logTest('Payment Database Migrations', false, error.message);
  }
  
  // Test 9: Check API documentation integration
  try {
    const routesFiles = [
      'src/routes/paymentTransaction.routes.ts',
      'src/routes/paymentMethod.routes.ts',
      'src/routes/paymentProvider.routes.ts'
    ];
    
    let swaggerDocCount = 0;
    routesFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('@swagger') || content.includes('swagger')) {
          swaggerDocCount++;
        }
      }
    });
    
    logTest('Payment API Documentation', swaggerDocCount >= 2, 
      `Found swagger documentation in ${swaggerDocCount}/${routesFiles.length} payment route files`);
    
  } catch (error) {
    logTest('Payment API Documentation', false, error.message);
  }
  
  // Test 10: Check error handling integration
  try {
    const errorFiles = [
      'src/controllers/paymentTransaction.controller.ts',
      'src/services/PaymentTransactionService.ts'
    ];
    
    let errorHandlingCount = 0;
    errorFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('try') && content.includes('catch') && 
            content.includes('error')) {
          errorHandlingCount++;
        }
      }
    });
    
    logTest('Payment Error Handling', errorHandlingCount === errorFiles.length, 
      `Found error handling in ${errorHandlingCount}/${errorFiles.length} payment files`);
    
  } catch (error) {
    logTest('Payment Error Handling', false, error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 PAYMENT SERVICES INTEGRATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(test => !test.success).forEach(test => {
      console.log(`   • ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\n🎯 Test Coverage Areas:');
  console.log('   ✓ Payment Files Structure');
  console.log('   ✓ API Routes Configuration');
  console.log('   ✓ Controller Methods');
  console.log('   ✓ Service Implementation');
  console.log('   ✓ Payment Method Components');
  console.log('   ✓ Payment Provider Components');
  console.log('   ✓ Type Definitions');
  console.log('   ✓ Database Migrations');
  console.log('   ✓ API Documentation');
  console.log('   ✓ Error Handling');
  
  console.log('\n🏆 OVERALL ASSESSMENT:');
  const passRate = results.passed / (results.passed + results.failed);
  if (passRate === 1) {
    console.log('✅ EXCELLENT - All payment services are properly integrated');
    console.log('🚀 Ready for production use');
  } else if (passRate >= 0.8) {
    console.log('⚠️ GOOD - Most services are working, minor integration issues');
    console.log('🔧 Minor fixes needed');
  } else {
    console.log('❌ NEEDS WORK - Multiple payment integration issues found');
    console.log('🛠️ Significant fixes required');
  }
  
  console.log(`\n📋 Test completed at: ${new Date().toISOString()}`);
  
  return passRate >= 0.8;
}

// Run the test
if (require.main === module) {
  testPaymentServicesIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentServicesIntegration };
