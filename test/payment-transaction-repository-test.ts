// =====================================================
// PAYMENT TRANSACTION REPOSITORY TESTING
// =====================================================

import { PaymentTransactionRepository } from '../src/repositories/PaymentTransactionRepository';
import {
  CreatePaymentTransactionData,
  UpdatePaymentTransactionData,
  PaymentTransactionFilters,
  PaymentTransactionSearchParams
} from '../src/types/paymentTransaction.types';

/**
 * This file provides simple examples for testing the payment transaction repository.
 * Run these functions from a Node.js environment or use them as a reference
 * for integration testing.
 */

// Create repository instance
const repository = new PaymentTransactionRepository();

// Test 1: Create a transaction
async function testCreateTransaction() {
  const transactionData: CreatePaymentTransactionData = {
    userId: 'test_user_001',
    bookingId: 'test_booking_001',
    transactionType: 'booking_payment',
    amount: 30000,
    currency: 'RWF',
    provider: 'stripe',
    providerTransactionId: 'pi_test_' + Date.now(),
    metadata: {
      test: true,
      booking_reference: 'BK-TEST-001',
      environment: 'development'
    },
    createdBy: 'test_script'
  };

  const transaction = await repository.create(transactionData);
  console.log('Created transaction:', transaction);
  return transaction;
}

// Test 2: Find transaction by ID
async function testFindById(id: string) {
  const transaction = await repository.findById(id);
  console.log('Found transaction:', transaction);
  return transaction;
}

// Test 3: Update a transaction
async function testUpdateTransaction(id: string) {
  const updateData: UpdatePaymentTransactionData = {
    status: 'completed',
    processedAt: new Date(),
    providerResponse: JSON.stringify({ status: 'succeeded', id: 'test_' + Date.now() }),
    metadata: { test_updated: true, processed_by: 'test_script' },
    updatedBy: 'test_script'
  };

  const updatedTransaction = await repository.update(id, updateData);
  console.log('Updated transaction:', updatedTransaction);
  return updatedTransaction;
}

// Test 4: Find transactions with filters
async function testFindWithFilters() {
  const filters: PaymentTransactionFilters = {
    transactionType: 'booking_payment',
    status: 'completed',
    amountMin: 10000
  };

  const transactions = await repository.findAll(filters);
  console.log(`Found ${transactions.length} transactions with filters:`, filters);
  console.log('First transaction:', transactions[0]);
  return transactions;
}

// Test 5: Find with pagination
async function testFindWithPagination() {
  const params: PaymentTransactionSearchParams = {
    page: 1,
    limit: 2,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  const result = await repository.findWithPagination(params);
  console.log(`Found ${result.total} transactions, showing page ${result.page} of ${result.totalPages}`);
  console.log('Transactions:', result.transactions);
  return result;
}

// Test 6: Get user transaction summary
async function testGetUserTransactionSummary(userId: string) {
  const summary = await repository.getTransactionSummary(userId);
  console.log('User transaction summary:', summary);
  return summary;
}

// Test 7: Delete a transaction (soft delete)
async function testDeleteTransaction(id: string) {
  const result = await repository.delete(id);
  console.log(`Transaction ${id} deleted:`, result);
  return result;
}

// Run all tests in sequence
async function runAllTests() {
  try {
    // Create a transaction
    const transaction = await testCreateTransaction();
    
    // Find the transaction
    await testFindById(transaction.id);
    
    // Update the transaction
    await testUpdateTransaction(transaction.id);
    
    // Find with filters
    await testFindWithFilters();
    
    // Find with pagination
    await testFindWithPagination();
    
    // Get user summary
    await testGetUserTransactionSummary(transaction.userId);
    
    // Get all transactions (for verification)
    const allTransactions = await repository.getAllTransactions();
    console.log(`Total transactions in repository: ${allTransactions.length}`);
    
    // Delete the transaction
    await testDeleteTransaction(transaction.id);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to run all tests
// runAllTests().catch(console.error);

// Export test functions for individual use
export {
  testCreateTransaction,
  testFindById,
  testUpdateTransaction,
  testFindWithFilters,
  testFindWithPagination,
  testGetUserTransactionSummary,
  testDeleteTransaction,
  runAllTests
};
