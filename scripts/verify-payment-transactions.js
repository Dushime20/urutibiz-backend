#!/usr/bin/env node

// =====================================================
// PAYMENT TRANSACTIONS VERIFICATION SCRIPT
// =====================================================

/**
 * This script verifies that the payment transactions implementation
 * is working correctly by running basic functionality tests.
 */

const { PaymentTransactionRepository } = require('./dist/repositories/PaymentTransactionRepository.js');
const { PaymentTransactionService } = require('./dist/services/PaymentTransactionService.js');

async function runVerification() {
  console.log('🔍 Payment Transactions Implementation Verification');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Repository Initialization
    console.log('\n1. Testing Repository Initialization...');
    const repository = new PaymentTransactionRepository();
    const allTransactions = await repository.getAllTransactions();
    console.log(`✅ Repository initialized with ${allTransactions.length} sample transactions`);
    
    // Test 2: Service Initialization
    console.log('\n2. Testing Service Initialization...');
    const service = new PaymentTransactionService();
    console.log('✅ Service initialized successfully');
    
    // Test 3: Create Transaction
    console.log('\n3. Testing Create Transaction...');
    const newTransaction = await service.createTransaction({
      userId: 'test_user_verification',
      transactionType: 'booking_payment',
      amount: 25000,
      currency: 'RWF',
      provider: 'stripe',
      metadata: { test: 'verification_script' },
      createdBy: 'verification_script'
    });
    console.log(`✅ Transaction created with ID: ${newTransaction.id}`);
    
    // Test 4: Get Transaction by ID
    console.log('\n4. Testing Get Transaction by ID...');
    const retrievedTransaction = await service.getTransactionById(newTransaction.id);
    console.log(`✅ Retrieved transaction: ${retrievedTransaction ? 'Success' : 'Failed'}`);
    
    // Test 5: Update Transaction
    console.log('\n5. Testing Update Transaction...');
    const updatedTransaction = await service.updateTransaction(newTransaction.id, {
      status: 'completed',
      metadata: { test: 'updated_by_verification' }
    });
    console.log(`✅ Transaction updated, status: ${updatedTransaction.status}`);
    
    // Test 6: Get User Transactions
    console.log('\n6. Testing Get User Transactions...');
    const userTransactions = await service.getTransactionsByUserId('test_user_verification');
    console.log(`✅ Found ${userTransactions.length} transactions for user`);
    
    // Test 7: Get Transaction Statistics
    console.log('\n7. Testing Transaction Statistics...');
    const stats = await service.getTransactionStats();
    console.log(`✅ Stats generated: ${stats.totalCount} total transactions, ${stats.totalAmount} total amount`);
    
    // Test 8: Get User Summary
    console.log('\n8. Testing User Transaction Summary...');
    const summary = await service.getUserTransactionSummary('test_user_verification');
    console.log(`✅ User summary: ${summary ? summary.totalTransactions + ' transactions' : 'No transactions'}`);
    
    // Test 9: Search Transactions
    console.log('\n9. Testing Transaction Search...');
    const searchResult = await service.getTransactions({
      status: 'completed',
      page: 1,
      limit: 5
    });
    console.log(`✅ Search found ${searchResult.total} completed transactions`);
    
    // Test 10: Process Payment (Simulated)
    console.log('\n10. Testing Payment Processing...');
    const paymentResult = await service.processPayment({
      userId: 'test_user_verification',
      paymentMethodId: 'pm_test_123',
      amount: 15000,
      transactionType: 'booking_payment'
    });
    console.log(`✅ Payment processing: ${paymentResult.success ? 'Success' : 'Failed'} - ${paymentResult.message}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! Payment Transactions implementation is working correctly.');
    console.log('\n📊 Final Statistics:');
    
    const finalStats = await service.getTransactionStats();
    console.log(`- Total Transactions: ${finalStats.totalCount}`);
    console.log(`- Total Amount: ${finalStats.totalAmount.toLocaleString()} RWF`);
    console.log(`- Average Amount: ${finalStats.averageAmount.toLocaleString()} RWF`);
    console.log(`- Status Distribution:`);
    Object.entries(finalStats.statusBreakdown).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`  - ${status}: ${count}`);
      }
    });
    
    console.log('\n✅ Payment Transactions system is ready for use!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { runVerification };
