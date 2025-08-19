// =====================================================
// PRODUCT PRICE SERVICE
// =====================================================

import { Op, WhereOptions } from 'sequelize';
import { ProductPriceModel } from '../models/ProductPrice.model';
import {
  ProductPrice,
  CreateProductPriceRequest,
  UpdateProductPriceRequest,
  ProductPriceFilters,
  PriceCalculationRequest,
  PriceCalculationResult,
  PriceComparison,
  BulkPriceUpdateOperation,
  ProductPriceStats,
} from '../types/productPrice.types';

/**
 * Product Price Service Class
 */
export class ProductPriceService {
  /**
   * Create a new product price
   */
  async createProductPrice(data: CreateProductPriceRequest): Promise<ProductPrice> {
    try {
      if (!data) {
        throw new Error('Invalid payload');
      }
      console.log('[DEBUG] ProductPriceService.createProductPrice payload:', {
        product_id: data.product_id,
        country_id: data.country_id,
        currency: data.currency,
        price_per_day: data.price_per_day
      });
      // Check if price already exists for this product/country/currency combination
      const existingPrice = await ProductPriceModel.findOne({
        where: {
          product_id: data.product_id,
          country_id: data.country_id,
          currency: data.currency.toUpperCase(),
        },
      });

      if (existingPrice) {
        console.warn('[DEBUG] Duplicate price found for product/country/currency');
        throw new Error(`Price already exists for product '${data.product_id}' in country '${data.country_id}' with currency '${data.currency}'`);
      }

      // Validate currency code
      if (!data.currency || data.currency.length !== 3) {
        console.warn('[DEBUG] Invalid currency code:', data.currency);
        throw new Error('Currency code must be exactly 3 characters');
      }

      // Validate base currency if provided
      if (data.base_currency && data.base_currency.length !== 3) {
        console.warn('[DEBUG] Invalid base_currency code:', data.base_currency);
        throw new Error('Base currency code must be exactly 3 characters');
      }

      // Validate pricing logic
      if (data.price_per_day === undefined || data.price_per_day === null) {
        console.warn('[DEBUG] price_per_day missing');
        throw new Error('price_per_day is required');
      }
      if (Number(data.price_per_day) <= 0) {
        console.warn('[DEBUG] price_per_day invalid (<= 0):', data.price_per_day);
        throw new Error('Daily price must be greater than 0');
      }

      // Validate market adjustment factor
      if (data.market_adjustment_factor && (data.market_adjustment_factor <= 0 || data.market_adjustment_factor > 10)) {
        throw new Error('Market adjustment factor must be between 0.01 and 10.0');
      }

      // Validate discount percentages
      if (data.weekly_discount_percentage && (data.weekly_discount_percentage < 0 || data.weekly_discount_percentage > 1)) {
        throw new Error('Weekly discount percentage must be between 0 and 1');
      }

      if (data.monthly_discount_percentage && (data.monthly_discount_percentage < 0 || data.monthly_discount_percentage > 1)) {
        throw new Error('Monthly discount percentage must be between 0 and 1');
      }

      const price = await ProductPriceModel.create({
        product_id: data.product_id,
        country_id: data.country_id,
        currency: data.currency.toUpperCase(),
        price_per_hour: data.price_per_hour,
        price_per_day: data.price_per_day,
        price_per_week: data.price_per_week,
        price_per_month: data.price_per_month,
        security_deposit: data.security_deposit ?? 0,
        market_adjustment_factor: data.market_adjustment_factor ?? 1.0,
        auto_convert: data.auto_convert ?? true,
        base_price: data.base_price,
        base_currency: data.base_currency?.toUpperCase(),
        exchange_rate: data.exchange_rate,
        min_rental_duration_hours: data.min_rental_duration_hours ?? 1.0,
        max_rental_duration_days: data.max_rental_duration_days,
        early_return_fee_percentage: data.early_return_fee_percentage ?? 0,
        late_return_fee_per_hour: data.late_return_fee_per_hour ?? 0,
        weekly_discount_percentage: data.weekly_discount_percentage ?? 0,
        monthly_discount_percentage: data.monthly_discount_percentage ?? 0,
        bulk_discount_threshold: data.bulk_discount_threshold ?? 1,
        bulk_discount_percentage: data.bulk_discount_percentage ?? 0,
        dynamic_pricing_enabled: data.dynamic_pricing_enabled ?? false,
        peak_season_multiplier: data.peak_season_multiplier ?? 1.0,
        off_season_multiplier: data.off_season_multiplier ?? 1.0,
        seasonal_adjustments: data.seasonal_adjustments,
        is_active: data.is_active ?? true,
        effective_from: data.effective_from ?? new Date(),
        effective_until: data.effective_until,
        notes: data.notes,
      } as any);

      const result = price.toJSON();
      console.log('[DEBUG] ProductPriceService.createProductPrice created id:', result.id);
      return result;
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        console.error('[DEBUG] SequelizeValidationError:', error.errors);
        throw new Error(`Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`);
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.warn('[DEBUG] SequelizeUniqueConstraintError on product price create');
        throw new Error(`Price already exists for this product/country/currency combination`);
      }
      console.error('[DEBUG] Unknown error in ProductPriceService.createProductPrice:', error);
      throw error;
    }
  }

  /**
   * Get product price by ID
   */
  async getProductPriceById(id: string): Promise<ProductPrice | null> {
    try {
      const price = await ProductPriceModel.findByPk(id);
      return price ? price.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching product price: ${(error as Error).message}`);
    }
  }

  /**
   * Get product prices with filters
   */
  async getProductPrices(filters: ProductPriceFilters = {}): Promise<{
    prices: ProductPrice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        product_id,
        country_id,
        currency,
        is_active,
        auto_convert,
        dynamic_pricing_enabled,
        min_price,
        max_price,
        has_hourly_pricing,
        has_weekly_pricing,
        has_monthly_pricing,
        effective_on,
        search,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = filters;

      // Build where clause
      const whereClause: WhereOptions = {};

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (country_id) {
        whereClause.country_id = country_id;
      }

      if (currency) {
        whereClause.currency = currency.toUpperCase();
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active;
      }

      if (auto_convert !== undefined) {
        whereClause.auto_convert = auto_convert;
      }

      if (dynamic_pricing_enabled !== undefined) {
        whereClause.dynamic_pricing_enabled = dynamic_pricing_enabled;
      }

      if (min_price !== undefined) {
        whereClause.price_per_day = { [Op.gte]: min_price };
      }

      if (max_price !== undefined) {
        if (whereClause.price_per_day) {
          (whereClause.price_per_day as any)[Op.lte] = max_price;
        } else {
          whereClause.price_per_day = { [Op.lte]: max_price };
        }
      }

      if (has_hourly_pricing !== undefined) {
        if (has_hourly_pricing) {
          whereClause.price_per_hour = { [Op.ne]: null };
        } else {
          whereClause.price_per_hour = null;
        }
      }

      if (has_weekly_pricing !== undefined) {
        if (has_weekly_pricing) {
          whereClause.price_per_week = { [Op.ne]: null };
        } else {
          whereClause.price_per_week = null;
        }
      }

      if (has_monthly_pricing !== undefined) {
        if (has_monthly_pricing) {
          whereClause.price_per_month = { [Op.ne]: null };
        } else {
          whereClause.price_per_month = null;
        }
      }

      if (effective_on) {
        const effectiveDate = new Date(effective_on);
        whereClause.effective_from = { [Op.lte]: effectiveDate };
        (whereClause as any)[Op.or] = [
          { effective_until: null },
          { effective_until: { [Op.gte]: effectiveDate } },
        ];
      }

      if (search) {
        (whereClause as any)[Op.or] = [
          { currency: { [Op.iLike]: `%${search}%` } },
          { base_currency: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query
      const { rows: prices, count: total } = await ProductPriceModel.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sort_by, sort_order.toUpperCase()]],
      });

      return {
        prices: prices.map(p => p.toJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching product prices: ${(error as Error).message}`);
    }
  }

  /**
   * Update product price
   */
  async updateProductPrice(id: string, data: UpdateProductPriceRequest): Promise<ProductPrice | null> {
    try {
      const price = await ProductPriceModel.findByPk(id);
      if (!price) {
        return null;
      }

      // Validate pricing logic if daily price is being updated
      if (data.price_per_day !== undefined && data.price_per_day <= 0) {
        throw new Error('Daily price must be greater than 0');
      }

      // Validate market adjustment factor
      if (data.market_adjustment_factor && (data.market_adjustment_factor <= 0 || data.market_adjustment_factor > 10)) {
        throw new Error('Market adjustment factor must be between 0.01 and 10.0');
      }

      // Validate discount percentages
      if (data.weekly_discount_percentage !== undefined && (data.weekly_discount_percentage < 0 || data.weekly_discount_percentage > 1)) {
        throw new Error('Weekly discount percentage must be between 0 and 1');
      }

      if (data.monthly_discount_percentage !== undefined && (data.monthly_discount_percentage < 0 || data.monthly_discount_percentage > 1)) {
        throw new Error('Monthly discount percentage must be between 0 and 1');
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.base_currency) {
        updateData.base_currency = data.base_currency.toUpperCase();
      }

      await price.update(updateData);
      return price.toJSON();
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map((e: any) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Delete product price
   */
  async deleteProductPrice(id: string): Promise<boolean> {
    try {
      const price = await ProductPriceModel.findByPk(id);
      if (!price) {
        return false;
      }

      await price.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error deleting product price: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate rental price for a specific request
   */
  async calculateRentalPrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    try {
      const {
        product_id,
        country_id,
        currency,
        rental_duration_hours,
        quantity = 1,
        rental_start_date,
        include_security_deposit = true,
        apply_discounts = true,
      } = request;

      // Find the appropriate price record
      const whereClause: WhereOptions = {
        product_id,
        country_id,
        is_active: true,
      };

      if (currency) {
        whereClause.currency = currency.toUpperCase();
      }

      // Add effective date filter
      const startDate = rental_start_date || new Date();
      whereClause.effective_from = { [Op.lte]: startDate };
      (whereClause as any)[Op.or] = [
        { effective_until: null },
        { effective_until: { [Op.gte]: startDate } },
      ];

      const priceRecord = await ProductPriceModel.findOne({
        where: whereClause,
        order: [['created_at', 'DESC']], // Get most recent if multiple matches
      });

      if (!priceRecord) {
        throw new Error(`No active pricing found for product ${product_id} in country ${country_id}`);
      }

      const price = priceRecord.toJSON();

      // Validate rental duration
      if (rental_duration_hours < price.min_rental_duration_hours) {
        throw new Error(`Minimum rental duration is ${price.min_rental_duration_hours} hours`);
      }

      if (price.max_rental_duration_days) {
        const maxHours = price.max_rental_duration_days * 24;
        if (rental_duration_hours > maxHours) {
          throw new Error(`Maximum rental duration is ${price.max_rental_duration_days} days`);
        }
      }

      // Determine pricing tier and calculate base amount
      let basePriceType: 'hourly' | 'daily' | 'weekly' | 'monthly';
      let baseRate: number;
      let unitsUsed: number;

      const rentalDays = rental_duration_hours / 24;

      // Choose the most economical pricing tier
      if (rentalDays >= 30 && price.price_per_month) {
        basePriceType = 'monthly';
        baseRate = price.price_per_month;
        unitsUsed = Math.ceil(rentalDays / 30);
      } else if (rentalDays >= 7 && price.price_per_week) {
        basePriceType = 'weekly';
        baseRate = price.price_per_week;
        unitsUsed = Math.ceil(rentalDays / 7);
      } else if (rentalDays >= 1) {
        basePriceType = 'daily';
        baseRate = price.price_per_day;
        unitsUsed = Math.ceil(rentalDays);
      } else if (price.price_per_hour) {
        basePriceType = 'hourly';
        baseRate = price.price_per_hour;
        unitsUsed = rental_duration_hours;
      } else {
        // Fallback to daily rate for partial days
        basePriceType = 'daily';
        baseRate = price.price_per_day;
        unitsUsed = Math.ceil(rentalDays);
      }

      let baseAmount = baseRate * unitsUsed * quantity;

      // Apply market adjustment
      baseAmount *= price.market_adjustment_factor;

      // Apply seasonal adjustments if dynamic pricing is enabled
      let seasonalMultiplier = 1.0;
      if (price.dynamic_pricing_enabled && price.seasonal_adjustments) {
        const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
        seasonalMultiplier = price.seasonal_adjustments[month.toString()] || 1.0;
      }

      const seasonalAdjustment = baseAmount * (seasonalMultiplier - 1);
      let adjustedAmount = baseAmount * seasonalMultiplier;

      // Apply discounts if enabled
      let weeklyDiscount = 0;
      let monthlyDiscount = 0;
      let bulkDiscount = 0;

      if (apply_discounts) {
        // Weekly discount
        if (rentalDays >= 7 && price.weekly_discount_percentage > 0) {
          weeklyDiscount = adjustedAmount * price.weekly_discount_percentage;
        }

        // Monthly discount (only if no weekly discount applied)
        if (rentalDays >= 30 && price.monthly_discount_percentage > 0 && weeklyDiscount === 0) {
          monthlyDiscount = adjustedAmount * price.monthly_discount_percentage;
        }

        // Bulk discount
        if (quantity >= price.bulk_discount_threshold && price.bulk_discount_percentage > 0) {
          bulkDiscount = adjustedAmount * price.bulk_discount_percentage;
        }
      }

      const totalDiscount = weeklyDiscount + monthlyDiscount + bulkDiscount;
      const subtotal = adjustedAmount - totalDiscount;

      // Security deposit
      const securityDeposit = include_security_deposit ? price.security_deposit * quantity : 0;

      // Total amount
      const totalAmount = subtotal + securityDeposit;

      // Build result
      const result: PriceCalculationResult = {
        product_id,
        country_id,
        currency: price.currency,
        rental_duration_hours,
        rental_duration_days: rentalDays,
        quantity,
        base_rate_type: basePriceType,
        base_rate: baseRate,
        base_amount: baseRate * unitsUsed * quantity,
        market_adjustment_factor: price.market_adjustment_factor,
        seasonal_multiplier: seasonalMultiplier,
        peak_season_adjustment: seasonalAdjustment,
        weekly_discount: weeklyDiscount,
        monthly_discount: monthlyDiscount,
        bulk_discount: bulkDiscount,
        total_discount: totalDiscount,
        subtotal,
        security_deposit: securityDeposit,
        total_amount: totalAmount,
        calculation_date: new Date(),
        exchange_rate_used: price.exchange_rate,
        pricing_tier_used: basePriceType,
        discounts_applied: [
          ...(weeklyDiscount > 0 ? [`Weekly: ${(price.weekly_discount_percentage * 100).toFixed(1)}%`] : []),
          ...(monthlyDiscount > 0 ? [`Monthly: ${(price.monthly_discount_percentage * 100).toFixed(1)}%`] : []),
          ...(bulkDiscount > 0 ? [`Bulk: ${(price.bulk_discount_percentage * 100).toFixed(1)}%`] : []),
        ],
        notes: [
          `Base rate: ${baseRate} ${price.currency} per ${basePriceType.replace('ly', '')}`,
          `Market adjustment: ${(price.market_adjustment_factor * 100).toFixed(0)}%`,
          ...(seasonalMultiplier !== 1 ? [`Seasonal adjustment: ${(seasonalMultiplier * 100).toFixed(0)}%`] : []),
          ...(price.notes ? [price.notes] : []),
        ],
      };

      return result;
    } catch (error) {
      throw new Error(`Error calculating rental price: ${(error as Error).message}`);
    }
  }

  /**
   * Compare prices across countries for a product
   */
  async compareProductPricesAcrossCountries(
    productId: string,
    rentalDurationHours: number,
    quantity: number = 1
  ): Promise<PriceComparison> {
    try {
      // Get all active prices for the product
      const prices = await ProductPriceModel.findAll({
        where: {
          product_id: productId,
          is_active: true,
          effective_from: { [Op.lte]: new Date() },
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gte]: new Date() } },
          ],
        } as any,
        order: [['country_id', 'ASC'], ['currency', 'ASC']],
      });

      if (prices.length === 0) {
        throw new Error(`No active pricing found for product ${productId}`);
      }

      // Calculate pricing for each country
      const countryPrices: PriceComparison['country_prices'] = [];

      for (const priceRecord of prices) {
        const price = priceRecord.toJSON();
        
        try {
          const calculation = await this.calculateRentalPrice({
            product_id: productId,
            country_id: price.country_id,
            currency: price.currency,
            rental_duration_hours: rentalDurationHours,
            quantity,
          });

          countryPrices.push({
            country_id: price.country_id,
            country_name: '', // Would be populated from country service
            currency: price.currency,
            price_calculation: calculation,
            rank_by_total: 0, // Will be set below
            rank_by_daily_rate: 0, // Will be set below
          });
        } catch (error) {
          // Skip countries where calculation fails
          console.warn(`Price calculation failed for country ${price.country_id}: ${(error as Error).message}`);
        }
      }

      if (countryPrices.length === 0) {
        throw new Error(`No valid price calculations available for product ${productId}`);
      }

      // Sort and rank by total amount
      countryPrices.sort((a, b) => a.price_calculation.total_amount - b.price_calculation.total_amount);
      countryPrices.forEach((cp, index) => {
        cp.rank_by_total = index + 1;
      });

      // Sort and rank by daily rate
      const dailyRateRanking = [...countryPrices].sort((a, b) => 
        a.price_calculation.base_rate - b.price_calculation.base_rate
      );
      dailyRateRanking.forEach((cp, index) => {
        const originalIndex = countryPrices.findIndex(ocp => 
          ocp.country_id === cp.country_id && ocp.currency === cp.currency
        );
        countryPrices[originalIndex].rank_by_daily_rate = index + 1;
      });

      // Find cheapest and most expensive
      const cheapest = countryPrices[0];
      const mostExpensive = countryPrices[countryPrices.length - 1];
      
      const averagePrice = countryPrices.reduce((sum, cp) => sum + cp.price_calculation.total_amount, 0) / countryPrices.length;
      const priceVariance = countryPrices.reduce((sum, cp) => 
        sum + Math.pow(cp.price_calculation.total_amount - averagePrice, 2), 0
      ) / countryPrices.length;

      const savingsPercentage = mostExpensive.price_calculation.total_amount > 0 
        ? ((mostExpensive.price_calculation.total_amount - cheapest.price_calculation.total_amount) / mostExpensive.price_calculation.total_amount) * 100
        : 0;

      const premiumPercentage = cheapest.price_calculation.total_amount > 0
        ? ((mostExpensive.price_calculation.total_amount - cheapest.price_calculation.total_amount) / cheapest.price_calculation.total_amount) * 100
        : 0;

      const uniqueCurrencies = Array.from(new Set(countryPrices.map(cp => cp.currency)));

      return {
        product_id: productId,
        comparison_date: new Date(),
        base_duration_hours: rentalDurationHours,
        quantity,
        country_prices: countryPrices,
        cheapest_country: {
          country_id: cheapest.country_id,
          total_amount: cheapest.price_calculation.total_amount,
          currency: cheapest.currency,
          savings_percentage: savingsPercentage,
        },
        most_expensive_country: {
          country_id: mostExpensive.country_id,
          total_amount: mostExpensive.price_calculation.total_amount,
          currency: mostExpensive.currency,
          premium_percentage: premiumPercentage,
        },
        average_price: Number(averagePrice.toFixed(2)),
        price_variance: Number(priceVariance.toFixed(2)),
        currency_diversity: uniqueCurrencies,
      };
    } catch (error) {
      throw new Error(`Error comparing product prices: ${(error as Error).message}`);
    }
  }

  /**
   * Bulk update product prices
   */
  async bulkUpdateProductPrices(operation: BulkPriceUpdateOperation): Promise<number> {
    try {
      const { operation: op, product_ids, country_ids, currencies, filters, data } = operation;

      // Build where clause
      const whereClause: WhereOptions = {};

      if (product_ids && product_ids.length > 0) {
        whereClause.product_id = { [Op.in]: product_ids };
      }

      if (country_ids && country_ids.length > 0) {
        whereClause.country_id = { [Op.in]: country_ids };
      }

      if (currencies && currencies.length > 0) {
        whereClause.currency = { [Op.in]: currencies.map(c => c.toUpperCase()) };
      }

      // Apply additional filters
      if (filters) {
        if (filters.is_active !== undefined) {
          whereClause.is_active = filters.is_active;
        }
        if (filters.dynamic_pricing_enabled !== undefined) {
          whereClause.dynamic_pricing_enabled = filters.dynamic_pricing_enabled;
        }
      }

      let updateData: any = {};

      switch (op) {
        case 'update_prices':
          if (data.price_adjustment_percentage !== undefined) {
            // This would require raw SQL to do percentage-based updates
            throw new Error('Percentage-based price updates not yet implemented');
          }
          break;
        case 'update_discounts':
          if (data.weekly_discount_percentage !== undefined) {
            updateData.weekly_discount_percentage = data.weekly_discount_percentage;
          }
          if (data.monthly_discount_percentage !== undefined) {
            updateData.monthly_discount_percentage = data.monthly_discount_percentage;
          }
          if (data.bulk_discount_percentage !== undefined) {
            updateData.bulk_discount_percentage = data.bulk_discount_percentage;
          }
          break;
        case 'update_market_factors':
          if (data.market_adjustment_factor !== undefined) {
            updateData.market_adjustment_factor = data.market_adjustment_factor;
          }
          break;
        case 'activate':
          updateData.is_active = true;
          if (data.effective_from) {
            updateData.effective_from = data.effective_from;
          }
          break;
        case 'deactivate':
          updateData.is_active = false;
          if (data.effective_until) {
            updateData.effective_until = data.effective_until;
          }
          break;
        case 'update_exchange_rates':
          if (data.exchange_rate !== undefined) {
            updateData.exchange_rate = data.exchange_rate;
            updateData.exchange_rate_updated_at = new Date();
          }
          if (data.base_currency) {
            updateData.base_currency = data.base_currency.toUpperCase();
          }
          break;
        default:
          throw new Error(`Unsupported bulk operation: ${op}`);
      }

      const [affectedCount] = await ProductPriceModel.update(updateData, {
        where: whereClause,
      });

      return affectedCount;
    } catch (error) {
      throw new Error(`Error performing bulk operation: ${(error as Error).message}`);
    }
  }

  /**
   * Get product price statistics
   */
  async getProductPriceStats(): Promise<ProductPriceStats> {
    try {
      const [
        totalPrices,
        activePrices,
        inactivePrices,
      ] = await Promise.all([
        ProductPriceModel.count(),
        ProductPriceModel.count({ where: { is_active: true } }),
        ProductPriceModel.count({ where: { is_active: false } }),
      ]);

      // Get all pricing data for analysis
      const allPrices = await ProductPriceModel.findAll({
        attributes: [
          'country_id', 'currency', 'price_per_day', 'is_active',
          'weekly_discount_percentage', 'monthly_discount_percentage', 'bulk_discount_percentage',
          'market_adjustment_factor', 'auto_convert', 'dynamic_pricing_enabled'
        ],
      });

      const pricesData = allPrices.map(p => p.toJSON());

      // Calculate statistics
      const uniqueCountries = new Set(pricesData.map(p => p.country_id));
      const uniqueCurrencies = new Set(pricesData.map(p => p.currency));

      const currencyDistribution: Record<string, number> = {};
      const countryDistribution: Record<string, number> = {};
      const priceRangeDistribution: Record<string, number> = {
        'Under 10': 0,
        '10-50': 0,
        '50-100': 0,
        '100-500': 0,
        '500-1000': 0,
        'Over 1000': 0,
      };

      let weeklyDiscountCount = 0;
      let monthlyDiscountCount = 0;
      let bulkDiscountCount = 0;
      let totalWeeklyDiscount = 0;
      let totalMonthlyDiscount = 0;
      let totalBulkDiscount = 0;

      let totalMarketAdjustment = 0;
      let premiumPricingCount = 0;
      let discountPricingCount = 0;
      let autoConvertCount = 0;
      let dynamicPricingCount = 0;

      for (const price of pricesData) {
        // Currency distribution
        currencyDistribution[price.currency] = (currencyDistribution[price.currency] || 0) + 1;
        
        // Country distribution
        countryDistribution[price.country_id] = (countryDistribution[price.country_id] || 0) + 1;
        
        // Price range distribution
        const dailyPrice = Number(price.price_per_day);
        if (dailyPrice < 10) priceRangeDistribution['Under 10']++;
        else if (dailyPrice < 50) priceRangeDistribution['10-50']++;
        else if (dailyPrice < 100) priceRangeDistribution['50-100']++;
        else if (dailyPrice < 500) priceRangeDistribution['100-500']++;
        else if (dailyPrice < 1000) priceRangeDistribution['500-1000']++;
        else priceRangeDistribution['Over 1000']++;

        // Discount analysis
        if (price.weekly_discount_percentage > 0) {
          weeklyDiscountCount++;
          totalWeeklyDiscount += price.weekly_discount_percentage;
        }
        if (price.monthly_discount_percentage > 0) {
          monthlyDiscountCount++;
          totalMonthlyDiscount += price.monthly_discount_percentage;
        }
        if (price.bulk_discount_percentage > 0) {
          bulkDiscountCount++;
          totalBulkDiscount += price.bulk_discount_percentage;
        }

        // Market analysis
        totalMarketAdjustment += price.market_adjustment_factor;
        if (price.market_adjustment_factor > 1) premiumPricingCount++;
        if (price.market_adjustment_factor < 1) discountPricingCount++;
        if (price.auto_convert) autoConvertCount++;
        if (price.dynamic_pricing_enabled) dynamicPricingCount++;
      }

      return {
        total_price_records: totalPrices,
        active_price_records: activePrices,
        inactive_price_records: inactivePrices,
        countries_with_pricing: uniqueCountries.size,
        currencies_supported: uniqueCurrencies.size,
        
        pricing_coverage: {
          products_with_pricing: 0, // Would need product count from product service
          products_without_pricing: 0,
          coverage_percentage: 0,
        },
        
        price_distribution: {
          by_currency: currencyDistribution,
          by_country: countryDistribution,
          by_price_range: priceRangeDistribution,
        },
        
        discount_analysis: {
          products_with_weekly_discount: weeklyDiscountCount,
          products_with_monthly_discount: monthlyDiscountCount,
          products_with_bulk_discount: bulkDiscountCount,
          average_weekly_discount: weeklyDiscountCount > 0 ? totalWeeklyDiscount / weeklyDiscountCount : 0,
          average_monthly_discount: monthlyDiscountCount > 0 ? totalMonthlyDiscount / monthlyDiscountCount : 0,
          average_bulk_discount: bulkDiscountCount > 0 ? totalBulkDiscount / bulkDiscountCount : 0,
        },
        
        market_analysis: {
          average_market_adjustment: pricesData.length > 0 ? totalMarketAdjustment / pricesData.length : 0,
          countries_with_premium_pricing: premiumPricingCount,
          countries_with_discount_pricing: discountPricingCount,
          auto_convert_adoption: (autoConvertCount / pricesData.length) * 100,
          dynamic_pricing_adoption: (dynamicPricingCount / pricesData.length) * 100,
        },
        
        temporal_analysis: {
          recent_price_updates: 0, // Would need to check recent updates
          upcoming_price_changes: 0, // Would need to check future effective dates
          expired_pricing: 0, // Would need to check expired prices
          average_pricing_duration_days: 0, // Would need to calculate from effective dates
        },
      };
    } catch (error) {
      throw new Error(`Error fetching product price statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Search product prices
   */
  async searchProductPrices(query: string, filters: Partial<ProductPriceFilters> = {}): Promise<ProductPrice[]> {
    try {
      const whereClause: any = {
        [Op.or]: [
          { currency: { [Op.iLike]: `%${query}%` } },
          { base_currency: { [Op.iLike]: `%${query}%` } },
          { notes: { [Op.iLike]: `%${query}%` } },
        ],
      };

      if (filters.country_id) {
        whereClause.country_id = filters.country_id;
      }

      if (filters.is_active !== undefined) {
        whereClause.is_active = filters.is_active;
      }

      const prices = await ProductPriceModel.findAll({
        where: whereClause,
        limit: filters.limit || 50,
        order: [['created_at', 'DESC']],
      });

      return prices.map(p => p.toJSON());
    } catch (error) {
      throw new Error(`Error searching product prices: ${(error as Error).message}`);
    }
  }
}

export const productPriceService = new ProductPriceService();
