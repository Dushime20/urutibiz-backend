#!/usr/bin/env node

// =====================================================
// BUSINESS RULES & REGULATIONS LOGIC TEST (STANDALONE)
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

console.log('📋 Testing Business Rules & Regulations Logic (Standalone)');
console.log('============================================================');

async function runTests() {
    // Test 1: Business Rule Engine Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rule Engine Logic...');
        
        // Mock business rule context structure
        const createRuleContext = (user, additionalData = {}) => ({
            user,
            ...additionalData
        });
        
        // Mock business rule evaluation
        const evaluateRule = (ruleValue, context) => {
            if (typeof ruleValue === 'function') {
                return ruleValue(context);
            }
            if (Array.isArray(ruleValue)) {
                return !!(context.user && ruleValue.includes(context.user.role));
            }
            if (typeof ruleValue === 'boolean') {
                return ruleValue;
            }
            return false;
        };
        
        // Test role-based rules
        const roleRule = ['admin', 'moderator'];
        const adminContext = createRuleContext({ id: '1', role: 'admin' });
        const userContext = createRuleContext({ id: '2', role: 'user' });
        
        const adminAllowed = evaluateRule(roleRule, adminContext);
        const userDenied = !evaluateRule(roleRule, userContext);
        
        // Test boolean rules
        const booleanRule = true;
        const booleanResult = evaluateRule(booleanRule, adminContext);
        
        // Test function rules
        const functionRule = (context) => context.user && context.user.role === 'admin';
        const functionResult = evaluateRule(functionRule, adminContext);
        
        if (adminAllowed && userDenied && booleanResult && functionResult) {
            console.log('✅ Business Rule Engine Logic: All rule evaluation logic works correctly');
            testResults.passed++;
        } else {
            throw new Error('Business rule engine logic failed');
        }
    } catch (error) {
        console.log('❌ Business Rule Engine Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rule Engine Logic: ${error.message}`);
    }

    // Test 2: Country Business Rules Validation
    try {
        testResults.total++;
        console.log('🔍 Testing Country Business Rules Validation...');
        
        const validateCountryBusinessRule = (rule) => {
            const requiredFields = ['country_id'];
            const optionalFields = [
                'min_user_age', 'kyc_required', 'max_booking_value',
                'support_hours_start', 'support_hours_end', 'support_days',
                'terms_of_service_url', 'privacy_policy_url',
                'service_fee_percentage', 'payment_processing_fee', 'min_payout_amount'
            ];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!rule[field]) return false;
            }
            
            // Validate data types and constraints
            if (rule.min_user_age && (typeof rule.min_user_age !== 'number' || rule.min_user_age < 0 || rule.min_user_age > 100)) {
                return false;
            }
            
            if (rule.kyc_required && typeof rule.kyc_required !== 'boolean') {
                return false;
            }
            
            if (rule.max_booking_value && (typeof rule.max_booking_value !== 'number' || rule.max_booking_value < 0)) {
                return false;
            }
            
            if (rule.service_fee_percentage && (typeof rule.service_fee_percentage !== 'number' || rule.service_fee_percentage < 0 || rule.service_fee_percentage > 100)) {
                return false;
            }
            
            if (rule.support_days && (!Array.isArray(rule.support_days) || rule.support_days.some(day => day < 1 || day > 7))) {
                return false;
            }
            
            return true;
        };
        
        // Test valid country business rules
        const validRules = [
            {
                country_id: 'country-1',
                min_user_age: 18,
                kyc_required: true,
                max_booking_value: 10000,
                service_fee_percentage: 5.0,
                support_days: [1, 2, 3, 4, 5]
            },
            {
                country_id: 'country-2',
                min_user_age: 21,
                kyc_required: false,
                service_fee_percentage: 3.5
            }
        ];
        
        const validRuleTests = validRules.every(rule => validateCountryBusinessRule(rule));
        
        // Test invalid country business rules
        const invalidRules = [
            { min_user_age: 18 }, // Missing country_id
            { country_id: 'country-1', min_user_age: -5 }, // Invalid age
            { country_id: 'country-1', kyc_required: 'yes' }, // Invalid boolean
            { country_id: 'country-1', service_fee_percentage: 150 }, // Invalid percentage
            { country_id: 'country-1', support_days: [0, 8] } // Invalid days
        ];
        
        const invalidRuleTests = invalidRules.every(rule => !validateCountryBusinessRule(rule));
        
        if (validRuleTests && invalidRuleTests) {
            console.log('✅ Country Business Rules Validation: All validation logic works correctly');
            testResults.passed++;
        } else {
            throw new Error('Country business rules validation failed');
        }
    } catch (error) {
        console.log('❌ Country Business Rules Validation:', error.message);
        testResults.failed++;
        testResults.errors.push(`Country Business Rules Validation: ${error.message}`);
    }

    // Test 3: Category Regulations Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Category Regulations Logic...');
        
        const validateCategoryRegulation = (regulation) => {
            const requiredFields = ['category_id', 'country_id'];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!regulation[field]) return false;
            }
            
            // Validate boolean fields
            if (regulation.is_allowed !== undefined && typeof regulation.is_allowed !== 'boolean') {
                return false;
            }
            
            if (regulation.requires_license !== undefined && typeof regulation.requires_license !== 'boolean') {
                return false;
            }
            
            // Validate age requirement
            if (regulation.min_age_requirement && (typeof regulation.min_age_requirement !== 'number' || regulation.min_age_requirement < 0 || regulation.min_age_requirement > 100)) {
                return false;
            }
            
            // Validate tax rates
            if (regulation.tax_rate && (typeof regulation.tax_rate !== 'number' || regulation.tax_rate < 0 || regulation.tax_rate > 100)) {
                return false;
            }
            
            // Validate arrays
            if (regulation.required_documents && !Array.isArray(regulation.required_documents)) {
                return false;
            }
            
            if (regulation.restricted_hours && !Array.isArray(regulation.restricted_hours)) {
                return false;
            }
            
            return true;
        };
        
        // Test valid category regulations
        const validRegulations = [
            {
                category_id: 'cat-1',
                country_id: 'country-1',
                is_allowed: true,
                requires_license: false,
                min_age_requirement: 18
            },
            {
                category_id: 'cat-2',
                country_id: 'country-2',
                is_allowed: true,
                requires_license: true,
                license_type: 'Professional License',
                tax_rate: 15.5,
                required_documents: ['ID', 'License'],
                restricted_hours: ['22:00', '06:00']
            }
        ];
        
        const validRegulationTests = validRegulations.every(reg => validateCategoryRegulation(reg));
        
        // Test invalid category regulations
        const invalidRegulations = [
            { category_id: 'cat-1' }, // Missing country_id
            { country_id: 'country-1' }, // Missing category_id
            { category_id: 'cat-1', country_id: 'country-1', is_allowed: 'yes' }, // Invalid boolean
            { category_id: 'cat-1', country_id: 'country-1', min_age_requirement: -10 }, // Invalid age
            { category_id: 'cat-1', country_id: 'country-1', tax_rate: 150 }, // Invalid tax rate
            { category_id: 'cat-1', country_id: 'country-1', required_documents: 'ID' } // Invalid array
        ];
        
        const invalidRegulationTests = invalidRegulations.every(reg => !validateCategoryRegulation(reg));
        
        if (validRegulationTests && invalidRegulationTests) {
            console.log('✅ Category Regulations Logic: All regulation validation works correctly');
            testResults.passed++;
        } else {
            throw new Error('Category regulations logic failed');
        }
    } catch (error) {
        console.log('❌ Category Regulations Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Category Regulations Logic: ${error.message}`);
    }

    // Test 4: Business Rule Enforcement Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Business Rule Enforcement Logic...');
        
        const enforceBusinessRule = async (rule, context, errorMessage) => {
            const evaluateRule = (ruleValue, context) => {
                if (typeof ruleValue === 'function') {
                    return ruleValue(context);
                }
                if (Array.isArray(ruleValue)) {
                    return !!(context.user && ruleValue.includes(context.user.role));
                }
                return !!ruleValue;
            };
            
            const allowed = evaluateRule(rule, context);
            if (!allowed) {
                throw new Error(errorMessage || 'Business rule violation');
            }
            return true;
        };
        
        // Test successful enforcement
        const allowedRule = ['admin', 'moderator'];
        const adminContext = { user: { id: '1', role: 'admin' } };
        
        try {
            await enforceBusinessRule(allowedRule, adminContext, 'Access denied');
            var enforcementSuccess = true;
        } catch (error) {
            var enforcementSuccess = false;
        }
        
        // Test failed enforcement
        const deniedRule = ['admin'];
        const userContext = { user: { id: '2', role: 'user' } };
        
        try {
            await enforceBusinessRule(deniedRule, userContext, 'Access denied');
            var enforcementFailure = false;
        } catch (error) {
            var enforcementFailure = true;
        }
        
        if (enforcementSuccess && enforcementFailure) {
            console.log('✅ Business Rule Enforcement Logic: All enforcement logic works correctly');
            testResults.passed++;
        } else {
            throw new Error('Business rule enforcement logic failed');
        }
    } catch (error) {
        console.log('❌ Business Rule Enforcement Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Rule Enforcement Logic: ${error.message}`);
    }

    // Test 5: Platform Fee Calculation Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Platform Fee Calculation Logic...');
        
        const calculatePlatformFees = (bookingValue, businessRules) => {
            const serviceFeeRate = businessRules.service_fee_percentage || 5.0;
            const processingFeeRate = businessRules.payment_processing_fee || 2.9;
            
            const serviceFee = (bookingValue * serviceFeeRate) / 100;
            const processingFee = (bookingValue * processingFeeRate) / 100;
            const totalFees = serviceFee + processingFee;
            
            return {
                serviceFee: Math.round(serviceFee * 100) / 100,
                processingFee: Math.round(processingFee * 100) / 100,
                totalFees: Math.round(totalFees * 100) / 100,
                netAmount: Math.round((bookingValue - totalFees) * 100) / 100
            };
        };
        
        // Test fee calculations
        const testCases = [
            {
                bookingValue: 100,
                businessRules: { service_fee_percentage: 5.0, payment_processing_fee: 2.9 },
                expected: { serviceFee: 5.0, processingFee: 2.9, totalFees: 7.9, netAmount: 92.1 }
            },
            {
                bookingValue: 250,
                businessRules: { service_fee_percentage: 3.5, payment_processing_fee: 2.5 },
                expected: { serviceFee: 8.75, processingFee: 6.25, totalFees: 15.0, netAmount: 235.0 }
            }
        ];
        
        const feeCalculationTests = testCases.every(testCase => {
            const result = calculatePlatformFees(testCase.bookingValue, testCase.businessRules);
            return (
                result.serviceFee === testCase.expected.serviceFee &&
                result.processingFee === testCase.expected.processingFee &&
                result.totalFees === testCase.expected.totalFees &&
                result.netAmount === testCase.expected.netAmount
            );
        });
        
        if (feeCalculationTests) {
            console.log('✅ Platform Fee Calculation Logic: All fee calculations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Platform fee calculation logic failed');
        }
    } catch (error) {
        console.log('❌ Platform Fee Calculation Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Platform Fee Calculation Logic: ${error.message}`);
    }

    // Test 6: Business Hours Validation Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Business Hours Validation Logic...');
        
        const isWithinBusinessHours = (currentTime, businessRules) => {
            const startTime = businessRules.support_hours_start || '08:00';
            const endTime = businessRules.support_hours_end || '18:00';
            const supportDays = businessRules.support_days || [1, 2, 3, 4, 5]; // Mon-Fri
            
            const currentDate = new Date(currentTime);
            const currentDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Sunday = 7
            const currentHour = currentDate.getHours();
            const currentMinute = currentDate.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            
            // Parse business hours
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startTimeMinutes = startHour * 60 + startMin;
            const endTimeMinutes = endHour * 60 + endMin;
            
            // Check if current day is supported
            if (!supportDays.includes(currentDay)) {
                return false;
            }
            
            // Check if current time is within business hours
            return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
        };
        
        const businessRules = {
            support_hours_start: '09:00',
            support_hours_end: '17:00',
            support_days: [1, 2, 3, 4, 5] // Mon-Fri
        };
        
        // Test cases (using a Monday for consistent testing)
        const testCases = [
            { time: new Date('2025-07-07T10:00:00'), expected: true }, // Monday 10 AM
            { time: new Date('2025-07-07T18:00:00'), expected: false }, // Monday 6 PM (after hours)
            { time: new Date('2025-07-07T08:00:00'), expected: false }, // Monday 8 AM (before hours)
            { time: new Date('2025-07-06T10:00:00'), expected: false }, // Sunday (weekend)
        ];
        
        const businessHoursTests = testCases.every(testCase => 
            isWithinBusinessHours(testCase.time, businessRules) === testCase.expected
        );
        
        if (businessHoursTests) {
            console.log('✅ Business Hours Validation Logic: All business hours logic works correctly');
            testResults.passed++;
        } else {
            throw new Error('Business hours validation logic failed');
        }
    } catch (error) {
        console.log('❌ Business Hours Validation Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Business Hours Validation Logic: ${error.message}`);
    }

    // Test 7: Compliance Check Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Compliance Check Logic...');
        
        const checkCompliance = (user, category, countryRules, categoryRegulation) => {
            const complianceResults = {
                passed: true,
                issues: [],
                requirements: []
            };
            
            // Check age requirement
            if (countryRules.min_user_age && user.age < countryRules.min_user_age) {
                complianceResults.passed = false;
                complianceResults.issues.push(`User age ${user.age} below minimum ${countryRules.min_user_age}`);
            }
            
            if (categoryRegulation.min_age_requirement && user.age < categoryRegulation.min_age_requirement) {
                complianceResults.passed = false;
                complianceResults.issues.push(`User age ${user.age} below category minimum ${categoryRegulation.min_age_requirement}`);
            }
            
            // Check KYC requirement
            if (countryRules.kyc_required && !user.isVerified) {
                complianceResults.passed = false;
                complianceResults.issues.push('KYC verification required');
                complianceResults.requirements.push('Complete identity verification');
            }
            
            // Check license requirement
            if (categoryRegulation.requires_license && !user.hasLicense) {
                complianceResults.passed = false;
                complianceResults.issues.push('Professional license required');
                complianceResults.requirements.push(`Obtain ${categoryRegulation.license_type || 'required license'}`);
            }
            
            // Check category allowance
            if (categoryRegulation.is_allowed === false) {
                complianceResults.passed = false;
                complianceResults.issues.push('Category not allowed in this country');
            }
            
            return complianceResults;
        };
        
        // Test compliant user
        const compliantUser = { age: 25, isVerified: true, hasLicense: true };
        const permissiveRules = { min_user_age: 18, kyc_required: true };
        const permissiveRegulation = { min_age_requirement: 21, requires_license: true, is_allowed: true, license_type: 'Professional' };
        
        const compliantResult = checkCompliance(compliantUser, 'category', permissiveRules, permissiveRegulation);
        
        // Test non-compliant user
        const nonCompliantUser = { age: 16, isVerified: false, hasLicense: false };
        const strictRules = { min_user_age: 18, kyc_required: true };
        const strictRegulation = { min_age_requirement: 21, requires_license: true, is_allowed: true };
        
        const nonCompliantResult = checkCompliance(nonCompliantUser, 'category', strictRules, strictRegulation);
        
        if (compliantResult.passed && !nonCompliantResult.passed && nonCompliantResult.issues.length > 0) {
            console.log('✅ Compliance Check Logic: All compliance checking works correctly');
            testResults.passed++;
        } else {
            throw new Error('Compliance check logic failed');
        }
    } catch (error) {
        console.log('❌ Compliance Check Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Compliance Check Logic: ${error.message}`);
    }

    // Test 8: Rule Priority and Override Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Rule Priority and Override Logic...');
        
        const resolveRuleConflicts = (globalRules, countryRules, categoryRules) => {
            // Priority: Category > Country > Global
            const resolvedRules = { ...globalRules };
            
            // Apply country overrides
            Object.keys(countryRules).forEach(key => {
                if (countryRules[key] !== undefined && countryRules[key] !== null) {
                    resolvedRules[key] = countryRules[key];
                }
            });
            
            // Apply category overrides (highest priority)
            Object.keys(categoryRules).forEach(key => {
                if (categoryRules[key] !== undefined && categoryRules[key] !== null) {
                    resolvedRules[key] = categoryRules[key];
                }
            });
            
            return resolvedRules;
        };
        
        const globalRules = {
            min_user_age: 16,
            kyc_required: false,
            service_fee_percentage: 5.0
        };
        
        const countryRules = {
            min_user_age: 18,
            kyc_required: true,
            // service_fee_percentage not specified, should use global
        };
        
        const categoryRules = {
            min_user_age: 21,
            // kyc_required not specified, should use country
            // service_fee_percentage not specified, should use global
        };
        
        const resolvedRules = resolveRuleConflicts(globalRules, countryRules, categoryRules);
        
        const expectedRules = {
            min_user_age: 21,        // Category override
            kyc_required: true,      // Country override
            service_fee_percentage: 5.0  // Global (no overrides)
        };
        
        const ruleResolutionCorrect = 
            resolvedRules.min_user_age === expectedRules.min_user_age &&
            resolvedRules.kyc_required === expectedRules.kyc_required &&
            resolvedRules.service_fee_percentage === expectedRules.service_fee_percentage;
        
        if (ruleResolutionCorrect) {
            console.log('✅ Rule Priority and Override Logic: All rule resolution works correctly');
            testResults.passed++;
        } else {
            throw new Error('Rule priority and override logic failed');
        }
    } catch (error) {
        console.log('❌ Rule Priority and Override Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Rule Priority and Override Logic: ${error.message}`);
    }

    // Print results
    console.log('============================================================');
    console.log('📊 BUSINESS RULES & REGULATIONS LOGIC TEST RESULTS');
    console.log('============================================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('❌ Failed Tests:');
        testResults.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('🏆 OVERALL ASSESSMENT:');
    if (testResults.failed === 0) {
        console.log('✅ EXCELLENT - All business rules and regulations logic tests passed');
    } else if (testResults.passed / testResults.total >= 0.8) {
        console.log('🟡 GOOD - Business rules and regulations logic needs minor improvements');
    } else {
        console.log('🔴 POOR - Business rules and regulations logic needs significant improvements');
    }
    
    console.log(`📋 Test completed at: ${new Date().toISOString()}`);
}

// Run the tests
runTests().catch(console.error);
