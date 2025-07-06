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
import { v4 as uuidv4 } from 'uuid';

// Demo repository - In-memory implementation for now
export class PaymentMethodRepository {
  private static paymentMethods: PaymentMethodData[] = [];

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodData): Promise<PaymentMethodData> {
    // If this is set as default, unset other default methods for the user
    if (data.isDefault) {
      await this.unsetDefaultForUser(data.userId);
    }

    const paymentMethod: PaymentMethodData = {
      id: uuidv4(),
      ...data,
      isDefault: data.isDefault || false,
      isVerified: false, // New methods start unverified
      currency: data.currency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    PaymentMethodRepository.paymentMethods.push(paymentMethod);
    return paymentMethod;
  }

  /**
   * Find payment method by ID
   */
  async findById(id: string): Promise<PaymentMethodData | null> {
    return PaymentMethodRepository.paymentMethods.find(method => method.id === id) || null;
  }

  /**
   * Find all payment methods for a user
   */
  async findByUserId(userId: string): Promise<PaymentMethodData[]> {
    return PaymentMethodRepository.paymentMethods
      .filter(method => method.userId === userId)
      .sort((a, b) => {
        // Default methods first, then by creation date
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  /**
   * Find user's default payment method
   */
  async findDefaultByUserId(userId: string): Promise<PaymentMethodData | null> {
    return PaymentMethodRepository.paymentMethods.find(
      method => method.userId === userId && method.isDefault
    ) || null;
  }

  /**
   * Find payment methods with filters
   */
  async findWithFilters(filters: PaymentMethodFilters): Promise<PaymentMethodData[]> {
    let filtered = PaymentMethodRepository.paymentMethods;

    if (filters.userId) {
      filtered = filtered.filter(method => method.userId === filters.userId);
    }
    if (filters.type) {
      filtered = filtered.filter(method => method.type === filters.type);
    }
    if (filters.provider) {
      filtered = filtered.filter(method => method.provider === filters.provider);
    }
    if (filters.isDefault !== undefined) {
      filtered = filtered.filter(method => method.isDefault === filters.isDefault);
    }
    if (filters.isVerified !== undefined) {
      filtered = filtered.filter(method => method.isVerified === filters.isVerified);
    }
    if (filters.currency) {
      filtered = filtered.filter(method => method.currency === filters.currency);
    }
    if (filters.paymentProviderId) {
      filtered = filtered.filter(method => method.paymentProviderId === filters.paymentProviderId);
    }

    return filtered;
  }

  /**
   * Find paginated payment methods
   */
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
    let filtered = await this.findWithFilters(filters);

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'provider':
          aValue = a.provider || '';
          bValue = b.provider || '';
          break;
        default:
          aValue = (a as any)[sortBy];
          bValue = (b as any)[sortBy];
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Update payment method
   */
  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethodData | null> {
    const methodIndex = PaymentMethodRepository.paymentMethods.findIndex(method => method.id === id);
    
    if (methodIndex === -1) {
      return null;
    }

    const existingMethod = PaymentMethodRepository.paymentMethods[methodIndex];

    // If setting as default, unset other default methods for the user
    if (data.isDefault && !existingMethod.isDefault) {
      await this.unsetDefaultForUser(existingMethod.userId);
    }

    const updatedMethod = {
      ...existingMethod,
      ...data,
      updatedAt: new Date()
    };

    PaymentMethodRepository.paymentMethods[methodIndex] = updatedMethod;
    return updatedMethod;
  }

  /**
   * Delete payment method
   */
  async delete(id: string): Promise<boolean> {
    const initialLength = PaymentMethodRepository.paymentMethods.length;
    PaymentMethodRepository.paymentMethods = PaymentMethodRepository.paymentMethods.filter(
      method => method.id !== id
    );
    return PaymentMethodRepository.paymentMethods.length < initialLength;
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
      : PaymentMethodRepository.paymentMethods;

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

    return PaymentMethodRepository.paymentMethods.filter(method => {
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

    return PaymentMethodRepository.paymentMethods.filter(method => {
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
}

export default new PaymentMethodRepository();
