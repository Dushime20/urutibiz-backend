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
  | 'delivery_fee';

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
  bookingId?: string | null;
  userId: string;
  paymentMethodId?: string | null;
  
  // Transaction details
  transactionType: TransactionType;
  amount: number;
  currency: CurrencyCode;
  
  // External provider details
  provider: PaymentProvider;
  providerTransactionId?: string | null;
  providerFee: number;
  
  // Status and processing
  status: PaymentStatus;
  processedAt?: Date | null;
  expiresAt?: Date | null;
  
  // Multi-currency support
  originalCurrency?: CurrencyCode | null;
  originalAmount?: number | null;
  exchangeRate?: number | null;
  exchangeRateDate?: Date | null;
  
  // Additional data and error handling
  metadata?: Record<string, any> | null;
  failureReason?: string | null;
  providerResponse?: string | null;
  
  // Audit fields
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

// Create Payment Transaction Interface
export interface CreatePaymentTransactionData {
  bookingId?: string;
  userId: string;
  paymentMethodId?: string;
  
  // Transaction details
  transactionType: TransactionType;
  amount: number;
  currency?: CurrencyCode;
  
  // External provider details
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerFee?: number;
  
  // Status and processing
  status?: PaymentStatus;
  expiresAt?: Date;
  
  // Multi-currency support
  originalCurrency?: CurrencyCode;
  originalAmount?: number;
  exchangeRate?: number;
  exchangeRateDate?: Date;
  
  // Additional data
  metadata?: Record<string, any>;
  createdBy?: string;
}

// Update Payment Transaction Interface
export interface UpdatePaymentTransactionData {
  // Status and processing
  status?: PaymentStatus;
  processedAt?: Date;
  expiresAt?: Date;
  
  // Provider details
  providerTransactionId?: string;
  providerFee?: number;
  providerResponse?: string;
  
  // Multi-currency support
  originalCurrency?: CurrencyCode;
  originalAmount?: number;
  exchangeRate?: number;
  exchangeRateDate?: Date;
  
  // Error handling
  failureReason?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  updatedBy?: string;
}

// Payment Transaction Filters for Queries
export interface PaymentTransactionFilters {
  userId?: string;
  bookingId?: string;
  paymentMethodId?: string;
  transactionType?: TransactionType | TransactionType[];
  status?: PaymentStatus | PaymentStatus[];
  provider?: PaymentProvider | PaymentProvider[];
  currency?: CurrencyCode;
  amountMin?: number;
  amountMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  processedAfter?: Date;
  processedBefore?: Date;
}

// Payment Transaction Search and Pagination
export interface PaymentTransactionSearchParams extends PaymentTransactionFilters {
  page?: number;
  limit?: number;
  sortBy?: keyof PaymentTransactionData;
  sortOrder?: 'asc' | 'desc';
  search?: string; // For searching in metadata, failure_reason, etc.
}

// Payment Transaction Summary/Analytics Interfaces
export interface TransactionSummary {
  userId: string;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalCompletedAmount: number;
  totalFailedAmount: number;
  lastTransactionDate: Date;
  uniqueProvidersUsed: number;
}

export interface PaymentTransactionStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  statusBreakdown: Record<PaymentStatus, number>;
  providerBreakdown: Record<PaymentProvider, number>;
  currencyBreakdown: Record<CurrencyCode, number>;
  transactionTypeBreakdown: Record<TransactionType, number>;
  monthlyTrends: Array<{
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
  userId: string;
  bookingId?: string;
  paymentMethodId: string;
  amount: number;
  currency?: CurrencyCode;
  transactionType: TransactionType;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  providerTransactionId?: string;
  message?: string;
  error?: string;
  redirectUrl?: string; // For 3D Secure or other redirects
}

// Refund Interfaces
export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundTransactionId?: string;
  originalTransactionId: string;
  refundAmount: number;
  status: PaymentStatus;
  message?: string;
  error?: string;
}

// Webhook and Event Interfaces
export interface PaymentWebhookEvent {
  id: string;
  type: 'payment.completed' | 'payment.failed' | 'payment.refunded' | 'payment.disputed';
  provider: PaymentProvider;
  transactionId: string;
  providerTransactionId: string;
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
  transactionType: {
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
    public providerCode?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

// Currency Conversion Interfaces
export interface CurrencyConversion {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  date: Date;
  source: string; // e.g., 'xe.com', 'fixer.io', 'manual'
}

export interface ConvertAmountRequest {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
}

export interface ConvertAmountResponse {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number;
  exchangeRateDate: Date;
}

// Export all types for external use
export type {
  PaymentTransactionData as PaymentTransaction,
  CreatePaymentTransactionData as CreatePaymentTransaction,
  UpdatePaymentTransactionData as UpdatePaymentTransaction,
};
