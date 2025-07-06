import { Request, Response } from 'express';
import { InsuranceProviderService } from '../services/insuranceProvider.service';
import {
  CreateInsuranceProviderData,
  UpdateInsuranceProviderData,
  InsuranceProviderFilters,
  InsuranceProviderQueryOptions,
} from '../types/insuranceProvider.types';

export class InsuranceProviderController {
  /**
   * Create a new insurance provider
   * POST /api/insurance-providers
   */
  static async createProvider(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateInsuranceProviderData = req.body;

      const result = await InsuranceProviderService.createInsuranceProvider(data);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Insurance provider created successfully',
          data: result.provider,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error,
          validation_errors: result.validation_errors,
        });
      }
    } catch (error: any) {
      console.error('Error creating insurance provider:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get insurance provider by ID
   * GET /api/insurance-providers/:id
   */
  static async getProviderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const options: InsuranceProviderQueryOptions = {
        include_inactive: req.query.include_inactive === 'true',
        include_credentials: req.query.include_credentials === 'true',
        include_stats: req.query.include_stats === 'true',
      };

      const provider = await InsuranceProviderService.getInsuranceProviderById(id, options);

      if (provider) {
        res.json({
          success: true,
          data: provider,
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Insurance provider not found',
        });
      }
    } catch (error: any) {
      console.error('Error fetching insurance provider:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Search insurance providers
   * GET /api/insurance-providers/search
   */
  static async searchProviders(req: Request, res: Response): Promise<void> {
    try {
      const filters: InsuranceProviderFilters = {
        country_id: req.query.country_id as string,
        provider_name: req.query.provider_name as string,
        provider_type: req.query.provider_type as any,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        integration_status: req.query.integration_status as any,
        min_rating: req.query.min_rating ? parseFloat(req.query.min_rating as string) : undefined,
        max_rating: req.query.max_rating ? parseFloat(req.query.max_rating as string) : undefined,
        supports_category: req.query.supports_category as string,
        coverage_type: req.query.coverage_type as any,
        language: req.query.language as string,
        min_coverage: req.query.min_coverage ? parseFloat(req.query.min_coverage as string) : undefined,
        max_coverage: req.query.max_coverage ? parseFloat(req.query.max_coverage as string) : undefined,
        max_processing_days: req.query.max_processing_days ? parseInt(req.query.max_processing_days as string) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: (req.query.sort_by as string) || 'provider_name',
        sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'ASC',
      };

      const result = await InsuranceProviderService.searchInsuranceProviders(filters);

      res.json({
        success: true,
        data: result.providers,
        pagination: result.pagination,
        filters_applied: result.filters_applied,
        stats: result.stats,
      });
    } catch (error: any) {
      console.error('Error searching insurance providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get all insurance providers
   * GET /api/insurance-providers
   */
  static async getAllProviders(req: Request, res: Response): Promise<void> {
    try {
      const filters: InsuranceProviderFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sort_by: (req.query.sort_by as string) || 'provider_name',
        sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'ASC',
        is_active: req.query.include_inactive === 'true' ? undefined : true,
      };

      const result = await InsuranceProviderService.searchInsuranceProviders(filters);

      res.json({
        success: true,
        data: result.providers,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching insurance providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Update insurance provider
   * PUT /api/insurance-providers/:id
   */
  static async updateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateInsuranceProviderData = req.body;

      const result = await InsuranceProviderService.updateInsuranceProvider(id, data);

      if (result.success) {
        res.json({
          success: true,
          message: 'Insurance provider updated successfully',
          data: result.provider,
          changes_made: result.changes_made,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error,
          validation_errors: result.validation_errors,
        });
      }
    } catch (error: any) {
      console.error('Error updating insurance provider:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Delete insurance provider
   * DELETE /api/insurance-providers/:id
   */
  static async deleteProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await InsuranceProviderService.deleteInsuranceProvider(id);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.error,
        });
      }
    } catch (error: any) {
      console.error('Error deleting insurance provider:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get providers by country
   * GET /api/insurance-providers/country/:countryId
   */
  static async getProvidersByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const options: InsuranceProviderQueryOptions = {
        include_inactive: req.query.include_inactive === 'true',
        include_credentials: req.query.include_credentials === 'true',
      };

      const providers = await InsuranceProviderService.getProvidersByCountry(countryId, options);

      res.json({
        success: true,
        data: providers,
        count: providers.length,
      });
    } catch (error: any) {
      console.error('Error fetching providers by country:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get providers by category
   * GET /api/insurance-providers/category/:categoryId
   */
  static async getProvidersByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const options: InsuranceProviderQueryOptions = {
        include_inactive: req.query.include_inactive === 'true',
        include_credentials: req.query.include_credentials === 'true',
        country_id: req.query.country_id as string,
      };

      const providers = await InsuranceProviderService.getProvidersByCategory(categoryId, options);

      res.json({
        success: true,
        data: providers,
        count: providers.length,
      });
    } catch (error: any) {
      console.error('Error fetching providers by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get live providers with API integration
   * GET /api/insurance-providers/live
   */
  static async getLiveProviders(req: Request, res: Response): Promise<void> {
    try {
      const options: InsuranceProviderQueryOptions = {
        country_id: req.query.country_id as string,
        include_credentials: req.query.include_credentials === 'true',
      };

      const providers = await InsuranceProviderService.getLiveProviders(options);

      res.json({
        success: true,
        data: providers,
        count: providers.length,
      });
    } catch (error: any) {
      console.error('Error fetching live providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get provider statistics
   * GET /api/insurance-providers/stats
   */
  static async getProviderStats(req: Request, res: Response): Promise<void> {
    try {
      const countryId = req.query.country_id as string;

      const stats = await InsuranceProviderService.getProviderStats(countryId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching provider stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Bulk create insurance providers
   * POST /api/insurance-providers/bulk
   */
  static async bulkCreateProviders(req: Request, res: Response): Promise<void> {
    try {
      const providersData: CreateInsuranceProviderData[] = req.body.providers;

      if (!Array.isArray(providersData)) {
        res.status(400).json({
          success: false,
          message: 'Providers data must be an array',
        });
        return;
      }

      const result = await InsuranceProviderService.bulkCreateProviders(providersData);

      const statusCode = result.success ? 201 : 207; // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.success,
        message: `Processed ${result.processed} providers, ${result.failed} failed`,
        data: {
          processed: result.processed,
          failed: result.failed,
          errors: result.errors,
          created_providers: result.created_providers,
        },
      });
    } catch (error: any) {
      console.error('Error bulk creating insurance providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Compare providers for a category
   * GET /api/insurance-providers/compare
   */
  static async compareProviders(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.category_id as string;
      const coverageAmount = req.query.coverage_amount ? parseFloat(req.query.coverage_amount as string) : 0;
      const countryId = req.query.country_id as string;

      if (!categoryId) {
        res.status(400).json({
          success: false,
          message: 'Category ID is required',
        });
        return;
      }

      const comparison = await InsuranceProviderService.compareProviders(categoryId, coverageAmount, countryId);

      res.json({
        success: true,
        data: comparison,
        filters: {
          category_id: categoryId,
          coverage_amount: coverageAmount,
          country_id: countryId,
        },
      });
    } catch (error: any) {
      console.error('Error comparing providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Analyze coverage for a category and country
   * GET /api/insurance-providers/coverage-analysis
   */
  static async analyzeCoverage(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.category_id as string;
      const countryId = req.query.country_id as string;

      if (!categoryId || !countryId) {
        res.status(400).json({
          success: false,
          message: 'Category ID and Country ID are required',
        });
        return;
      }

      const analysis = await InsuranceProviderService.analyzeCoverage(categoryId, countryId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      console.error('Error analyzing coverage:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  /**
   * Get market analysis for a country
   * GET /api/insurance-providers/market-analysis/:countryId
   */
  static async getMarketAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;

      const analysis = await InsuranceProviderService.getMarketAnalysis(countryId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      console.error('Error getting market analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}
