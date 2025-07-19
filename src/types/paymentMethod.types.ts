// =====================================================
// PAYMENT METHODS TYPES
// =====================================================

export type PaymentMethodType = 'card' | 'mobile_money' | 'bank_transfer';
export type PaymentProvider = 'stripe' | 'mtn_momo' | 'airtel_money' | 'visa' | 'mastercard' | 'paypal' | 'bank';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay';

export interface PaymentMethodData {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  provider?: PaymentProvider;
  
  // Card details (encrypted/tokenized)
  last_four?: string;
  card_brand?: CardBrand;
  exp_month?: number;
  exp_year?: number;
  
  // Mobile money details
  phone_number?: string;
  
  // Tokenization and provider integration
  provider_token?: string; // Stripe customer ID, etc.
  payment_provider_id?: string; // Reference to payment_providers table
  
  // Status and configuration
  is_default: boolean;
  is_verified: boolean;
  currency: string;
  
  // Audit fields
  created_at: Date;
  updated_at?: Date;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface CreatePaymentMethodData {
  user_id?: string; // Optional - will be set from authentication token
  type: PaymentMethodType;
  provider?: PaymentProvider;
  
  // Card details
  last_four?: string;
  card_brand?: CardBrand;
  exp_month?: number;
  exp_year?: number;
  
  // Mobile money details
  phone_number?: string;
  
  // Provider integration
  provider_token?: string;
  payment_provider_id?: string;
  
  // Configuration
  is_default?: boolean;
  currency?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodData {
  is_default?: boolean;
  is_verified?: boolean;
  exp_month?: number;
  exp_year?: number;
  phone_number?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethodFilters {
  user_id?: string;
  type?: PaymentMethodType;
  provider?: PaymentProvider;
  is_default?: boolean;
  is_verified?: boolean;
  currency?: string;
  payment_provider_id?: string;
}

export interface PaymentMethodSearchParams {
  user_id?: string;
  type?: PaymentMethodType;
  provider?: PaymentProvider;
  is_default?: boolean;
  is_verified?: boolean;
  currency?: string;
  page?: number;
  limit?: number;
}

// Validation interfaces
export interface CardValidationData {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
  cardholder_name: string;
}

export interface MobileMoneyValidationData {
  phone_number: string;
  provider: PaymentProvider;
  pin?: string;
}

// Provider-specific response interfaces
export interface StripePaymentMethodResponse {
  id: string;
  customer: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  metadata?: Record<string, any>;
}

export interface MobileMoneyResponse {
  transaction_id: string;
  phone_number: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  currency?: string;
}

// Analytics and reporting interfaces
export interface PaymentMethodAnalytics {
  total_methods: number;
  methods_by_type: Record<PaymentMethodType, number>;
  methods_by_provider: Record<PaymentProvider, number>;
  methods_by_currency: Record<string, number>;
  verification_rate: number;
  default_methods_count: number;
  recently_added: PaymentMethodData[];
}

// Security and encryption interfaces
export interface EncryptedCardData {
  encrypted_number: string;
  tokenized_number: string;
  encryption_key: string;
  salt: string;
}
