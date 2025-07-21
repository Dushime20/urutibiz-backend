// =====================================================
// PAYMENT METHODS SERVICE
// =====================================================

import PaymentMethodRepository from '../repositories/PaymentMethodRepository';
import { 
  PaymentMethodData, 
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
  PaymentMethodFilters,
  CardValidationData,
  MobileMoneyValidationData,
  PaymentMethodAnalytics,
  PaymentMethodType,
  PaymentProvider
} from '@/types/paymentMethod.types';

class PaymentMethodService {
  private repository = PaymentMethodRepository;

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodData): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      // Validate the payment method data
      const validation = await this.validatePaymentMethodData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Create the payment method
      const paymentMethod = await this.repository.create(data);

      return { success: true, data: paymentMethod };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return { success: false, error: 'Failed to create payment method' };
    }
  }

  /**
   * Get payment method by ID
   */
  async getById(id: string): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      const paymentMethod = await this.repository.findById(id);
      
      if (!paymentMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      return { success: true, data: paymentMethod };
    } catch (error) {
      console.error('Error fetching payment method:', error);
      return { success: false, error: 'Failed to fetch payment method' };
    }
  }

  /**
   * Get all payment methods for a user
   */
  async getByUserId(userId: string): Promise<{ success: boolean; data?: PaymentMethodData[]; error?: string }> {
    try {
      const paymentMethods = await this.repository.findByUserId(userId);
      return { success: true, data: paymentMethods };
    } catch (error) {
      console.error('Error fetching user payment methods:', error);
      return { success: false, error: 'Failed to fetch payment methods' };
    }
  }

  /**
   * Get user's default payment method
   */
  async getDefaultByUserId(userId: string): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      const defaultMethod = await this.repository.findDefaultByUserId(userId);
      
      if (!defaultMethod) {
        return { success: false, error: 'No default payment method found' };
      }

      return { success: true, data: defaultMethod };
    } catch (error) {
      console.error('Error fetching default payment method:', error);
      return { success: false, error: 'Failed to fetch default payment method' };
    }
  }

  /**
   * Get paginated payment methods with filters
   */
  async getPaginated(
    filters: PaymentMethodFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.repository.findPaginated(filters, page, limit, sortBy, sortOrder);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching paginated payment methods:', error);
      return { success: false, error: 'Failed to fetch payment methods' };
    }
  }

  /**
   * Update payment method
   */
  async update(id: string, data: UpdatePaymentMethodData): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      const updatedMethod = await this.repository.update(id, data);
      
      if (!updatedMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      return { success: true, data: updatedMethod };
    } catch (error) {
      console.error('Error updating payment method:', error);
      return { success: false, error: 'Failed to update payment method' };
    }
  }

  /**
   * Delete payment method
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await this.repository.delete(id);
      
      if (!deleted) {
        return { success: false, error: 'Payment method not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return { success: false, error: 'Failed to delete payment method' };
    }
  }

  /**
   * Verify payment method
   */
  async verify(id: string): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      // In production, this would involve actual verification with payment providers
      const verifiedMethod = await this.repository.verify(id);
      
      if (!verifiedMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      return { success: true, data: verifiedMethod };
    } catch (error) {
      console.error('Error verifying payment method:', error);
      return { success: false, error: 'Failed to verify payment method' };
    }
  }

  /**
   * Set payment method as default
   */
  async setAsDefault(id: string, userId: string): Promise<{ success: boolean; data?: PaymentMethodData; error?: string }> {
    try {
      // Verify the payment method belongs to the user
      const method = await this.repository.findById(id);
      if (!method) {
        return { success: false, error: 'Payment method not found' };
      }

      if (method.user_id !== userId) {
        return { success: false, error: 'Unauthorized to modify this payment method' };
      }

      const defaultMethod = await this.repository.setAsDefault(id);
      
      if (!defaultMethod) {
        return { success: false, error: 'Failed to set as default' };
      }

      return { success: true, data: defaultMethod };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return { success: false, error: 'Failed to set default payment method' };
    }
  }

  /**
   * Get payment method analytics
   */
  async getAnalytics(userId?: string): Promise<{ success: boolean; data?: PaymentMethodAnalytics; error?: string }> {
    try {
      const stats = await this.repository.getStatistics(userId);
      const recentlyAdded = userId 
        ? (await this.repository.findByUserId(userId)).slice(0, 5)
        : [];

      const analytics: PaymentMethodAnalytics = {
        total_methods: stats.totalMethods,
        methods_by_type: stats.methodsByType,
        methods_by_provider: stats.methodsByProvider,
        methods_by_currency: {}, // Could be implemented if needed
        verification_rate: stats.totalMethods > 0 ? (stats.verifiedCount / stats.totalMethods) * 100 : 0,
        default_methods_count: stats.defaultCount,
        recently_added
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error generating analytics:', error);
      return { success: false, error: 'Failed to generate analytics' };
    }
  }

  /**
   * Get expired payment methods
   */
  async getExpiredMethods(): Promise<{ success: boolean; data?: PaymentMethodData[]; error?: string }> {
    try {
      const expiredMethods = await this.repository.findExpiredCards();
      return { success: true, data: expiredMethods };
    } catch (error) {
      console.error('Error fetching expired payment methods:', error);
      return { success: false, error: 'Failed to fetch expired payment methods' };
    }
  }

  /**
   * Get payment methods expiring soon
   */
  async getMethodsExpiringSoon(): Promise<{ success: boolean; data?: PaymentMethodData[]; error?: string }> {
    try {
      const expiringSoon = await this.repository.findCardsExpiringSoon();
      return { success: true, data: expiringSoon };
    } catch (error) {
      console.error('Error fetching methods expiring soon:', error);
      return { success: false, error: 'Failed to fetch methods expiring soon' };
    }
  }

  /**
   * Validate card data
   */
  private validateCard(data: CardValidationData): { isValid: boolean; error?: string } {
    // Basic card number validation (Luhn algorithm)
    if (!this.isValidCardNumber(data.card_number)) {
      return { isValid: false, error: 'Invalid card number' };
    }

    // Expiry date validation
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (data.exp_year < currentYear || (data.exp_year === currentYear && data.exp_month < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    if (data.exp_month < 1 || data.exp_month > 12) {
      return { isValid: false, error: 'Invalid expiry month' };
    }

    // CVV validation
    if (!/^\d{3,4}$/.test(data.cvv)) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    return { isValid: true };
  }

  /**
   * Validate mobile money data
   */
  private validateMobileMoney(data: MobileMoneyValidationData): { isValid: boolean; error?: string } {
    // Phone number validation
    if (!/^[+\d\s\-()]{10,15}$/.test(data.phone_number)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Provider validation
    const validMobileProviders: PaymentProvider[] = ['mtn_momo', 'airtel_money'];
    if (!validMobileProviders.includes(data.provider)) {
      return { isValid: false, error: 'Invalid mobile money provider' };
    }

    return { isValid: true };
  }

  /**
   * Validate payment method data
   */
  private async validatePaymentMethodData(data: CreatePaymentMethodData): Promise<{ isValid: boolean; error?: string }> {
    // Type validation
    const validTypes: PaymentMethodType[] = ['card', 'mobile_money', 'bank_transfer'];
    if (!validTypes.includes(data.type)) {
      return { isValid: false, error: 'Invalid payment method type' };
    }

    // Type-specific validation
    if (data.type === 'card') {
      if (!data.last_four || !data.exp_month || !data.exp_year) {
        return { isValid: false, error: 'Card details are required for card payment methods' };
      }

      if (data.exp_month < 1 || data.exp_month > 12) {
        return { isValid: false, error: 'Invalid expiry month' };
      }

      const currentYear = new Date().getFullYear();
      if (data.exp_year < currentYear || data.exp_year > currentYear + 20) {
        return { isValid: false, error: 'Invalid expiry year' };
      }
    }

    if (data.type === 'mobile_money') {
      if (!data.phone_number) {
        return { isValid: false, error: 'Phone number is required for mobile money payment methods' };
      }

      if (!/^[+\d\s\-()]{10,15}$/.test(data.phone_number)) {
        return { isValid: false, error: 'Invalid phone number format' };
      }
    }

    return { isValid: true };
  }

  /**
   * Luhn algorithm for card number validation
   */
  private isValidCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card brand from card number
   */
  getCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    if (/^30[0-5]/.test(cleanNumber)) return 'diners';
    if (/^35/.test(cleanNumber)) return 'jcb';
    if (/^62/.test(cleanNumber)) return 'unionpay';
    
    return 'unknown';
  }

  async getAll() {
    // Fetch all payment methods from the database
    const paymentMethods = await this.repository.findAll();
    return { success: true, data: paymentMethods };
  }
}

export default new PaymentMethodService();
