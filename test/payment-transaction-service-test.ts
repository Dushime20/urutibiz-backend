// =====================================================
// PAYMENT TRANSACTION SERVICE TESTING
// =====================================================

import { PaymentTransactionService } from '../src/services/PaymentTransactionService';
import { PaymentTransactionRepository } from '../src/repositories/PaymentTransactionRepository';
import {
  ProcessPaymentRequest,
  RefundRequest
} from '../src/types/paymentTransaction.types';

/**
 * This file provides simple examples for testing the payment transaction service.
 * It demonstrates the higher-level business logic on top of the repository.
 */

// Create repository and service instances
const repository = new PaymentTransactionRepository();
const service = new PaymentTransactionService(repository);

// Test 1: Process a payment
async function testProcessPayment() {
  const paymentRequest: ProcessPaymentRequest = {
    userId: 'test_user_002',
    bookingId: 'test_booking_002',
    paymentMethodId: 'pm_test_001',
    amount: 45000,
    currency: 'RWF',
    transactionType: 'booking_payment',
    metadata: {
      test: true,
      booking_reference: 'BK-TEST-002',
      product_name: 'Professional Camera Kit',
      environment: 'development'
    }
  };

  try {
    const result = await service.processPayment(paymentRequest);
    console.log('Payment processed:', result);
    return result;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
}

// Test 2: Process a refund
async function testProcessRefund(transactionId: string) {
  const refundRequest: RefundRequest = {
    transactionId,
    reason: 'Customer requested refund',
    metadata: {
      test: true,
      refund_requested_by: 'test_user',
      refund_approved_by: 'test_admin'
    }
  };

  try {
    const result = await service.processRefund(refundRequest);
    console.log('Refund processed:', result);
    return result;
  } catch (error) {
    console.error('Refund processing failed:', error);
    throw error;
  }
}

// Test 3: Get user transaction summary
async function testGetUserTransactionSummary(userId: string) {
  try {
    const summary = await service.getUserTransactionSummary(userId);
    console.log('User transaction summary:', summary);
    return summary;
  } catch (error) {
    console.error('Failed to get user transaction summary:', error);
    throw error;
  }
}

// Test 4: Get transaction statistics
async function testGetTransactionStats() {
  try {
    const stats = await service.getTransactionStats();
    console.log('Transaction statistics:', JSON.stringify(stats, null, 2));
    return stats;
  } catch (error) {
    console.error('Failed to get transaction statistics:', error);
    throw error;
  }
}

// Test 5: Get transaction by ID
async function testGetTransactionById(id: string) {
  try {
    const transaction = await service.getTransactionById(id);
    console.log('Transaction details:', transaction);
    return transaction;
  } catch (error) {
    console.error(`Failed to get transaction with ID ${id}:`, error);
    throw error;
  }
}

// Run all tests in sequence
async function runAllTests() {
  try {
    // Process a payment
    console.log('=== Test 1: Process Payment ===');
    const paymentResult = await testProcessPayment();
    
    if (!paymentResult.success) {
      console.error('Payment failed, stopping tests');
      return;
    }
    
    // Get the transaction details
    console.log('\n=== Test 5: Get Transaction by ID ===');
    const transaction = await testGetTransactionById(paymentResult.transactionId!);
    
    // Process a refund
    console.log('\n=== Test 2: Process Refund ===');
    await testProcessRefund(paymentResult.transactionId!);
    
    // Get user transaction summary
    console.log('\n=== Test 3: Get User Transaction Summary ===');
    await testGetUserTransactionSummary('test_user_002');
    
    // Get transaction statistics
    console.log('\n=== Test 4: Get Transaction Statistics ===');
    await testGetTransactionStats();
    
    console.log('\n✅ All service tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export test functions for individual use
export {
  testProcessPayment,
  testProcessRefund,
  testGetUserTransactionSummary,
  testGetTransactionStats,
  testGetTransactionById,
  runAllTests
};

// Uncomment to run all tests
// runAllTests().catch(console.error);
