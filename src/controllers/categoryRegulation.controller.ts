import { Request, Response } from 'express';
import CategoryRegulationService from '../services/categoryRegulation/CategoryRegulationService';
import {
  CreateCategoryRegulationRequest,
  UpdateCategoryRegulationRequest,
  CategoryRegulationFilters,
  BulkCategoryRegulationOperation,
  ComplianceCheckRequest,
} from '../types/categoryRegulation.types';
import { validationResult } from 'express-validator';
import logger from '../utils/logger';

export class CategoryRegulationController {
  
  /**
   * Create a new category regulation
   */
  static async createCategoryRegulation(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }
      
      const data: CreateCategoryRegulationRequest = req.body;
      
      const result = await CategoryRegulationService.createCategoryRegulation(data);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error: any) {
      logger.error('Error in createCategoryRegulation controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create category regulation',
      });
    }
  }
  
  /**
   * Get category regulation by ID
   */
  static async getCategoryRegulationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category regulation ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.getCategoryRegulationById(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        const statusCode = result.error === 'Category regulation not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getCategoryRegulationById controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get category regulation',
      });
    }
  }
  
  /**
   * Get category regulations with filtering and pagination
   */
  static async getCategoryRegulations(req: Request, res: Response): Promise<void> {
    try {
      const filters: CategoryRegulationFilters = {
        category_id: req.query.category_id as string,
        country_id: req.query.country_id as string,
        country_code: req.query.country_code as string,
        is_allowed: req.query.is_allowed === 'true' ? true : req.query.is_allowed === 'false' ? false : undefined,
        requires_license: req.query.requires_license === 'true' ? true : req.query.requires_license === 'false' ? false : undefined,
        license_type: req.query.license_type as string,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
        max_rental_days_min: req.query.max_rental_days_min ? parseInt(req.query.max_rental_days_min as string) : undefined,
        max_rental_days_max: req.query.max_rental_days_max ? parseInt(req.query.max_rental_days_max as string) : undefined,
        mandatory_insurance: req.query.mandatory_insurance === 'true' ? true : req.query.mandatory_insurance === 'false' ? false : undefined,
        min_coverage_min: req.query.min_coverage_min ? parseFloat(req.query.min_coverage_min as string) : undefined,
        min_coverage_max: req.query.min_coverage_max ? parseFloat(req.query.min_coverage_max as string) : undefined,
        requires_background_check: req.query.requires_background_check === 'true' ? true : req.query.requires_background_check === 'false' ? false : undefined,
        compliance_level: req.query.compliance_level as any,
        has_seasonal_restrictions: req.query.has_seasonal_restrictions === 'true' ? true : req.query.has_seasonal_restrictions === 'false' ? false : undefined,
        documentation_type: req.query.documentation_type as any,
        search: req.query.search as string,
        include_deleted: req.query.include_deleted === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof CategoryRegulationFilters] === undefined) {
          delete filters[key as keyof CategoryRegulationFilters];
        }
      });
      
      const result = await CategoryRegulationService.getCategoryRegulations(filters);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data?.data,
          pagination: result.data?.pagination,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getCategoryRegulations controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get category regulations',
      });
    }
  }
  
  /**
   * Update category regulation
   */
  static async updateCategoryRegulation(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }
      
      const { id } = req.params;
      const data: UpdateCategoryRegulationRequest = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category regulation ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.updateCategoryRegulation(id, data);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error === 'Category regulation not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error: any) {
      logger.error('Error in updateCategoryRegulation controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update category regulation',
      });
    }
  }
  
  /**
   * Delete category regulation (soft delete)
   */
  static async deleteCategoryRegulation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category regulation ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.deleteCategoryRegulation(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error === 'Category regulation not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in deleteCategoryRegulation controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete category regulation',
      });
    }
  }
  
  /**
   * Permanently delete category regulation
   */
  static async permanentlyDeleteCategoryRegulation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category regulation ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.permanentlyDeleteCategoryRegulation(id);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error === 'Category regulation not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in permanentlyDeleteCategoryRegulation controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to permanently delete category regulation',
      });
    }
  }
  
  /**
   * Bulk operations for category regulations
   */
  static async bulkOperations(req: Request, res: Response): Promise<void> {
    try {
      const operations: BulkCategoryRegulationOperation = req.body;
      
      if (!operations || Object.keys(operations).length === 0) {
        res.status(400).json({
          success: false,
          error: 'Bulk operations data is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.bulkOperations(operations);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in bulkOperations controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to perform bulk operations',
      });
    }
  }
  
  /**
   * Check compliance for category-country combination
   */
  static async checkCompliance(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }
      
      const checkRequest: ComplianceCheckRequest = req.body;
      
      const result = await CategoryRegulationService.checkCompliance(checkRequest);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in checkCompliance controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check compliance',
      });
    }
  }
  
  /**
   * Get category regulation statistics
   */
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const result = await CategoryRegulationService.getStats();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getStats controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get statistics',
      });
    }
  }
  
  /**
   * Get country regulation overview
   */
  static async getCountryRegulationOverview(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      
      if (!countryId) {
        res.status(400).json({
          success: false,
          error: 'Country ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.getCountryRegulationOverview(countryId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        const statusCode = result.error === 'No regulations found for this country' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getCountryRegulationOverview controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get country regulation overview',
      });
    }
  }
  
  /**
   * Get category regulation overview
   */
  static async getCategoryRegulationOverview(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
        });
        return;
      }
      
      const result = await CategoryRegulationService.getCategoryRegulationOverview(categoryId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        const statusCode = result.error === 'No regulations found for this category' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getCategoryRegulationOverview controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get category regulation overview',
      });
    }
  }
  
  /**
   * Get regulations by category
   */
  static async getRegulationsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
        });
        return;
      }
      
      const filters: CategoryRegulationFilters = {
        category_id: categoryId,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };
      
      const result = await CategoryRegulationService.getCategoryRegulations(filters);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data?.data,
          pagination: result.data?.pagination,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getRegulationsByCategory controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get regulations by category',
      });
    }
  }
  
  /**
   * Get regulations by country
   */
  static async getRegulationsByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      
      if (!countryId) {
        res.status(400).json({
          success: false,
          error: 'Country ID is required',
        });
        return;
      }
      
      const filters: CategoryRegulationFilters = {
        country_id: countryId,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      };
      
      const result = await CategoryRegulationService.getCategoryRegulations(filters);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data?.data,
          pagination: result.data?.pagination,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Error in getRegulationsByCountry controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get regulations by country',
      });
    }
  }
  
  /**
   * Find regulation for category-country combination
   */
  static async findRegulationForCategoryCountry(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, countryId } = req.params;
      
      if (!categoryId || !countryId) {
        res.status(400).json({
          success: false,
          error: 'Both category ID and country ID are required',
        });
        return;
      }
      
      const filters: CategoryRegulationFilters = {
        category_id: categoryId,
        country_id: countryId,
        limit: 1,
      };
      
      const result = await CategoryRegulationService.getCategoryRegulations(filters);
      
      if (
        result.success &&
        result.data &&
        Array.isArray(result.data.data) &&
        result.data.data.length > 0
      ) {
        res.status(200).json({
          success: true,
          data: result.data.data[0],
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'No regulation found for this category-country combination',
        });
      }
    } catch (error: any) {
      logger.error('Error in findRegulationForCategoryCountry controller:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to find regulation for category-country combination',
      });
    }
  }
}

export default CategoryRegulationController;
