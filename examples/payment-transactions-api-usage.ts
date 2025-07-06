// =====================================================
// PAYMENT TRANSACTIONS API USAGE EXAMPLES
// =====================================================

/**
 * This file contains comprehensive examples of how to use the Payment Transactions API
 * in the UrutiBiz backend application.
 * 
 * These examples demonstrate:
 * - Creating payment transactions
 * - Processing payments
 * - Managing refunds
 * - Querying and filtering transactions
 * - Getting analytics and summaries
 * 
 * Note: This is for documentation and testing purposes.
 * In production, use proper authentication and error handling.
 */

import axios from 'axios';

// Base configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const API_BASE = `${BASE_URL}/payment-transactions`;

// Type definitions for examples
interface PaymentTransactionExample {
  userId: string;
  bookingId?: string;
  paymentMethodId?: string;
  transactionType: 'booking_payment' | 'security_deposit' | 'refund' | 'partial_refund' | 'platform_fee' | 'insurance_payment' | 'delivery_fee';
  amount: number;
  currency?: 'RWF' | 'USD' | 'EUR';
  provider: 'stripe' | 'mtn_momo' | 'airtel_money' | 'visa' | 'mastercard' | 'paypal' | 'bank' | 'internal';
  metadata?: Record<string, any>;
}

// =====================================================
// 1. CREATING PAYMENT TRANSACTIONS
// =====================================================

/**
 * Example 1: Create a booking payment transaction
 */
export async function createBookingPaymentTransaction() {
  console.log('Creating booking payment transaction...');
  
  const transactionData: PaymentTransactionExample = {
    userId: 'user_123',
    bookingId: 'booking_456',
    paymentMethodId: 'pm_789',
    transactionType: 'booking_payment',
    amount: 25000.00,
    currency: 'RWF',
    provider: 'mtn_momo',
    metadata: {
      booking_reference: 'BK123456',
      payment_description: 'Equipment rental payment',
      user_ip: '192.168.1.1'
    }
  };

  try {
    const response = await axios.post(API_BASE, transactionData);
    console.log('Transaction created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating transaction:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Create a security deposit transaction
 */
export async function createSecurityDepositTransaction() {
  console.log('Creating security deposit transaction...');
  
  const transactionData: PaymentTransactionExample = {
    userId: 'user_123',
    bookingId: 'booking_456',
    paymentMethodId: 'pm_789',
    transactionType: 'security_deposit',
    amount: 50000.00,
    currency: 'RWF',
    provider: 'stripe',
    metadata: {
      hold_until: '2025-08-05',
      auto_release: true,
      deposit_type: 'equipment_damage_protection'
    }
  };

  try {
    const response = await axios.post(API_BASE, transactionData);
    console.log('Security deposit created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating security deposit:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Create a platform fee transaction
 */
export async function createPlatformFeeTransaction() {
  console.log('Creating platform fee transaction...');
  
  const transactionData: PaymentTransactionExample = {
    userId: 'user_123',
    transactionType: 'platform_fee',
    amount: 2500.00,
    currency: 'RWF',
    provider: 'internal',
    metadata: {
      fee_type: 'service_fee',
      percentage: 10.0,
      base_amount: 25000.00,
      calculation_method: 'percentage'
    }
  };

  try {
    const response = await axios.post(API_BASE, transactionData);
    console.log('Platform fee created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating platform fee:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 2. PROCESSING PAYMENTS
// =====================================================

/**
 * Example 4: Process a payment
 */
export async function processPayment() {
  console.log('Processing payment...');
  
  const paymentRequest = {
    userId: 'user_123',
    bookingId: 'booking_456',
    paymentMethodId: 'pm_789',
    amount: 25000.00,
    currency: 'RWF',
    transactionType: 'booking_payment',
    metadata: {
      payment_intent: 'immediate',
      retry_count: 0
    }
  };

  try {
    const response = await axios.post(`${API_BASE}/process`, paymentRequest);
    console.log('Payment processed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 3. MANAGING REFUNDS
// =====================================================

/**
 * Example 5: Process a full refund
 */
export async function processFullRefund(transactionId: string) {
  console.log(`Processing full refund for transaction ${transactionId}...`);
  
  const refundRequest = {
    reason: 'Cancelled booking - customer request',
    metadata: {
      refund_type: 'full',
      processed_by: 'admin_user',
      cancellation_reason: 'Customer changed plans'
    }
  };

  try {
    const response = await axios.post(`${API_BASE}/${transactionId}/refund`, refundRequest);
    console.log('Refund processed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing refund:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Process a partial refund
 */
export async function processPartialRefund(transactionId: string) {
  console.log(`Processing partial refund for transaction ${transactionId}...`);
  
  const refundRequest = {
    amount: 15000.00, // Partial amount
    reason: 'Equipment returned early - partial usage',
    metadata: {
      refund_type: 'partial',
      original_amount: 25000.00,
      days_used: 3,
      days_paid: 5,
      calculated_refund: 15000.00
    }
  };

  try {
    const response = await axios.post(`${API_BASE}/${transactionId}/refund`, refundRequest);
    console.log('Partial refund processed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing partial refund:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 4. QUERYING TRANSACTIONS
// =====================================================

/**
 * Example 7: Get all transactions with pagination
 */
export async function getAllTransactions() {
  console.log('Getting all transactions...');
  
  const params = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  try {
    const response = await axios.get(API_BASE, { params });
    console.log('Transactions retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving transactions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Get transactions with filters
 */
export async function getFilteredTransactions() {
  console.log('Getting filtered transactions...');
  
  const params = {
    page: 1,
    limit: 20,
    userId: 'user_123',
    status: 'completed',
    transactionType: 'booking_payment',
    amountMin: 1000,
    amountMax: 50000,
    createdAfter: '2025-01-01',
    createdBefore: '2025-12-31'
  };

  try {
    const response = await axios.get(API_BASE, { params });
    console.log('Filtered transactions:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving filtered transactions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Search transactions
 */
export async function searchTransactions() {
  console.log('Searching transactions...');
  
  const params = {
    search: 'MTN_TXN',
    page: 1,
    limit: 10
  };

  try {
    const response = await axios.get(API_BASE, { params });
    console.log('Search results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching transactions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 10: Get user transactions
 */
export async function getUserTransactions(userId: string) {
  console.log(`Getting transactions for user ${userId}...`);

  try {
    const response = await axios.get(`${API_BASE}/user/${userId}`);
    console.log('User transactions:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving user transactions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 11: Get booking transactions
 */
export async function getBookingTransactions(bookingId: string) {
  console.log(`Getting transactions for booking ${bookingId}...`);

  try {
    const response = await axios.get(`${API_BASE}/booking/${bookingId}`);
    console.log('Booking transactions:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving booking transactions:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 5. ANALYTICS AND SUMMARIES
// =====================================================

/**
 * Example 12: Get user transaction summary
 */
export async function getUserTransactionSummary(userId: string) {
  console.log(`Getting transaction summary for user ${userId}...`);

  try {
    const response = await axios.get(`${API_BASE}/user/${userId}/summary`);
    console.log('User transaction summary:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving user summary:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 13: Get transaction statistics
 */
export async function getTransactionStatistics() {
  console.log('Getting transaction statistics...');

  try {
    const response = await axios.get(`${API_BASE}/stats`);
    console.log('Transaction statistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving statistics:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 14: Get filtered statistics
 */
export async function getFilteredStatistics() {
  console.log('Getting filtered transaction statistics...');
  
  const params = {
    status: 'completed',
    createdAfter: '2025-01-01',
    provider: 'mtn_momo'
  };

  try {
    const response = await axios.get(`${API_BASE}/stats`, { params });
    console.log('Filtered statistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving filtered statistics:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 6. TRANSACTION MANAGEMENT
// =====================================================

/**
 * Example 15: Update transaction status
 */
export async function updateTransactionStatus(transactionId: string) {
  console.log(`Updating status for transaction ${transactionId}...`);
  
  const updateData = {
    status: 'completed',
    providerTransactionId: 'STRIPE_PI_123456789',
    providerResponse: JSON.stringify({
      status: 'succeeded',
      amount_received: 25000
    })
  };

  try {
    const response = await axios.patch(`${API_BASE}/${transactionId}/status`, updateData);
    console.log('Transaction status updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction status:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 16: Update transaction details
 */
export async function updateTransactionDetails(transactionId: string) {
  console.log(`Updating details for transaction ${transactionId}...`);
  
  const updateData = {
    providerFee: 750.00,
    metadata: {
      updated_fee: true,
      fee_calculation: 'updated_rate'
    },
    updatedBy: 'admin_user'
  };

  try {
    const response = await axios.put(`${API_BASE}/${transactionId}`, updateData);
    console.log('Transaction details updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction details:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 17: Get single transaction
 */
export async function getTransaction(transactionId: string) {
  console.log(`Getting transaction ${transactionId}...`);

  try {
    const response = await axios.get(`${API_BASE}/${transactionId}`);
    console.log('Transaction details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving transaction:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 7. COMPREHENSIVE WORKFLOW EXAMPLES
// =====================================================

/**
 * Example 18: Complete booking payment workflow
 */
export async function completeBookingPaymentWorkflow() {
  console.log('Starting complete booking payment workflow...');
  
  try {
    // Step 1: Create the payment transaction
    const transaction = await createBookingPaymentTransaction();
    console.log('Step 1 - Transaction created:', transaction.id);
    
    // Step 2: Process the payment
    const paymentResult = await processPayment();
    console.log('Step 2 - Payment processed:', paymentResult.success);
    
    // Step 3: Get updated transaction details
    const updatedTransaction = await getTransaction(transaction.id);
    console.log('Step 3 - Final status:', updatedTransaction.data.status);
    
    return {
      success: true,
      transactionId: transaction.id,
      paymentSuccess: paymentResult.success,
      finalStatus: updatedTransaction.data.status
    };
  } catch (error) {
    console.error('Booking payment workflow failed:', error);
    throw error;
  }
}

/**
 * Example 19: Complete refund workflow
 */
export async function completeRefundWorkflow(originalTransactionId: string) {
  console.log('Starting complete refund workflow...');
  
  try {
    // Step 1: Get original transaction
    const originalTransaction = await getTransaction(originalTransactionId);
    console.log('Step 1 - Original transaction:', originalTransaction.data.status);
    
    // Step 2: Process the refund
    const refundResult = await processFullRefund(originalTransactionId);
    console.log('Step 2 - Refund processed:', refundResult.success);
    
    // Step 3: Get refund transaction details
    if (refundResult.refundTransactionId) {
      const refundTransaction = await getTransaction(refundResult.refundTransactionId);
      console.log('Step 3 - Refund status:', refundTransaction.data.status);
    }
    
    return {
      success: true,
      originalTransactionId,
      refundTransactionId: refundResult.refundTransactionId,
      refundSuccess: refundResult.success
    };
  } catch (error) {
    console.error('Refund workflow failed:', error);
    throw error;
  }
}

// =====================================================
// 8. ERROR HANDLING EXAMPLES
// =====================================================

/**
 * Example 20: Handle common errors
 */
export async function demonstrateErrorHandling() {
  console.log('Demonstrating error handling...');
  
  // Example 1: Invalid transaction ID
  try {
    await getTransaction('invalid_id');
  } catch (error) {
    console.log('Expected error for invalid ID:', error.response?.data.message);
  }
  
  // Example 2: Invalid payment data
  try {
    const invalidPayment = {
      userId: '', // Invalid - empty
      amount: -100, // Invalid - negative
      transactionType: 'invalid_type' // Invalid type
    };
    await axios.post(API_BASE, invalidPayment);
  } catch (error) {
    console.log('Expected validation error:', error.response?.data.message);
  }
  
  // Example 3: Invalid refund
  try {
    await processPartialRefund('non_existent_transaction');
  } catch (error) {
    console.log('Expected refund error:', error.response?.data.message);
  }
}

// =====================================================
// 9. HEALTH CHECK AND MONITORING
// =====================================================

/**
 * Example 21: Health check
 */
export async function checkPaymentTransactionHealth() {
  console.log('Checking payment transaction service health...');

  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('Health check result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error.response?.data || error.message);
    throw error;
  }
}

// =====================================================
// 10. TESTING HELPER FUNCTIONS
// =====================================================

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('Running all payment transaction examples...');
  
  try {
    // Check health first
    await checkPaymentTransactionHealth();
    
    // Create transactions
    const bookingTransaction = await createBookingPaymentTransaction();
    const depositTransaction = await createSecurityDepositTransaction();
    await createPlatformFeeTransaction();
    
    // Process payments
    await processPayment();
    
    // Query data
    await getAllTransactions();
    await getFilteredTransactions();
    await searchTransactions();
    await getUserTransactions('user_123');
    
    // Analytics
    await getTransactionStatistics();
    await getUserTransactionSummary('user_123');
    
    // Refunds
    await processPartialRefund(bookingTransaction.id);
    
    // Error handling
    await demonstrateErrorHandling();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export all functions for use in tests or other modules
export {
  createBookingPaymentTransaction,
  createSecurityDepositTransaction,
  createPlatformFeeTransaction,
  processPayment,
  processFullRefund,
  processPartialRefund,
  getAllTransactions,
  getFilteredTransactions,
  searchTransactions,
  getUserTransactions,
  getBookingTransactions,
  getUserTransactionSummary,
  getTransactionStatistics,
  getFilteredStatistics,
  updateTransactionStatus,
  updateTransactionDetails,
  getTransaction,
  completeBookingPaymentWorkflow,
  completeRefundWorkflow,
  demonstrateErrorHandling,
  checkPaymentTransactionHealth
};

// If running this file directly, run all examples
if (require.main === module) {
  runAllExamples().catch(console.error);
}
