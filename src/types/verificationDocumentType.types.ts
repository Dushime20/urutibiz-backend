// =====================================================
// VERIFICATION DOCUMENT TYPES INTERFACES
// =====================================================

/**
 * Base verification document type interface
 */
export interface VerificationDocumentType {
  id: string;
  country_id: string;
  document_type: string;
  local_name?: string;
  is_required: boolean;
  validation_regex?: string;
  format_example?: string;
  description?: string;
  min_length?: number;
  max_length?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create verification document type request interface
 */
export interface CreateVerificationDocumentTypeRequest {
  country_id: string;
  document_type: string;
  local_name?: string;
  is_required?: boolean;
  validation_regex?: string;
  format_example?: string;
  description?: string;
  min_length?: number;
  max_length?: number;
  is_active?: boolean;
}

/**
 * Update verification document type request interface
 */
export interface UpdateVerificationDocumentTypeRequest {
  local_name?: string;
  is_required?: boolean;
  validation_regex?: string;
  format_example?: string;
  description?: string;
  min_length?: number;
  max_length?: number;
  is_active?: boolean;
}

/**
 * Verification document type filters interface
 */
export interface VerificationDocumentTypeFilters {
  country_id?: string;
  document_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'document_type' | 'local_name';
  sort_order?: 'asc' | 'desc';
}

/**
 * Document type validation result interface
 */
export interface DocumentValidationResult {
  is_valid: boolean;
  document_type: string;
  document_number: string;
  errors: string[];
  suggestions?: string[];
}

/**
 * Document type statistics interface
 */
export interface VerificationDocumentTypeStats {
  total_document_types: number;
  active_document_types: number;
  inactive_document_types: number;
  required_document_types: number;
  optional_document_types: number;
  document_types_by_country: Record<string, number>;
  document_types_by_type: Record<string, number>;
  countries_with_documents: number;
}

/**
 * Country document types interface
 */
export interface CountryDocumentTypes {
  country_id: string;
  country_name: string;
  country_code: string;
  document_types: VerificationDocumentType[];
  required_documents: VerificationDocumentType[];
  optional_documents: VerificationDocumentType[];
}

/**
 * Document type validation config interface
 */
export interface DocumentTypeValidationConfig {
  document_type: string;
  validation_regex?: string;
  min_length?: number;
  max_length?: number;
  format_example?: string;
  description?: string;
  custom_validators?: string[];
}

/**
 * Common document types enum
 */
export enum CommonDocumentTypes {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  VOTER_ID = 'voter_id',
  BIRTH_CERTIFICATE = 'birth_certificate',
  SOCIAL_SECURITY = 'social_security',
  TAX_ID = 'tax_id',
  STUDENT_ID = 'student_id',
  EMPLOYEE_ID = 'employee_id',
  MILITARY_ID = 'military_id'
}

/**
 * Document validation error types enum
 */
export enum DocumentValidationErrors {
  INVALID_FORMAT = 'invalid_format',
  INVALID_LENGTH = 'invalid_length',
  INVALID_CHARACTERS = 'invalid_characters',
  DOCUMENT_NOT_SUPPORTED = 'document_not_supported',
  MISSING_REQUIRED_DOCUMENT = 'missing_required_document',
  REGEX_VALIDATION_FAILED = 'regex_validation_failed'
}

/**
 * Bulk document type operation interface
 */
export interface BulkDocumentTypeOperation {
  operation: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  document_types: (CreateVerificationDocumentTypeRequest | UpdateVerificationDocumentTypeRequest)[];
  filters?: VerificationDocumentTypeFilters;
}

/**
 * Document type export/import interface
 */
export interface DocumentTypeExportData {
  country_code: string;
  document_types: CreateVerificationDocumentTypeRequest[];
  metadata: {
    exported_at: Date;
    total_count: number;
    active_count: number;
    required_count: number;
  };
}
