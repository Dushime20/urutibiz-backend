// =====================================================
// PAYMENT PROVIDER INTERFACES
// =====================================================

/**
 * Base payment provider interface
 */
export interface PaymentProvider {
  id: string;
  country_id: string;
  provider_name: string;
  provider_type: string;
  display_name?: string;
  logo_url?: string;
  is_active: boolean;
  supported_currencies: string[];
  min_amount: number;
  max_amount?: number;
  fee_percentage: number;
  fee_fixed: number;
  settings?: Record<string, any>;
  description?: string;
  api_endpoint?: string;
  supports_refunds: boolean;
  supports_recurring: boolean;
  processing_time_minutes?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create payment provider request interface
 */
export interface CreatePaymentProviderRequest {
  country_id: string;
  provider_name: string;
  provider_type: string;
  display_name?: string;
  logo_url?: string;
  is_active?: boolean;
  supported_currencies: string[];
  min_amount?: number;
  max_amount?: number;
  fee_percentage?: number;
  fee_fixed?: number;
  settings?: Record<string, any>;
  description?: string;
  api_endpoint?: string;
  supports_refunds?: boolean;
  supports_recurring?: boolean;
  processing_time_minutes?: number;
}

/**
 * Update payment provider request interface
 */
export interface UpdatePaymentProviderRequest {
  display_name?: string;
  logo_url?: string;
  is_active?: boolean;
  supported_currencies?: string[];
  min_amount?: number;
  max_amount?: number;
  fee_percentage?: number;
  fee_fixed?: number;
  settings?: Record<string, any>;
  description?: string;
  api_endpoint?: string;
  supports_refunds?: boolean;
  supports_recurring?: boolean;
  processing_time_minutes?: number;
}

/**
 * Payment provider filters interface
 */
export interface PaymentProviderFilters {
  country_id?: string;
  provider_name?: string;
  provider_type?: string;
  is_active?: boolean;
  currency?: string;
  supports_refunds?: boolean;
  supports_recurring?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'provider_name' | 'display_name' | 'fee_percentage';
  sort_order?: 'asc' | 'desc';
}

/**
 * Payment provider statistics interface
 */
export interface PaymentProviderStats {
  total_providers: number;
  active_providers: number;
  inactive_providers: number;
  providers_by_country: Record<string, number>;
  providers_by_type: Record<string, number>;
  providers_with_refunds: number;
  providers_with_recurring: number;
  average_fee_percentage: number;
  countries_with_providers: number;
  supported_currencies: string[];
}

/**
 * Country payment providers interface
 */
export interface CountryPaymentProviders {
  country_id: string;
  country_name: string;
  country_code: string;
  providers: PaymentProvider[];
  mobile_money_providers: PaymentProvider[];
  card_providers: PaymentProvider[];
  bank_transfer_providers: PaymentProvider[];
  digital_wallet_providers: PaymentProvider[];
  active_providers: PaymentProvider[];
  supported_currencies: string[];
}

/**
 * Payment calculation result interface
 */
export interface PaymentCalculationResult {
  provider_id: string;
  provider_name: string;
  amount: number;
  fee_percentage: number;
  fee_fixed: number;
  total_fee: number;
  total_amount: number;
  currency: string;
  processing_time_minutes?: number;
}

/**
 * Provider comparison interface
 */
export interface ProviderComparison {
  amount: number;
  currency: string;
  providers: PaymentCalculationResult[];
  cheapest_provider: PaymentCalculationResult;
  fastest_provider: PaymentCalculationResult;
}

/**
 * Common provider types enum
 */
export enum PaymentProviderTypes {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet'
}

/**
 * Common payment providers enum
 */
export enum CommonPaymentProviders {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MTN_MOMO = 'mtn_momo',
  MPESA = 'mpesa',
  WAVE = 'wave',
  AIRTEL_MONEY = 'airtel_money',
  ORANGE_MONEY = 'orange_money',
  FLUTTERWAVE = 'flutterwave',
  PAYSTACK = 'paystack'
}

/**
 * Provider settings interface for common providers
 */
export interface StripeSettings {
  webhook_secret_required: boolean;
  '3d_secure': boolean;
  capture_method: 'automatic' | 'manual';
  statement_descriptor?: string;
}

export interface MobileMoneySettings {
  merchant_code_required?: boolean;
  callback_url_required?: boolean;
  api_version?: string;
  encryption?: string;
  timeout_seconds?: number;
  business_shortcode?: boolean;
  passkey_required?: boolean;
}

export interface PayPalSettings {
  client_id: string;
  client_secret?: string;
  webhook_id?: string;
  sandbox_mode?: boolean;
}

/**
 * Payment provider configuration interface
 */
export interface PaymentProviderConfig {
  provider_name: string;
  display_name: string;
  provider_type: PaymentProviderTypes;
  logo_url?: string;
  description: string;
  supported_countries: string[];
  default_currencies: string[];
  fee_structure: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  features: {
    supports_refunds: boolean;
    supports_recurring: boolean;
    supports_webhooks: boolean;
    supports_3d_secure?: boolean;
  };
  limits: {
    min_amount: number;
    max_amount: number;
    daily_limit?: number;
    monthly_limit?: number;
  };
  processing: {
    average_time_minutes: number;
    settlement_time_days: number;
  };
}

/**
 * Bulk provider operation interface
 */
export interface BulkProviderOperation {
  operation: 'activate' | 'deactivate' | 'update_fees' | 'update_limits';
  provider_ids: string[];
  data?: {
    fee_percentage?: number;
    fee_fixed?: number;
    min_amount?: number;
    max_amount?: number;
    is_active?: boolean;
  };
}

/**
 * Provider integration status interface
 */
export interface ProviderIntegrationStatus {
  provider_id: string;
  provider_name: string;
  is_configured: boolean;
  is_tested: boolean;
  last_test_date?: Date;
  test_result?: 'success' | 'failed';
  error_message?: string;
  configuration_issues: string[];
  required_settings: string[];
  missing_settings: string[];
}

/**
 * Payment provider analytics interface
 */
export interface PaymentProviderAnalytics {
  provider_id: string;
  provider_name: string;
  country_id: string;
  period: {
    start_date: Date;
    end_date: Date;
  };
  metrics: {
    total_transactions: number;
    successful_transactions: number;
    failed_transactions: number;
    success_rate: number;
    total_volume: number;
    currency: string;
    average_transaction_amount: number;
    total_fees_collected: number;
    refund_count: number;
    refund_amount: number;
  };
  trends: {
    daily_volumes: Array<{ date: string; volume: number; count: number }>;
    hourly_distribution: Array<{ hour: number; count: number }>;
  };
}
