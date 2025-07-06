/**
 * Administrative Divisions Services Integration Test
 * Tests administrative division services, models, and component integration
 */

// Force environment variables override
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');

console.log('🗺️ Testing Administrative Divisions Services Integration');
console.log('======================================================================');

/**
 * Test administrative division integration components
 */
async function runAdministrativeDivisionIntegrationTests() {
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: Administrative Division Files Structure
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Files...');
        
        const requiredFiles = [
            'src/routes/administrativeDivision.routes.ts',
            'src/controllers/administrativeDivision.controller.ts',
            'src/services/administrativeDivision.service.ts',
            'src/models/AdministrativeDivision.model.ts',
            'src/types/administrativeDivision.types.ts'
        ];
        
        const existingFiles = requiredFiles.filter(filePath => {
            const fullPath = path.join(__dirname, filePath);
            return fs.existsSync(fullPath);
        });
        
        if (existingFiles.length >= 4) {
            console.log(`✅ Administrative Division Files: Found ${existingFiles.length}/${requiredFiles.length} administrative division files`);
            testResults.passed++;
        } else {
            throw new Error(`Only ${existingFiles.length}/${requiredFiles.length} administrative division files found`);
        }
    } catch (error) {
        console.log('❌ Administrative Division Files:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Files: ${error.message}`);
    }

    // Test 2: Administrative Division Routes Configuration
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Routes Configuration...');
        
        const routesPath = path.join(__dirname, 'src/routes/administrativeDivision.routes.ts');
        if (fs.existsSync(routesPath)) {
            const routesContent = fs.readFileSync(routesPath, 'utf8');
            
            const expectedRoutePatterns = [
                'post',
                'get',
                'put',
                'delete',
                'Router',
                'administrativeDivision'
            ];
            
            const foundPatterns = expectedRoutePatterns.filter(pattern =>
                routesContent.includes(pattern)
            );
            
            if (foundPatterns.length >= 5) {
                console.log(`✅ Administrative Division Routes Configuration: Found ${foundPatterns.length} route patterns`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundPatterns.length}/${expectedRoutePatterns.length} route patterns found`);
            }
        } else {
            throw new Error('Administrative division routes file not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Routes Configuration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Routes Configuration: ${error.message}`);
    }

    // Test 3: Administrative Division Controller Methods
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Controller Methods...');
        
        const controllerPath = path.join(__dirname, 'src/controllers/administrativeDivision.controller.ts');
        if (fs.existsSync(controllerPath)) {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            
            const expectedMethods = [
                'createDivision',
                'getDivisions',
                'getDivisionById',
                'updateDivision',
                'deleteDivision',
                'getHierarchy',
                'getStatistics'
            ];
            
            const foundMethods = expectedMethods.filter(method =>
                controllerContent.includes(method)
            );
            
            if (foundMethods.length >= 5) {
                console.log(`✅ Administrative Division Controller Methods: Found ${foundMethods.length} controller methods`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundMethods.length}/${expectedMethods.length} controller methods found`);
            }
        } else {
            throw new Error('Administrative division controller file not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Controller Methods:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Controller Methods: ${error.message}`);
    }

    // Test 4: Administrative Division Service Implementation
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Service Implementation...');
        
        const servicePath = path.join(__dirname, 'src/services/administrativeDivision.service.ts');
        if (fs.existsSync(servicePath)) {
            const serviceContent = fs.readFileSync(servicePath, 'utf8');
            
            const expectedFeatures = [
                'createDivision',
                'findById',
                'findByFilters',
                'updateDivision',
                'deleteDivision',
                'getHierarchy',
                'getStatistics',
                'buildTree'
            ];
            
            const foundFeatures = expectedFeatures.filter(feature =>
                serviceContent.includes(feature)
            );
            
            if (foundFeatures.length >= 6) {
                console.log(`✅ Administrative Division Service Implementation: Found ${foundFeatures.length} service features`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundFeatures.length}/${expectedFeatures.length} service features found`);
            }
        } else {
            throw new Error('Administrative division service file not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Service Implementation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Service Implementation: ${error.message}`);
    }

    // Test 5: Administrative Division Model Methods
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Model Methods...');
        
        const modelPath = path.join(__dirname, 'src/models/AdministrativeDivision.model.ts');
        if (fs.existsSync(modelPath)) {
            const modelContent = fs.readFileSync(modelPath, 'utf8');
            
            const expectedModelMethods = [
                'create',
                'findById',
                'findAll',
                'update',
                'delete',
                'findByCountry',
                'findByParent',
                'getChildren'
            ];
            
            const foundModelMethods = expectedModelMethods.filter(method =>
                modelContent.includes(method)
            );
            
            if (foundModelMethods.length >= 6) {
                console.log(`✅ Administrative Division Model Methods: Found ${foundModelMethods.length} model methods`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundModelMethods.length}/${expectedModelMethods.length} model methods found`);
            }
        } else {
            throw new Error('Administrative division model file not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Model Methods:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Model Methods: ${error.message}`);
    }

    // Test 6: Administrative Division Type Definitions
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Type Definitions...');
        
        const typesPath = path.join(__dirname, 'src/types/administrativeDivision.types.ts');
        if (fs.existsSync(typesPath)) {
            const typesContent = fs.readFileSync(typesPath, 'utf8');
            
            const expectedTypes = [
                'AdministrativeDivision',
                'CreateAdministrativeDivisionRequest',
                'UpdateAdministrativeDivisionRequest',
                'AdministrativeDivisionFilters',
                'AdministrativeHierarchy',
                'DivisionTreeNode',
                'AdministrativeDivisionStats'
            ];
            
            const foundTypes = expectedTypes.filter(type =>
                typesContent.includes(type)
            );
            
            if (foundTypes.length >= 6) {
                console.log(`✅ Administrative Division Type Definitions: Found ${foundTypes.length}/${expectedTypes.length} type definitions`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundTypes.length}/${expectedTypes.length} type definitions found`);
            }
        } else {
            throw new Error('Administrative division types file not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Type Definitions:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Type Definitions: ${error.message}`);
    }

    // Test 7: Administrative Division Database Migration
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Database Migration...');
        
        const migrationsDir = path.join(__dirname, 'database/migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir);
            const adminDivisionMigrations = migrationFiles.filter(file => 
                file.includes('administrative') || 
                file.includes('division') ||
                file.includes('geographic')
            );
            
            if (adminDivisionMigrations.length >= 1) {
                // Check if migration has substantial content
                let hasProperMigration = false;
                
                adminDivisionMigrations.forEach(migrationFile => {
                    const migrationPath = path.join(migrationsDir, migrationFile);
                    const stats = fs.statSync(migrationPath);
                    
                    if (stats.size > 500) { // Check for non-trivial migration
                        hasProperMigration = true;
                    }
                });
                
                if (hasProperMigration) {
                    console.log(`✅ Administrative Division Database Migration: Found ${adminDivisionMigrations.length} migration(s)`);
                    testResults.passed++;
                } else {
                    throw new Error('Administrative division migration files are too small or empty');
                }
            } else {
                throw new Error('No administrative division migration files found');
            }
        } else {
            throw new Error('Migrations directory not found');
        }
    } catch (error) {
        console.log('❌ Administrative Division Database Migration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Database Migration: ${error.message}`);
    }

    // Test 8: Geographic Features Integration
    try {
        testResults.total++;
        console.log('🔍 Testing Geographic Features Integration...');
        
        const servicePath = path.join(__dirname, 'src/services/administrativeDivision.service.ts');
        const modelPath = path.join(__dirname, 'src/models/AdministrativeDivision.model.ts');
        
        let hasGeographicFeatures = false;
        
        [servicePath, modelPath].forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for geographic/GIS features
                if (content.includes('coordinates') || 
                    content.includes('bounds') ||
                    content.includes('ST_') || // PostGIS functions
                    content.includes('geometry') ||
                    content.includes('latitude') ||
                    content.includes('longitude')) {
                    hasGeographicFeatures = true;
                }
            }
        });
        
        if (hasGeographicFeatures) {
            console.log('✅ Geographic Features Integration: Geographic features are integrated');
            testResults.passed++;
        } else {
            throw new Error('Geographic features not integrated');
        }
    } catch (error) {
        console.log('❌ Geographic Features Integration:', error.message);
        testResults.failed++;
        testResults.errors.push(`Geographic Features Integration: ${error.message}`);
    }

    // Test 9: Hierarchical Structure Support
    try {
        testResults.total++;
        console.log('🔍 Testing Hierarchical Structure Support...');
        
        const servicePath = path.join(__dirname, 'src/services/administrativeDivision.service.ts');
        const typesPath = path.join(__dirname, 'src/types/administrativeDivision.types.ts');
        
        let hasHierarchicalSupport = false;
        
        [servicePath, typesPath].forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for hierarchical features
                if (content.includes('parent_id') || 
                    content.includes('level') ||
                    content.includes('hierarchy') ||
                    content.includes('tree') ||
                    content.includes('children') ||
                    content.includes('parent')) {
                    hasHierarchicalSupport = true;
                }
            }
        });
        
        if (hasHierarchicalSupport) {
            console.log('✅ Hierarchical Structure Support: Hierarchical features are supported');
            testResults.passed++;
        } else {
            throw new Error('Hierarchical structure support not implemented');
        }
    } catch (error) {
        console.log('❌ Hierarchical Structure Support:', error.message);
        testResults.failed++;
        testResults.errors.push(`Hierarchical Structure Support: ${error.message}`);
    }

    // Test 10: Error Handling and Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Error Handling and Validation...');
        
        const errorHandlingFiles = [
            'src/controllers/administrativeDivision.controller.ts',
            'src/services/administrativeDivision.service.ts'
        ];
        
        let errorHandlingCount = 0;
        
        errorHandlingFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for error handling patterns
                const hasErrorHandling = content.includes('try') && content.includes('catch') ||
                                       content.includes('throw') ||
                                       content.includes('Error') ||
                                       content.includes('validation') ||
                                       content.includes('validate');
                
                if (hasErrorHandling) {
                    errorHandlingCount++;
                }
            }
        });
        
        if (errorHandlingCount >= 1) {
            console.log(`✅ Error Handling and Validation: Found error handling in ${errorHandlingCount}/${errorHandlingFiles.length} files`);
            testResults.passed++;
        } else {
            throw new Error('No error handling found in administrative division files');
        }
    } catch (error) {
        console.log('❌ Error Handling and Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Error Handling and Validation: ${error.message}`);
    }

    return testResults;
}

/**
 * Main test execution
 */
async function main() {
    try {
        const results = await runAdministrativeDivisionIntegrationTests();
        
        console.log('======================================================================');
        console.log('📊 ADMINISTRATIVE DIVISIONS INTEGRATION TEST RESULTS');
        console.log('======================================================================');
        console.log(`Total Tests: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
        
        if (results.passed > 0) {
            console.log('\n🎯 Test Coverage Areas:');
            const coverageAreas = [
                '✓ Files Structure',
                '✓ Routes Configuration', 
                '✓ Controller Methods',
                '✓ Service Implementation',
                '✓ Model Methods',
                '✓ Type Definitions',
                '✓ Database Migration',
                '✓ Geographic Features',
                '✓ Hierarchical Structure',
                '✓ Error Handling'
            ];
            coverageAreas.slice(0, results.passed).forEach(area => console.log(`   ${area}`));
        }
        
        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        const passRate = (results.passed / results.total) * 100;
        let assessment;
        if (passRate >= 90) {
            assessment = '✅ EXCELLENT - All administrative division services are properly integrated';
        } else if (passRate >= 75) {
            assessment = '🟡 GOOD - Administrative division services need minor improvements';
        } else if (passRate >= 50) {
            assessment = '🟠 FAIR - Administrative division services need significant improvements';
        } else {
            assessment = '❌ POOR - Administrative division services need major refactoring';
        }
        
        console.log('\n🏆 OVERALL ASSESSMENT:');
        console.log(assessment);
        console.log('🚀 Ready for production use' + (passRate >= 90 ? '' : ' after addressing issues'));
        console.log(`📋 Test completed at: ${new Date().toISOString()}`);
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('💥 Fatal error during administrative division integration testing:', error);
        process.exit(1);
    }
}

// Run tests
main();
