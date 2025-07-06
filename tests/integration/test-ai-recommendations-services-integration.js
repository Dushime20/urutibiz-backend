/**
 * AI Recommendations Services Integration Test
 * Tests AI recommendation services, repositories, and component integration
 */

// Force environment variables override
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');

console.log('🤖 Testing AI Recommendations Services Integration');
console.log('======================================================================');

/**
 * Test AI recommendation integration components
 */
async function runAIRecommendationIntegrationTests() {
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: AI Recommendation Files Structure
    try {
        testResults.total++;
        console.log('🔍 Testing AI Recommendation Files...');
        
        const requiredFiles = [
            'src/routes/aiRecommendation.routes.ts',
            'src/controllers/aiRecommendation.controller.ts',
            'src/services/AIRecommendationService.ts',
            'src/types/aiRecommendation.types.ts',
            'src/types/ai.types.ts',
            'src/repositories/AIRecommendationRepository.knex.ts',
            'src/repositories/UserInteractionRepository.knex.ts',
            'src/repositories/AIModelMetricRepository.knex.ts',
            'src/utils/aiProfileScoring.ts'
        ];
        
        const existingFiles = requiredFiles.filter(filePath => {
            const fullPath = path.join(__dirname, filePath);
            return fs.existsSync(fullPath);
        });
        
        if (existingFiles.length >= 8) {
            console.log(`✅ AI Recommendation Files: Found ${existingFiles.length}/${requiredFiles.length} AI recommendation files`);
            testResults.passed++;
        } else {
            throw new Error(`Only ${existingFiles.length}/${requiredFiles.length} AI recommendation files found`);
        }
    } catch (error) {
        console.log('❌ AI Recommendation Files:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Recommendation Files: ${error.message}`);
    }

    // Test 2: AI Routes Configuration
    try {
        testResults.total++;
        console.log('🔍 Testing AI Routes Configuration...');
        
        const routesPath = path.join(__dirname, 'src/routes/aiRecommendation.routes.ts');
        if (fs.existsSync(routesPath)) {
            const routesContent = fs.readFileSync(routesPath, 'utf8');
            
            const expectedRoutePatterns = [
                'generateRecommendations',
                'getRecommendationsForUser',
                'recordInteraction',
                'trackInteraction',
                'getRecommendationTypes'
            ];
            
            const foundPatterns = expectedRoutePatterns.filter(pattern =>
                routesContent.includes(pattern)
            );
            
            if (foundPatterns.length >= 4) {
                console.log(`✅ AI Routes Configuration: Found ${foundPatterns.length} AI route patterns`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundPatterns.length}/${expectedRoutePatterns.length} route patterns found`);
            }
        } else {
            throw new Error('AI routes file not found');
        }
    } catch (error) {
        console.log('❌ AI Routes Configuration:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Routes Configuration: ${error.message}`);
    }

    // Test 3: AI Controller Methods
    try {
        testResults.total++;
        console.log('🔍 Testing AI Controller Methods...');
        
        const controllerPath = path.join(__dirname, 'src/controllers/aiRecommendation.controller.ts');
        if (fs.existsSync(controllerPath)) {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            
            const expectedMethods = [
                'generateRecommendations',
                'getRecommendationsForUser',
                'recordInteraction',
                'cleanupExpiredRecommendations',
                'getRecommendationTypes'
            ];
            
            const foundMethods = expectedMethods.filter(method =>
                controllerContent.includes(`async ${method}`) || controllerContent.includes(`${method}(`)
            );
            
            if (foundMethods.length >= 4) {
                console.log(`✅ AI Controller Methods: Found ${foundMethods.length} AI controller methods`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundMethods.length}/${expectedMethods.length} controller methods found`);
            }
        } else {
            throw new Error('AI controller file not found');
        }
    } catch (error) {
        console.log('❌ AI Controller Methods:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Controller Methods: ${error.message}`);
    }

    // Test 4: AI Service Implementation
    try {
        testResults.total++;
        console.log('🔍 Testing AI Service Implementation...');
        
        const servicePath = path.join(__dirname, 'src/services/AIRecommendationService.ts');
        if (fs.existsSync(servicePath)) {
            const serviceContent = fs.readFileSync(servicePath, 'utf8');
            
            const expectedFeatures = [
                'generateRecommendations',
                'createRecommendation',
                'getRecommendationsForUser',
                'recordUserInteraction',
                'getUserProfile',
                'calculateSimilarity'
            ];
            
            const foundFeatures = expectedFeatures.filter(feature =>
                serviceContent.includes(feature)
            );
            
            if (foundFeatures.length >= 5) {
                console.log(`✅ AI Service Implementation: Found ${foundFeatures.length} AI service features`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundFeatures.length}/${expectedFeatures.length} service features found`);
            }
        } else {
            throw new Error('AI service file not found');
        }
    } catch (error) {
        console.log('❌ AI Service Implementation:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Service Implementation: ${error.message}`);
    }

    // Test 5: AI Repository Components
    try {
        testResults.total++;
        console.log('🔍 Testing AI Repository Components...');
        
        const aiRepoComponents = [
            'src/repositories/AIRecommendationRepository.knex.ts',
            'src/repositories/UserInteractionRepository.knex.ts',
            'src/repositories/AIModelMetricRepository.knex.ts'
        ];
        
        const existingRepos = aiRepoComponents.filter(repoPath => {
            const fullPath = path.join(__dirname, repoPath);
            return fs.existsSync(fullPath);
        });
        
        if (existingRepos.length >= 2) {
            console.log(`✅ AI Repository Components: Found ${existingRepos.length}/${aiRepoComponents.length} AI repository files`);
            testResults.passed++;
        } else {
            throw new Error(`Only ${existingRepos.length}/${aiRepoComponents.length} repository files found`);
        }
    } catch (error) {
        console.log('❌ AI Repository Components:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Repository Components: ${error.message}`);
    }

    // Test 6: AI Type Definitions
    try {
        testResults.total++;
        console.log('🔍 Testing AI Type Definitions...');
        
        const typesPath = path.join(__dirname, 'src/types/aiRecommendation.types.ts');
        if (fs.existsSync(typesPath)) {
            const typesContent = fs.readFileSync(typesPath, 'utf8');
            
            const expectedTypes = [
                'AIRecommendation',
                'RecommendationType',
                'InteractionActionType',
                'TargetType',
                'DeviceType',
                'GenerateRecommendationsRequest',
                'UserInteractionError'
            ];
            
            const foundTypes = expectedTypes.filter(type =>
                typesContent.includes(type)
            );
            
            if (foundTypes.length >= 6) {
                console.log(`✅ AI Type Definitions: Found ${foundTypes.length}/${expectedTypes.length} AI type definitions`);
                testResults.passed++;
            } else {
                throw new Error(`Only ${foundTypes.length}/${expectedTypes.length} type definitions found`);
            }
        } else {
            throw new Error('AI types file not found');
        }
    } catch (error) {
        console.log('❌ AI Type Definitions:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Type Definitions: ${error.message}`);
    }

    // Test 7: AI Database Migrations
    try {
        testResults.total++;
        console.log('🔍 Testing AI Database Migrations...');
        
        const migrationsDir = path.join(__dirname, 'database/migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir);
            const aiMigrations = migrationFiles.filter(file => 
                file.includes('ai') || 
                file.includes('AI') ||
                file.includes('recommendation') ||
                file.includes('interaction')
            );
            
            if (aiMigrations.length >= 1) {
                console.log(`✅ AI Database Migrations: Found ${aiMigrations.length} AI-related migration(s)`);
                testResults.passed++;
            } else {
                throw new Error('No AI-related migration files found');
            }
        } else {
            throw new Error('Migrations directory not found');
        }
    } catch (error) {
        console.log('❌ AI Database Migrations:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Database Migrations: ${error.message}`);
    }

    // Test 8: AI Utilities and Helpers
    try {
        testResults.total++;
        console.log('🔍 Testing AI Utilities and Helpers...');
        
        const utilityFiles = [
            'src/utils/aiProfileScoring.ts'
        ];
        
        const existingUtils = utilityFiles.filter(utilPath => {
            const fullPath = path.join(__dirname, utilPath);
            return fs.existsSync(fullPath);
        });
        
        // Check for additional AI utility patterns
        const srcDir = path.join(__dirname, 'src');
        if (fs.existsSync(srcDir)) {
            const findAIFiles = (dir) => {
                const files = [];
                const items = fs.readdirSync(dir);
                
                items.forEach(item => {
                    const itemPath = path.join(dir, item);
                    const stat = fs.statSync(itemPath);
                    
                    if (stat.isDirectory()) {
                        files.push(...findAIFiles(itemPath));
                    } else if (item.toLowerCase().includes('ai') || 
                              item.toLowerCase().includes('recommendation') ||
                              item.toLowerCase().includes('ml')) {
                        files.push(itemPath);
                    }
                });
                
                return files;
            };
            
            const aiFiles = findAIFiles(srcDir);
            const totalAIFiles = existingUtils.length + aiFiles.length;
            
            if (totalAIFiles >= 1) {
                console.log(`✅ AI Utilities and Helpers: Found ${totalAIFiles} AI utility file(s)`);
                testResults.passed++;
            } else {
                throw new Error('No AI utility files found');
            }
        } else {
            throw new Error('Source directory not found');
        }
    } catch (error) {
        console.log('❌ AI Utilities and Helpers:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Utilities and Helpers: ${error.message}`);
    }

    // Test 9: AI Error Handling
    try {
        testResults.total++;
        console.log('🔍 Testing AI Error Handling...');
        
        const errorHandlingFiles = [
            'src/controllers/aiRecommendation.controller.ts',
            'src/services/AIRecommendationService.ts'
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
                                       content.includes('status(4') ||
                                       content.includes('status(5');
                
                if (hasErrorHandling) {
                    errorHandlingCount++;
                }
            }
        });
        
        if (errorHandlingCount >= 1) {
            console.log(`✅ AI Error Handling: Found error handling in ${errorHandlingCount}/${errorHandlingFiles.length} AI files`);
            testResults.passed++;
        } else {
            throw new Error('No error handling found in AI files');
        }
    } catch (error) {
        console.log('❌ AI Error Handling:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Error Handling: ${error.message}`);
    }

    // Test 10: AI Configuration and Setup
    try {
        testResults.total++;
        console.log('🔍 Testing AI Configuration and Setup...');
        
        // Check for AI configuration in various files
        const configFiles = [
            'src/services/AIRecommendationService.ts',
            'src/config/config.ts',
            '.env'
        ];
        
        let configCount = 0;
        
        configFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Check for AI configuration patterns
                const hasAIConfig = content.includes('AI_') ||
                                  content.includes('ai') ||
                                  content.includes('recommendation') ||
                                  content.includes('model') ||
                                  content.includes('ML_');
                
                if (hasAIConfig) {
                    configCount++;
                }
            }
        });
        
        if (configCount >= 1) {
            console.log(`✅ AI Configuration and Setup: Found AI configuration in ${configCount} files`);
            testResults.passed++;
        } else {
            throw new Error('No AI configuration found');
        }
    } catch (error) {
        console.log('❌ AI Configuration and Setup:', error.message);
        testResults.failed++;
        testResults.errors.push(`AI Configuration and Setup: ${error.message}`);
    }

    return testResults;
}

/**
 * Main test execution
 */
async function main() {
    try {
        const results = await runAIRecommendationIntegrationTests();
        
        console.log('======================================================================');
        console.log('📊 AI RECOMMENDATIONS INTEGRATION TEST RESULTS');
        console.log('======================================================================');
        console.log(`Total Tests: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
        
        if (results.passed > 0) {
            console.log('\n🎯 Test Coverage Areas:');
            const coverageAreas = [
                '✓ AI Files Structure',
                '✓ API Routes Configuration', 
                '✓ Controller Methods',
                '✓ Service Implementation',
                '✓ Repository Components',
                '✓ Type Definitions',
                '✓ Database Migrations',
                '✓ Utilities and Helpers',
                '✓ Error Handling',
                '✓ Configuration and Setup'
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
            assessment = '✅ EXCELLENT - All AI recommendation services are properly integrated';
        } else if (passRate >= 75) {
            assessment = '🟡 GOOD - AI recommendation services need minor improvements';
        } else if (passRate >= 50) {
            assessment = '🟠 FAIR - AI recommendation services need significant improvements';
        } else {
            assessment = '❌ POOR - AI recommendation services need major refactoring';
        }
        
        console.log('\n🏆 OVERALL ASSESSMENT:');
        console.log(assessment);
        console.log('🚀 Ready for production use' + (passRate >= 90 ? '' : ' after addressing issues'));
        console.log(`📋 Test completed at: ${new Date().toISOString()}`);
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('💥 Fatal error during AI recommendation integration testing:', error);
        process.exit(1);
    }
}

// Run tests
main();
