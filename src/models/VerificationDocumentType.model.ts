// =====================================================
// VERIFICATION DOCUMENT TYPE MODEL
// =====================================================

import { getDatabase } from '@/config/database';
import { 
  VerificationDocumentType, 
  CreateVerificationDocumentTypeRequest, 
  UpdateVerificationDocumentTypeRequest, 
  VerificationDocumentTypeFilters, 
  VerificationDocumentTypeStats,
  CountryDocumentTypes,
  DocumentValidationResult,
  DocumentTypeValidationConfig
} from '@/types/verificationDocumentType.types';
import { v4 as uuidv4 } from 'uuid';

export class VerificationDocumentTypeModel {
  
  /**
   * Create a new verification document type
   */
  static async create(data: CreateVerificationDocumentTypeRequest): Promise<VerificationDocumentType> {
    const db = getDatabase();
    
    const documentTypeData = {
      id: uuidv4(),
      ...data,
      is_required: data.is_required !== undefined ? data.is_required : false,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdDocumentType] = await db('verification_document_types')
      .insert(documentTypeData)
      .returning('*');

    return createdDocumentType;
  }

  /**
   * Find verification document type by ID
   */
  static async findById(id: string): Promise<VerificationDocumentType | null> {
    const db = getDatabase();
    
    const documentType = await db('verification_document_types')
      .select('*')
      .where({ id })
      .first();

    return documentType || null;
  }

  /**
   * Find all verification document types with optional filters
   */
  static async findAll(filters: VerificationDocumentTypeFilters = {}): Promise<{
    data: VerificationDocumentType[];
    total: number;
    page: number;
    limit: number;
  }> {
    const db = getDatabase();
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = db('verification_document_types')
      .select('*');

    // Apply filters
    if (filters.country_id) {
      query = query.where('country_id', filters.country_id);
    }

    if (filters.document_type) {
      query = query.where('document_type', filters.document_type);
    }

    if (filters.is_required !== undefined) {
      query = query.where('is_required', filters.is_required);
    }

    if (filters.is_active !== undefined) {
      query = query.where('is_active', filters.is_active);
    }

    if (filters.search) {
      query = query.where(function() {
        this.whereILike('document_type', `%${filters.search}%`)
          .orWhereILike('local_name', `%${filters.search}%`)
          .orWhereILike('description', `%${filters.search}%`);
      });
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    const documentTypes = await query.limit(limit).offset(offset);

    return {
      data: documentTypes,
      total,
      page,
      limit
    };
  }

  /**
   * Update verification document type
   */
  static async update(id: string, data: UpdateVerificationDocumentTypeRequest): Promise<VerificationDocumentType | null> {
    const db = getDatabase();
    
    const updateData = {
      ...data,
      updated_at: new Date()
    };

    const [updatedDocumentType] = await db('verification_document_types')
      .where({ id })
      .update(updateData)
      .returning('*');

    return updatedDocumentType || null;
  }

  /**
   * Delete verification document type (soft delete by setting is_active = false)
   */
  static async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    const affectedRows = await db('verification_document_types')
      .where({ id })
      .update({ 
        is_active: false,
        updated_at: new Date()
      });

    return affectedRows > 0;
  }

  /**
   * Hard delete verification document type
   */
  static async hardDelete(id: string): Promise<boolean> {
    const db = getDatabase();
    
    const affectedRows = await db('verification_document_types')
      .where({ id })
      .del();

    return affectedRows > 0;
  }

  /**
   * Get verification document types by country
   */
  static async findByCountry(countryId: string): Promise<CountryDocumentTypes | null> {
    const db = getDatabase();
    
    // Get country info
    const country = await db('countries')
      .select('id', 'name', 'code')
      .where({ id: countryId })
      .first();

    if (!country) {
      return null;
    }

    // Get document types for the country
    const documentTypes = await db('verification_document_types')
      .select('*')
      .where({ country_id: countryId, is_active: true })
      .orderBy('is_required', 'desc')
      .orderBy('document_type', 'asc');

    const requiredDocuments = documentTypes.filter(doc => doc.is_required);
    const optionalDocuments = documentTypes.filter(doc => !doc.is_required);

    return {
      country_id: country.id,
      country_name: country.name,
      country_code: country.code,
      document_types: documentTypes,
      required_documents: requiredDocuments,
      optional_documents: optionalDocuments
    };
  }

  /**
   * Get required document types for a country
   */
  static async getRequiredDocuments(countryId: string): Promise<VerificationDocumentType[]> {
    const db = getDatabase();
    
    return await db('verification_document_types')
      .select('*')
      .where({ 
        country_id: countryId, 
        is_required: true, 
        is_active: true 
      })
      .orderBy('document_type', 'asc');
  }

  /**
   * Check if document type exists for country
   */
  static async existsForCountry(countryId: string, documentType: string): Promise<boolean> {
    const db = getDatabase();
    
    const exists = await db('verification_document_types')
      .select('id')
      .where({ 
        country_id: countryId, 
        document_type: documentType,
        is_active: true 
      })
      .first();

    return !!exists;
  }

  /**
   * Validate document number against document type rules
   */
  static async validateDocument(
    countryId: string, 
    documentType: string, 
    documentNumber: string
  ): Promise<DocumentValidationResult> {
    const db = getDatabase();
    
    const docTypeConfig = await db('verification_document_types')
      .select('*')
      .where({ 
        country_id: countryId, 
        document_type: documentType,
        is_active: true 
      })
      .first();

    const result: DocumentValidationResult = {
      is_valid: false,
      document_type: documentType,
      document_number: documentNumber,
      errors: [],
      suggestions: []
    };

    if (!docTypeConfig) {
      result.errors.push('Document type not supported for this country');
      return result;
    }

    // Check length constraints
    if (docTypeConfig.min_length && documentNumber.length < docTypeConfig.min_length) {
      result.errors.push(`Document number too short. Minimum length: ${docTypeConfig.min_length}`);
    }

    if (docTypeConfig.max_length && documentNumber.length > docTypeConfig.max_length) {
      result.errors.push(`Document number too long. Maximum length: ${docTypeConfig.max_length}`);
    }

    // Check regex validation
    if (docTypeConfig.validation_regex) {
      const regex = new RegExp(docTypeConfig.validation_regex);
      if (!regex.test(documentNumber)) {
        result.errors.push(`Invalid document format. Expected format: ${docTypeConfig.format_example || 'See validation rules'}`);
        if (docTypeConfig.format_example) {
          result.suggestions?.push(`Example: ${docTypeConfig.format_example}`);
        }
      }
    }

    result.is_valid = result.errors.length === 0;
    return result;
  }

  /**
   * Get validation configuration for document type
   */
  static async getValidationConfig(
    countryId: string, 
    documentType: string
  ): Promise<DocumentTypeValidationConfig | null> {
    const db = getDatabase();
    
    const config = await db('verification_document_types')
      .select('document_type', 'validation_regex', 'min_length', 'max_length', 'format_example', 'description')
      .where({ 
        country_id: countryId, 
        document_type: documentType,
        is_active: true 
      })
      .first();

    return config || null;
  }

  /**
   * Get statistics for verification document types
   */
  static async getStats(countryId?: string): Promise<VerificationDocumentTypeStats> {
    const db = getDatabase();
    
    let baseQuery = db('verification_document_types');
    if (countryId) {
      baseQuery = baseQuery.where('country_id', countryId);
    }

    // Total document types
    const [{ count: totalCount }] = await baseQuery.clone().count('* as count');
    const total_document_types = parseInt(totalCount as string);

    // Active document types
    const [{ count: activeCount }] = await baseQuery.clone()
      .where('is_active', true)
      .count('* as count');
    const active_document_types = parseInt(activeCount as string);

    // Inactive document types
    const inactive_document_types = total_document_types - active_document_types;

    // Required document types
    const [{ count: requiredCount }] = await baseQuery.clone()
      .where({ is_required: true, is_active: true })
      .count('* as count');
    const required_document_types = parseInt(requiredCount as string);

    // Optional document types
    const optional_document_types = active_document_types - required_document_types;

    // Document types by country
    const countryStats = await db('verification_document_types')
      .select('country_id')
      .count('* as count')
      .where('is_active', true)
      .groupBy('country_id');

    const document_types_by_country: Record<string, number> = {};
    countryStats.forEach(stat => {
      document_types_by_country[stat.country_id] = parseInt(stat.count as string);
    });

    // Document types by type
    const typeStats = await baseQuery.clone()
      .select('document_type')
      .count('* as count')
      .where('is_active', true)
      .groupBy('document_type');

    const document_types_by_type: Record<string, number> = {};
    typeStats.forEach(stat => {
      document_types_by_type[stat.document_type] = parseInt(stat.count as string);
    });

    // Countries with documents
    const [{ count: countriesCount }] = await db('verification_document_types')
      .countDistinct('country_id as count')
      .where('is_active', true);
    const countries_with_documents = parseInt(countriesCount as string);

    return {
      total_document_types,
      active_document_types,
      inactive_document_types,
      required_document_types,
      optional_document_types,
      document_types_by_country,
      document_types_by_type,
      countries_with_documents
    };
  }

  /**
   * Bulk activate/deactivate document types
   */
  static async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    const db = getDatabase();
    
    const affectedRows = await db('verification_document_types')
      .whereIn('id', ids)
      .update({ 
        is_active: isActive,
        updated_at: new Date()
      });

    return affectedRows;
  }

  /**
   * Get all document types for a specific type across countries
   */
  static async findByDocumentType(documentType: string): Promise<VerificationDocumentType[]> {
    const db = getDatabase();
    
    return await db('verification_document_types')
      .select('verification_document_types.*', 'countries.name as country_name', 'countries.code as country_code')
      .leftJoin('countries', 'verification_document_types.country_id', 'countries.id')
      .where({ 
        'verification_document_types.document_type': documentType,
        'verification_document_types.is_active': true 
      })
      .orderBy('countries.name', 'asc');
  }
}
