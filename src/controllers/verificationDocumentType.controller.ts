// =====================================================
// VERIFICATION DOCUMENT TYPE CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { VerificationDocumentTypeService } from '@/services/verificationDocumentType.service';
import { VerificationDocumentTypeFilters } from '@/types/verificationDocumentType.types';
import logger from '@/utils/logger';

export class VerificationDocumentTypeController {

  /**
   * Create a new verification document type
   */
  static async createDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const documentType = await VerificationDocumentTypeService.createDocumentType(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Verification document type created successfully',
        data: documentType
      });
    } catch (error: any) {
      logger.error('Error in createDocumentType controller:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Validation failed')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get verification document type by ID
   */
  static async getDocumentTypeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const documentType = await VerificationDocumentTypeService.getDocumentTypeById(id);
      
      res.status(200).json({
        success: true,
        data: documentType
      });
    } catch (error: any) {
      logger.error('Error in getDocumentTypeById controller:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get all verification document types
   */
  static async getDocumentTypes(req: Request, res: Response): Promise<void> {
    try {
      const filters: VerificationDocumentTypeFilters = {
        country_id: req.query.country_id as string,
        document_type: req.query.document_type as string,
        is_required: req.query.is_required === 'true' ? true : req.query.is_required === 'false' ? false : undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any
      };

      const result = await VerificationDocumentTypeService.getAllDocumentTypes(filters);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error: any) {
      logger.error('Error in getDocumentTypes controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update verification document type
   */
  static async updateDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const documentType = await VerificationDocumentTypeService.updateDocumentType(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Verification document type updated successfully',
        data: documentType
      });
    } catch (error: any) {
      logger.error('Error in updateDocumentType controller:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Validation failed')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Delete verification document type
   */
  static async deleteDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VerificationDocumentTypeService.deleteDocumentType(id);
      
      res.status(200).json({
        success: true,
        message: 'Verification document type deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error in deleteDocumentType controller:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get verification document types by country
   */
  static async getDocumentTypesByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const countryDocumentTypes = await VerificationDocumentTypeService.getDocumentTypesByCountry(countryId);
      
      res.status(200).json({
        success: true,
        data: countryDocumentTypes
      });
    } catch (error: any) {
      logger.error('Error in getDocumentTypesByCountry controller:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * Get required document types for a country
   */
  static async getRequiredDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { countryId } = req.params;
      const requiredDocuments = await VerificationDocumentTypeService.getRequiredDocuments(countryId);
      
      res.status(200).json({
        success: true,
        data: requiredDocuments
      });
    } catch (error: any) {
      logger.error('Error in getRequiredDocuments controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Validate document number
   */
  static async validateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { country_id, document_type, document_number } = req.body;
      
      if (!country_id || !document_type || !document_number) {
        res.status(400).json({
          success: false,
          message: 'Country ID, document type, and document number are required'
        });
        return;
      }
      
      const validationResult = await VerificationDocumentTypeService.validateDocument(
        country_id, 
        document_type, 
        document_number
      );
      
      res.status(200).json({
        success: true,
        data: validationResult
      });
    } catch (error: any) {
      logger.error('Error in validateDocument controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Search verification document types
   */
  static async searchDocumentTypes(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const filters: VerificationDocumentTypeFilters = {
        country_id: req.query.country_id as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await VerificationDocumentTypeService.searchDocumentTypes(query, filters);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error: any) {
      logger.error('Error in searchDocumentTypes controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get verification document type statistics
   */
  static async getDocumentTypeStats(req: Request, res: Response): Promise<void> {
    try {
      const countryId = req.query.country_id as string;
      const stats = await VerificationDocumentTypeService.getStatistics(countryId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error in getDocumentTypeStats controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all document types for a specific type across countries
   */
  static async getDocumentTypesByType(req: Request, res: Response): Promise<void> {
    try {
      const { documentType } = req.params;
      const documentTypes = await VerificationDocumentTypeService.getDocumentTypesByType(documentType);
      
      res.status(200).json({
        success: true,
        data: documentTypes
      });
    } catch (error: any) {
      logger.error('Error in getDocumentTypesByType controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get common document types
   */
  static async getCommonDocumentTypes(_req: Request, res: Response): Promise<void> {
    try {
      const commonTypes = VerificationDocumentTypeService.getCommonDocumentTypes();
      
      res.status(200).json({
        success: true,
        data: commonTypes
      });
    } catch (error: any) {
      logger.error('Error in getCommonDocumentTypes controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Bulk activate/deactivate document types
   */
  static async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ids, is_active } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Array of IDs is required'
        });
        return;
      }

      if (typeof is_active !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'is_active must be a boolean value'
        });
        return;
      }
      
      const affectedRows = await VerificationDocumentTypeService.bulkUpdateStatus(ids, is_active);
      
      res.status(200).json({
        success: true,
        message: `Successfully ${is_active ? 'activated' : 'deactivated'} ${affectedRows} document types`,
        data: { affected_rows: affectedRows }
      });
    } catch (error: any) {
      logger.error('Error in bulkUpdateStatus controller:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
