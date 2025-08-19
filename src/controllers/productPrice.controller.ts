// =====================================================
// PRODUCT PRICE CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { productPriceService } from '../services/productPrice.service';
import {
  CreateProductPriceRequest,
  UpdateProductPriceRequest,
  ProductPriceFilters,
  PriceCalculationRequest,
  BulkPriceUpdateOperation,
} from '../types/productPrice.types';

/**
 * Product Price Controller Class
 */
export class ProductPriceController {
  /**
   * Create a new product price
   */
  async createProductPrice(req: Request, res: Response): Promise<void> {
    try {
      console.log('[DEBUG] Entered ProductPriceController.createProductPrice');
      console.log('[DEBUG] Request body:', req.body);
      const data: CreateProductPriceRequest = req.body;

      // Validate required fields
      if (!data.product_id || !data.country_id || !data.currency || !data.price_per_day) {
        const missing: string[] = [];
        if (!data.product_id) missing.push('product_id');
        if (!data.country_id) missing.push('country_id');
        if (!data.currency) missing.push('currency');
        if (!data.price_per_day) missing.push('price_per_day');
        console.warn('[DEBUG] Missing required fields for product price creation:', missing);
        res.status(400).json({
          success: false,
          message: 'Missing required fields: product_id, country_id, currency, price_per_day',
        });
        return;
      }

      if (data.price_per_day <= 0) {
        console.warn('[DEBUG] price_per_day invalid (<= 0):', data.price_per_day);
        res.status(400).json({
          success: false,
          message: 'Daily price must be greater than 0',
        });
        return;
      }

      console.log('[DEBUG] Creating product price with payload:', {
        product_id: data.product_id,
        country_id: data.country_id,
        currency: data.currency,
        price_per_day: data.price_per_day
      });
      const price = await productPriceService.createProductPrice(data);
      console.log('[DEBUG] Product price created successfully:', price?.id);
      
      res.status(201).json({
        success: true,
        data: price,
        message: 'Product price created successfully',
      });
    } catch (error: any) {
      // Normalize unknown errors to avoid cryptic messages like "reading 'constructor'"
      console.error('[ProductPriceController] createProductPrice error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to create product price');
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * Get product price by ID
   */
  async getProductPriceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Price ID is required',
        });
        return;
      }

      const price = await productPriceService.getProductPriceById(id);
      
      if (!price) {
        res.status(404).json({
          success: false,
          message: 'Product price not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: price,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch product price',
      });
    }
  }

  /**
   * Get product prices with filters
   */
  async getProductPrices(req: Request, res: Response): Promise<void> {
    try {
      const filters: ProductPriceFilters = {
        product_id: req.query.product_id as string,
        country_id: req.query.country_id as string,
        currency: req.query.currency as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        auto_convert: req.query.auto_convert === 'true' ? true : req.query.auto_convert === 'false' ? false : undefined,
        dynamic_pricing_enabled: req.query.dynamic_pricing_enabled === 'true' ? true : req.query.dynamic_pricing_enabled === 'false' ? false : undefined,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        has_hourly_pricing: req.query.has_hourly_pricing === 'true' ? true : req.query.has_hourly_pricing === 'false' ? false : undefined,
        has_weekly_pricing: req.query.has_weekly_pricing === 'true' ? true : req.query.has_weekly_pricing === 'false' ? false : undefined,
        has_monthly_pricing: req.query.has_monthly_pricing === 'true' ? true : req.query.has_monthly_pricing === 'false' ? false : undefined,
        effective_on: req.query.effective_on ? new Date(req.query.effective_on as string) : undefined,
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

      const result = await productPriceService.getProductPrices(filters);
      
      res.status(200).json({
        success: true,
        data: result.prices,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch product prices',
      });
    }
  }

  /**
   * Update product price
   */
  async updateProductPrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateProductPriceRequest = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Price ID is required',
        });
        return;
      }

      // Validate daily price if provided
      if (data.price_per_day !== undefined && data.price_per_day <= 0) {
        res.status(400).json({
          success: false,
          message: 'Daily price must be greater than 0',
        });
        return;
      }

      const price = await productPriceService.updateProductPrice(id, data);
      
      if (!price) {
        res.status(404).json({
          success: false,
          message: 'Product price not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: price,
        message: 'Product price updated successfully',
      });
    } catch (error: any) {
      console.error('[ProductPriceController] updateProductPrice error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to update product price');
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * Delete product price
   */
  async deleteProductPrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Price ID is required',
        });
        return;
      }

      const deleted = await productPriceService.deleteProductPrice(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Product price not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product price deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete product price',
      });
    }
  }

  /**
   * Calculate rental price
   */
  async calculateRentalPrice(req: Request, res: Response): Promise<void> {
    try {
      const request: PriceCalculationRequest = {
        product_id: req.body.product_id || req.query.product_id as string,
        country_id: req.body.country_id || req.query.country_id as string,
        currency: req.body.currency || req.query.currency as string,
        rental_duration_hours: parseFloat(req.body.rental_duration_hours || req.query.rental_duration_hours as string),
        quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : parseInt(req.query.quantity as string || '1', 10),
        rental_start_date: req.body.rental_start_date ? new Date(req.body.rental_start_date) : req.query.rental_start_date ? new Date(req.query.rental_start_date as string) : undefined,
        include_security_deposit: req.body.include_security_deposit !== undefined ? req.body.include_security_deposit : (req.query.include_security_deposit !== 'false'),
        apply_discounts: req.body.apply_discounts !== undefined ? req.body.apply_discounts : (req.query.apply_discounts !== 'false'),
      };

      // Validate required fields
      if (!request.product_id || !request.country_id || !request.rental_duration_hours) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: product_id, country_id, rental_duration_hours',
        });
        return;
      }

      if (request.rental_duration_hours <= 0) {
        res.status(400).json({
          success: false,
          message: 'Rental duration must be greater than 0 hours',
        });
        return;
      }

      if (request.quantity && request.quantity < 1) {
        res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1',
        });
        return;
      }

      const calculation = await productPriceService.calculateRentalPrice(request);
      
      res.status(200).json({
        success: true,
        data: calculation,
      });
    } catch (error: any) {
      console.error('[ProductPriceController] calculateRentalPrice error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to calculate rental price');
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * Compare prices across countries
   */
  async compareProductPricesAcrossCountries(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const rentalDurationHours = parseFloat(req.query.rental_duration_hours as string);
      const quantity = parseInt(req.query.quantity as string || '1', 10);

      if (!productId) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      if (!rentalDurationHours || rentalDurationHours <= 0) {
        res.status(400).json({
          success: false,
          message: 'Rental duration hours must be provided and greater than 0',
        });
        return;
      }

      if (quantity < 1) {
        res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1',
        });
        return;
      }

      const comparison = await productPriceService.compareProductPricesAcrossCountries(
        productId,
        rentalDurationHours,
        quantity
      );
      
      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      console.error('[ProductPriceController] compareProductPricesAcrossCountries error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to compare product prices');
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * Get product price statistics
   */
  async getProductPriceStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await productPriceService.getProductPriceStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch product price statistics',
      });
    }
  }

  /**
   * Bulk update product prices
   */
  async bulkUpdateProductPrices(req: Request, res: Response): Promise<void> {
    try {
      const operation: BulkPriceUpdateOperation = req.body;

      if (!operation.operation || !operation.data) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: operation, data',
        });
        return;
      }

      const validOperations = ['update_prices', 'update_discounts', 'update_market_factors', 'activate', 'deactivate', 'update_exchange_rates'];
      if (!validOperations.includes(operation.operation)) {
        res.status(400).json({
          success: false,
          message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
        });
        return;
      }

      const affectedCount = await productPriceService.bulkUpdateProductPrices(operation);
      
      res.status(200).json({
        success: true,
        data: { affected_count: affectedCount },
        message: `Bulk operation '${operation.operation}' completed successfully`,
      });
    } catch (error: any) {
      console.error('[ProductPriceController] bulkUpdateProductPrices error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to perform bulk operation');
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * Search product prices
   */
  async searchProductPrices(req: Request, res: Response): Promise<void> {
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
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const prices = await productPriceService.searchProductPrices(query, filters);
      
      res.status(200).json({
        success: true,
        data: prices,
      });
    } catch (error: any) {
      console.error('[ProductPriceController] searchProductPrices error:', error);
      const message = error instanceof Error
        ? error.message
        : (typeof error === 'string' ? error : 'Failed to search product prices');
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get prices by product
   */
  async getProductPricesByProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const filters: ProductPriceFilters = {
        product_id: productId,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        country_id: req.query.country_id as string,
        currency: req.query.currency as string,
        page: 1,
        limit: 100,
        sort_by: 'country_id',
        sort_order: 'asc',
      };

      const result = await productPriceService.getProductPrices(filters);
      
      res.status(200).json({
        success: true,
        data: result.prices,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch product prices',
      });
    }
  }

  /**
   * Get prices by country
   */
  async getProductPricesByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;

      if (!countryId) {
        res.status(400).json({
          success: false,
          message: 'Country ID is required',
        });
        return;
      }

      const filters: ProductPriceFilters = {
        country_id: countryId,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        product_id: req.query.product_id as string,
        currency: req.query.currency as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sort_by: 'product_id',
        sort_order: 'asc',
      };

      const result = await productPriceService.getProductPrices(filters);
      
      res.status(200).json({
        success: true,
        data: result.prices,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch product prices',
      });
    }
  }
}

export const productPriceController = new ProductPriceController();
