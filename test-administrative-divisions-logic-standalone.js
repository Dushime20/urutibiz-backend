/**
 * Administrative Divisions Logic Standalone Test
 * Tests administrative division core logic and validation without external dependencies
 */

// Force environment variables override
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');

console.log('🗺️ Testing Administrative Divisions Logic (Standalone)');
console.log('============================================================');

/**
 * Test administrative division logic components
 */
async function runAdministrativeDivisionLogicTests() {
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: Administrative Division Level Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Administrative Division Level Validation...');
        
        const validateLevel = (level) => {
            return Number.isInteger(level) && level >= 1 && level <= 10;
        };
        
        // Test valid levels
        const validLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const validTests = validLevels.every(level => validateLevel(level));
        
        // Test invalid levels
        const invalidLevels = [0, -1, 11, 15, 0.5, 'invalid', null, undefined];
        const invalidTests = invalidLevels.every(level => !validateLevel(level));
        
        if (validTests && invalidTests) {
            console.log('✅ Administrative Division Level Validation: All levels validated correctly');
            testResults.passed++;
        } else {
            throw new Error('Administrative division level validation failed');
        }
    } catch (error) {
        console.log('❌ Administrative Division Level Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Administrative Division Level Validation: ${error.message}`);
    }

    // Test 2: Division Type Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Division Type Validation...');
        
        const validDivisionTypes = [
            'country', 'province', 'state', 'region', 'district', 'county',
            'municipality', 'city', 'town', 'ward', 'sector', 'cell',
            'village', 'neighborhood', 'parish', 'commune', 'department'
        ];
        
        const isValidDivisionType = (type) => {
            if (!type) return true; // Type is optional
            return validDivisionTypes.includes(type.toLowerCase());
        };
        
        // Test valid types
        const validTypeTests = validDivisionTypes.every(type => isValidDivisionType(type));
        
        // Test invalid types
        const invalidTypes = ['invalid', 'unknown', 'bad-type', '123'];
        const invalidTypeTests = invalidTypes.every(type => !isValidDivisionType(type));
        
        // Test null/undefined (should be valid as optional)
        const nullTests = isValidDivisionType(null) && isValidDivisionType(undefined);
        
        if (validTypeTests && invalidTypeTests && nullTests) {
            console.log('✅ Division Type Validation: All division types validated correctly');
            testResults.passed++;
        } else {
            throw new Error('Division type validation failed');
        }
    } catch (error) {
        console.log('❌ Division Type Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Division Type Validation: ${error.message}`);
    }

    // Test 3: Hierarchical Level Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Hierarchical Level Logic...');
        
        const validateHierarchy = (parentLevel, childLevel) => {
            if (!parentLevel) return true; // Root level division
            return childLevel > parentLevel;
        };
        
        // Test valid hierarchies
        const validHierarchies = [
            { parent: null, child: 1 },  // Root level
            { parent: 1, child: 2 },     // Province -> District
            { parent: 2, child: 3 },     // District -> Sector
            { parent: 3, child: 4 },     // Sector -> Cell
            { parent: 5, child: 6 }      // Municipality -> Ward
        ];
        
        const validHierarchyTests = validHierarchies.every(h => 
            validateHierarchy(h.parent, h.child)
        );
        
        // Test invalid hierarchies
        const invalidHierarchies = [
            { parent: 2, child: 2 },     // Same level
            { parent: 3, child: 2 },     // Child level lower than parent
            { parent: 5, child: 1 }      // Child level much lower than parent
        ];
        
        const invalidHierarchyTests = invalidHierarchies.every(h => 
            !validateHierarchy(h.parent, h.child)
        );
        
        if (validHierarchyTests && invalidHierarchyTests) {
            console.log('✅ Hierarchical Level Logic: All hierarchy validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Hierarchical level logic failed');
        }
    } catch (error) {
        console.log('❌ Hierarchical Level Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Hierarchical Level Logic: ${error.message}`);
    }

    // Test 4: Geographic Coordinate Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Geographic Coordinate Validation...');
        
        const validateCoordinates = (coordinates) => {
            if (!coordinates) return true; // Coordinates are optional
            
            const { latitude, longitude } = coordinates;
            
            // Check if latitude and longitude are numbers
            if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
            
            // Latitude must be between -90 and 90
            if (latitude < -90 || latitude > 90) return false;
            
            // Longitude must be between -180 and 180
            if (longitude < -180 || longitude > 180) return false;
            
            return true;
        };
        
        // Test valid coordinates
        const validCoordinates = [
            { latitude: 0, longitude: 0 },           // Equator/Prime Meridian
            { latitude: -1.9441, longitude: 30.0619 }, // Kigali, Rwanda
            { latitude: 40.7128, longitude: -74.0060 }, // New York City
            { latitude: -33.8688, longitude: 151.2093 }, // Sydney
            { latitude: 90, longitude: 180 },          // North Pole, Date Line
            { latitude: -90, longitude: -180 }         // South Pole, Date Line
        ];
        
        const validCoordTests = validCoordinates.every(coord => validateCoordinates(coord));
        
        // Test invalid coordinates
        const invalidCoordinates = [
            { latitude: 91, longitude: 0 },     // Latitude too high
            { latitude: -91, longitude: 0 },    // Latitude too low
            { latitude: 0, longitude: 181 },    // Longitude too high
            { latitude: 0, longitude: -181 },   // Longitude too low
            { latitude: 'invalid', longitude: 0 }, // Invalid latitude type
            { latitude: 0, longitude: 'invalid' }  // Invalid longitude type
        ];
        
        const invalidCoordTests = invalidCoordinates.every(coord => {
            try {
                return !validateCoordinates(coord);
            } catch (error) {
                return true; // Expect validation to fail
            }
        });
        
        // Test null/undefined (should be valid as optional)
        const nullCoordTests = validateCoordinates(null) && validateCoordinates(undefined);
        
        if (validCoordTests && invalidCoordTests && nullCoordTests) {
            console.log('✅ Geographic Coordinate Validation: All coordinate validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Geographic coordinate validation failed');
        }
    } catch (error) {
        console.log('❌ Geographic Coordinate Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Geographic Coordinate Validation: ${error.message}`);
    }

    // Test 5: Division Code Format Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Division Code Format Validation...');
        
        const validateDivisionCode = (code) => {
            if (!code) return true; // Code is optional
            
            // Code should be alphanumeric, may contain hyphens and underscores
            // Length between 1 and 20 characters
            const codeRegex = /^[A-Za-z0-9_-]{1,20}$/;
            return codeRegex.test(code);
        };
        
        // Test valid codes
        const validCodes = [
            'RW-01',      // Rwanda province code
            'NY',         // New York state code
            'KIG',        // Kigali city code
            'DIST_001',   // District with underscore
            'RG-EAST',    // Region code
            'A1',         // Simple alphanumeric
            '12345'       // Numeric code
        ];
        
        const validCodeTests = validCodes.every(code => validateDivisionCode(code));
        
        // Test invalid codes
        const invalidCodes = [
            'CODE_WITH_VERY_LONG_NAME_THAT_EXCEEDS_LIMIT',  // Too long (>20 chars)
            'CODE WITH SPACES',          // Contains spaces
            'CODE@SPECIAL',              // Contains special characters
            'CODE!',                     // Contains exclamation
            'CODE#123'                   // Contains hash
        ];
        
        const invalidCodeTests = invalidCodes.every(code => !validateDivisionCode(code));
        
        // Test null/undefined (should be valid as optional)
        const nullCodeTests = validateDivisionCode(null) && validateDivisionCode(undefined);
        
        if (validCodeTests && invalidCodeTests && nullCodeTests) {
            console.log('✅ Division Code Format Validation: All code format validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Division code format validation failed');
        }
    } catch (error) {
        console.log('❌ Division Code Format Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Division Code Format Validation: ${error.message}`);
    }

    // Test 6: Division Name Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Division Name Validation...');
        
        const validateDivisionName = (name) => {
            if (!name || typeof name !== 'string') return false;
            
            // Name should be 1-100 characters, can contain letters (including Unicode), numbers, spaces, hyphens, apostrophes, periods, commas, parentheses
            // Updated regex to support Unicode letters (including accented characters)
            const nameRegex = /^[\p{L}\p{N}\s\-'.,()]{1,100}$/u;
            return nameRegex.test(name.trim());
        };
        
        // Test valid names
        const validNames = [
            'Kigali',
            'New York',
            'Saint-Denis',
            "N'Djamena",
            'São Paulo',
            'Al-Qāhirah (Cairo)',
            'District 1',
            'Province of Ontario',
            'County Cork'
        ];
        
        const validNameTests = validNames.every(name => {
            const result = validateDivisionName(name);
            if (!result) {
                console.log(`❌ Valid name test failed for: "${name}"`);
            }
            return result;
        });
        
        // Test invalid names
        const invalidNames = [
            '',                     // Empty string
            '   ',                  // Only spaces
            null,                   // Null
            undefined,              // Undefined
            123,                    // Number
            'A'.repeat(101),        // Too long (>100 chars)
            'Name@invalid',         // Invalid character @
            'Name#invalid',         // Invalid character #
            'Name$invalid'          // Invalid character $
        ];
        
        const invalidNameTests = invalidNames.every(name => {
            const result = !validateDivisionName(name);
            if (!result) {
                console.log(`❌ Invalid name test failed for: "${name}" (should be invalid but passed)`);
            }
            return result;
        });
        
        console.log(`Valid names test: ${validNameTests ? 'PASS' : 'FAIL'}`);
        console.log(`Invalid names test: ${invalidNameTests ? 'PASS' : 'FAIL'}`);
        
        if (validNameTests && invalidNameTests) {
            console.log('✅ Division Name Validation: All name validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Division name validation failed');
        }
    } catch (error) {
        console.log('❌ Division Name Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Division Name Validation: ${error.message}`);
    }

    // Test 7: Population and Area Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Population and Area Validation...');
        
        const validatePopulation = (population) => {
            if (population === null || population === undefined) return true; // Optional
            return Number.isInteger(population) && population >= 0;
        };
        
        const validateArea = (area) => {
            if (area === null || area === undefined) return true; // Optional
            return typeof area === 'number' && area > 0;
        };
        
        // Test valid populations
        const validPopulations = [null, undefined, 0, 1000, 50000, 1000000, 10000000];
        const validPopTests = validPopulations.every(pop => validatePopulation(pop));
        
        // Test invalid populations
        const invalidPopulations = [-1, -1000, 1.5, 'invalid', '1000'];
        const invalidPopTests = invalidPopulations.every(pop => !validatePopulation(pop));
        
        // Test valid areas
        const validAreas = [null, undefined, 0.1, 100, 1000.5, 50000, 1000000.75];
        const validAreaTests = validAreas.every(area => validateArea(area));
        
        // Test invalid areas
        const invalidAreas = [-1, -100.5, 0, 'invalid', '100'];
        const invalidAreaTests = invalidAreas.every(area => !validateArea(area));
        
        if (validPopTests && invalidPopTests && validAreaTests && invalidAreaTests) {
            console.log('✅ Population and Area Validation: All population and area validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Population and area validation failed');
        }
    } catch (error) {
        console.log('❌ Population and Area Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Population and Area Validation: ${error.message}`);
    }

    // Test 8: Division Tree Structure Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Division Tree Structure Logic...');
        
        // Mock function to build tree structure
        const buildDivisionTree = (divisions) => {
            const divisionMap = new Map();
            const rootDivisions = [];
            
            // Create map of all divisions
            divisions.forEach(division => {
                divisionMap.set(division.id, { ...division, children: [] });
            });
            
            // Build tree structure
            divisions.forEach(division => {
                if (division.parent_id) {
                    const parent = divisionMap.get(division.parent_id);
                    if (parent) {
                        parent.children.push(divisionMap.get(division.id));
                    }
                } else {
                    rootDivisions.push(divisionMap.get(division.id));
                }
            });
            
            return rootDivisions;
        };
        
        // Test data
        const testDivisions = [
            { id: '1', parent_id: null, level: 1, name: 'Province A' },
            { id: '2', parent_id: '1', level: 2, name: 'District A1' },
            { id: '3', parent_id: '1', level: 2, name: 'District A2' },
            { id: '4', parent_id: '2', level: 3, name: 'Sector A1-1' },
            { id: '5', parent_id: null, level: 1, name: 'Province B' }
        ];
        
        const tree = buildDivisionTree(testDivisions);
        
        // Validate tree structure
        const isValidTree = tree.length === 2 && // Two root provinces
                           tree[0].children.length === 2 && // Province A has 2 districts
                           tree[0].children[0].children.length === 1 && // District A1 has 1 sector
                           tree[1].children.length === 0; // Province B has no children
        
        if (isValidTree) {
            console.log('✅ Division Tree Structure Logic: All tree structure logic works correctly');
            testResults.passed++;
        } else {
            throw new Error('Division tree structure logic failed');
        }
    } catch (error) {
        console.log('❌ Division Tree Structure Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Division Tree Structure Logic: ${error.message}`);
    }

    return testResults;
}

/**
 * Main test execution
 */
async function main() {
    try {
        const results = await runAdministrativeDivisionLogicTests();
        
        console.log('============================================================');
        console.log('📊 ADMINISTRATIVE DIVISIONS LOGIC TEST RESULTS');
        console.log('============================================================');
        console.log(`Total Tests: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
        
        if (results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            results.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        const passRate = (results.passed / results.total) * 100;
        let assessment;
        if (passRate >= 90) {
            assessment = '✅ EXCELLENT - All administrative division logic tests passed';
        } else if (passRate >= 75) {
            assessment = '🟡 GOOD - Administrative division logic needs minor improvements';
        } else if (passRate >= 50) {
            assessment = '🟠 FAIR - Administrative division logic needs significant improvements';
        } else {
            assessment = '❌ POOR - Administrative division logic needs major refactoring';
        }
        
        console.log('\n🏆 OVERALL ASSESSMENT:');
        console.log(assessment);
        console.log(`📋 Test completed at: ${new Date().toISOString()}`);
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('💥 Fatal error during administrative division logic testing:', error);
        process.exit(1);
    }
}

// Run tests
main();
