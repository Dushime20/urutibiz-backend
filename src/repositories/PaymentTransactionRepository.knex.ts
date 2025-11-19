// =====================================================
// PAYMENT TRANSACTION REPOSITORY - DATABASE IMPLEMENTATION
// =====================================================

import { getDatabase } from '../config/database';
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
 * Database repository for payment transactions using Knex
 * This replaces the in-memory implementation for proper database persistence
 */
export class PaymentTransactionRepository {
  private db = getDatabase();

  /**
   * Create a new payment transaction in the database
   */
  async create(data: CreatePaymentTransactionData): Promise<PaymentTransactionData> {
    const transactionData = {
      id: this.generateId(),
      booking_id: data.booking_id,
      user_id: data.user_id,
      payment_method_id: data.payment_method_id || null, // Make it optional
      transaction_type: data.transaction_type,
      amount: data.amount,
      currency: data.currency || 'RWF',
      original_currency: data.original_currency,
      original_amount: data.original_amount,
      exchange_rate: data.exchange_rate,
      exchange_rate_date: data.exchange_rate_date,
      provider: data.provider,
      provider_transaction_id: data.provider_transaction_id,
      provider_fee: data.provider_fee || 0,
      status: data.status || 'pending',
      failure_reason: data.failure_reason,
      processed_at: data.processed_at,
      created_at: new Date(),
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    };

    console.log('🔧 Inserting transaction data:', JSON.stringify(transactionData, null, 2));

    const [transaction] = await this.db('payment_transactions')
      .insert(transactionData)
      .returning('*');

    console.log('✅ Transaction created in database:', transaction.id);

    // Parse metadata back to object
    if (transaction.metadata) {
      try {
        transaction.metadata = JSON.parse(transaction.metadata);
      } catch (error) {
        console.log('⚠️ Warning: Could not parse metadata JSON:', transaction.metadata);
        transaction.metadata = null;
      }
    }

    return transaction as PaymentTransactionData;
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<PaymentTransactionData | null> {
    const transaction = await this.db('payment_transactions')
      .where('id', id)
      .first();

    if (!transaction) return null;

    // Parse metadata - check if it's already an object (JSONB returns objects)
    if (transaction.metadata) {
      try {
        // Check if metadata is already an object (JSONB returns objects)
        if (typeof transaction.metadata === 'string') {
          transaction.metadata = JSON.parse(transaction.metadata);
        }
        // If it's already an object, leave it as is
      } catch (error) {
        console.log('⚠️ Warning: Could not parse metadata JSON:', transaction.metadata);
        transaction.metadata = null;
      }
    }

    return transaction as PaymentTransactionData;
  }

  /**
   * Find transaction by provider transaction ID
   */
  async findByProviderTransactionId(provider: PaymentProvider, providerTransactionId: string): Promise<PaymentTransactionData | null> {
    const transaction = await this.db('payment_transactions')
      .where({
        provider,
        provider_transaction_id: providerTransactionId
      })
      .first();

    if (!transaction) return null;

    // Parse metadata - check if it's already an object (JSONB returns objects)
    if (transaction.metadata) {
      try {
        // Check if metadata is already an object (JSONB returns objects)
        if (typeof transaction.metadata === 'string') {
          transaction.metadata = JSON.parse(transaction.metadata);
        }
        // If it's already an object, leave it as is
      } catch (error) {
        console.log('⚠️ Warning: Could not parse metadata JSON:', transaction.metadata);
        transaction.metadata = null;
      }
    }

    return transaction as PaymentTransactionData;
  }

  /**
   * Find all transactions with optional filters
   */
  async findAll(filters?: PaymentTransactionFilters): Promise<PaymentTransactionData[]> {
    let query = this.db('payment_transactions');

    // Log filters for debugging
    console.log('[PaymentTransactionRepository] findAll filters:', JSON.stringify(filters, null, 2));

    if (filters) {
      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }
      if (filters.booking_id) {
        query = query.where('booking_id', filters.booking_id);
      }
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.provider) {
        query = query.where('provider', filters.provider);
      }
      if (filters.transaction_type) {
        query = query.where('transaction_type', filters.transaction_type);
      }
      const createdAfter = (filters as any).created_after || (filters as any).date_from;
      const createdBefore = (filters as any).created_before || (filters as any).date_to;
      
      // Log date filters
      console.log('[PaymentTransactionRepository] Date filters:', {
        created_after: createdAfter,
        created_before: createdBefore
      });
      
      if (createdAfter) {
        const dateAfter = createdAfter instanceof Date ? createdAfter : new Date(createdAfter);
        console.log('[PaymentTransactionRepository] Applying created_after filter:', dateAfter.toISOString());
        query = query.where('created_at', '>=', dateAfter);
      }
      if (createdBefore) {
        const dateBefore = createdBefore instanceof Date ? createdBefore : new Date(createdBefore);
        // Add one day to include the entire end date
        dateBefore.setHours(23, 59, 59, 999);
        console.log('[PaymentTransactionRepository] Applying created_before filter:', dateBefore.toISOString());
        query = query.where('created_at', '<=', dateBefore);
      }
    }

    // Log the SQL query for debugging
    const sqlQuery = query.toSQL();
    console.log('[PaymentTransactionRepository] SQL Query:', sqlQuery.sql);
    console.log('[PaymentTransactionRepository] SQL Bindings:', sqlQuery.bindings);

    const transactions = await query.orderBy('created_at', 'desc');
    
    // Log results
    console.log('[PaymentTransactionRepository] Found transactions:', transactions.length);
    if (transactions.length > 0) {
      const totalAmount = transactions.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount) || 0;
        return sum + amount;
      }, 0);
      console.log('[PaymentTransactionRepository] Total amount from DB:', totalAmount);
    }

    // Parse metadata for all transactions
    return transactions.map(t => {
      if (t.metadata) {
        try {
          t.metadata = JSON.parse(t.metadata);
        } catch (error) {
          console.log('⚠️ Warning: Could not parse metadata JSON:', t.metadata);
          t.metadata = null;
        }
      }
      return t as PaymentTransactionData;
    });
  }

  /**
   * Find transactions with pagination
   */
  async findWithPagination(params: PaymentTransactionSearchParams): Promise<{
    transactions: PaymentTransactionData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc', ...filters } = params;
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.db('payment_transactions');

    // Apply filters
    if (filters.user_id) {
      query = query.where('user_id', filters.user_id);
    }
    if (filters.booking_id) {
      query = query.where('booking_id', filters.booking_id);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.provider) {
      query = query.where('provider', filters.provider);
    }
    if (filters.transaction_type) {
      query = query.where('transaction_type', filters.transaction_type);
    }

    // Get total count
    const [{ count }] = await query.clone().count('* as count');

    // Get paginated results - use snake_case column names
    const transactions = await query
      .orderBy(sort_by, sort_order)
      .limit(limit)
      .offset(offset);

    // Parse metadata
    const parsedTransactions = transactions.map(t => {
      if (t.metadata) {
        try {
          t.metadata = JSON.parse(t.metadata);
        } catch (error) {
          console.log('⚠️ Warning: Could not parse metadata JSON:', t.metadata);
          t.metadata = null;
        }
      }
      return t as PaymentTransactionData;
    });

    return {
      transactions: parsedTransactions,
      total: parseInt(count as string),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count as string) / limit)
    };
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(userId: string): Promise<PaymentTransactionData[]> {
    const transactions = await this.db('payment_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    return transactions.map(t => {
      if (t.metadata) {
        try {
          // Check if metadata is already an object
          if (typeof t.metadata === 'string') {
            t.metadata = JSON.parse(t.metadata);
          }
          // If it's already an object, leave it as is
        } catch (error) {
          console.log('⚠️ Warning: Could not parse metadata JSON:', t.metadata);
          t.metadata = null;
        }
      }
      return t as PaymentTransactionData;
    });
  }

  /**
   * Find transactions by booking ID
   */
  async findByBookingId(bookingId: string): Promise<PaymentTransactionData[]> {
    const transactions = await this.db('payment_transactions')
      .where('booking_id', bookingId)
      .orderBy('created_at', 'desc');

    return transactions.map(t => {
      if (t.metadata) {
        try {
          // Check if metadata is already an object
          if (typeof t.metadata === 'string') {
            t.metadata = JSON.parse(t.metadata);
          }
          // If it's already an object, leave it as is
        } catch (error) {
          console.log('⚠️ Warning: Could not parse metadata JSON:', t.metadata);
          t.metadata = null;
        }
      }
      return t as PaymentTransactionData;
    });
  }

  /**
   * Update a transaction
   */
  async update(id: string, updates: UpdatePaymentTransactionData): Promise<PaymentTransactionData | null> {
    const updateData: any = { ...updates };
    
    // Handle metadata serialization
    if (updates.metadata) {
      updateData.metadata = JSON.stringify(updates.metadata);
    }

    const [updated] = await this.db('payment_transactions')
      .where('id', id)
      .update(updateData) // Remove updated_at since column doesn't exist
      .returning('*');

    if (!updated) return null;

    // Parse metadata
    if (updated.metadata) {
      try {
        updated.metadata = JSON.parse(updated.metadata);
      } catch (error) {
        console.log('⚠️ Warning: Could not parse metadata JSON:', updated.metadata);
        updated.metadata = null;
      }
    }

    return updated as PaymentTransactionData;
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: PaymentStatus, updates?: Partial<UpdatePaymentTransactionData>): Promise<PaymentTransactionData | null> {
    return this.update(id, { status, ...updates });
  }

  /**
   * Delete a transaction (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db('payment_transactions')
      .where('id', id)
      .update({ 
        deleted_at: new Date(),
        updated_at: new Date()
      });

    return result > 0;
  }

  /**
   * Hard delete a transaction
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.db('payment_transactions')
      .where('id', id)
      .del();

    return result > 0;
  }

  /**
   * Get transaction summary for a user
   */
  async getTransactionSummary(userId: string): Promise<TransactionSummary | null> {
    const transactions = await this.findByUserId(userId);
    
    if (transactions.length === 0) return null;

    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const failedTransactions = transactions.filter(t => t.status === 'failed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'processing');
    const totalCompletedAmount = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFailedAmount = failedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const uniqueProviders = new Set(transactions.map(t => t.provider));

    return {
      user_id: userId,
      total_transactions: transactions.length,
      completed_transactions: completedTransactions.length,
      failed_transactions: failedTransactions.length,
      pending_transactions: pendingTransactions.length,
      total_completed_amount: totalCompletedAmount,
      total_failed_amount: totalFailedAmount,
      last_transaction_date: transactions[0]?.created_at || new Date(),
      unique_providers_used: uniqueProviders.size
    };
  }

  /**
   * Generate a unique transaction ID
   */
  private generateId(): string {
    // Use proper UUID format instead of custom string
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
  }
}

export default new PaymentTransactionRepository(); 