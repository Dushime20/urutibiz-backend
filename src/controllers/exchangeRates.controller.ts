/**
 * Exchange Rates Controller
 * 
 * HTTP endpoints for managing currency exchange rates and conversions
 */
import { Request, Response } from 'express';
import { ExchangeRatesService } from '../services/localization/ExchangeRatesService';
import { CreateExchangeRateData, UpdateExchangeRateData, ExchangeRateFilters } from '../types/localization.types';

export class ExchangeRatesController {

  /**
   * Create a new exchange rate
   * POST /api/exchange-rates
   */
  static async createExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateExchangeRateData = req.body;
      const result = await ExchangeRatesService.createExchangeRate(data);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Bulk create exchange rates
   * POST /api/exchange-rates/bulk
   */
  static async bulkCreateExchangeRates(req: Request, res: Response): Promise<void> {
    try {
      const { rates } = req.body;
      
      if (!Array.isArray(rates)) {
        res.status(400).json({
          success: false,
          error: 'Rates must be an array'
        });
        return;
      }

      const result = await ExchangeRatesService.bulkCreateExchangeRates(rates);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get exchange rate by ID
   * GET /api/exchange-rates/:id
   */
  static async getExchangeRateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ExchangeRatesService.getExchangeRateById(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get latest exchange rate for a currency pair
   * GET /api/exchange-rates/latest/:fromCurrency/:toCurrency
   */
  static async getLatestExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const result = await ExchangeRatesService.getLatestExchangeRate(fromCurrency.toUpperCase(), toCurrency.toUpperCase());

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get exchange rates with filters and pagination
   * GET /api/exchange-rates
   */
  static async getExchangeRates(req: Request, res: Response): Promise<void> {
    try {
      const filters: ExchangeRateFilters = {
        from_currency: req.query.from_currency as string,
        to_currency: req.query.to_currency as string,
        rate_date: req.query.rate_date ? new Date(req.query.rate_date as string) : undefined,
        source: req.query.source as string,
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 50, 100)
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ExchangeRateFilters] === undefined) {
          delete filters[key as keyof ExchangeRateFilters];
        }
      });

      const result = await ExchangeRatesService.getExchangeRates(filters);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update exchange rate
   * PUT /api/exchange-rates/:id
   */
  static async updateExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateExchangeRateData = req.body;
      const result = await ExchangeRatesService.updateExchangeRate(id, data);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete exchange rate
   * DELETE /api/exchange-rates/:id
   */
  static async deleteExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ExchangeRatesService.deleteExchangeRate(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete exchange rates by currency pair
   * DELETE /api/exchange-rates/pair/:fromCurrency/:toCurrency
   */
  static async deleteExchangeRatesByCurrencyPair(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const result = await ExchangeRatesService.deleteExchangeRatesByCurrencyPair(fromCurrency.toUpperCase(), toCurrency.toUpperCase());

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Convert currency
   * POST /api/exchange-rates/convert
   */
  static async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { amount, from_currency, to_currency, rate_date } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
        return;
      }

      if (!from_currency || !to_currency) {
        res.status(400).json({
          success: false,
          error: 'from_currency and to_currency are required'
        });
        return;
      }

      const rateDate = rate_date ? new Date(rate_date) : undefined;
      const result = await ExchangeRatesService.convertCurrency(amount, from_currency.toUpperCase(), to_currency.toUpperCase(), rateDate);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available currency pairs
   * GET /api/exchange-rates/currency-pairs
   */
  static async getAvailableCurrencyPairs(_req: Request, res: Response): Promise<void> {
    try {
      const result = await ExchangeRatesService.getAvailableCurrencyPairs();

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get historical rates for a currency pair
   * GET /api/exchange-rates/history/:fromCurrency/:toCurrency
   */
  static async getHistoricalRates(req: Request, res: Response): Promise<void> {
    try {
      const { fromCurrency, toCurrency } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      if (days > 365) {
        res.status(400).json({
          success: false,
          error: 'Maximum 365 days of history allowed'
        });
        return;
      }

      const result = await ExchangeRatesService.getHistoricalRates(fromCurrency.toUpperCase(), toCurrency.toUpperCase(), days);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Upsert exchange rate (update or create)
   * PUT /api/exchange-rates/upsert
   */
  static async upsertExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateExchangeRateData = req.body;
      const result = await ExchangeRatesService.upsertExchangeRate(data);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default ExchangeRatesController;
