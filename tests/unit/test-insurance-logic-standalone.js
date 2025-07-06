#!/usr/bin/env node

// =====================================================
// INSURANCE SYSTEM LOGIC TEST (STANDALONE)
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

console.log('🛡️ Testing Insurance System Logic (Standalone)');
console.log('============================================================');

async function runTests() {
    // Test 1: Insurance Policy Validation Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Insurance Policy Validation Logic...');
        
        const validateInsurancePolicy = (policy) => {
            const requiredFields = ['bookingId', 'insuranceType', 'coverageAmount', 'premiumAmount'];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!policy[field]) return false;
            }
            
            // Validate data types and constraints
            if (typeof policy.coverageAmount !== 'number' || policy.coverageAmount <= 0) {
                return false;
            }
            
            if (typeof policy.premiumAmount !== 'number' || policy.premiumAmount <= 0) {
                return false;
            }
            
            if (policy.deductibleAmount && (typeof policy.deductibleAmount !== 'number' || policy.deductibleAmount < 0)) {
                return false;
            }
            
            // Validate insurance types
            const validTypes = [
                'travel_insurance', 'cancellation_insurance', 'medical_insurance',
                'baggage_insurance', 'activity_insurance', 'comprehensive_insurance',
                'liability_insurance'
            ];
            
            if (!validTypes.includes(policy.insuranceType)) {
                return false;
            }
            
            // Validate policy status
            const validStatuses = ['active', 'expired', 'claimed', 'cancelled'];
            if (policy.status && !validStatuses.includes(policy.status)) {
                return false;
            }
            
            return true;
        };
        
        // Test valid insurance policies
        const validPolicies = [
            {
                bookingId: 'booking-1',
                insuranceType: 'travel_insurance',
                coverageAmount: 50000,
                premiumAmount: 150,
                deductibleAmount: 500,
                status: 'active'
            },
            {
                bookingId: 'booking-2',
                insuranceType: 'medical_insurance',
                coverageAmount: 100000,
                premiumAmount: 300,
                deductibleAmount: 0,
                status: 'active'
            }
        ];
        
        const validPolicyTests = validPolicies.every(policy => validateInsurancePolicy(policy));
        
        // Test invalid insurance policies
        const invalidPolicies = [
            { bookingId: 'booking-1' }, // Missing required fields
            { bookingId: 'booking-1', insuranceType: 'travel_insurance', coverageAmount: -1000, premiumAmount: 150 }, // Negative coverage
            { bookingId: 'booking-1', insuranceType: 'invalid_type', coverageAmount: 50000, premiumAmount: 150 }, // Invalid type
            { bookingId: 'booking-1', insuranceType: 'travel_insurance', coverageAmount: 50000, premiumAmount: 150, status: 'invalid_status' } // Invalid status
        ];
        
        const invalidPolicyTests = invalidPolicies.every(policy => !validateInsurancePolicy(policy));
        
        if (validPolicyTests && invalidPolicyTests) {
            console.log('✅ Insurance Policy Validation Logic: All policy validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Insurance policy validation logic failed');
        }
    } catch (error) {
        console.log('❌ Insurance Policy Validation Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Insurance Policy Validation Logic: ${error.message}`);
    }

    // Test 2: Insurance Claim Processing Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Insurance Claim Processing Logic...');
        
        const validateInsuranceClaim = (claim) => {
            const requiredFields = ['policyId', 'claimType', 'incidentDate', 'claimAmount'];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!claim[field]) return false;
            }
            
            // Validate claim amount
            if (typeof claim.claimAmount !== 'number' || claim.claimAmount <= 0) {
                return false;
            }
            
            // Validate incident date
            const incidentDate = new Date(claim.incidentDate);
            if (isNaN(incidentDate.getTime())) {
                return false;
            }
            
            // Incident should not be in the future
            if (incidentDate > new Date()) {
                return false;
            }
            
            // Validate claim status
            const validStatuses = ['submitted', 'investigating', 'approved', 'denied', 'paid'];
            if (claim.status && !validStatuses.includes(claim.status)) {
                return false;
            }
            
            return true;
        };
        
        // Test valid insurance claims
        const validClaims = [
            {
                policyId: 'policy-1',
                claimType: 'medical_expense',
                incidentDate: '2025-07-01',
                claimAmount: 5000,
                status: 'submitted'
            },
            {
                policyId: 'policy-2',
                claimType: 'trip_cancellation',
                incidentDate: '2025-06-15',
                claimAmount: 2500,
                status: 'investigating'
            }
        ];
        
        const validClaimTests = validClaims.every(claim => validateInsuranceClaim(claim));
        
        // Test invalid insurance claims
        const invalidClaims = [
            { policyId: 'policy-1' }, // Missing required fields
            { policyId: 'policy-1', claimType: 'medical_expense', incidentDate: '2025-07-01', claimAmount: -1000 }, // Negative amount
            { policyId: 'policy-1', claimType: 'medical_expense', incidentDate: 'invalid-date', claimAmount: 5000 }, // Invalid date
            { policyId: 'policy-1', claimType: 'medical_expense', incidentDate: '2026-01-01', claimAmount: 5000 }, // Future date
            { policyId: 'policy-1', claimType: 'medical_expense', incidentDate: '2025-07-01', claimAmount: 5000, status: 'invalid_status' } // Invalid status
        ];
        
        const invalidClaimTests = invalidClaims.every(claim => !validateInsuranceClaim(claim));
        
        if (validClaimTests && invalidClaimTests) {
            console.log('✅ Insurance Claim Processing Logic: All claim validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Insurance claim processing logic failed');
        }
    } catch (error) {
        console.log('❌ Insurance Claim Processing Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Insurance Claim Processing Logic: ${error.message}`);
    }

    // Test 3: Insurance Provider Validation Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Insurance Provider Validation Logic...');
        
        const validateInsuranceProvider = (provider) => {
            const requiredFields = ['country_id', 'provider_name'];
            
            // Check required fields
            for (const field of requiredFields) {
                if (!provider[field]) return false;
            }
            
            // Validate provider name length
            if (provider.provider_name.length < 2 || provider.provider_name.length > 100) {
                return false;
            }
            
            // Validate provider type
            const validTypes = ['TRADITIONAL', 'DIGITAL', 'PEER_TO_PEER', 'GOVERNMENT', 'MUTUAL'];
            if (provider.provider_type && !validTypes.includes(provider.provider_type)) {
                return false;
            }
            
            // Validate integration status
            const validStatuses = ['NOT_INTEGRATED', 'TESTING', 'LIVE', 'DEPRECATED'];
            if (provider.integration_status && !validStatuses.includes(provider.integration_status)) {
                return false;
            }
            
            // Validate coverage types array
            if (provider.coverage_types && !Array.isArray(provider.coverage_types)) {
                return false;
            }
            
            // Validate contact info structure
            if (provider.contact_info) {
                if (typeof provider.contact_info !== 'object') {
                    return false;
                }
                
                // If email is provided, validate format
                if (provider.contact_info.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.contact_info.email)) {
                    return false;
                }
                
                // If website is provided, validate format
                if (provider.contact_info.website && !/^https?:\/\/.+/.test(provider.contact_info.website)) {
                    return false;
                }
            }
            
            return true;
        };
        
        // Test valid insurance providers
        const validProviders = [
            {
                country_id: 'country-1',
                provider_name: 'SafeTravel Insurance',
                provider_type: 'TRADITIONAL',
                integration_status: 'LIVE',
                coverage_types: ['LIABILITY', 'COMPREHENSIVE'],
                contact_info: {
                    email: 'contact@safetravel.com',
                    website: 'https://safetravel.com',
                    phone: '+1-555-0123'
                }
            },
            {
                country_id: 'country-2',
                provider_name: 'Digital Shield',
                provider_type: 'DIGITAL',
                integration_status: 'TESTING'
            }
        ];
        
        const validProviderTests = validProviders.every(provider => validateInsuranceProvider(provider));
        
        // Test invalid insurance providers
        const invalidProviders = [
            { provider_name: 'Test Provider' }, // Missing country_id
            { country_id: 'country-1' }, // Missing provider_name
            { country_id: 'country-1', provider_name: 'A' }, // Name too short
            { country_id: 'country-1', provider_name: 'Valid Name', provider_type: 'INVALID_TYPE' }, // Invalid type
            { country_id: 'country-1', provider_name: 'Valid Name', integration_status: 'INVALID_STATUS' }, // Invalid status
            { country_id: 'country-1', provider_name: 'Valid Name', coverage_types: 'not_array' }, // Invalid coverage types
            { country_id: 'country-1', provider_name: 'Valid Name', contact_info: { email: 'invalid-email' } }, // Invalid email
            { country_id: 'country-1', provider_name: 'Valid Name', contact_info: { website: 'invalid-url' } } // Invalid website
        ];
        
        const invalidProviderTests = invalidProviders.every(provider => !validateInsuranceProvider(provider));
        
        if (validProviderTests && invalidProviderTests) {
            console.log('✅ Insurance Provider Validation Logic: All provider validations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Insurance provider validation logic failed');
        }
    } catch (error) {
        console.log('❌ Insurance Provider Validation Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Insurance Provider Validation Logic: ${error.message}`);
    }

    // Test 4: Insurance Premium Calculation Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Insurance Premium Calculation Logic...');
        
        const calculateInsurancePremium = (factors) => {
            const {
                baseRate = 0.05, // 5% of coverage
                coverageAmount,
                riskFactors = {},
                discountFactors = {},
                duration = 1 // in days
            } = factors;
            
            if (!coverageAmount || coverageAmount <= 0) {
                throw new Error('Invalid coverage amount');
            }
            
            // Base premium calculation
            let premium = coverageAmount * baseRate;
            
            // Apply risk factors (multiply)
            if (riskFactors.age && riskFactors.age > 65) {
                premium *= 1.2; // 20% increase for seniors
            }
            
            if (riskFactors.activityRisk === 'high') {
                premium *= 1.5; // 50% increase for high-risk activities
            }
            
            if (riskFactors.destination === 'high_risk') {
                premium *= 1.3; // 30% increase for high-risk destinations
            }
            
            // Apply discount factors (divide)
            if (discountFactors.loyalCustomer) {
                premium *= 0.9; // 10% discount for loyal customers
            }
            
            if (discountFactors.bundleDiscount) {
                premium *= 0.85; // 15% discount for bundle purchases
            }
            
            // Apply duration multiplier
            if (duration > 30) {
                premium *= 0.95; // 5% discount for long-term policies
            }
            
            // Round to 2 decimal places
            return Math.round(premium * 100) / 100;
        };
        
        // Test premium calculations
        const testCases = [
            {
                factors: {
                    baseRate: 0.05,
                    coverageAmount: 10000,
                    riskFactors: {},
                    discountFactors: {},
                    duration: 7
                },
                expected: 500 // 10000 * 0.05
            },
            {
                factors: {
                    baseRate: 0.05,
                    coverageAmount: 10000,
                    riskFactors: { age: 70, activityRisk: 'high' },
                    discountFactors: { loyalCustomer: true },
                    duration: 7
                },
                expected: 810 // 10000 * 0.05 * 1.2 * 1.5 * 0.9 = 810
            }
        ];
        
        const premiumCalculationTests = testCases.every(testCase => {
            const result = calculateInsurancePremium(testCase.factors);
            return result === testCase.expected;
        });
        
        if (premiumCalculationTests) {
            console.log('✅ Insurance Premium Calculation Logic: All premium calculations work correctly');
            testResults.passed++;
        } else {
            throw new Error('Insurance premium calculation logic failed');
        }
    } catch (error) {
        console.log('❌ Insurance Premium Calculation Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Insurance Premium Calculation Logic: ${error.message}`);
    }

    // Test 5: Coverage Eligibility Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Coverage Eligibility Logic...');
        
        const checkCoverageEligibility = (user, booking, insuranceType) => {
            const eligibilityResult = {
                eligible: true,
                reasons: [],
                requirements: []
            };
            
            // Age restrictions
            if (insuranceType === 'travel_insurance' && user.age > 75) {
                eligibilityResult.eligible = false;
                eligibilityResult.reasons.push('Age exceeds maximum limit for travel insurance');
            }
            
            if (insuranceType === 'activity_insurance' && user.age < 18) {
                eligibilityResult.eligible = false;
                eligibilityResult.reasons.push('Minimum age requirement not met for activity insurance');
            }
            
            // Medical conditions
            if (user.hasPreExistingConditions && insuranceType === 'medical_insurance') {
                eligibilityResult.requirements.push('Medical examination required');
            }
            
            // Booking value restrictions
            if (booking.value > 100000 && insuranceType === 'comprehensive_insurance') {
                eligibilityResult.requirements.push('Additional documentation required for high-value bookings');
            }
            
            // Geographic restrictions
            if (booking.destination && booking.destination.riskLevel === 'extreme') {
                if (insuranceType === 'travel_insurance') {
                    eligibilityResult.eligible = false;
                    eligibilityResult.reasons.push('Destination not covered by standard travel insurance');
                }
            }
            
            // Time restrictions
            const bookingDate = new Date(booking.startDate);
            const today = new Date();
            const daysDifference = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDifference < 1) {
                eligibilityResult.eligible = false;
                eligibilityResult.reasons.push('Insurance must be purchased at least 1 day before travel');
            }
            
            return eligibilityResult;
        };
        
        // Test eligible cases
        const eligibleCase = checkCoverageEligibility(
            { age: 35, hasPreExistingConditions: false },
            { value: 5000, startDate: '2025-07-15', destination: { riskLevel: 'low' } },
            'travel_insurance'
        );
        
        // Test ineligible cases
        const ineligibleCase = checkCoverageEligibility(
            { age: 80, hasPreExistingConditions: false },
            { value: 5000, startDate: '2025-07-15', destination: { riskLevel: 'low' } },
            'travel_insurance'
        );
        
        // Test requirements case
        const requirementsCase = checkCoverageEligibility(
            { age: 35, hasPreExistingConditions: true },
            { value: 150000, startDate: '2025-07-15', destination: { riskLevel: 'low' } },
            'medical_insurance'
        );
        
        const eligibilityTests = 
            eligibleCase.eligible &&
            !ineligibleCase.eligible &&
            ineligibleCase.reasons.length > 0 &&
            requirementsCase.requirements.length > 0;
        
        if (eligibilityTests) {
            console.log('✅ Coverage Eligibility Logic: All eligibility checks work correctly');
            testResults.passed++;
        } else {
            throw new Error('Coverage eligibility logic failed');
        }
    } catch (error) {
        console.log('❌ Coverage Eligibility Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Coverage Eligibility Logic: ${error.message}`);
    }

    // Test 6: Claim Assessment Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Claim Assessment Logic...');
        
        const assessInsuranceClaim = (claim, policy) => {
            const assessment = {
                approved: false,
                payoutAmount: 0,
                reasons: [],
                requirements: []
            };
            
            // Check if claim amount exceeds coverage
            if (claim.claimAmount > policy.coverageAmount) {
                assessment.reasons.push(`Claim amount (${claim.claimAmount}) exceeds coverage limit (${policy.coverageAmount})`);
                return assessment;
            }
            
            // Check policy status
            if (policy.status !== 'active') {
                assessment.reasons.push('Policy is not active');
                return assessment;
            }
            
            // Check if incident occurred during policy period
            const incidentDate = new Date(claim.incidentDate);
            const policyStart = new Date(policy.startDate);
            const policyEnd = new Date(policy.endDate);
            
            if (incidentDate < policyStart || incidentDate > policyEnd) {
                assessment.reasons.push('Incident occurred outside policy coverage period');
                return assessment;
            }
            
            // Calculate payout amount (considering deductible)
            let payoutAmount = claim.claimAmount;
            if (policy.deductibleAmount && policy.deductibleAmount > 0) {
                payoutAmount = Math.max(0, claim.claimAmount - policy.deductibleAmount);
            }
            
            // Check documentation requirements
            if (claim.claimAmount > 1000 && !claim.documentation) {
                assessment.requirements.push('Documentation required for claims over $1000');
                return assessment;
            }
            
            // Approve claim if all checks pass
            assessment.approved = true;
            assessment.payoutAmount = payoutAmount;
            
            return assessment;
        };
        
        // Test valid claim
        const validClaim = {
            claimAmount: 2000,
            incidentDate: '2025-07-05',
            documentation: true
        };
        
        const validPolicy = {
            coverageAmount: 50000,
            deductibleAmount: 500,
            status: 'active',
            startDate: '2025-07-01',
            endDate: '2025-07-31'
        };
        
        const validAssessment = assessInsuranceClaim(validClaim, validPolicy);
        
        // Test claim exceeding coverage
        const excessiveClaim = {
            claimAmount: 60000,
            incidentDate: '2025-07-05'
        };
        
        const excessiveAssessment = assessInsuranceClaim(excessiveClaim, validPolicy);
        
        // Test inactive policy
        const inactivePolicy = { ...validPolicy, status: 'expired' };
        const inactiveAssessment = assessInsuranceClaim(validClaim, inactivePolicy);
        
        const claimAssessmentTests = 
            validAssessment.approved &&
            validAssessment.payoutAmount === 1500 && // 2000 - 500 deductible
            !excessiveAssessment.approved &&
            !inactiveAssessment.approved;
        
        if (claimAssessmentTests) {
            console.log('✅ Claim Assessment Logic: All claim assessments work correctly');
            testResults.passed++;
        } else {
            throw new Error('Claim assessment logic failed');
        }
    } catch (error) {
        console.log('❌ Claim Assessment Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Claim Assessment Logic: ${error.message}`);
    }

    // Test 7: Risk Assessment Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Risk Assessment Logic...');
        
        const calculateRiskScore = (factors) => {
            let riskScore = 0;
            
            // Age factor
            if (factors.age < 25) riskScore += 2;
            else if (factors.age > 65) riskScore += 3;
            else riskScore += 1;
            
            // Activity risk
            const activityRisks = {
                'low': 1,
                'medium': 3,
                'high': 5,
                'extreme': 8
            };
            riskScore += activityRisks[factors.activityRisk] || 1;
            
            // Destination risk
            const destinationRisks = {
                'safe': 1,
                'moderate': 2,
                'high': 4,
                'extreme': 6
            };
            riskScore += destinationRisks[factors.destinationRisk] || 1;
            
            // Medical history
            if (factors.hasPreExistingConditions) riskScore += 2;
            if (factors.hasPreviousClaims) riskScore += 1;
            
            // Duration factor
            if (factors.tripDuration > 30) riskScore += 1;
            if (factors.tripDuration > 90) riskScore += 2;
            
            return riskScore;
        };
        
        const getRiskCategory = (riskScore) => {
            if (riskScore <= 4) return 'low';
            if (riskScore <= 8) return 'medium';
            if (riskScore <= 12) return 'high';
            return 'extreme';
        };
        
        // Test risk assessments
        const testCases = [
            {
                factors: {
                    age: 30,
                    activityRisk: 'low',
                    destinationRisk: 'safe',
                    hasPreExistingConditions: false,
                    hasPreviousClaims: false,
                    tripDuration: 7
                },
                expectedCategory: 'low'
            },
            {
                factors: {
                    age: 70,
                    activityRisk: 'extreme',
                    destinationRisk: 'extreme',
                    hasPreExistingConditions: true,
                    hasPreviousClaims: true,
                    tripDuration: 100
                },
                expectedCategory: 'extreme'
            }
        ];
        
        const riskAssessmentTests = testCases.every(testCase => {
            const riskScore = calculateRiskScore(testCase.factors);
            const riskCategory = getRiskCategory(riskScore);
            return riskCategory === testCase.expectedCategory;
        });
        
        if (riskAssessmentTests) {
            console.log('✅ Risk Assessment Logic: All risk assessments work correctly');
            testResults.passed++;
        } else {
            throw new Error('Risk assessment logic failed');
        }
    } catch (error) {
        console.log('❌ Risk Assessment Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Risk Assessment Logic: ${error.message}`);
    }

    // Test 8: Policy Lifecycle Management Logic
    try {
        testResults.total++;
        console.log('🔍 Testing Policy Lifecycle Management Logic...');
        
        const managePolicyLifecycle = (policy, action, context = {}) => {
            const result = {
                success: false,
                newStatus: policy.status,
                message: '',
                actions: []
            };
            
            switch (action) {
                case 'activate':
                    if (policy.status === 'pending') {
                        result.success = true;
                        result.newStatus = 'active';
                        result.message = 'Policy activated successfully';
                        result.actions.push('send_confirmation_email');
                    } else {
                        result.message = 'Policy cannot be activated from current status';
                    }
                    break;
                    
                case 'claim':
                    if (policy.status === 'active') {
                        result.success = true;
                        result.newStatus = 'claimed';
                        result.message = 'Claim initiated';
                        result.actions.push('start_claim_process', 'notify_assessor');
                    } else {
                        result.message = 'Claims can only be made on active policies';
                    }
                    break;
                    
                case 'cancel':
                    if (['pending', 'active'].includes(policy.status)) {
                        result.success = true;
                        result.newStatus = 'cancelled';
                        result.message = 'Policy cancelled';
                        if (policy.status === 'active') {
                            result.actions.push('calculate_refund');
                        }
                        result.actions.push('send_cancellation_notice');
                    } else {
                        result.message = 'Policy cannot be cancelled from current status';
                    }
                    break;
                    
                case 'expire':
                    if (policy.status === 'active') {
                        const currentDate = new Date();
                        const endDate = new Date(policy.endDate);
                        if (currentDate >= endDate) {
                            result.success = true;
                            result.newStatus = 'expired';
                            result.message = 'Policy expired';
                            result.actions.push('archive_policy');
                        } else {
                            result.message = 'Policy has not yet reached expiration date';
                        }
                    } else {
                        result.message = 'Only active policies can expire';
                    }
                    break;
                    
                default:
                    result.message = 'Unknown action';
            }
            
            return result;
        };
        
        // Test lifecycle transitions
        const testCases = [
            {
                policy: { status: 'pending', endDate: '2025-12-31' },
                action: 'activate',
                expectedSuccess: true,
                expectedStatus: 'active'
            },
            {
                policy: { status: 'active', endDate: '2025-12-31' },
                action: 'claim',
                expectedSuccess: true,
                expectedStatus: 'claimed'
            },
            {
                policy: { status: 'expired', endDate: '2025-01-01' },
                action: 'claim',
                expectedSuccess: false,
                expectedStatus: 'expired'
            }
        ];
        
        const lifecycleTests = testCases.every(testCase => {
            const result = managePolicyLifecycle(testCase.policy, testCase.action);
            return result.success === testCase.expectedSuccess && 
                   result.newStatus === testCase.expectedStatus;
        });
        
        if (lifecycleTests) {
            console.log('✅ Policy Lifecycle Management Logic: All lifecycle management works correctly');
            testResults.passed++;
        } else {
            throw new Error('Policy lifecycle management logic failed');
        }
    } catch (error) {
        console.log('❌ Policy Lifecycle Management Logic:', error.message);
        testResults.failed++;
        testResults.errors.push(`Policy Lifecycle Management Logic: ${error.message}`);
    }

    // Print results
    console.log('============================================================');
    console.log('📊 INSURANCE SYSTEM LOGIC TEST RESULTS');
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
        console.log('✅ EXCELLENT - All insurance system logic tests passed');
    } else if (testResults.passed / testResults.total >= 0.8) {
        console.log('🟡 GOOD - Insurance system logic needs minor improvements');
    } else {
        console.log('🔴 POOR - Insurance system logic needs significant improvements');
    }
    
    console.log(`📋 Test completed at: ${new Date().toISOString()}`);
}

// Run the tests
runTests().catch(console.error);
