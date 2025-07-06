// =====================================================
// PAYMENT METHODS TYPES
// =====================================================

export type PaymentMethodType = 'card' | 'mobile_money' | 'bank_transfer';
export type PaymentProvider = 'stripe' | 'mtn_momo' | 'airtel_money' | 'visa' | 'mastercard' | 'paypal' | 'bank';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay';

export interface PaymentMethodData {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider?: PaymentProvider;
  
  // Card details (encrypted/tokenized)
  lastFour?: string;
  cardBrand?: CardBrand;
  expMonth?: number;
  expYear?: number;
  
  // Mobile money details
  phoneNumber?: string;
  
  // Tokenization and provider integration
  providerToken?: string; // Stripe customer ID, etc.
  paymentProviderId?: string; // Reference to payment_providers table
  
  // Status and configuration
  isDefault: boolean;
  isVerified: boolean;
  currency: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt?: Date;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface CreatePaymentMethodData {
  userId: string;
  type: PaymentMethodType;
  provider?: PaymentProvider;
  
  // Card details
  lastFour?: string;
  cardBrand?: CardBrand;
  expMonth?: number;
  expYear?: number;
  
  // Mobile money details
  phoneNumber?: string;
  
  // Provider integration
  providerToken?: string;
  paymentProviderId?: string;
  
  // Configuration
  isDefault?: boolean;
  currency?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodData {
  isDefault?: boolean;
  isVerified?: boolean;
  expMonth?: number;
  expYear?: number;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethodFilters {
  userId?: string;
  type?: PaymentMethodType;
  provider?: PaymentProvider;
  isDefault?: boolean;
  isVerified?: boolean;
  currency?: string;
  paymentProviderId?: string;
}

export interface PaymentMethodSearchParams {
  userId?: string;
  type?: PaymentMethodType;
  provider?: PaymentProvider;
  isDefault?: boolean;
  isVerified?: boolean;
  currency?: string;
  page?: number;
  limit?: number;
}

// Validation interfaces
export interface CardValidationData {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  cardholderName: string;
}

export interface MobileMoneyValidationData {
  phoneNumber: string;
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
  transactionId: string;
  phoneNumber: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  currency?: string;
}

// Analytics and reporting interfaces
export interface PaymentMethodAnalytics {
  totalMethods: number;
  methodsByType: Record<PaymentMethodType, number>;
  methodsByProvider: Record<PaymentProvider, number>;
  methodsByCurrency: Record<string, number>;
  verificationRate: number;
  defaultMethodsCount: number;
  recentlyAdded: PaymentMethodData[];
}

// Security and encryption interfaces
export interface EncryptedCardData {
  encryptedNumber: string;
  tokenizedNumber: string;
  encryptionKey: string;
  salt: string;
}
