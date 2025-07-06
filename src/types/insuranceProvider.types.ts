// =====================================================
// INSURANCE PROVIDERS TYPES
// =====================================================

/**
 * Provider types for insurance companies
 */
export type ProviderType = 'TRADITIONAL' | 'DIGITAL' | 'PEER_TO_PEER' | 'GOVERNMENT' | 'MUTUAL';

/**
 * Integration status with the platform
 */
export type IntegrationStatus = 'NOT_INTEGRATED' | 'TESTING' | 'LIVE' | 'DEPRECATED';

/**
 * Coverage types offered by providers
 */
export type CoverageType = 
  | 'LIABILITY'
  | 'COMPREHENSIVE' 
  | 'COLLISION'
  | 'PERSONAL_INJURY'
  | 'THEFT'
  | 'DAMAGE'
  | 'PERSONAL_PROPERTY'
  | 'AUTO'
  | 'MOTOR'
  | 'HOME'
  | 'CONTENTS'
  | 'KFZ'
  | 'HAFTPFLICHT'
  | 'KASKO'
  | 'RECHTSSCHUTZ'
  | 'THIRD_PARTY'
  | 'SPORTS';

/**
 * Contact information structure
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    province?: string;
    county?: string;
    zip?: string;
    postal?: string;
    postcode?: string;
    country?: string;
  };
  support_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  emergency_contact?: string;
  claims_phone?: string;
  sales_phone?: string;
}

/**
 * API credentials structure (encrypted)
 */
export interface ApiCredentials {
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  api_version?: string;
  webhook_secret?: string;
  sandbox_mode?: boolean;
  rate_limit?: number;
  timeout_ms?: number;
  retry_attempts?: number;
}

/**
 * Base insurance provider data structure
 */
export interface InsuranceProviderData {
  id: string;
  country_id: string;
  provider_name: string;
  display_name?: string;
  logo_url?: string;
  contact_info?: ContactInfo;
  supported_categories?: string[];
  api_endpoint?: string;
  api_credentials?: ApiCredentials;
  is_active: boolean;
  
  // Enhanced fields
  provider_type: ProviderType;
  license_number?: string;
  rating?: number;
  coverage_types?: CoverageType[];
  min_coverage_amount?: number;
  max_coverage_amount?: number;
  deductible_options?: number[];
  processing_time_days?: number;
  languages_supported?: string[];
  commission_rate?: number;
  integration_status: IntegrationStatus;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * Data for creating a new insurance provider
 */
export interface CreateInsuranceProviderData {
  country_id: string;
  provider_name: string;
  display_name?: string;
  logo_url?: string;
  contact_info?: ContactInfo;
  supported_categories?: string[];
  api_endpoint?: string;
  api_credentials?: ApiCredentials;
  is_active?: boolean;
  provider_type?: ProviderType;
  license_number?: string;
  rating?: number;
  coverage_types?: CoverageType[];
  min_coverage_amount?: number;
  max_coverage_amount?: number;
  deductible_options?: number[];
  processing_time_days?: number;
  languages_supported?: string[];
  commission_rate?: number;
  integration_status?: IntegrationStatus;
}

/**
 * Data for updating an existing insurance provider
 */
export interface UpdateInsuranceProviderData {
  provider_name?: string;
  display_name?: string;
  logo_url?: string;
  contact_info?: ContactInfo;
  supported_categories?: string[];
  api_endpoint?: string;
  api_credentials?: ApiCredentials;
  is_active?: boolean;
  provider_type?: ProviderType;
  license_number?: string;
  rating?: number;
  coverage_types?: CoverageType[];
  min_coverage_amount?: number;
  max_coverage_amount?: number;
  deductible_options?: number[];
  processing_time_days?: number;
  languages_supported?: string[];
  commission_rate?: number;
  integration_status?: IntegrationStatus;
}

/**
 * Query filters for searching insurance providers
 */
export interface InsuranceProviderFilters {
  country_id?: string;
  provider_name?: string;
  provider_type?: ProviderType | ProviderType[];
  is_active?: boolean;
  integration_status?: IntegrationStatus | IntegrationStatus[];
  min_rating?: number;
  max_rating?: number;
  supports_category?: string;
  coverage_type?: CoverageType | CoverageType[];
  language?: string;
  min_coverage?: number;
  max_coverage?: number;
  max_processing_days?: number;
  
  // Search and pagination
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Insurance provider query options
 */
export interface InsuranceProviderQueryOptions {
  include_inactive?: boolean;
  include_credentials?: boolean;
  include_stats?: boolean;
  country_id?: string;
  category_id?: string;
}

/**
 * Insurance provider statistics
 */
export interface InsuranceProviderStats {
  total_providers: number;
  active_providers: number;
  by_type: Record<ProviderType, number>;
  by_integration_status: Record<IntegrationStatus, number>;
  by_country: Record<string, number>;
  average_rating: number;
  average_processing_time: number;
  coverage_distribution: Record<CoverageType, number>;
  language_distribution: Record<string, number>;
}

/**
 * Insurance provider search result
 */
export interface InsuranceProviderSearchResult {
  providers: InsuranceProviderData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: InsuranceProviderFilters;
  stats?: InsuranceProviderStats;
}

/**
 * Insurance provider creation result
 */
export interface CreateInsuranceProviderResult {
  success: boolean;
  provider?: InsuranceProviderData;
  error?: string;
  validation_errors?: Record<string, string[]>;
}

/**
 * Insurance provider update result
 */
export interface UpdateInsuranceProviderResult {
  success: boolean;
  provider?: InsuranceProviderData;
  error?: string;
  validation_errors?: Record<string, string[]>;
  changes_made?: string[];
}

/**
 * Insurance provider deletion result
 */
export interface DeleteInsuranceProviderResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Bulk operations result
 */
export interface BulkInsuranceProviderResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    index: number;
    data: any;
    error: string;
  }>;
  created_providers?: InsuranceProviderData[];
}

/**
 * Provider comparison data
 */
export interface InsuranceProviderComparison {
  provider_id: string;
  provider_name: string;
  rating: number;
  coverage_types: CoverageType[];
  min_coverage: number;
  max_coverage: number;
  processing_time: number;
  commission_rate: number;
  supported_languages: string[];
  api_available: boolean;
  integration_status: IntegrationStatus;
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
  category_id: string;
  country_id: string;
  available_providers: InsuranceProviderComparison[];
  coverage_gaps: CoverageType[];
  recommended_providers: InsuranceProviderComparison[];
  average_coverage_amount: number;
  processing_time_range: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Market analysis for insurance providers
 */
export interface InsuranceMarketAnalysis {
  country_id: string;
  total_providers: number;
  market_share: Array<{
    provider_id: string;
    provider_name: string;
    market_share_percentage: number;
    supported_categories_count: number;
  }>;
  coverage_gaps: {
    category_id: string;
    coverage_types: CoverageType[];
  }[];
  competitive_landscape: {
    price_range: {
      min_coverage: number;
      max_coverage: number;
    };
    rating_distribution: Record<string, number>;
    integration_readiness: number;
  };
}
