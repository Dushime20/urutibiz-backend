/**
 * Test script to validate InsuranceClaimRepository compilation
 */

async function testInsuranceClaimRepository() {
  console.log('🧪 Testing InsuranceClaimRepository compilation...');
  
  try {
    // Test that the repository can be imported without compilation errors
    const repository = require('./src/repositories/InsuranceClaimRepository.knex');
    
    console.log('✅ Repository imported successfully');
    console.log('✅ Repository class available:', typeof repository.InsuranceClaimRepository);
    
    console.log('🎉 All tests passed! InsuranceClaimRepository compiles correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testInsuranceClaimRepository().catch(console.error);
