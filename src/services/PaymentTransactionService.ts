// =====================================================
// PAYMENT TRANSACTION SERVICE
// =====================================================

import { PaymentTransactionRepository } from '../repositories/PaymentTransactionRepository.knex';
import { getDatabase } from '../config/database';
import { 
  PaymentTransactionData, 
  CreatePaymentTransactionData, 
  UpdatePaymentTransactionData, 
  PaymentTransactionFilters,
  PaymentTransactionSearchParams,
  PaymentTransactionStats,
  TransactionSummary,
  PaymentStatus,
  TransactionType,
  PaymentProvider,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentTransactionError,
  PaymentProviderError
} from '../types/paymentTransaction.types';

/**
 * Service class for managing payment transactions
 * Handles business logic, validation, and coordination between repository and external services
 */
export class PaymentTransactionService {
  private repository: PaymentTransactionRepository;

  constructor(repository?: PaymentTransactionRepository) {
    this.repository = repository || new PaymentTransactionRepository();
  }

  /**
   * Create a new payment transaction
   */
  async createTransaction(data: CreatePaymentTransactionData): Promise<PaymentTransactionData> {
    // Validate transaction data
    await this.validateTransactionData(data);

    // Create the transaction
    const transaction = await this.repository.create(data);

    // Log transaction creation (in production, use proper logging)
    console.log(`Payment transaction created: ${transaction.id} for user ${transaction.user_id}`);

    return transaction;
  }

  /**
   * Get a transaction by ID
   */
  async getTransactionById(id: string): Promise<PaymentTransactionData | null> {
    if (!id) {
      throw new PaymentTransactionError('Transaction ID is required', 'INVALID_ID');
    }

    return await this.repository.findById(id);
  }

  /**
   * Get transactions with filters and pagination
   */
  async getTransactions(params?: PaymentTransactionSearchParams): Promise<{
    transactions: PaymentTransactionData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt' as keyof PaymentTransactionData,
      sortOrder: 'desc' as 'desc',
      ...params
    };

    return await this.repository.findWithPagination(searchParams);
  }

  /**
   * Get transactions by user ID
   */
  async getTransactionsByUserId(userId: string): Promise<PaymentTransactionData[]> {
    if (!userId) {
      throw new PaymentTransactionError('User ID is required', 'INVALID_USER_ID');
    }

    return await this.repository.findByUserId(userId);
  }

  /**
   * Get transactions by booking ID
   */
  async getTransactionsByBookingId(bookingId: string): Promise<PaymentTransactionData[]> {
    if (!bookingId) {
      throw new PaymentTransactionError('Booking ID is required', 'INVALID_BOOKING_ID');
    }

    return await this.repository.findByBookingId(bookingId);
  }

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, updates: UpdatePaymentTransactionData): Promise<PaymentTransactionData> {
    if (!id) {
      throw new PaymentTransactionError('Transaction ID is required', 'INVALID_ID');
    }

    // Validate updates
    await this.validateTransactionUpdates(updates);

    const transaction = await this.repository.update(id, updates);
    
    if (!transaction) {
      throw new PaymentTransactionError('Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Sync booking if status changed and booking_id exists
    if (transaction.booking_id && updates.status) {
      const updatedTransaction = await this.getTransactionById(id);
      if (updatedTransaction) {
        await this.syncBookingWithPaymentTransaction(updatedTransaction);
      }
    }

    // Log transaction update
    console.log(`Payment transaction updated: ${transaction.id} - Status: ${transaction.status}`);

    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    id: string, 
    status: PaymentStatus, 
    updates?: Partial<UpdatePaymentTransactionData>
  ): Promise<PaymentTransactionData> {
    const transaction = await this.getTransactionById(id);
    
    if (!transaction) {
      throw new PaymentTransactionError('Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Validate status transition
    this.validateStatusTransition(transaction.status, status);

    // updateTransaction will handle booking sync when status changes
    return await this.updateTransaction(id, { ...updates, status });
  }

  /**
   * Process a payment (simplified implementation)
   */
  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      // Validate payment request
      await this.validatePaymentRequest(request);

      // Create initial transaction record
      const transaction = await this.createTransaction({
        user_id: request.user_id,
        booking_id: request.booking_id,
        payment_method_id: request.payment_method_id,
        amount: request.amount,
        currency: request.currency,
        transaction_type: request.transaction_type,
        provider: request.provider || 'stripe' as PaymentProvider, // Use provider from request body, fallback to stripeahh
        status: 'pending',
        metadata: request.metadata
      });

      // Simulate payment processing (in production, integrate with actual payment providers)
      const processingResult = await this.simulatePaymentProcessing(transaction);

      // Update transaction with result
      const finalStatuses: PaymentStatus[] = ['completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'];
      const updateData: Partial<UpdatePaymentTransactionData> = {
        status: processingResult.status,
        provider_transaction_id: processingResult.providerTransactionId,
        provider_response: JSON.stringify(processingResult.providerResponse),
        failure_reason: processingResult.failureReason
      };

      // Set processed_at when status is final (required by database constraint)
      if (finalStatuses.includes(processingResult.status)) {
        updateData.processed_at = new Date();
      }

      await this.updateTransaction(transaction.id, updateData);

      // Sync booking with payment transaction (update payment_status and auto-confirm if payment completed)
      if (transaction.booking_id) {
        const updatedTransaction = await this.getTransactionById(transaction.id);
        if (updatedTransaction) {
          await this.syncBookingWithPaymentTransaction(updatedTransaction);
        }
      }

      return {
        success: processingResult.status === 'completed',
        transaction_id: transaction.id,
        status: processingResult.status,
        provider_transaction_id: processingResult.providerTransactionId,
        message: processingResult.status === 'completed' ? 'Payment processed successfully' : 'Payment failed',
        error: processingResult.failureReason
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      
      if (error instanceof PaymentTransactionError || error instanceof PaymentProviderError) {
        throw error;
      }
      
      throw new PaymentTransactionError('Payment processing failed', 'PROCESSING_ERROR', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Process a refund
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const originalTransaction = await this.getTransactionById(request.transaction_id);
      
      if (!originalTransaction) {
        throw new PaymentTransactionError('Original transaction not found', 'TRANSACTION_NOT_FOUND');
      }

      if (originalTransaction.status !== 'completed') {
        throw new PaymentTransactionError('Can only refund completed transactions', 'INVALID_TRANSACTION_STATUS');
      }

      // Determine refund amount
      const refundAmount = request.amount || originalTransaction.amount;
      
      if (refundAmount > originalTransaction.amount) {
        throw new PaymentTransactionError('Refund amount cannot exceed original amount', 'INVALID_REFUND_AMOUNT');
      }

      // Create refund transaction
      const refundTransaction = await this.createTransaction({
        user_id: originalTransaction.user_id,
        booking_id: originalTransaction.booking_id || undefined,
        payment_method_id: originalTransaction.payment_method_id || undefined,
        amount: refundAmount,
        currency: originalTransaction.currency,
        transaction_type: refundAmount === originalTransaction.amount ? 'refund' : 'partial_refund',
        provider: originalTransaction.provider,
        status: 'pending',
        metadata: {
          ...request.metadata,
          original_transaction_id: originalTransaction.id,
          refund_reason: request.reason
        }
      });

      // Simulate refund processing
      const refundResult = await this.simulateRefundProcessing(refundTransaction);

      // Update refund transaction
      const finalStatuses: PaymentStatus[] = ['completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'];
      const updateData: Partial<UpdatePaymentTransactionData> = {
        status: refundResult.status,
        provider_transaction_id: refundResult.provider_transaction_id,
        provider_response: JSON.stringify(refundResult.provider_response),
        failure_reason: refundResult.failure_reason
      };

      // Set processed_at when status is final (required by database constraint)
      if (finalStatuses.includes(refundResult.status)) {
        updateData.processed_at = new Date();
      }

      await this.updateTransaction(refundTransaction.id, updateData);

      // Sync booking with refund transaction
      if (refundTransaction.booking_id) {
        const updatedRefund = await this.getTransactionById(refundTransaction.id);
        if (updatedRefund) {
          await this.syncBookingWithPaymentTransaction(updatedRefund);
        }
      }

      return {
        success: refundResult.status === 'completed',
        refund_transaction_id: refundTransaction.id,
        original_transaction_id: originalTransaction.id,
        refund_amount: refundAmount,
        status: refundResult.status,
        message: refundResult.status === 'completed' ? 'Refund processed successfully' : 'Refund failed',
        error: refundResult.failure_reason
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      
      if (error instanceof PaymentTransactionError) {
        throw error;
      }
      
      throw new PaymentTransactionError('Refund processing failed', 'REFUND_ERROR', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get transaction summary for a user
   */
  async getUserTransactionSummary(userId: string): Promise<TransactionSummary | null> {
    if (!userId) {
      throw new PaymentTransactionError('User ID is required', 'INVALID_USER_ID');
    }

    return await this.repository.getTransactionSummary(userId);
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(filters?: PaymentTransactionFilters): Promise<PaymentTransactionStats> {
    const transactions = await this.repository.findAll(filters);

    if (transactions.length === 0) {
      return this.getEmptyStats();
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCount = transactions.length;
    const averageAmount = totalAmount / totalCount;

    // Status breakdown
    const statusBreakdown: Record<PaymentStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      partially_refunded: 0,
      cancelled: 0
    };

    // Provider breakdown
    const providerBreakdown: Record<string, number> = {};

    // Currency breakdown
    const currencyBreakdown: Record<string, number> = {};

    // Transaction type breakdown
    const transactionTypeBreakdown: Record<string, number> = {};

    transactions.forEach(transaction => {
      statusBreakdown[transaction.status]++;
      providerBreakdown[transaction.provider] = (providerBreakdown[transaction.provider] || 0) + 1;
      currencyBreakdown[transaction.currency] = (currencyBreakdown[transaction.currency] || 0) + 1;
      transactionTypeBreakdown[transaction.transaction_type] = (transactionTypeBreakdown[transaction.transaction_type] || 0) + 1;
    });

    // Monthly trends (simplified - last 12 months)
    const monthlyTrends = this.calculateMonthlyTrends(transactions);

    return {
      totalAmount,
      totalCount,
      averageAmount,
      statusBreakdown,
      providerBreakdown: providerBreakdown as Record<PaymentProvider, number>,
      currencyBreakdown: currencyBreakdown as any,
      transactionTypeBreakdown: transactionTypeBreakdown as Record<TransactionType, number>,
      monthlyTrends
    };
  }

  /**
   * Delete a transaction (soft delete)
   */
  async deleteTransaction(id: string): Promise<boolean> {
    if (!id) {
      throw new PaymentTransactionError('Transaction ID is required', 'INVALID_ID');
    }

    const transaction = await this.getTransactionById(id);
    
    if (!transaction) {
      throw new PaymentTransactionError('Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Only allow deletion of pending or failed transactions
    if (!['pending', 'failed'].includes(transaction.status)) {
      throw new PaymentTransactionError('Cannot delete completed transactions', 'INVALID_OPERATION');
    }

    return await this.repository.delete(id);
  }

  // Private helper methods

  /**
   * Validate transaction data
   */
  private async validateTransactionData(data: CreatePaymentTransactionData): Promise<void> {
    if (!data.user_id) {
      throw new PaymentTransactionError('User ID is required', 'VALIDATION_ERROR');
    }

    if (!data.transaction_type) {
      throw new PaymentTransactionError('Transaction type is required', 'VALIDATION_ERROR');
    }

    if (!data.amount || data.amount <= 0) {
      throw new PaymentTransactionError('Amount must be greater than 0', 'VALIDATION_ERROR');
    }

    if (!data.provider) {
      throw new PaymentTransactionError('Payment provider is required', 'VALIDATION_ERROR');
    }

    // Add more validation as needed
  }

  /**
   * Validate transaction updates
   */
  private async validateTransactionUpdates(updates: UpdatePaymentTransactionData): Promise<void> {
    if (updates.status && !['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'].includes(updates.status)) {
      throw new PaymentTransactionError('Invalid transaction status', 'VALIDATION_ERROR');
    }

    // Add more validation as needed
  }

  /**
   * Validate payment request
   */
  private async validatePaymentRequest(request: ProcessPaymentRequest): Promise<void> {
    if (!request.user_id) {
      throw new PaymentTransactionError('User ID is required', 'VALIDATION_ERROR');
    }

    if (!request.payment_method_id) {
      throw new PaymentTransactionError('Payment method ID is required', 'VALIDATION_ERROR');
    }

    if (!request.amount || request.amount <= 0) {
      throw new PaymentTransactionError('Amount must be greater than 0', 'VALIDATION_ERROR');
    }

    if (!request.transaction_type) {
      throw new PaymentTransactionError('Transaction type is required', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): void {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ['processing', 'completed', 'failed', 'cancelled'],
      processing: ['completed', 'failed'],
      completed: ['refunded', 'partially_refunded'],
      failed: ['pending'], // Allow retry
      refunded: [], // Final state
      partially_refunded: ['refunded'],
      cancelled: [] // Final state
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new PaymentTransactionError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION'
      );
    }
  }

  /**
   * Simulate payment processing (replace with actual payment provider integration)
   */
  private async simulatePaymentProcessing(transaction: PaymentTransactionData): Promise<{
    status: PaymentStatus;
    providerTransactionId?: string;
    providerResponse: Record<string, any>;
    failureReason?: string;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      return {
        status: 'completed',
        providerTransactionId: `${transaction.provider.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerResponse: {
          status: 'success',
          amount: transaction.amount,
          currency: transaction.currency,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        status: 'failed',
        providerResponse: {
          status: 'failed',
          error_code: 'INSUFFICIENT_FUNDS',
          timestamp: new Date().toISOString()
        },
        failureReason: 'Insufficient funds'
      };
    }
  }

  /**
   * Simulate refund processing
   */
  private async simulateRefundProcessing(transaction: PaymentTransactionData): Promise<{
    status: PaymentStatus;
    providerTransactionId?: string;
    providerResponse: Record<string, any>;
    failureReason?: string;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 95% success rate for refunds
    const success = Math.random() > 0.05;

    if (success) {
      return {
        status: 'completed',
        providerTransactionId: `REFUND_${transaction.provider.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerResponse: {
          status: 'success',
          refund_amount: transaction.amount,
          currency: transaction.currency,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        status: 'failed',
        providerResponse: {
          status: 'failed',
          error_code: 'REFUND_FAILED',
          timestamp: new Date().toISOString()
        },
        failureReason: 'Refund processing failed'
      };
    }
  }

  /**
   * Calculate monthly trends
   */
  private calculateMonthlyTrends(transactions: PaymentTransactionData[]): Array<{
    month: string;
    count: number;
    amount: number;
  }> {
    const trends: Record<string, { count: number; amount: number }> = {};

    transactions.forEach(transaction => {
      const created = (transaction as any).created_at || (transaction as any).createdAt;
      if (!created) return;
      const d: Date = created instanceof Date ? created : new Date(created);
      if (isNaN(d.getTime())) return;
      const month = d.toISOString().substring(0, 7); // YYYY-MM

      if (!trends[month]) trends[month] = { count: 0, amount: 0 };
      trends[month].count++;
      trends[month].amount += Number(transaction.amount) || 0;
    });

    return Object.entries(trends)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): PaymentTransactionStats {
    return {
      totalAmount: 0,
      totalCount: 0,
      averageAmount: 0,
      statusBreakdown: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        refunded: 0,
        partially_refunded: 0,
        cancelled: 0
      },
      providerBreakdown: {} as Record<PaymentProvider, number>,
      currencyBreakdown: {} as any,
      transactionTypeBreakdown: {} as Record<TransactionType, number>,
      monthlyTrends: []
    };
  }

  /**
   * Sync booking payment status and booking status based on transaction status
   * Automatically updates booking.payment_status and auto-confirms booking when payment completes
   */
  private async syncBookingWithPaymentTransaction(
    transaction: PaymentTransactionData
  ): Promise<void> {
    if (!transaction.booking_id) {
      return; // No booking to sync
    }

    const db = getDatabase();
    const booking = await db('bookings')
      .where({ id: transaction.booking_id })
      .first();

    if (!booking) {
      console.warn(`[PaymentSync] Booking ${transaction.booking_id} not found`);
      return;
    }

    // Map transaction status to booking payment status
    const paymentStatusMap: Record<PaymentStatus, string> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'refunded': 'refunded',
      'partially_refunded': 'partially_refunded',
      'cancelled': 'failed'
    };

    const newPaymentStatus = paymentStatusMap[transaction.status] || 'pending';
    const updateData: any = {
      payment_status: newPaymentStatus,
      updated_at: new Date()
    };

    // Auto-confirm booking when payment completes successfully
    if (transaction.status === 'completed' && booking.status === 'pending') {
      updateData.status = 'confirmed';
      updateData.confirmed_at = new Date();
      
      // Note: Conflict checking is handled automatically by BookingService.isProductAvailable()
      // which checks for overlapping confirmed/in_progress bookings. The bookings table itself
      // serves as the source of truth for date conflicts - no need to update product_availability.
      console.log(`[PaymentSync] Auto-confirmed booking ${booking.id} after payment completion`);
    }

    // Handle refunds - cancel booking if fully refunded (main payment transaction)
    if (transaction.status === 'refunded' && booking.status !== 'cancelled') {
      // Check if this is the main payment transaction
      const isMainPayment = transaction.transaction_type === 'payment' || 
                            transaction.transaction_type === 'deposit';
      
      if (isMainPayment) {
        updateData.status = 'cancelled';
        updateData.cancelled_at = new Date();
        console.log(`[PaymentSync] Auto-cancelled booking ${booking.id} after full refund`);
      }
    }

    // Update booking
    await db('bookings')
      .where({ id: transaction.booking_id })
      .update(updateData);

    console.log(`[PaymentSync] Updated booking ${transaction.booking_id}: payment_status=${newPaymentStatus}, status=${updateData.status || booking.status}`);
  }
}
