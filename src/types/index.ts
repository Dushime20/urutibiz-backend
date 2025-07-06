// =====================================================
// MAIN TYPE EXPORTS
// =====================================================

// Common types and utilities
export * from './common.types';
export * from './database.types';

// Authentication and authorization
export * from './auth.types';
export * from './user.types';

// Business logic types
export * from './product.types';
export * from './booking.types';
export * from './country.types';
export * from './administrativeDivision.types';
export * from './verificationDocumentType.types';
export * from './paymentProvider.types';
export * from './productPrice.types';
export * from './categoryRegulation.types';
export * from './insuranceProvider.types';

// Advanced features
export * from './ai.types';

// API and response types
// export * from './api.types';

// =====================================================
// UTILITY TYPES
// =====================================================

export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Async response type for better error handling
export type AsyncResult<T, E = Error> = Promise<{
  success: boolean;
  data?: T;
  error?: E;
  message?: string;
}>;

// Service response pattern
export interface ServiceResponse<T = any, E = string> {
  success: boolean;
  data?: T;
  error?: E;
  errors?: Array<{ field: string; message: string }>;
  metadata?: Record<string, any>;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

// Request with typed user (extends core Request without user property conflict)
export interface AuthenticatedRequest<T = any> {
  user: T;
  body: any;
  query: any;
  params: any;
  headers: any;
  method: string;
  url: string;
  path: string;
  ip: string;
}

// Request with optional typed user (for endpoints that may or may not require auth)
export interface OptionalAuthRequest<T = any> {
  user?: T;
  body: any;
  query: any;
  params: any;
  headers: any;
  method: string;
  url: string;
  path: string;
  ip: string;
}

// Generic filter interface
export interface BaseFilter {
  search?: string;
  status?: string;
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  updatedAt?: {
    from?: Date;
    to?: Date;
  };
}

// Sorting options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Pagination with sorting
export interface PaginationWithSort {
  page: number;
  limit: number;
  sort?: SortOptions[];
}

// Database model base interface
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Analytics types
export * from './analytics.types';
export * from './admin.types';
