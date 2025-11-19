// =====================================================
// PAYMENT TRANSACTION REPOSITORY
// =====================================================

import { 
  PaymentTransactionData, 
  CreatePaymentTransactionData, 
  UpdatePaymentTransactionData, 
  PaymentTransactionFilters,
  PaymentTransactionSearchParams,
  TransactionSummary,
  PaymentStatus,
  PaymentProvider
} from '../types/paymentTransaction.types';

/**
 * In-memory repository for payment transactions
 * This is a temporary implementation for development and testing.
 * In production, this should be replaced with a proper database implementation.
 */
export class PaymentTransactionRepository {
  private transactions: Map<string, PaymentTransactionData> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize with sample data for development and testing
   */
  private initializeSampleData(): void {
    const sampleTransactions: PaymentTransactionData[] = [
      {
        id: 'txn_001',
        booking_id: 'booking_001',
        user_id: 'user_001',
        payment_method_id: 'pm_001',
        transaction_type: 'booking_payment',
        amount: 25000.00,
        currency: 'RWF',
        provider: 'mtn_momo',
        provider_transaction_id: 'MTN_TXN_123456789',
        provider_fee: 500.00,
        status: 'completed',
        processed_at: new Date('2025-07-05T10:30:00Z'),
        created_at: new Date('2025-07-05T10:25:00Z'),
        created_by: 'system',
        metadata: {
          booking_reference: 'BK123456',
          payment_description: 'Equipment rental payment',
          user_ip: '192.168.1.1'
        }
      },
      {
        id: 'txn_002',
        booking_id: 'booking_002',
        user_id: 'user_002',
        payment_method_id: 'pm_002',
        transaction_type: 'security_deposit',
        amount: 50000.00,
        currency: 'RWF',
        provider: 'stripe',
        provider_transaction_id: 'pi_1234567890abcdef',
        provider_fee: 1500.00,
        status: 'completed',
        processed_at: new Date('2025-07-05T11:00:00Z'),
        created_at: new Date('2025-07-05T10:55:00Z'),
        created_by: 'system',
        metadata: {
          hold_until: '2025-08-05',
          auto_release: true
        }
      },
      {
        id: 'txn_003',
        user_id: 'user_003',
        transaction_type: 'refund',
        amount: 15000.00,
        currency: 'RWF',
        original_currency: 'USD',
        original_amount: 15.00,
        exchange_rate: 1000.00,
        exchange_rate_date: new Date('2025-07-05'),
        provider: 'airtel_money',
        provider_transaction_id: 'AIRTEL_REF_987654321',
        provider_fee: 300.00,
        status: 'completed',
        processed_at: new Date('2025-07-05T12:00:00Z'),
        created_at: new Date('2025-07-05T11:55:00Z'),
        created_by: 'admin_user',
        metadata: {
          refund_reason: 'Cancelled booking',
          original_transaction_id: 'MTN_TXN_123456789',
          processed_by: 'admin'
        }
      },
      {
        id: 'txn_004',
        user_id: 'user_001',
        transaction_type: 'platform_fee',
        amount: 2500.00,
        currency: 'RWF',
        provider: 'internal',
        provider_fee: 0,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: new Date(),
        created_by: 'system',
        metadata: {
          fee_type: 'service_fee',
          percentage: 10.0,
          base_amount: 25000.00
        }
      }
    ];

    sampleTransactions.forEach(transaction => {
      this.transactions.set(transaction.id, transaction);
    });

    this.nextId = sampleTransactions.length + 1;
  }

  /**
   * Generate a new unique ID for a transaction
   */
  private generateId(): string {
    return `txn_${String(this.nextId++).padStart(3, '0')}`;
  }

  /**
   * Create a new payment transaction
   */
  async create(data: CreatePaymentTransactionData): Promise<PaymentTransactionData> {
    const now = new Date();
    const transaction: PaymentTransactionData = {
      id: this.generateId(),
      booking_id: data.booking_id || null,
      user_id: data.user_id,
      payment_method_id: data.payment_method_id || null,
      transaction_type: data.transaction_type,
      amount: data.amount,
      currency: data.currency || 'RWF',
      provider: data.provider,
      provider_transaction_id: data.provider_transaction_id || null,
      provider_fee: data.provider_fee || 0,
      status: data.status || 'pending',
      processed_at: null,
      expires_at: data.expires_at || null,
      original_currency: data.original_currency || null,
      original_amount: data.original_amount || null,
      exchange_rate: data.exchange_rate || null,
      exchange_rate_date: data.exchange_rate_date || null,
      metadata: data.metadata || null,
      failure_reason: null,
      provider_response: null,
      created_at: now,
      updated_at: null,
      created_by: data.created_by || null,
      updated_by: null
    };

    this.transactions.set(transaction.id, transaction);
    return { ...transaction };
  }

  /**
   * Find a transaction by ID
   */
  async findById(id: string): Promise<PaymentTransactionData | null> {
    const transaction = this.transactions.get(id);
    return transaction ? { ...transaction } : null;
  }

  /**
   * Find a transaction by provider transaction ID
   */
  async findByProviderTransactionId(provider: PaymentProvider, providerTransactionId: string): Promise<PaymentTransactionData | null> {
    const transactions = Array.from(this.transactions.values());
    for (const transaction of transactions) {
      if (transaction.provider === provider && transaction.provider_transaction_id === providerTransactionId) {
        return { ...transaction };
      }
    }
    return null;
  }

  /**
   * Find all transactions with optional filters
   */
  async findAll(filters?: PaymentTransactionFilters): Promise<PaymentTransactionData[]> {
    let transactions = Array.from(this.transactions.values());

    if (filters) {
      transactions = this.applyFilters(transactions, filters);
    }

    return transactions.map(transaction => ({ ...transaction }));
  }

  /**
   * Find transactions with search and pagination
   */
  async findWithPagination(params: PaymentTransactionSearchParams): Promise<{
    transactions: PaymentTransactionData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let transactions = Array.from(this.transactions.values());

    // Apply filters
    if (params) {
      transactions = this.applyFilters(transactions, params);
    }

    // Apply search
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      transactions = transactions.filter(transaction => 
        transaction.id.toLowerCase().includes(searchTerm) ||
        transaction.provider_transaction_id?.toLowerCase().includes(searchTerm) ||
        transaction.failure_reason?.toLowerCase().includes(searchTerm) ||
        JSON.stringify(transaction.metadata || {}).toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (params.sort_by) {
      transactions.sort((a, b) => {
        const sortKey = params.sort_by!;
        const aValue = a[sortKey as keyof PaymentTransactionData];
        const bValue = b[sortKey as keyof PaymentTransactionData];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) return params.sort_order === 'desc' ? 1 : -1;
        if (aValue > bValue) return params.sort_order === 'desc' ? -1 : 1;
        return 0;
      });
    } else {
      // Default sort by created_at desc
      transactions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions.map(transaction => ({ ...transaction })),
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(userId: string): Promise<PaymentTransactionData[]> {
    return this.findAll({ user_id: userId });
  }

  /**
   * Find transactions by booking ID
   */
  async findByBookingId(bookingId: string): Promise<PaymentTransactionData[]> {
    return this.findAll({ booking_id: bookingId });
  }

  /**
   * Update a transaction
   */
  async update(id: string, updates: UpdatePaymentTransactionData): Promise<PaymentTransactionData | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      return null;
    }

    const now = new Date();
    const updatedTransaction: PaymentTransactionData = {
      ...transaction,
      ...updates,
      updated_at: now,
      // Set processed_at if status is being updated to a final state
      processed_at: updates.status && ['completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'].includes(updates.status)
        ? updates.processed_at || now
        : transaction.processed_at
    };

    this.transactions.set(id, updatedTransaction);
    return { ...updatedTransaction };
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: PaymentStatus, updates?: Partial<UpdatePaymentTransactionData>): Promise<PaymentTransactionData | null> {
    return this.update(id, { ...updates, status });
  }

  /**
   * Delete a transaction (soft delete by setting status to cancelled)
   */
  async delete(id: string): Promise<boolean> {
    const transaction = await this.update(id, { 
      status: 'cancelled',
      updated_by: 'system'
    });
    return transaction !== null;
  }

  /**
   * Hard delete a transaction (remove from memory)
   */
  async hardDelete(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  /**
   * Get transaction summary for a user
   */
  async getTransactionSummary(userId: string): Promise<TransactionSummary | null> {
    const userTransactions = await this.findByUserId(userId);
    
    if (userTransactions.length === 0) {
      return null;
    }

    const completedTransactions = userTransactions.filter(t => t.status === 'completed');
    const failedTransactions = userTransactions.filter(t => t.status === 'failed');
    const pendingTransactions = userTransactions.filter(t => t.status === 'pending');
    
    const totalCompletedAmount = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFailedAmount = failedTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const uniqueProviders = new Set(userTransactions.map(t => t.provider)).size;
    const lastTransaction = userTransactions.reduce((latest, current) => 
      current.created_at > latest.created_at ? current : latest
    );

    return {
      user_id: userId,
      total_transactions: userTransactions.length,
      completed_transactions: completedTransactions.length,
      failed_transactions: failedTransactions.length,
      pending_transactions: pendingTransactions.length,
      total_completed_amount: totalCompletedAmount,
      total_failed_amount: totalFailedAmount,
      last_transaction_date: lastTransaction.created_at,
      unique_providers_used: uniqueProviders
    };
  }

  /**
   * Apply filters to transactions array
   */
  private applyFilters(transactions: PaymentTransactionData[], filters: PaymentTransactionFilters): PaymentTransactionData[] {
    return transactions.filter(transaction => {
      if (filters.user_id && transaction.user_id !== filters.user_id) return false;
      if (filters.booking_id && transaction.booking_id !== filters.booking_id) return false;
      if (filters.payment_method_id && transaction.payment_method_id !== filters.payment_method_id) return false;
      
      if (filters.transaction_type) {
        const types = Array.isArray(filters.transaction_type) ? filters.transaction_type : [filters.transaction_type];
        if (!types.includes(transaction.transaction_type)) return false;
      }
      
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        if (!statuses.includes(transaction.status)) return false;
      }
      
      if (filters.provider) {
        const providers = Array.isArray(filters.provider) ? filters.provider : [filters.provider];
        if (!providers.includes(transaction.provider)) return false;
      }
      
      if (filters.currency && transaction.currency !== filters.currency) return false;
      if (filters.amount_min && transaction.amount < filters.amount_min) return false;
      if (filters.amount_max && transaction.amount > filters.amount_max) return false;
      if (filters.created_after && transaction.created_at < filters.created_after) return false;
      if (filters.created_before && transaction.created_at > filters.created_before) return false;
      if (filters.processed_after && (!transaction.processed_at || transaction.processed_at < filters.processed_after)) return false;
      if (filters.processed_before && (!transaction.processed_at || transaction.processed_at > filters.processed_before)) return false;
      
      return true;
    });
  }

  /**
   * Get all transactions (for development/debugging)
   */
  async getAllTransactions(): Promise<PaymentTransactionData[]> {
    return Array.from(this.transactions.values()).map(transaction => ({ ...transaction }));
  }

  /**
   * Clear all transactions (for testing)
   */
  async clearAll(): Promise<void> {
    this.transactions.clear();
    this.nextId = 1;
  }

  /**
   * Get transaction count
   */
  async getCount(filters?: PaymentTransactionFilters): Promise<number> {
    const transactions = await this.findAll(filters);
    return transactions.length;
  }
}
