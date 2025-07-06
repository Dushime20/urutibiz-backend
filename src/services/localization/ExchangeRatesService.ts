/**
 * Exchange Rates Service
 * 
 * Handles CRUD operations for currency exchange rates and conversions
 */
import { getDatabase } from '../../config/database';
import logger from '../../utils/logger';

// Get database instance
const db = getDatabase();
import {
  ExchangeRateData,
  CreateExchangeRateData,
  UpdateExchangeRateData,
  ExchangeRateFilters,
  ServiceResponse,
  PaginatedResponse
} from '../../types/localization.types';

export class ExchangeRatesService {
  
  // =====================================================
  // CREATE
  // =====================================================
  
  /**
   * Create a new exchange rate
   */
  static async createExchangeRate(data: CreateExchangeRateData): Promise<ServiceResponse<ExchangeRateData>> {
    try {
      // Validate required fields
      if (!data.from_currency || !data.to_currency || !data.rate || !data.rate_date || !data.source) {
        return {
          success: false,
          error: 'Missing required fields: from_currency, to_currency, rate, rate_date, source'
        };
      }

      // Validate rate is positive
      if (data.rate <= 0) {
        return {
          success: false,
          error: 'Exchange rate must be greater than 0'
        };
      }

      // Validate currencies are different
      if (data.from_currency === data.to_currency) {
        return {
          success: false,
          error: 'From and to currencies must be different'
        };
      }

      // Check for existing rate on the same date
      const existing = await db('exchange_rates')
        .where({
          from_currency: data.from_currency,
          to_currency: data.to_currency,
          rate_date: data.rate_date
        })
        .first();

      if (existing) {
        return {
          success: false,
          error: 'Exchange rate already exists for this currency pair and date'
        };
      }

      const exchangeRateData = {
        ...data,
        created_at: new Date()
      };

      const [newRate] = await db('exchange_rates')
        .insert(exchangeRateData)
        .returning('*');

      logger.info(`Exchange rate created: ${data.from_currency} to ${data.to_currency} - ${data.rate}`);

      return {
        success: true,
        data: newRate,
        message: 'Exchange rate created successfully'
      };

    } catch (error) {
      logger.error('Error creating exchange rate:', error);
      return {
        success: false,
        error: 'Failed to create exchange rate'
      };
    }
  }

  /**
   * Bulk create exchange rates
   */
  static async bulkCreateExchangeRates(rates: CreateExchangeRateData[]): Promise<ServiceResponse<ExchangeRateData[]>> {
    try {
      if (!rates || rates.length === 0) {
        return {
          success: false,
          error: 'No exchange rates provided'
        };
      }

      // Validate all rates
      for (const rate of rates) {
        if (!rate.from_currency || !rate.to_currency || !rate.rate || !rate.rate_date || !rate.source) {
          return {
            success: false,
            error: 'All rates must have required fields: from_currency, to_currency, rate, rate_date, source'
          };
        }

        if (rate.rate <= 0) {
          return {
            success: false,
            error: 'All exchange rates must be greater than 0'
          };
        }

        if (rate.from_currency === rate.to_currency) {
          return {
            success: false,
            error: 'From and to currencies must be different for all rates'
          };
        }
      }

      const exchangeRatesData = rates.map(rate => ({
        ...rate,
        created_at: new Date()
      }));

      const newRates = await db('exchange_rates')
        .insert(exchangeRatesData)
        .returning('*');

      logger.info(`Bulk created ${newRates.length} exchange rates`);

      return {
        success: true,
        data: newRates,
        message: `${newRates.length} exchange rates created successfully`
      };

    } catch (error) {
      logger.error('Error bulk creating exchange rates:', error);
      return {
        success: false,
        error: 'Failed to bulk create exchange rates'
      };
    }
  }

  // =====================================================
  // READ
  // =====================================================
  
  /**
   * Get exchange rate by ID
   */
  static async getExchangeRateById(id: string): Promise<ServiceResponse<ExchangeRateData>> {
    try {
      const rate = await db('exchange_rates')
        .where('id', id)
        .first();

      if (!rate) {
        return {
          success: false,
          error: 'Exchange rate not found'
        };
      }

      return {
        success: true,
        data: rate
      };

    } catch (error) {
      logger.error('Error fetching exchange rate by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch exchange rate'
      };
    }
  }

  /**
   * Get latest exchange rate for a currency pair
   */
  static async getLatestExchangeRate(fromCurrency: string, toCurrency: string): Promise<ServiceResponse<ExchangeRateData>> {
    try {
      const rate = await db('exchange_rates')
        .where('from_currency', fromCurrency)
        .where('to_currency', toCurrency)
        .orderBy('rate_date', 'desc')
        .orderBy('created_at', 'desc')
        .first();

      if (!rate) {
        return {
          success: false,
          error: `No exchange rate found for ${fromCurrency} to ${toCurrency}`
        };
      }

      return {
        success: true,
        data: rate
      };

    } catch (error) {
      logger.error('Error fetching latest exchange rate:', error);
      return {
        success: false,
        error: 'Failed to fetch latest exchange rate'
      };
    }
  }

  /**
   * Get exchange rates with filters and pagination
   */
  static async getExchangeRates(filters: ExchangeRateFilters = {}): Promise<ServiceResponse<PaginatedResponse<ExchangeRateData>>> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 50, 100); // Max 100 per page
      const offset = (page - 1) * limit;

      let query = db('exchange_rates');

      // Apply filters
      if (filters.from_currency) {
        query = query.where('from_currency', filters.from_currency);
      }

      if (filters.to_currency) {
        query = query.where('to_currency', filters.to_currency);
      }

      if (filters.rate_date) {
        query = query.where('rate_date', filters.rate_date);
      }

      if (filters.source) {
        query = query.where('source', filters.source);
      }

      // Get total count
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('* as count');

      // Get paginated data
      const rows = await query
        .orderBy('rate_date', 'desc')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalCount = parseInt(count as string);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          rows,
          totalCount,
          page,
          limit,
          totalPages
        }
      };

    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      return {
        success: false,
        error: 'Failed to fetch exchange rates'
      };
    }
  }

  // =====================================================
  // UPDATE
  // =====================================================
  
  /**
   * Update exchange rate
   */
  static async updateExchangeRate(id: string, data: UpdateExchangeRateData): Promise<ServiceResponse<ExchangeRateData>> {
    try {
      // Check if rate exists
      const existing = await db('exchange_rates')
        .where('id', id)
        .first();

      if (!existing) {
        return {
          success: false,
          error: 'Exchange rate not found'
        };
      }

      // Validate rate if provided
      if (data.rate !== undefined && data.rate <= 0) {
        return {
          success: false,
          error: 'Exchange rate must be greater than 0'
        };
      }

      const [updated] = await db('exchange_rates')
        .where('id', id)
        .update(data)
        .returning('*');

      logger.info(`Exchange rate updated: ${id}`);

      return {
        success: true,
        data: updated,
        message: 'Exchange rate updated successfully'
      };

    } catch (error) {
      logger.error('Error updating exchange rate:', error);
      return {
        success: false,
        error: 'Failed to update exchange rate'
      };
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  
  /**
   * Delete exchange rate
   */
  static async deleteExchangeRate(id: string): Promise<ServiceResponse<void>> {
    try {
      const deleted = await db('exchange_rates')
        .where('id', id)
        .del();

      if (deleted === 0) {
        return {
          success: false,
          error: 'Exchange rate not found'
        };
      }

      logger.info(`Exchange rate deleted: ${id}`);

      return {
        success: true,
        message: 'Exchange rate deleted successfully'
      };

    } catch (error) {
      logger.error('Error deleting exchange rate:', error);
      return {
        success: false,
        error: 'Failed to delete exchange rate'
      };
    }
  }

  /**
   * Delete exchange rates by currency pair
   */
  static async deleteExchangeRatesByCurrencyPair(fromCurrency: string, toCurrency: string): Promise<ServiceResponse<void>> {
    try {
      const deleted = await db('exchange_rates')
        .where('from_currency', fromCurrency)
        .where('to_currency', toCurrency)
        .del();

      logger.info(`Deleted ${deleted} exchange rates for ${fromCurrency} to ${toCurrency}`);

      return {
        success: true,
        message: `${deleted} exchange rates deleted successfully`
      };

    } catch (error) {
      logger.error('Error deleting exchange rates by currency pair:', error);
      return {
        success: false,
        error: 'Failed to delete exchange rates'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Convert amount from one currency to another
   */
  static async convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rateDate?: Date): Promise<ServiceResponse<{ convertedAmount: number; rate: number; rateDate: Date }>> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0'
        };
      }

      if (fromCurrency === toCurrency) {
        return {
          success: true,
          data: {
            convertedAmount: amount,
            rate: 1,
            rateDate: new Date()
          }
        };
      }

      let query = db('exchange_rates')
        .where('from_currency', fromCurrency)
        .where('to_currency', toCurrency);

      if (rateDate) {
        query = query.where('rate_date', '<=', rateDate);
      }

      const rate = await query
        .orderBy('rate_date', 'desc')
        .orderBy('created_at', 'desc')
        .first();

      if (!rate) {
        return {
          success: false,
          error: `No exchange rate found for ${fromCurrency} to ${toCurrency}`
        };
      }

      const convertedAmount = amount * rate.rate;

      return {
        success: true,
        data: {
          convertedAmount: parseFloat(convertedAmount.toFixed(2)),
          rate: rate.rate,
          rateDate: rate.rate_date
        }
      };

    } catch (error) {
      logger.error('Error converting currency:', error);
      return {
        success: false,
        error: 'Failed to convert currency'
      };
    }
  }

  /**
   * Get all available currency pairs
   */
  static async getAvailableCurrencyPairs(): Promise<ServiceResponse<Array<{ from_currency: string; to_currency: string }>>> {
    try {
      const pairs = await db('exchange_rates')
        .distinct('from_currency', 'to_currency')
        .orderBy('from_currency')
        .orderBy('to_currency');

      return {
        success: true,
        data: pairs
      };

    } catch (error) {
      logger.error('Error fetching available currency pairs:', error);
      return {
        success: false,
        error: 'Failed to fetch available currency pairs'
      };
    }
  }

  /**
   * Get historical rates for a currency pair
   */
  static async getHistoricalRates(fromCurrency: string, toCurrency: string, days: number = 30): Promise<ServiceResponse<ExchangeRateData[]>> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const rates = await db('exchange_rates')
        .where('from_currency', fromCurrency)
        .where('to_currency', toCurrency)
        .where('rate_date', '>=', dateThreshold)
        .orderBy('rate_date', 'desc');

      return {
        success: true,
        data: rates
      };

    } catch (error) {
      logger.error('Error fetching historical rates:', error);
      return {
        success: false,
        error: 'Failed to fetch historical rates'
      };
    }
  }

  /**
   * Update or create exchange rate (upsert)
   */
  static async upsertExchangeRate(data: CreateExchangeRateData): Promise<ServiceResponse<ExchangeRateData>> {
    try {
      // Check for existing rate
      const existing = await db('exchange_rates')
        .where({
          from_currency: data.from_currency,
          to_currency: data.to_currency,
          rate_date: data.rate_date
        })
        .first();

      if (existing) {
        // Update existing rate
        const [updated] = await db('exchange_rates')
          .where('id', existing.id)
          .update({
            rate: data.rate,
            source: data.source
          })
          .returning('*');

        logger.info(`Exchange rate updated: ${data.from_currency} to ${data.to_currency} - ${data.rate}`);

        return {
          success: true,
          data: updated,
          message: 'Exchange rate updated successfully'
        };
      } else {
        // Create new rate
        return await this.createExchangeRate(data);
      }

    } catch (error) {
      logger.error('Error upserting exchange rate:', error);
      return {
        success: false,
        error: 'Failed to upsert exchange rate'
      };
    }
  }
}

export default ExchangeRatesService;
