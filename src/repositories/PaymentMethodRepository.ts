// =====================================================
// PAYMENT METHODS REPOSITORY
// =====================================================

import { 
  PaymentMethodData, 
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
  PaymentMethodFilters,
  PaymentMethodType,
  PaymentProvider
} from '@/types/paymentMethod.types';
import { getDatabase } from '@/config/database';

export class PaymentMethodRepository {
  private db = getDatabase();

  /**
   * Return all payment methods in the database
   */
  async findAll(): Promise<PaymentMethodData[]> {
    return await this.db<PaymentMethodData>('payment_methods').select('*');
  }

  /**
   * Find payment method by ID
   */
  async findById(id: string): Promise<PaymentMethodData | null> {
    const result = await this.db<PaymentMethodData>('payment_methods').where({ id }).first();
    return result || null;
  }

  /**
   * Find all payment methods for a user
   */
  async findByUserId(userId: string): Promise<PaymentMethodData[]> {
    return await this.db<PaymentMethodData>('payment_methods').where({ user_id: userId }).select('*');
  }

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodData): Promise<PaymentMethodData> {
    const [created] = await this.db<PaymentMethodData>('payment_methods')
      .insert({ ...data, created_at: new Date(), updated_at: new Date() })
      .returning('*');
    return created;
  }

  /**
   * Update payment method
   */
  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethodData | null> {
    const [updated] = await this.db<PaymentMethodData>('payment_methods')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return updated || null;
  }

  /**
   * Delete payment method
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await this.db<PaymentMethodData>('payment_methods').where({ id }).del();
    return deleted > 0;
  }

  /**
   * Verify a payment method
   */
  async verify(id: string): Promise<PaymentMethodData | null> {
    return this.update(id, { isVerified: true });
  }

  /**
   * Set payment method as default
   */
  async setAsDefault(id: string): Promise<PaymentMethodData | null> {
    const method = await this.findById(id);
    if (!method) {
      return null;
    }

    // Unset other default methods for the user
    await this.unsetDefaultForUser(method.userId);

    // Set this method as default
    return this.update(id, { isDefault: true });
  }

  /**
   * Unset default status for all user's payment methods
   */
  async unsetDefaultForUser(userId: string): Promise<void> {
    const userMethods = await this.findByUserId(userId);
    
    for (const method of userMethods) {
      if (method.isDefault) {
        await this.update(method.id, { isDefault: false });
      }
    }
  }

  /**
   * Get payment method statistics
   */
  async getStatistics(userId?: string): Promise<{
    totalMethods: number;
    methodsByType: Record<PaymentMethodType, number>;
    methodsByProvider: Record<string, number>;
    verifiedCount: number;
    defaultCount: number;
  }> {
    const methods = userId 
      ? await this.findByUserId(userId)
      : await this.findAll();

    const methodsByType: Record<PaymentMethodType, number> = {
      'card': 0,
      'mobile_money': 0,
      'bank_transfer': 0
    };

    const methodsByProvider: Record<string, number> = {};
    let verifiedCount = 0;
    let defaultCount = 0;

    methods.forEach(method => {
      // Count by type
      methodsByType[method.type]++;

      // Count by provider
      if (method.provider) {
        methodsByProvider[method.provider] = (methodsByProvider[method.provider] || 0) + 1;
      }

      // Count verified and default
      if (method.isVerified) verifiedCount++;
      if (method.isDefault) defaultCount++;
    });

    return {
      totalMethods: methods.length,
      methodsByType,
      methodsByProvider,
      verifiedCount,
      defaultCount
    };
  }

  /**
   * Find expired card payment methods
   */
  async findExpiredCards(): Promise<PaymentMethodData[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    return (await this.findAll()).filter(method => {
      if (method.type !== 'card' || !method.expYear || !method.expMonth) {
        return false;
      }

      // Card is expired if exp year is past, or exp year is current but month is past
      return method.expYear < currentYear || 
             (method.expYear === currentYear && method.expMonth < currentMonth);
    });
  }

  /**
   * Find cards expiring soon (within next 2 months)
   */
  async findCardsExpiringSoon(): Promise<PaymentMethodData[]> {
    const currentDate = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(currentDate.getMonth() + 2);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const futureYear = twoMonthsFromNow.getFullYear();
    const futureMonth = twoMonthsFromNow.getMonth() + 1;

    return (await this.findAll()).filter(method => {
      if (method.type !== 'card' || !method.expYear || !method.expMonth) {
        return false;
      }

      // Check if card expires within the next 2 months
      const isCurrentOrFutureYear = method.expYear >= currentYear && method.expYear <= futureYear;
      const isWithinTimeframe = (method.expYear === currentYear && method.expMonth >= currentMonth) ||
                               (method.expYear === futureYear && method.expMonth <= futureMonth);

      return isCurrentOrFutureYear && isWithinTimeframe;
    });
  }

  async findPaginated(
    filters: PaymentMethodFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    data: PaymentMethodData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Remove undefined filters
    const cleanedFilters: Record<string, any> = {};
    for (const key in filters) {
      if (filters[key] !== undefined) {
        cleanedFilters[key] = filters[key];
      }
    }

    // Count query (no orderBy)
    const countQuery = this.db<PaymentMethodData>('payment_methods').where(cleanedFilters);
    const total = await countQuery.count<{ count: string }[]>('* as count');
    const totalCount = parseInt(total[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Data query (with orderBy)
    const data = await this.db<PaymentMethodData>('payment_methods')
      .where(cleanedFilters)
      .orderBy(sortBy, sortOrder)
      .offset(offset)
      .limit(limit)
      .select('*');

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    };
  }
}

export default new PaymentMethodRepository();
