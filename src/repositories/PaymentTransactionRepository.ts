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
        bookingId: 'booking_001',
        userId: 'user_001',
        paymentMethodId: 'pm_001',
        transactionType: 'booking_payment',
        amount: 25000.00,
        currency: 'RWF',
        provider: 'mtn_momo',
        providerTransactionId: 'MTN_TXN_123456789',
        providerFee: 500.00,
        status: 'completed',
        processedAt: new Date('2025-07-05T10:30:00Z'),
        createdAt: new Date('2025-07-05T10:25:00Z'),
        createdBy: 'system',
        metadata: {
          booking_reference: 'BK123456',
          payment_description: 'Equipment rental payment',
          user_ip: '192.168.1.1'
        }
      },
      {
        id: 'txn_002',
        bookingId: 'booking_002',
        userId: 'user_002',
        paymentMethodId: 'pm_002',
        transactionType: 'security_deposit',
        amount: 50000.00,
        currency: 'RWF',
        provider: 'stripe',
        providerTransactionId: 'pi_1234567890abcdef',
        providerFee: 1500.00,
        status: 'completed',
        processedAt: new Date('2025-07-05T11:00:00Z'),
        createdAt: new Date('2025-07-05T10:55:00Z'),
        createdBy: 'system',
        metadata: {
          hold_until: '2025-08-05',
          auto_release: true
        }
      },
      {
        id: 'txn_003',
        userId: 'user_003',
        transactionType: 'refund',
        amount: 15000.00,
        currency: 'RWF',
        originalCurrency: 'USD',
        originalAmount: 15.00,
        exchangeRate: 1000.00,
        exchangeRateDate: new Date('2025-07-05'),
        provider: 'airtel_money',
        providerTransactionId: 'AIRTEL_REF_987654321',
        providerFee: 300.00,
        status: 'completed',
        processedAt: new Date('2025-07-05T12:00:00Z'),
        createdAt: new Date('2025-07-05T11:55:00Z'),
        createdBy: 'admin_user',
        metadata: {
          refund_reason: 'Cancelled booking',
          original_transaction_id: 'MTN_TXN_123456789',
          processed_by: 'admin'
        }
      },
      {
        id: 'txn_004',
        userId: 'user_001',
        transactionType: 'platform_fee',
        amount: 2500.00,
        currency: 'RWF',
        provider: 'internal',
        providerFee: 0,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: new Date(),
        createdBy: 'system',
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
      bookingId: data.bookingId || null,
      userId: data.userId,
      paymentMethodId: data.paymentMethodId || null,
      transactionType: data.transactionType,
      amount: data.amount,
      currency: data.currency || 'RWF',
      provider: data.provider,
      providerTransactionId: data.providerTransactionId || null,
      providerFee: data.providerFee || 0,
      status: data.status || 'pending',
      processedAt: null,
      expiresAt: data.expiresAt || null,
      originalCurrency: data.originalCurrency || null,
      originalAmount: data.originalAmount || null,
      exchangeRate: data.exchangeRate || null,
      exchangeRateDate: data.exchangeRateDate || null,
      metadata: data.metadata || null,
      failureReason: null,
      providerResponse: null,
      createdAt: now,
      updatedAt: null,
      createdBy: data.createdBy || null,
      updatedBy: null
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
      if (transaction.provider === provider && transaction.providerTransactionId === providerTransactionId) {
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
        transaction.providerTransactionId?.toLowerCase().includes(searchTerm) ||
        transaction.failureReason?.toLowerCase().includes(searchTerm) ||
        JSON.stringify(transaction.metadata || {}).toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      transactions.sort((a, b) => {
        const aValue = a[params.sortBy!];
        const bValue = b[params.sortBy!];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) return params.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return params.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    } else {
      // Default sort by createdAt desc
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    return this.findAll({ userId });
  }

  /**
   * Find transactions by booking ID
   */
  async findByBookingId(bookingId: string): Promise<PaymentTransactionData[]> {
    return this.findAll({ bookingId });
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
      updatedAt: now,
      // Set processedAt if status is being updated to a final state
      processedAt: updates.status && ['completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'].includes(updates.status)
        ? updates.processedAt || now
        : transaction.processedAt
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
      updatedBy: 'system'
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
      current.createdAt > latest.createdAt ? current : latest
    );

    return {
      userId,
      totalTransactions: userTransactions.length,
      completedTransactions: completedTransactions.length,
      failedTransactions: failedTransactions.length,
      pendingTransactions: pendingTransactions.length,
      totalCompletedAmount,
      totalFailedAmount,
      lastTransactionDate: lastTransaction.createdAt,
      uniqueProvidersUsed: uniqueProviders
    };
  }

  /**
   * Apply filters to transactions array
   */
  private applyFilters(transactions: PaymentTransactionData[], filters: PaymentTransactionFilters): PaymentTransactionData[] {
    return transactions.filter(transaction => {
      if (filters.userId && transaction.userId !== filters.userId) return false;
      if (filters.bookingId && transaction.bookingId !== filters.bookingId) return false;
      if (filters.paymentMethodId && transaction.paymentMethodId !== filters.paymentMethodId) return false;
      
      if (filters.transactionType) {
        const types = Array.isArray(filters.transactionType) ? filters.transactionType : [filters.transactionType];
        if (!types.includes(transaction.transactionType)) return false;
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
      if (filters.amountMin && transaction.amount < filters.amountMin) return false;
      if (filters.amountMax && transaction.amount > filters.amountMax) return false;
      if (filters.createdAfter && transaction.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && transaction.createdAt > filters.createdBefore) return false;
      if (filters.processedAfter && (!transaction.processedAt || transaction.processedAt < filters.processedAfter)) return false;
      if (filters.processedBefore && (!transaction.processedAt || transaction.processedAt > filters.processedBefore)) return false;
      
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
