// =====================================================
// PAYMENT PROVIDER CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { paymentProviderService } from '../services/paymentProvider.service';
import {
  CreatePaymentProviderRequest,
  UpdatePaymentProviderRequest,
  PaymentProviderFilters,
  BulkProviderOperation,
} from '../types/paymentProvider.types';

/**
 * Payment Provider Controller Class
 */
export class PaymentProviderController {
  /**
   * Create a new payment provider
   */
  async createPaymentProvider(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePaymentProviderRequest = req.body;

      // Validate required fields
      if (!data.country_id || !data.provider_name || !data.provider_type || !data.supported_currencies) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: country_id, provider_name, provider_type, supported_currencies',
        });
        return;
      }

      if (!Array.isArray(data.supported_currencies) || data.supported_currencies.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Supported currencies must be a non-empty array',
        });
        return;
      }

      const provider = await paymentProviderService.createPaymentProvider(data);
      
      res.status(201).json({
        success: true,
        data: provider,
        message: 'Payment provider created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payment provider',
      });
    }
  }

  /**
   * Get payment provider by ID
   */
  async getPaymentProviderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Provider ID is required',
        });
        return;
      }

      const provider = await paymentProviderService.getPaymentProviderById(id);
      
      if (!provider) {
        res.status(404).json({
          success: false,
          message: 'Payment provider not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment provider',
      });
    }
  }

  /**
   * Get payment providers with filters
   */
  async getPaymentProviders(req: Request, res: Response): Promise<void> {
    try {
      const filters: PaymentProviderFilters = {
        country_id: req.query.country_id as string,
        provider_name: req.query.provider_name as string,
        provider_type: req.query.provider_type as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        currency: req.query.currency as string,
        supports_refunds: req.query.supports_refunds === 'true' ? true : req.query.supports_refunds === 'false' ? false : undefined,
        supports_recurring: req.query.supports_recurring === 'true' ? true : req.query.supports_recurring === 'false' ? false : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };

      // Validate pagination
      if (filters.page && filters.page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page must be greater than 0',
        });
        return;
      }

      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
        });
        return;
      }

      const result = await paymentProviderService.getPaymentProviders(filters);
      
      res.status(200).json({
        success: true,
        data: result.providers,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment providers',
      });
    }
  }

  /**
   * Update payment provider
   */
  async updatePaymentProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdatePaymentProviderRequest = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Provider ID is required',
        });
        return;
      }

      const provider = await paymentProviderService.updatePaymentProvider(id, data);
      
      if (!provider) {
        res.status(404).json({
          success: false,
          message: 'Payment provider not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: provider,
        message: 'Payment provider updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update payment provider',
      });
    }
  }

  /**
   * Delete payment provider
   */
  async deletePaymentProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Provider ID is required',
        });
        return;
      }

      const deleted = await paymentProviderService.deletePaymentProvider(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Payment provider not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment provider deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete payment provider',
      });
    }
  }

  /**
   * Get payment provider statistics
   */
  async getPaymentProviderStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await paymentProviderService.getPaymentProviderStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment provider statistics',
      });
    }
  }

  /**
   * Get payment providers by country
   */
  async getPaymentProvidersByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;

      if (!countryId) {
        res.status(400).json({
          success: false,
          message: 'Country ID is required',
        });
        return;
      }

      const result = await paymentProviderService.getPaymentProvidersByCountry(countryId);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment providers for country',
      });
    }
  }

  /**
   * Calculate payment fees
   */
  async calculatePaymentFees(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const { amount, currency, provider_type } = req.query;

      if (!countryId || !amount || !currency) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: countryId, amount, currency',
        });
        return;
      }

      const amountNum = parseFloat(amount as string);
      if (isNaN(amountNum) || amountNum <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
        return;
      }

      const calculations = await paymentProviderService.calculatePaymentFees(
        countryId,
        amountNum,
        currency as string,
        provider_type as string
      );
      
      res.status(200).json({
        success: true,
        data: calculations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate payment fees',
      });
    }
  }

  /**
   * Compare providers for a payment
   */
  async compareProvidersForPayment(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const { amount, currency, provider_type } = req.query;

      if (!countryId || !amount || !currency) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: countryId, amount, currency',
        });
        return;
      }

      const amountNum = parseFloat(amount as string);
      if (isNaN(amountNum) || amountNum <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
        return;
      }

      const comparison = await paymentProviderService.compareProvidersForPayment(
        countryId,
        amountNum,
        currency as string,
        provider_type as string
      );
      
      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to compare providers',
      });
    }
  }

  /**
   * Bulk operations on providers
   */
  async bulkUpdateProviders(req: Request, res: Response): Promise<void> {
    try {
      const operation: BulkProviderOperation = req.body;

      if (!operation.operation || !operation.provider_ids || !Array.isArray(operation.provider_ids)) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: operation, provider_ids (array)',
        });
        return;
      }

      if (operation.provider_ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Provider IDs array cannot be empty',
        });
        return;
      }

      const validOperations = ['activate', 'deactivate', 'update_fees', 'update_limits'];
      if (!validOperations.includes(operation.operation)) {
        res.status(400).json({
          success: false,
          message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
        });
        return;
      }

      const affectedCount = await paymentProviderService.bulkUpdateProviders(operation);
      
      res.status(200).json({
        success: true,
        data: { affected_count: affectedCount },
        message: `Bulk operation '${operation.operation}' completed successfully`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to perform bulk operation',
      });
    }
  }

  /**
   * Search payment providers
   */
  async searchPaymentProviders(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const filters = {
        country_id: req.query.country_id as string,
        provider_type: req.query.provider_type as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const providers = await paymentProviderService.searchPaymentProviders(query, filters);
      
      res.status(200).json({
        success: true,
        data: providers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search payment providers',
      });
    }
  }
}

export const paymentProviderController = new PaymentProviderController();
