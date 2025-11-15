// =====================================================
// PAYMENT TRANSACTIONS TYPES
// =====================================================

// Enums and Union Types
export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'partially_refunded' 
  | 'cancelled';

export type TransactionType = 
  | 'booking_payment' 
  | 'security_deposit' 
  | 'refund' 
  | 'partial_refund' 
  | 'platform_fee' 
  | 'insurance_payment' 
  | 'delivery_fee'
  | 'inspection_fee'; // Payment for third-party inspection services

export type PaymentProvider = 
  | 'stripe' 
  | 'mtn_momo' 
  | 'airtel_money' 
  | 'visa' 
  | 'mastercard' 
  | 'paypal' 
  | 'bank' 
  | 'internal';

export type CurrencyCode = 'RWF' | 'USD' | 'EUR' | 'KES' | 'UGX' | 'TZS';

// Main Payment Transaction Interface
export interface PaymentTransactionData {
  id: string;
  booking_id?: string | null;
  user_id: string;
  payment_method_id?: string | null;
  
  // Transaction details
  transaction_type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  
  // External provider details
  provider: PaymentProvider;
  provider_transaction_id?: string | null;
  provider_fee: number;
  
  // Status and processing
  status: PaymentStatus;
  processed_at?: Date | null;
  expires_at?: Date | null;
  
  // Multi-currency support
  original_currency?: CurrencyCode | null;
  original_amount?: number | null;
  exchange_rate?: number | null;
  exchange_rate_date?: Date | null;
  
  // Additional data and error handling
  metadata?: Record<string, any> | null;
  failure_reason?: string | null;
  provider_response?: string | null;
  
  // Audit fields
  created_at: Date;
  updated_at?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
}

// Create Payment Transaction Interface
export interface CreatePaymentTransactionData {
  booking_id?: string;
  user_id: string;
  payment_method_id?: string;
  
  // Transaction details
  transaction_type: TransactionType;
  amount: number;
  currency?: CurrencyCode;
  
  // External provider details
  provider: PaymentProvider;
  provider_transaction_id?: string;
  provider_fee?: number;
  
  // Status and processing
  status?: PaymentStatus;
  expires_at?: Date;
  
  // Multi-currency support
  original_currency?: CurrencyCode;
  original_amount?: number;
  exchange_rate?: number;
  exchange_rate_date?: Date;
  
  // Additional data
  metadata?: Record<string, any>;
  created_by?: string;
}

// Update Payment Transaction Interface
export interface UpdatePaymentTransactionData {
  // Status and processing
  status?: PaymentStatus;
  processed_at?: Date;
  expires_at?: Date;
  
  // Provider details
  provider_transaction_id?: string;
  provider_fee?: number;
  provider_response?: string;
  
  // Multi-currency support
  original_currency?: CurrencyCode;
  original_amount?: number;
  exchange_rate?: number;
  exchange_rate_date?: Date;
  
  // Error handling
  failure_reason?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  updated_by?: string;
}

// Payment Transaction Filters for Queries
export interface PaymentTransactionFilters {
  user_id?: string;
  booking_id?: string;
  payment_method_id?: string;
  transaction_type?: TransactionType | TransactionType[];
  status?: PaymentStatus | PaymentStatus[];
  provider?: PaymentProvider | PaymentProvider[];
  currency?: CurrencyCode;
  amount_min?: number;
  amount_max?: number;
  created_after?: Date;
  created_before?: Date;
  processed_after?: Date;
  processed_before?: Date;
}

// Payment Transaction Search and Pagination
export interface PaymentTransactionSearchParams extends PaymentTransactionFilters {
  page?: number;
  limit?: number;
  sort_by?: keyof PaymentTransactionData;
  sort_order?: 'asc' | 'desc';
  search?: string; // For searching in metadata, failure_reason, etc.
}

// Payment Transaction Summary/Analytics Interfaces
export interface TransactionSummary {
  user_id: string;
  total_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  total_completed_amount: number;
  total_failed_amount: number;
  last_transaction_date: Date;
  unique_providers_used: number;
}

export interface PaymentTransactionStats {
  total_amount: number;
  total_count: number;
  average_amount: number;
  status_breakdown: Record<PaymentStatus, number>;
  provider_breakdown: Record<PaymentProvider, number>;
  currency_breakdown: Record<CurrencyCode, number>;
  transaction_type_breakdown: Record<TransactionType, number>;
  monthly_trends: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

// Payment Transaction Response Interfaces
export interface PaymentTransactionResponse {
  success: boolean;
  data?: PaymentTransactionData;
  message?: string;
  error?: string;
}

export interface PaymentTransactionListResponse {
  success: boolean;
  data?: PaymentTransactionData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface PaymentTransactionStatsResponse {
  success: boolean;
  data?: PaymentTransactionStats;
  message?: string;
  error?: string;
}

// Payment Processing Interfaces
export interface ProcessPaymentRequest {
  user_id?: string; // Optional - will be set from authentication token
  booking_id?: string;
  payment_method_id: string;
  amount: number;
  currency?: CurrencyCode;
  transaction_type: TransactionType;
  provider?: PaymentProvider; // Payment provider (stripe, mtn_momo, airtel_money, etc.)
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transaction_id?: string;
  status: PaymentStatus;
  provider_transaction_id?: string;
  message?: string;
  error?: string;
  redirect_url?: string; // For 3D Secure or other redirects
}

// Refund Interfaces
export interface RefundRequest {
  transaction_id: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refund_transaction_id?: string;
  original_transaction_id: string;
  refund_amount: number;
  status: PaymentStatus;
  message?: string;
  error?: string;
}

// Webhook and Event Interfaces
export interface PaymentWebhookEvent {
  id: string;
  type: 'payment.completed' | 'payment.failed' | 'payment.refunded' | 'payment.disputed';
  provider: PaymentProvider;
  transaction_id: string;
  provider_transaction_id: string;
  status: PaymentStatus;
  timestamp: Date;
  data: Record<string, any>;
}

// Validation Schemas (for use with validation libraries)
export interface PaymentTransactionValidationRules {
  amount: {
    min: number;
    max: number;
  };
  currency: {
    supported: CurrencyCode[];
  };
  provider: {
    supported: PaymentProvider[];
  };
  transaction_type: {
    supported: TransactionType[];
  };
}

// Error Types
export class PaymentTransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentTransactionError';
  }
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public provider: PaymentProvider,
    public provider_code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

// Currency Conversion Interfaces
export interface CurrencyConversion {
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  date: Date;
  source: string; // e.g., 'xe.com', 'fixer.io', 'manual'
}

export interface ConvertAmountRequest {
  amount: number;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
}

export interface ConvertAmountResponse {
  original_amount: number;
  converted_amount: number;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  exchange_rate: number;
  exchange_rate_date: Date;
}

// Export all types for external use
export type {
  PaymentTransactionData as PaymentTransaction,
  CreatePaymentTransactionData as CreatePaymentTransaction,
  UpdatePaymentTransactionData as UpdatePaymentTransaction,
};
