// =====================================================
// TRANSLATIONS TYPES
// =====================================================

/**
 * Translation entity data structure
 */
export interface TranslationData {
  id: string;
  entity_type: string; // 'category', 'product', 'notification_template'
  entity_id: string;
  field_name: string; // 'name', 'description', 'title'
  language_code: string; // 'en', 'fr', 'rw', 'sw', etc.
  content: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Data required to create a new translation
 */
export interface CreateTranslationData {
  entity_type: string;
  entity_id: string;
  field_name: string;
  language_code: string;
  content: string;
}

/**
 * Data for updating a translation
 */
export interface UpdateTranslationData {
  content?: string;
}

// =====================================================
// TAX RATES TYPES
// =====================================================

/**
 * Tax rate entity data structure
 */
export interface TaxRateData {
  id: string;
  country_id: string;
  category_id?: string; // NULL = applies to all categories
  tax_name: string; // 'VAT', 'GST', 'Sales Tax'
  tax_type: 'percentage' | 'fixed' | 'progressive';
  rate_percentage?: number; // 18.00 for 18%
  fixed_amount?: number;
  applies_to: 'total' | 'service_fee' | 'product_only';
  min_amount_threshold: number;
  effective_from: Date;
  effective_until?: Date;
  is_active: boolean;
  created_at: Date;
}

/**
 * Data required to create a new tax rate
 */
export interface CreateTaxRateData {
  country_id: string;
  category_id?: string;
  tax_name: string;
  tax_type: 'percentage' | 'fixed' | 'progressive';
  rate_percentage?: number;
  fixed_amount?: number;
  applies_to?: 'total' | 'service_fee' | 'product_only';
  min_amount_threshold?: number;
  effective_from: Date;
  effective_until?: Date;
  is_active?: boolean;
}

/**
 * Data for updating a tax rate
 */
export interface UpdateTaxRateData {
  tax_name?: string;
  tax_type?: 'percentage' | 'fixed' | 'progressive';
  rate_percentage?: number;
  fixed_amount?: number;
  applies_to?: 'total' | 'service_fee' | 'product_only';
  min_amount_threshold?: number;
  effective_from?: Date;
  effective_until?: Date;
  is_active?: boolean;
}

// =====================================================
// DELIVERY PROVIDERS TYPES
// =====================================================

/**
 * Delivery provider entity data structure
 */
export interface DeliveryProviderData {
  id: string;
  country_id: string;
  provider_name: string;
  display_name?: string;
  logo_url?: string;
  service_areas?: string[]; // Array of administrative_division IDs
  base_fee: number;
  per_km_rate?: number;
  currency: string;
  same_day_delivery: boolean;
  next_day_delivery: boolean;
  scheduled_delivery: boolean;
  pickup_service: boolean;
  api_endpoint?: string;
  api_credentials?: Record<string, any>;
  tracking_url_template?: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Data required to create a new delivery provider
 */
export interface CreateDeliveryProviderData {
  country_id: string;
  provider_name: string;
  display_name?: string;
  logo_url?: string;
  service_areas?: string[];
  base_fee: number;
  per_km_rate?: number;
  currency: string;
  same_day_delivery?: boolean;
  next_day_delivery?: boolean;
  scheduled_delivery?: boolean;
  pickup_service?: boolean;
  api_endpoint?: string;
  api_credentials?: Record<string, any>;
  tracking_url_template?: string;
  is_active?: boolean;
}

/**
 * Data for updating a delivery provider
 */
export interface UpdateDeliveryProviderData {
  provider_name?: string;
  display_name?: string;
  logo_url?: string;
  service_areas?: string[];
  base_fee?: number;
  per_km_rate?: number;
  currency?: string;
  same_day_delivery?: boolean;
  next_day_delivery?: boolean;
  scheduled_delivery?: boolean;
  pickup_service?: boolean;
  api_endpoint?: string;
  api_credentials?: Record<string, any>;
  tracking_url_template?: string;
  is_active?: boolean;
}

// =====================================================
// COUNTRY BUSINESS RULES TYPES
// =====================================================

/**
 * Country business rules entity data structure
 */
export interface CountryBusinessRulesData {
  id: string;
  country_id: string;
  min_user_age: number;
  kyc_required: boolean;
  max_booking_value?: number;
  support_hours_start: string; // Time string
  support_hours_end: string; // Time string
  support_days: number[]; // Array of day numbers (1=Monday, 7=Sunday)
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  local_registration_number?: string;
  tax_registration_number?: string;
  service_fee_percentage: number;
  payment_processing_fee: number;
  min_payout_amount: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Data required to create new country business rules
 */
export interface CreateCountryBusinessRulesData {
  country_id: string;
  min_user_age?: number;
  kyc_required?: boolean;
  max_booking_value?: number;
  support_hours_start?: string;
  support_hours_end?: string;
  support_days?: number[];
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  local_registration_number?: string;
  tax_registration_number?: string;
  service_fee_percentage?: number;
  payment_processing_fee?: number;
  min_payout_amount?: number;
}

/**
 * Data for updating country business rules
 */
export interface UpdateCountryBusinessRulesData {
  min_user_age?: number;
  kyc_required?: boolean;
  max_booking_value?: number;
  support_hours_start?: string;
  support_hours_end?: string;
  support_days?: number[];
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  local_registration_number?: string;
  tax_registration_number?: string;
  service_fee_percentage?: number;
  payment_processing_fee?: number;
  min_payout_amount?: number;
}

// =====================================================
// EXCHANGE RATES TYPES
// =====================================================

/**
 * Exchange rate entity data structure
 */
export interface ExchangeRateData {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: Date;
  source: 'central_bank' | 'api_provider' | 'manual';
  created_at: Date;
}

/**
 * Data required to create a new exchange rate
 */
export interface CreateExchangeRateData {
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: Date;
  source: 'central_bank' | 'api_provider' | 'manual';
}

/**
 * Data for updating an exchange rate
 */
export interface UpdateExchangeRateData {
  rate?: number;
  source?: 'central_bank' | 'api_provider' | 'manual';
}

// =====================================================
// COMMON FILTER TYPES
// =====================================================

/**
 * Filters for translations
 */
export interface TranslationFilters {
  entity_type?: string;
  entity_id?: string;
  field_name?: string;
  language_code?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Filters for tax rates
 */
export interface TaxRateFilters {
  country_id?: string;
  category_id?: string;
  tax_type?: string;
  is_active?: boolean;
  effective_date?: Date;
  page?: number;
  limit?: number;
}

/**
 * Filters for delivery providers
 */
export interface DeliveryProviderFilters {
  country_id?: string;
  is_active?: boolean;
  same_day_delivery?: boolean;
  next_day_delivery?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Filters for exchange rates
 */
export interface ExchangeRateFilters {
  from_currency?: string;
  to_currency?: string;
  rate_date?: Date;
  source?: string;
  page?: number;
  limit?: number;
}

// =====================================================
// SERVICE RESPONSE TYPES
// =====================================================

/**
 * Generic service response
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  rows: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
