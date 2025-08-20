// =====================================================
// PAYMENT PROVIDER SERVICE
// =====================================================

import { Op, WhereOptions } from 'sequelize';
import { PaymentProviderModel } from '../models/PaymentProvider.model';
import {
  PaymentProvider,
  CreatePaymentProviderRequest,
  UpdatePaymentProviderRequest,
  PaymentProviderFilters,
  PaymentProviderStats,
  CountryPaymentProviders,
  PaymentCalculationResult,
  ProviderComparison,
  BulkProviderOperation,
  PaymentProviderTypes,
} from '../types/paymentProvider.types';

/**
 * Payment Provider Service Class
 */
export class PaymentProviderService {
  /**
   * Create a new payment provider
   */
  async createPaymentProvider(data: CreatePaymentProviderRequest): Promise<PaymentProvider> {
    try {
      // Check if provider already exists for this country
      const existingProvider = await PaymentProviderModel.findOne({
        where: {
          country_id: data.country_id,
          provider_name: data.provider_name.toLowerCase(),
        },
      });

      if (existingProvider) {
        throw new Error(`Payment provider '${data.provider_name}' already exists for country '${data.country_id}'`);
      }

      // Validate currency codes
      if (data.supported_currencies) {
        for (const currency of data.supported_currencies) {
          if (typeof currency !== 'string' || currency.length !== 3) {
            throw new Error(`Invalid currency code: ${currency}. Must be a 3-letter string.`);
          }
        }
      }

      // Validate amount limits
      if (data.min_amount && data.max_amount && data.min_amount >= data.max_amount) {
        throw new Error('Minimum amount must be less than maximum amount');
      }

      // Validate fee percentages
      if (data.fee_percentage && (data.fee_percentage < 0 || data.fee_percentage > 1)) {
        throw new Error('Fee percentage must be between 0 and 1 (0% to 100%)');
      }

      const provider = await PaymentProviderModel.create({
        country_id: data.country_id,
        provider_name: data.provider_name.toLowerCase(),
        provider_type: data.provider_type.toLowerCase(),
        display_name: data.display_name,
        logo_url: data.logo_url,
        is_active: data.is_active ?? true,
        supported_currencies: data.supported_currencies.map(c => c.toUpperCase()),
        min_amount: data.min_amount ?? 0.01,
        max_amount: data.max_amount,
        fee_percentage: data.fee_percentage ?? 0.0,
        fee_fixed: data.fee_fixed ?? 0.0,
        settings: data.settings,
        description: data.description,
        api_endpoint: data.api_endpoint,
        supports_refunds: data.supports_refunds ?? false,
        supports_recurring: data.supports_recurring ?? false,
        processing_time_minutes: data.processing_time_minutes,
      } as any);

      return provider.toJSON();
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`);
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Payment provider already exists for this country and name`);
      }
      throw error;
    }
  }

  /**
   * Get payment provider by ID
   */
  async getPaymentProviderById(id: string): Promise<PaymentProvider | null> {
    try {
      const provider = await PaymentProviderModel.findByPk(id);
      return provider ? provider.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching payment provider: ${(error as Error).message}`);
    }
  }

  /**
   * Get payment providers with filters
   */
  async getPaymentProviders(filters: PaymentProviderFilters = {}): Promise<{
    providers: PaymentProvider[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        country_id,
        provider_name,
        provider_type,
        is_active,
        currency,
        supports_refunds,
        supports_recurring,
        search,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = filters;

      // Build where clause
      const whereClause: WhereOptions = {};

      if (country_id) {
        whereClause.country_id = country_id.toUpperCase();
      }

      if (provider_name) {
        whereClause.provider_name = {
          [Op.iLike]: `%${provider_name}%`,
        };
      }

      if (provider_type) {
        whereClause.provider_type = provider_type.toLowerCase();
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active;
      }

      if (currency) {
        whereClause.supported_currencies = {
          [Op.contains]: [currency.toUpperCase()],
        };
      }

      if (supports_refunds !== undefined) {
        whereClause.supports_refunds = supports_refunds;
      }

      if (supports_recurring !== undefined) {
        whereClause.supports_recurring = supports_recurring;
      }

      if (search) {
        (whereClause as any)[Op.or] = [
          { provider_name: { [Op.iLike]: `%${search}%` } },
          { display_name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query
      const { rows: providers, count: total } = await PaymentProviderModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sort_by, sort_order.toUpperCase()]],
      });

      return {
        providers: providers.map(p => p.toJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching payment providers: ${(error as Error).message}`);
    }
  }

  /**
   * Update payment provider
   */
  async updatePaymentProvider(id: string, data: UpdatePaymentProviderRequest): Promise<PaymentProvider | null> {
    try {
      const provider = await PaymentProviderModel.findByPk(id);
      if (!provider) {
        return null;
      }

      // Validate currency codes if provided
      if (data.supported_currencies) {
        for (const currency of data.supported_currencies) {
          if (typeof currency !== 'string' || currency.length !== 3) {
            throw new Error(`Invalid currency code: ${currency}. Must be a 3-letter string.`);
          }
        }
      }

      // Validate amount limits
      const currentMinAmount = provider.min_amount;
      const newMinAmount = data.min_amount ?? currentMinAmount;
      const newMaxAmount = data.max_amount ?? provider.max_amount;

      if (newMaxAmount && newMinAmount >= newMaxAmount) {
        throw new Error('Minimum amount must be less than maximum amount');
      }

      // Validate fee percentages
      if (data.fee_percentage !== undefined && (data.fee_percentage < 0 || data.fee_percentage > 1)) {
        throw new Error('Fee percentage must be between 0 and 1 (0% to 100%)');
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.supported_currencies) {
        updateData.supported_currencies = data.supported_currencies.map(c => c.toUpperCase());
      }

      await provider.update(updateData);
      return provider.toJSON();
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Delete payment provider
   */
  async deletePaymentProvider(id: string): Promise<boolean> {
    try {
      const provider = await PaymentProviderModel.findByPk(id);
      if (!provider) {
        return false;
      }

      await provider.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error deleting payment provider: ${(error as Error).message}`);
    }
  }

  /**
   * Get payment provider statistics
   */
  async getPaymentProviderStats(): Promise<PaymentProviderStats> {
    try {
      const [
        totalProviders,
        activeProviders,
        inactiveProviders,
        providersWithRefunds,
        providersWithRecurring,
      ] = await Promise.all([
        PaymentProviderModel.count(),
        PaymentProviderModel.count({ where: { is_active: true } }),
        PaymentProviderModel.count({ where: { is_active: false } }),
        PaymentProviderModel.count({ where: { supports_refunds: true } }),
        PaymentProviderModel.count({ where: { supports_recurring: true } }),
      ]);

      // Get providers by country and type
      const allProviders = await PaymentProviderModel.findAll({
        attributes: ['country_id', 'provider_type', 'fee_percentage', 'supported_currencies'],
      });

      const providersByCountry: Record<string, number> = {};
      const providersByType: Record<string, number> = {};
      const allCurrencies = new Set<string>();
      let totalFeePercentage = 0;
      let feeCount = 0;

      for (const provider of allProviders) {
        const data = provider.toJSON();
        
        // Count by country
        providersByCountry[data.country_id] = (providersByCountry[data.country_id] || 0) + 1;
        
        // Count by type
        providersByType[data.provider_type] = (providersByType[data.provider_type] || 0) + 1;
        
        // Collect currencies
        if (data.supported_currencies) {
          data.supported_currencies.forEach(currency => allCurrencies.add(currency));
        }
        
        // Calculate average fee
        if (data.fee_percentage > 0) {
          totalFeePercentage += data.fee_percentage;
          feeCount++;
        }
      }

      return {
        total_providers: totalProviders,
        active_providers: activeProviders,
        inactive_providers: inactiveProviders,
        providers_by_country: providersByCountry,
        providers_by_type: providersByType,
        providers_with_refunds: providersWithRefunds,
        providers_with_recurring: providersWithRecurring,
        average_fee_percentage: feeCount > 0 ? totalFeePercentage / feeCount : 0,
        countries_with_providers: Object.keys(providersByCountry).length,
        supported_currencies: Array.from(allCurrencies).sort(),
      };
    } catch (error) {
      throw new Error(`Error fetching payment provider statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Get payment providers by country
   */
  async getPaymentProvidersByCountry(countryId: string): Promise<CountryPaymentProviders> {
    try {
      const providers = await PaymentProviderModel.findAll({
        where: { country_id: countryId },
        order: [['provider_name', 'ASC']],
      });

      const providerData = providers.map(p => p.toJSON());
      
      // Group providers by type
      const mobileMoneyProviders = providerData.filter(p => p.provider_type === PaymentProviderTypes.MOBILE_MONEY);
      const cardProviders = providerData.filter(p => p.provider_type === PaymentProviderTypes.CARD);
      const bankTransferProviders = providerData.filter(p => p.provider_type === PaymentProviderTypes.BANK_TRANSFER);
      const digitalWalletProviders = providerData.filter(p => p.provider_type === PaymentProviderTypes.DIGITAL_WALLET);
      const activeProviders = providerData.filter(p => p.is_active);

      // Get unique supported currencies
      const supportedCurrencies = Array.from(new Set(
        providerData.flatMap(p => p.supported_currencies)
      )).sort();

      return {
        country_id: countryId.toUpperCase(),
        country_name: '', // This would need to be fetched from a countries table
        country_code: countryId.toUpperCase(),
        providers: providerData,
        mobile_money_providers: mobileMoneyProviders,
        card_providers: cardProviders,
        bank_transfer_providers: bankTransferProviders,
        digital_wallet_providers: digitalWalletProviders,
        active_providers: activeProviders,
        supported_currencies: supportedCurrencies,
      };
    } catch (error) {
      throw new Error(`Error fetching payment providers for country: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate payment fees for providers
   */
  async calculatePaymentFees(
    countryId: string,
    amount: number,
    currency: string,
    providerType?: string
  ): Promise<PaymentCalculationResult[]> {
    try {
      const whereClause: WhereOptions = {
        country_id: countryId,
        is_active: true,
        supported_currencies: {
          [Op.contains]: [currency.toUpperCase()],
        },
        min_amount: { [Op.lte]: amount },
      };

      // Add max_amount filter if set
      (whereClause as any)[Op.or] = [
        { max_amount: null },
        { max_amount: { [Op.gte]: amount } },
      ];

      if (providerType) {
        whereClause.provider_type = providerType.toLowerCase();
      }

      const providers = await PaymentProviderModel.findAll({
        where: whereClause,
        order: [['fee_percentage', 'ASC'], ['fee_fixed', 'ASC']],
      });

      return providers.map(provider => {
        const data = provider.toJSON();
        const feePercentage = data.fee_percentage * amount;
        const totalFee = feePercentage + data.fee_fixed;
        const totalAmount = amount + totalFee;

        return {
          provider_id: data.id,
          provider_name: data.display_name || data.provider_name,
          amount,
          fee_percentage: data.fee_percentage,
          fee_fixed: data.fee_fixed,
          total_fee: Number(totalFee.toFixed(2)),
          total_amount: Number(totalAmount.toFixed(2)),
          currency: currency.toUpperCase(),
          processing_time_minutes: data.processing_time_minutes,
        };
      });
    } catch (error) {
      throw new Error(`Error calculating payment fees: ${(error as Error).message}`);
    }
  }

  /**
   * Compare providers for a payment
   */
  async compareProvidersForPayment(
    countryId: string,
    amount: number,
    currency: string,
    providerType?: string
  ): Promise<ProviderComparison> {
    try {
      const calculations = await this.calculatePaymentFees(countryId, amount, currency, providerType);

      if (calculations.length === 0) {
        throw new Error('No active providers found for the specified criteria');
      }

      // Find cheapest provider (lowest total fee)
      const cheapestProvider = calculations.reduce((prev, current) => 
        current.total_fee < prev.total_fee ? current : prev
      );

      // Find fastest provider (shortest processing time)
      const providersWithTime = calculations.filter(p => p.processing_time_minutes !== undefined);
      const fastestProvider = providersWithTime.length > 0
        ? providersWithTime.reduce((prev, current) => 
            (current.processing_time_minutes || 0) < (prev.processing_time_minutes || 0) ? current : prev
          )
        : cheapestProvider;

      return {
        amount,
        currency: currency.toUpperCase(),
        providers: calculations,
        cheapest_provider: cheapestProvider,
        fastest_provider: fastestProvider,
      };
    } catch (error) {
      throw new Error(`Error comparing providers: ${(error as Error).message}`);
    }
  }

  /**
   * Bulk operations on providers
   */
  async bulkUpdateProviders(operation: BulkProviderOperation): Promise<number> {
    try {
      const { operation: op, provider_ids, data } = operation;

      let updateData: any = {};

      switch (op) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'update_fees':
          if (data?.fee_percentage !== undefined) updateData.fee_percentage = data.fee_percentage;
          if (data?.fee_fixed !== undefined) updateData.fee_fixed = data.fee_fixed;
          break;
        case 'update_limits':
          if (data?.min_amount !== undefined) updateData.min_amount = data.min_amount;
          if (data?.max_amount !== undefined) updateData.max_amount = data.max_amount;
          break;
        default:
          throw new Error(`Unsupported bulk operation: ${op}`);
      }

      const [affectedCount] = await PaymentProviderModel.update(updateData, {
        where: { id: { [Op.in]: provider_ids } },
      });

      return affectedCount;
    } catch (error) {
      throw new Error(`Error performing bulk operation: ${(error as Error).message}`);
    }
  }

  /**
   * Search payment providers
   */
  async searchPaymentProviders(query: string, filters: Partial<PaymentProviderFilters> = {}): Promise<PaymentProvider[]> {
    try {
      const whereClause: any = {
        [Op.or]: [
          { provider_name: { [Op.iLike]: `%${query}%` } },
          { display_name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      };

      if (filters.country_id) {
        whereClause.country_id = filters.country_id.toUpperCase();
      }

      if (filters.provider_type) {
        whereClause.provider_type = filters.provider_type.toLowerCase();
      }

      if (filters.is_active !== undefined) {
        whereClause.is_active = filters.is_active;
      }

      const providers = await PaymentProviderModel.findAll({
        where: whereClause,
        limit: filters.limit || 50,
        order: [['provider_name', 'ASC']],
      });

      return providers.map(p => p.toJSON());
    } catch (error) {
      throw new Error(`Error searching payment providers: ${(error as Error).message}`);
    }
  }
}

export const paymentProviderService = new PaymentProviderService();
