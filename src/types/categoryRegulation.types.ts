// =====================================================
// CATEGORY REGULATIONS TYPES
// =====================================================

/**
 * Compliance levels for category regulations
 */
export type ComplianceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Seasonal restrictions structure
 */
export interface SeasonalRestrictions {
  [season: string]: {
    max_days?: number;
    max_consecutive_days?: number;
    special_rate?: boolean;
    advance_booking_required?: boolean;
    additional_requirements?: string[];
    additional_safety?: boolean;
    restricted_equipment?: string[];
    extended_hours?: boolean;
  };
}

/**
 * Required documentation types
 */
export type DocumentationType = 
  | 'government_id'
  | 'passport_or_id' 
  | 'driver_license'
  | 'proof_of_address'
  | 'credit_card'
  | 'insurance_certificate'
  | 'insurance_policy'
  | 'operator_license'
  | 'safety_certification'
  | 'employer_authorization'
  | 'insurance_proof'
  | 'emergency_contact'
  | 'medical_clearance'
  | 'identification'
  | 'contact_information'
  | 'parental_consent';

/**
 * Base category regulation data structure
 */
export interface CategoryRegulationData {
  id: string;
  category_id: string;
  country_id: string;
  
  // Basic regulations
  is_allowed: boolean;
  requires_license: boolean;
  license_type?: string;
  min_age_requirement?: number;
  max_rental_days?: number;
  special_requirements?: string;
  
  // Insurance requirements
  mandatory_insurance: boolean;
  min_coverage_amount?: number;
  
  // Additional regulations
  max_liability_amount?: number;
  requires_background_check: boolean;
  prohibited_activities?: string;
  seasonal_restrictions?: SeasonalRestrictions;
  documentation_required?: DocumentationType[];
  compliance_level: ComplianceLevel;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  
  // Relations (optional, populated when included)
  category?: any;
  country?: any;
}

/**
 * Data required to create a new category regulation
 */
export interface CreateCategoryRegulationData {
  category_id: string;
  country_id: string;
  
  // Basic regulations
  is_allowed?: boolean;
  requires_license?: boolean;
  license_type?: string;
  min_age_requirement?: number;
  max_rental_days?: number;
  special_requirements?: string;
  
  // Insurance requirements
  mandatory_insurance?: boolean;
  min_coverage_amount?: number;
  
  // Additional regulations
  max_liability_amount?: number;
  requires_background_check?: boolean;
  prohibited_activities?: string;
  seasonal_restrictions?: SeasonalRestrictions;
  documentation_required?: DocumentationType[];
  compliance_level?: ComplianceLevel;
}

/**
 * Data for updating a category regulation
 */
export interface UpdateCategoryRegulationData {
  // Basic regulations
  is_allowed?: boolean;
  requires_license?: boolean;
  license_type?: string;
  min_age_requirement?: number;
  max_rental_days?: number;
  special_requirements?: string;
  
  // Insurance requirements
  mandatory_insurance?: boolean;
  min_coverage_amount?: number;
  
  // Additional regulations
  max_liability_amount?: number;
  requires_background_check?: boolean;
  prohibited_activities?: string;
  seasonal_restrictions?: SeasonalRestrictions;
  documentation_required?: DocumentationType[];
  compliance_level?: ComplianceLevel;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * API request for creating category regulation
 */
export interface CreateCategoryRegulationRequest {
  category_id: string;
  country_id: string;
  is_allowed?: boolean;
  requires_license?: boolean;
  license_type?: string;
  min_age_requirement?: number;
  max_rental_days?: number;
  special_requirements?: string;
  mandatory_insurance?: boolean;
  min_coverage_amount?: number;
  max_liability_amount?: number;
  requires_background_check?: boolean;
  prohibited_activities?: string;
  seasonal_restrictions?: SeasonalRestrictions;
  documentation_required?: DocumentationType[];
  compliance_level?: ComplianceLevel;
}

/**
 * API request for updating category regulation
 */
export interface UpdateCategoryRegulationRequest {
  is_allowed?: boolean;
  requires_license?: boolean;
  license_type?: string;
  min_age_requirement?: number;
  max_rental_days?: number;
  special_requirements?: string;
  mandatory_insurance?: boolean;
  min_coverage_amount?: number;
  max_liability_amount?: number;
  requires_background_check?: boolean;
  prohibited_activities?: string;
  seasonal_restrictions?: SeasonalRestrictions;
  documentation_required?: DocumentationType[];
  compliance_level?: ComplianceLevel;
}

/**
 * Filters for querying category regulations
 */
export interface CategoryRegulationFilters {
  category_id?: string;
  country_id?: string;
  country_code?: string;
  is_allowed?: boolean;
  requires_license?: boolean;
  license_type?: string;
  min_age?: number;
  max_age?: number;
  max_rental_days_min?: number;
  max_rental_days_max?: number;
  mandatory_insurance?: boolean;
  min_coverage_min?: number;
  min_coverage_max?: number;
  requires_background_check?: boolean;
  compliance_level?: ComplianceLevel | ComplianceLevel[];
  has_seasonal_restrictions?: boolean;
  documentation_type?: DocumentationType;
  search?: string;
  include_deleted?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'compliance_level' | 'min_age_requirement' | 'max_rental_days' | 'min_coverage_amount';
  sort_order?: 'asc' | 'desc';
}

// =====================================================
// ADVANCED OPERATIONS TYPES
// =====================================================

/**
 * Bulk operations for category regulations
 */
export interface BulkCategoryRegulationOperation {
  regulations?: CreateCategoryRegulationData[];
  updates?: {
    filters: CategoryRegulationFilters;
    data: UpdateCategoryRegulationData;
  };
  deletes?: {
    ids?: string[];
    filters?: CategoryRegulationFilters;
  };
}

/**
 * Compliance check request
 */
export interface ComplianceCheckRequest {
  category_id: string;
  country_id: string;
  user_age?: number;
  rental_duration_days?: number;
  has_license?: boolean;
  license_type?: string;
  has_insurance?: boolean;
  coverage_amount?: number;
  background_check_status?: 'pending' | 'approved' | 'rejected';
  season?: string;
  documentation_provided?: DocumentationType[];
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  is_compliant: boolean;
  category_id: string;
  country_id: string;
  regulation_exists: boolean;
  checks: {
    is_allowed: { passed: boolean; message?: string };
    age_requirement: { passed: boolean; required?: number; provided?: number; message?: string };
    license_requirement: { passed: boolean; required?: string; provided?: boolean; message?: string };
    rental_duration: { passed: boolean; max_allowed?: number; requested?: number; message?: string };
    insurance_requirement: { passed: boolean; required?: boolean; coverage_sufficient?: boolean; message?: string };
    background_check: { passed: boolean; required?: boolean; status?: string; message?: string };
    documentation: { passed: boolean; required?: DocumentationType[]; provided?: DocumentationType[]; missing?: DocumentationType[]; message?: string };
    seasonal_restrictions: { passed: boolean; restrictions?: any; message?: string };
  };
  violations: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Regulation statistics
 */
export interface CategoryRegulationStats {
  total_regulations: number;
  by_country: Record<string, number>;
  by_category: Record<string, number>;
  by_compliance_level: Record<ComplianceLevel, number>;
  licensing_required: number;
  insurance_required: number;
  background_check_required: number;
  average_age_requirement: number;
  average_max_rental_days: number;
  most_restrictive_countries: Array<{
    country_id: string;
    country_code: string;
    restriction_count: number;
    average_compliance_level: number;
  }>;
  most_regulated_categories: Array<{
    category_id: string;
    category_name: string;
    regulation_count: number;
    average_compliance_level: number;
  }>;
}

/**
 * Country regulation overview
 */
export interface CountryRegulationOverview {
  country_id: string;
  country_code: string;
  country_name: string;
  total_regulations: number;
  allowed_categories: number;
  restricted_categories: number;
  prohibited_categories: number;
  licensing_requirements: number;
  insurance_requirements: number;
  compliance_breakdown: Record<ComplianceLevel, number>;
  most_restrictive_categories: Array<{
    category_id: string;
    category_name: string;
    compliance_level: ComplianceLevel;
    requires_license: boolean;
    mandatory_insurance: boolean;
  }>;
  documentation_requirements: DocumentationType[];
}

/**
 * Category regulation overview
 */
export interface CategoryRegulationOverview {
  category_id: string;
  category_name: string;
  total_regulations: number;
  countries_allowed: number;
  countries_restricted: number;
  countries_prohibited: number;
  global_compliance_level: ComplianceLevel;
  licensing_countries: string[];
  insurance_countries: string[];
  most_restrictive_countries: Array<{
    country_id: string;
    country_code: string;
    compliance_level: ComplianceLevel;
    restrictions: string[];
  }>;
  common_requirements: {
    min_age_range: { min: number; max: number };
    max_rental_days_range: { min: number; max: number };
    common_documents: DocumentationType[];
  };
}

// =====================================================
// VALIDATION TYPES
// =====================================================

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Service response pattern
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =====================================================
// ALL TYPES EXPORTED ABOVE
// =====================================================
