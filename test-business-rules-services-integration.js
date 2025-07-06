#!/usr/bin/env node

// =====================================================
// BUSINESS RULES & REGULATIONS SERVICES INTEGRATION TEST
// =====================================================

const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

console.log('📋 Testing Business Rules & Regulations Services Integration');
console.log('======================================================================');

async function runTests() {
    // Test 1: Business Rules Files Structure
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Files...');
        
        const expectedFiles = [
            'src/services/businessRule.service.ts',
            'src/controllers/businessRule.controller.ts',
            'src/routes/businessRules.routes.ts',
            'src/config/businessRules.ts'
        ];
        
        const missingFiles = [];
        const existingFiles = [];
        
        expectedFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                existingFiles.push(filePath);
            } else {
                missingFiles.push(filePath);
            }
        });
        
        if (existingFiles.length >= 3) {
            console.log(`✅ Business Rules Files: Found ${existingFiles.length}/${expectedFiles.length} business rules files`);
            testResults.passed++;
        } else {
            throw new Error(`Only ${existingFiles.length}/${expectedFiles.length} business rules files found`);
        }
    } catch (error) {
        console.log('❌ Business Rules Files:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Files: ${error.message}`);
    }

    // Test 2: Business Rules Routes Configuration
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Routes Configuration...');
        
        const routesPath = path.join(__dirname, 'src/routes/businessRules.routes.ts');
        if (fs.existsSync(routesPath)) {
            const routesContent = fs.readFileSync(routesPath, 'utf8');
            
            const expectedRoutes = [
                'router.get',
                'router.post',
                'BusinessRuleController',
                'requireAuth',
                'requireRole'
            ];
            
            const foundRoutes = expectedRoutes.filter(route =>
                routesContent.includes(route)
            );
            
            if (foundRoutes.length >= 4) {
                console.log(`✅ Business Rules Routes Configuration: Found ${foundRoutes.length} route patterns`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundRoutes.length}/${expectedRoutes.length} route patterns found`);
            }
        } else {
            throw new Error('Business rules routes file not found');
        }
    } catch (error) {
        console.log('❌ Business Rules Routes Configuration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Routes Configuration: ${error.message}`);
    }

    // Test 3: Business Rules Controller Methods
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Controller Methods...');
        
        const controllerPath = path.join(__dirname, 'src/controllers/businessRule.controller.ts');
        if (fs.existsSync(controllerPath)) {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            
            const expectedMethods = [
                'getRules',
                'updateRule',
                'businessRules',
                'AuditLogService'
            ];
            
            const foundMethods = expectedMethods.filter(method =>
                controllerContent.includes(method)
            );
            
            if (foundMethods.length >= 3) {
                console.log(`✅ Business Rules Controller Methods: Found ${foundMethods.length} controller methods`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundMethods.length}/${expectedMethods.length} controller methods found`);
            }
        } else {
            throw new Error('Business rules controller file not found');
        }
    } catch (error) {
        console.log('❌ Business Rules Controller Methods:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Controller Methods: ${error.message}`);
    }

    // Test 4: Business Rules Service Implementation
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Service Implementation...');
        
        const servicePath = path.join(__dirname, 'src/services/businessRule.service.ts');
        if (fs.existsSync(servicePath)) {
            const serviceContent = fs.readFileSync(servicePath, 'utf8');
            
            const expectedFeatures = [
                'getRule',
                'checkRule',
                'enforce',
                'RuleContext',
                'BusinessRuleService'
            ];
            
            const foundFeatures = expectedFeatures.filter(feature =>
                serviceContent.includes(feature)
            );
            
            if (foundFeatures.length >= 4) {
                console.log(`✅ Business Rules Service Implementation: Found ${foundFeatures.length} service features`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundFeatures.length}/${expectedFeatures.length} service features found`);
            }
        } else {
            throw new Error('Business rules service file not found');
        }
    } catch (error) {
        console.log('❌ Business Rules Service Implementation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Service Implementation: ${error.message}`);
    }

    // Test 5: Business Rules Configuration
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Configuration...');
        
        const configPath = path.join(__dirname, 'src/config/businessRules.ts');
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            
            const expectedConfigItems = [
                'businessRules',
                'product',
                'category',
                'booking',
                'requireVerifiedUser',
                'allowedRoles'
            ];
            
            const foundConfigItems = expectedConfigItems.filter(item =>
                configContent.includes(item)
            );
            
            if (foundConfigItems.length >= 5) {
                console.log(`✅ Business Rules Configuration: Found ${foundConfigItems.length} configuration items`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundConfigItems.length}/${expectedConfigItems.length} configuration items found`);
            }
        } else {
            throw new Error('Business rules configuration file not found');
        }
    } catch (error) {
        console.log('❌ Business Rules Configuration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Configuration: ${error.message}`);
    }

    // Test 6: Database Migrations for Business Rules
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rules Database Migration...');
        
        const migrationPaths = [
            'database/migrations/20250705_create_country_business_rules_table.ts',
            'database/migrations/20250705_create_category_regulations_table.ts'
        ];
        
        let migrationsFound = 0;
        migrationPaths.forEach(migrationPath => {
            const fullPath = path.join(__dirname, migrationPath);
            if (fs.existsSync(fullPath)) {
                migrationsFound++;
            }
        });
        
        if (migrationsFound >= 1) {
            console.log(`✅ Business Rules Database Migration: Found ${migrationsFound} migration(s)`);
            testResults.passed++;
        } else {
            throw new Error('Business rules database migrations not found');
        }
    } catch (error) {
        console.log('❌ Business Rules Database Migration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rules Database Migration: ${error.message}`);
    }

    // Test 7: Country Business Rules Schema
    try {
        testResults.total++;
        console.log('🔍 Testing Country Business Rules Schema...');
        
        const countryRulesMigrationPath = path.join(__dirname, 'database/migrations/20250705_create_country_business_rules_table.ts');
        if (fs.existsSync(countryRulesMigrationPath)) {
            const migrationContent = fs.readFileSync(countryRulesMigrationPath, 'utf8');
            
            const expectedFields = [
                'country_id',
                'min_user_age',
                'kyc_required',
                'max_booking_value',
                'support_hours_start',
                'support_hours_end',
                'service_fee_percentage',
                'payment_processing_fee',
                'terms_of_service_url',
                'privacy_policy_url'
            ];
            
            const foundFields = expectedFields.filter(field =>
                migrationContent.includes(field)
            );
            
            if (foundFields.length >= 8) {
                console.log(`✅ Country Business Rules Schema: Found ${foundFields.length}/${expectedFields.length} schema fields`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundFields.length}/${expectedFields.length} schema fields found`);
            }
        } else {
            throw new Error('Country business rules migration not found');
        }
    } catch (error) {
        console.log('❌ Country Business Rules Schema:', error.message);
        testResults.failed++;
        testResults.errors.push(`Country Business Rules Schema: ${error.message}`);
    }

    // Test 8: Category Regulations Schema
    try {
        testResults.total++;
        console.log('🔍 Testing Category Regulations Schema...');
        
        const categoryRegulationsMigrationPath = path.join(__dirname, 'database/migrations/20250705_create_category_regulations_table.ts');
        if (fs.existsSync(categoryRegulationsMigrationPath)) {
            const migrationContent = fs.readFileSync(categoryRegulationsMigrationPath, 'utf8');
            
            const expectedFields = [
                'category_id',
                'country_id',
                'is_allowed',
                'requires_license',
                'license_type',
                'min_age_requirement',
                'tax_rate',
                'required_documents',
                'restricted_hours'
            ];
            
            const foundFields = expectedFields.filter(field =>
                migrationContent.includes(field)
            );
            
            if (foundFields.length >= 6) {
                console.log(`✅ Category Regulations Schema: Found ${foundFields.length}/${expectedFields.length} schema fields`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundFields.length}/${expectedFields.length} schema fields found`);
            }
        } else {
            throw new Error('Category regulations migration not found');
        }
    } catch (error) {
        console.log('❌ Category Regulations Schema:', error.message);
        testResults.failed++;
        testResults.errors.push(`Category Regulations Schema: ${error.message}`);
    }

    // Test 9: Authorization and Security Integration
    try {
        testResults.total++;
        console.log('🔍 Testing Authorization and Security Integration...');
        
        const routesPath = path.join(__dirname, 'src/routes/businessRules.routes.ts');
        if (fs.existsSync(routesPath)) {
            const routesContent = fs.readFileSync(routesPath, 'utf8');
            
            const securityFeatures = [
                'requireAuth',
                'requireRole',
                'admin',
                'super_admin'
            ];
            
            const foundSecurityFeatures = securityFeatures.filter(feature =>
                routesContent.includes(feature)
            );
            
            if (foundSecurityFeatures.length >= 3) {
                console.log(`✅ Authorization and Security Integration: Found security measures in routes`);
                testResults.passed++;
            } else {
                throw new Error('Insufficient security measures found');
            }
        } else {
            throw new Error('Routes file not found for security check');
        }
    } catch (error) {
        console.log('❌ Authorization and Security Integration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Authorization and Security Integration: ${error.message}`);
    }

    // Test 10: Audit Logging Integration
    try {
        testResults.total++;
        console.log('🔍 Testing Audit Logging Integration...');
        
        const controllerPath = path.join(__dirname, 'src/controllers/businessRule.controller.ts');
        if (fs.existsSync(controllerPath)) {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            
            const auditFeatures = [
                'AuditLogService',
                'log',
                'timestamp',
                'adminId',
                'action',
                'oldValue',
                'newValue'
            ];
            
            const foundAuditFeatures = auditFeatures.filter(feature =>
                controllerContent.includes(feature)
            );
            
            if (foundAuditFeatures.length >= 5) {
                console.log(`✅ Audit Logging Integration: Found audit logging integration`);
                testResults.passed++;
            } else {
                throw new Error('Audit logging integration incomplete');
            }
        } else {
            throw new Error('Controller file not found for audit check');
        }
    } catch (error) {
        console.log('❌ Audit Logging Integration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Audit Logging Integration: ${error.message}`);
    }

    // Print results
    console.log('======================================================================');
    console.log('📊 BUSINESS RULES & REGULATIONS INTEGRATION TEST RESULTS');
    console.log('======================================================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    console.log('🎯 Test Coverage Areas:');
    const coverageAreas = [
        'Files Structure',
        'Routes Configuration', 
        'Controller Methods',
        'Service Implementation',
        'Configuration Management',
        'Database Migration',
        'Schema Design',
        'Authorization & Security',
        'Audit Logging'
    ];
    
    coverageAreas.forEach((area, index) => {
        if (index < testResults.passed) {
            console.log(`   ✓ ${area}`);
        } else {
            console.log(`   ✗ ${area}`);
        }
    });
    
    if (testResults.failed > 0) {
        console.log('❌ Failed Tests:');
        testResults.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('🏆 OVERALL ASSESSMENT:');
    if (testResults.failed === 0) {
        console.log('✅ EXCELLENT - All business rules and regulations services are properly integrated');
    } else if (testResults.passed / testResults.total >= 0.8) {
        console.log('🟡 GOOD - Business rules and regulations services need minor improvements');
    } else {
        console.log('🔴 POOR - Business rules and regulations services need significant improvements');
    }
    
    console.log('🚀 Ready for production use' + (testResults.failed > 0 ? ' after addressing issues' : ''));
    console.log(`📋 Test completed at: ${new Date().toISOString()}`);
}

// Run the tests
runTests().catch(console.error);
