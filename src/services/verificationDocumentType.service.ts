// =====================================================
// VERIFICATION DOCUMENT TYPE SERVICE
// =====================================================

import { VerificationDocumentTypeModel } from '@/models/VerificationDocumentType.model';
import { 
  VerificationDocumentType, 
  CreateVerificationDocumentTypeRequest, 
  UpdateVerificationDocumentTypeRequest, 
  VerificationDocumentTypeFilters, 
  VerificationDocumentTypeStats,
  CountryDocumentTypes,
  DocumentValidationResult,
  DocumentTypeValidationConfig,
  CommonDocumentTypes
} from '@/types/verificationDocumentType.types';
import logger from '@/utils/logger';

export class VerificationDocumentTypeService {

  /**
   * Create a new verification document type
   */
  static async createDocumentType(data: CreateVerificationDocumentTypeRequest): Promise<VerificationDocumentType> {
    try {
      // Validate input data
      await this.validateCreateRequest(data);

      // Check if document type already exists for country
      const exists = await VerificationDocumentTypeModel.existsForCountry(data.country_id, data.document_type);
      if (exists) {
        throw new Error('Document type already exists for this country');
      }

      // Create document type
      const documentType = await VerificationDocumentTypeModel.create(data);
      
      logger.info(`Verification document type created: ${documentType.id}`, {
        country_id: data.country_id,
        document_type: data.document_type
      });

      return documentType;
    } catch (error: any) {
      logger.error('Error creating verification document type:', error);
      throw error;
    }
  }

  /**
   * Get verification document type by ID
   */
  static async getDocumentTypeById(id: string): Promise<VerificationDocumentType> {
    try {
      const documentType = await VerificationDocumentTypeModel.findById(id);
      
      if (!documentType) {
        throw new Error('Verification document type not found');
      }

      return documentType;
    } catch (error: any) {
      logger.error('Error getting verification document type by ID:', error);
      throw error;
    }
  }

  /**
   * Get all verification document types with optional filters
   */
  static async getAllDocumentTypes(filters: VerificationDocumentTypeFilters = {}): Promise<{
    data: VerificationDocumentType[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      return await VerificationDocumentTypeModel.findAll(filters);
    } catch (error: any) {
      logger.error('Error getting verification document types:', error);
      throw error;
    }
  }

  /**
   * Update verification document type
   */
  static async updateDocumentType(id: string, data: UpdateVerificationDocumentTypeRequest): Promise<VerificationDocumentType> {
    try {
      // Check if document type exists
      const existingDocumentType = await VerificationDocumentTypeModel.findById(id);
      if (!existingDocumentType) {
        throw new Error('Verification document type not found');
      }

      // Validate update data
      await this.validateUpdateRequest(data);

      // Update document type
      const updatedDocumentType = await VerificationDocumentTypeModel.update(id, data);
      
      if (!updatedDocumentType) {
        throw new Error('Failed to update verification document type');
      }

      logger.info(`Verification document type updated: ${id}`, { updates: data });

      return updatedDocumentType;
    } catch (error: any) {
      logger.error('Error updating verification document type:', error);
      throw error;
    }
  }

  /**
   * Delete verification document type (soft delete)
   */
  static async deleteDocumentType(id: string): Promise<void> {
    try {
      // Check if document type exists
      const existingDocumentType = await VerificationDocumentTypeModel.findById(id);
      if (!existingDocumentType) {
        throw new Error('Verification document type not found');
      }

      // Soft delete document type
      const deleted = await VerificationDocumentTypeModel.delete(id);
      
      if (!deleted) {
        throw new Error('Failed to delete verification document type');
      }

      logger.info(`Verification document type deleted: ${id}`);
    } catch (error: any) {
      logger.error('Error deleting verification document type:', error);
      throw error;
    }
  }

  /**
   * Get verification document types by country
   */
  static async getDocumentTypesByCountry(countryId: string): Promise<CountryDocumentTypes> {
    try {
      const countryDocumentTypes = await VerificationDocumentTypeModel.findByCountry(countryId);
      
      if (!countryDocumentTypes) {
        throw new Error('Country not found or has no document types');
      }

      return countryDocumentTypes;
    } catch (error: any) {
      logger.error('Error getting document types by country:', error);
      throw error;
    }
  }

  /**
   * Get required document types for a country
   */
  static async getRequiredDocuments(countryId: string): Promise<VerificationDocumentType[]> {
    try {
      return await VerificationDocumentTypeModel.getRequiredDocuments(countryId);
    } catch (error: any) {
      logger.error('Error getting required document types:', error);
      throw error;
    }
  }

  /**
   * Validate document number
   */
  static async validateDocument(
    countryId: string, 
    documentType: string, 
    documentNumber: string
  ): Promise<DocumentValidationResult> {
    try {
      if (!documentNumber || documentNumber.trim().length === 0) {
        return {
          is_valid: false,
          document_type: documentType,
          document_number: documentNumber,
          errors: ['Document number is required'],
          suggestions: []
        };
      }

      return await VerificationDocumentTypeModel.validateDocument(countryId, documentType, documentNumber.trim());
    } catch (error: any) {
      logger.error('Error validating document:', error);
      throw error;
    }
  }

  /**
   * Get validation configuration for document type
   */
  static async getValidationConfig(
    countryId: string, 
    documentType: string
  ): Promise<DocumentTypeValidationConfig> {
    try {
      const config = await VerificationDocumentTypeModel.getValidationConfig(countryId, documentType);
      
      if (!config) {
        throw new Error('Document type validation configuration not found');
      }

      return config;
    } catch (error: any) {
      logger.error('Error getting validation configuration:', error);
      throw error;
    }
  }

  /**
   * Get verification document type statistics
   */
  static async getStatistics(countryId?: string): Promise<VerificationDocumentTypeStats> {
    try {
      return await VerificationDocumentTypeModel.getStats(countryId);
    } catch (error: any) {
      logger.error('Error getting verification document type statistics:', error);
      throw error;
    }
  }

  /**
   * Search document types
   */
  static async searchDocumentTypes(query: string, filters: VerificationDocumentTypeFilters = {}): Promise<{
    data: VerificationDocumentType[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const searchFilters = {
        ...filters,
        search: query,
        is_active: filters.is_active !== undefined ? filters.is_active : true
      };

      return await VerificationDocumentTypeModel.findAll(searchFilters);
    } catch (error: any) {
      logger.error('Error searching verification document types:', error);
      throw error;
    }
  }

  /**
   * Get all document types for a specific type across countries
   */
  static async getDocumentTypesByType(documentType: string): Promise<VerificationDocumentType[]> {
    try {
      return await VerificationDocumentTypeModel.findByDocumentType(documentType);
    } catch (error: any) {
      logger.error('Error getting document types by type:', error);
      throw error;
    }
  }

  /**
   * Bulk activate/deactivate document types
   */
  static async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    try {
      if (!ids || ids.length === 0) {
        throw new Error('No document type IDs provided');
      }

      const affectedRows = await VerificationDocumentTypeModel.bulkUpdateStatus(ids, isActive);
      
      logger.info(`Bulk ${isActive ? 'activated' : 'deactivated'} ${affectedRows} document types`);
      
      return affectedRows;
    } catch (error: any) {
      logger.error('Error in bulk status update:', error);
      throw error;
    }
  }

  /**
   * Validate create request data
   */
  private static async validateCreateRequest(data: CreateVerificationDocumentTypeRequest): Promise<void> {
    const errors: string[] = [];

    // Required fields
    if (!data.country_id) {
      errors.push('Country ID is required');
    }

    if (!data.document_type) {
      errors.push('Document type is required');
    }

    // Validate document type format
    if (data.document_type && !/^[a-z_]+$/.test(data.document_type)) {
      errors.push('Document type must contain only lowercase letters and underscores');
    }

    // Validate regex if provided
    if (data.validation_regex) {
      try {
        new RegExp(data.validation_regex);
      } catch {
        errors.push('Invalid validation regex pattern');
      }
    }

    // Validate length constraints
    if (data.min_length !== undefined && data.min_length < 1) {
      errors.push('Minimum length must be at least 1');
    }

    if (data.max_length !== undefined && data.max_length < 1) {
      errors.push('Maximum length must be at least 1');
    }

    if (data.min_length !== undefined && data.max_length !== undefined && data.min_length > data.max_length) {
      errors.push('Minimum length cannot be greater than maximum length');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate update request data
   */
  private static async validateUpdateRequest(data: UpdateVerificationDocumentTypeRequest): Promise<void> {
    const errors: string[] = [];

    // Validate regex if provided
    if (data.validation_regex) {
      try {
        new RegExp(data.validation_regex);
      } catch {
        errors.push('Invalid validation regex pattern');
      }
    }

    // Validate length constraints
    if (data.min_length !== undefined && data.min_length < 1) {
      errors.push('Minimum length must be at least 1');
    }

    if (data.max_length !== undefined && data.max_length < 1) {
      errors.push('Maximum length must be at least 1');
    }

    if (data.min_length !== undefined && data.max_length !== undefined && data.min_length > data.max_length) {
      errors.push('Minimum length cannot be greater than maximum length');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get common document types
   */
  static getCommonDocumentTypes(): { [key: string]: string } {
    return {
      [CommonDocumentTypes.NATIONAL_ID]: 'National Identity Card',
      [CommonDocumentTypes.PASSPORT]: 'Passport',
      [CommonDocumentTypes.DRIVING_LICENSE]: 'Driving License',
      [CommonDocumentTypes.VOTER_ID]: 'Voter Registration Card',
      [CommonDocumentTypes.BIRTH_CERTIFICATE]: 'Birth Certificate',
      [CommonDocumentTypes.SOCIAL_SECURITY]: 'Social Security Card',
      [CommonDocumentTypes.TAX_ID]: 'Tax Identification Number',
      [CommonDocumentTypes.STUDENT_ID]: 'Student Identification Card',
      [CommonDocumentTypes.EMPLOYEE_ID]: 'Employee Identification Card',
      [CommonDocumentTypes.MILITARY_ID]: 'Military Identification Card'
    };
  }
}
