// =====================================================
// BOOKING TYPES
// =====================================================

import type { PickupMethod, ProductPricing } from './product.types';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'cancellation_requested';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type InsuranceType = 'basic' | 'standard' | 'premium' | 'none';
export type ConditionType = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

// Enhanced comprehensive booking data interface
export interface BookingData {
  id: string;
  booking_number?: string; // Unique booking reference
  renter_id: string;
  owner_id: string;
  product_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method_id?: string; // Reference to payment method used
  
  // Payment transaction IDs for tracking
  payment_transaction_id?: string; // Main payment transaction
  deposit_transaction_id?: string; // Security deposit transaction
  refund_transaction_id?: string; // Refund transaction if applicable
  
  insurance_type?: InsuranceType;
  
  // Dates and times
  start_date: string;
  end_date: string;
  total_days?: number; // Generated in database
  check_in_time?: string;
  check_out_time?: string;
  pickup_time?: string;
  return_time?: string;
  
  // Pickup and delivery information
  pickup_method: PickupMethod;
  pickup_address?: string;
  delivery_address?: string;
  pickup_coordinates?: { lat: number; lng: number };
  delivery_coordinates?: { lat: number; lng: number };
  
  // Pricing breakdown (matching database schema)
  base_amount?: number;
  delivery_fee?: number;
  service_fee?: number;
  insurance_fee?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  security_deposit?: number;
  currency?: string;
  
  // Insurance information
  insurance_policy_number?: string;
  insurance_premium?: number;
  insurance_details?: Record<string, any>;
  
  // Legacy pricing structure (for backward compatibility)
  pricing?: ProductPricing;
  platform_fee?: number;
  
  // AI and risk assessment
  ai_risk_score?: number;
  ai_compatibility_score?: number;
  ai_assessment?: Record<string, any>;
  
  // Notes and instructions
  special_instructions?: string;
  renter_notes?: string;
  owner_notes?: string;
  admin_notes?: string;
  
  // Condition tracking
  initial_condition?: ConditionType;
  final_condition?: ConditionType;
  damage_report?: string;
  damage_photos?: string[];
  
  // Audit information
  created_by?: string;
  last_modified_by?: string;
  created_at: Date;
  updated_at?: Date;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  is_repeat_booking?: boolean;
  parent_booking_id?: string;
  
  // Cancellation metadata
  cancellation_reason?: string;
  cancellation_requested_at?: Date;
  cancellation_approved_at?: Date;
  cancellation_rejected_at?: Date;
  cancellation_rejected_reason?: string;
  owner_decision?: 'approved' | 'rejected';
  admin_override?: boolean;
  
  // Refund metadata
  refund_amount?: number;
  cancellation_fee?: number;
  
  // Owner confirmation fields
  owner_confirmed?: boolean;
  owner_confirmation_status?: 'pending' | 'confirmed' | 'rejected';
  owner_confirmed_at?: string;
  owner_rejection_reason?: string;
  owner_confirmation_notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingData {
  product_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  pickup_method: PickupMethod;
  pickup_address?: string;
  delivery_address?: string;
  pickup_coordinates?: { lat: number; lng: number };
  delivery_coordinates?: { lat: number; lng: number };
  check_in_time?: string;
  check_out_time?: string;
  special_instructions?: string;
  renter_notes?: string;
  insurance_type?: InsuranceType;
  security_deposit?: number;
  metadata?: Record<string, any>;
  parent_booking_id?: string; // For repeat bookings
  is_repeat_booking?: boolean; // Flag for repeat bookings
}

export interface UpdateBookingData {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  payment_method_id?: string; // Reference to payment method
  check_in_time?: string;
  check_out_time?: string;
  pickup_time?: string;
  return_time?: string;
  special_instructions?: string;
  renter_notes?: string;
  owner_notes?: string;
  admin_notes?: string;
  ai_risk_score?: number;
  ai_compatibility_score?: number;
  initial_condition?: ConditionType;
  final_condition?: ConditionType;
  damage_report?: string;
  damage_photos?: string[];
  insurance_type?: InsuranceType;
  insurance_policy_number?: string;
  insurance_details?: Record<string, any>;
  last_modified_by?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  metadata?: Record<string, any>;
  // Owner confirmation fields
  owner_confirmed?: boolean;
  owner_confirmation_status?: 'pending' | 'confirmed' | 'rejected';
  owner_rejection_reason?: string;
  owner_confirmation_notes?: string;
}

export interface BookingFilters {
  renter_id?: string;
  owner_id?: string;
  product_id?: string;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  insurance_type?: InsuranceType;
  start_date?: string;
  end_date?: string;
  booking_number?: string;
  min_amount?: number;
  max_amount?: number;
  has_insurance?: boolean;
  is_damaged?: boolean;
}

// Legacy types for backward compatibility
export interface BookingPricing {
  base_price: number;
  currency: string;
  total_days: number;
  subtotal: number;
  platform_fee: number;
  tax_amount: number;
  total_amount: number;
  security_deposit?: number;
  discount_amount?: number;
  insurance_fee: number;
}

export interface BookingTimelineEvent {
  id: string;
  event_type: string;
  user_id: string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  timestamp: Date;
  is_read: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    type: 'image' | 'document';
    filename: string;
  }>;
}

// Enhanced booking status history interface
export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  previous_status?: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  metadata?: Record<string, any>;
  changed_at: Date;
}

export interface BookingSearchParams {
  user_id?: string;
  product_id?: string;
  status?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
  booking_number?: string;
  insurance_type?: string;
  min_amount?: number;
  max_amount?: number;
}

// Insurance-related types
export interface InsuranceDetails {
  provider: string;
  policy_number: string;
  coverage: {
    damage_limit: number;
    theft_coverage: boolean;
    liability_coverage: boolean;
    personal_accident_coverage: boolean;
  };
  premium: number;
  deductible: number;
  terms: string[];
}

// AI assessment types
export interface AIAssessment {
  renter_risk_score: number;
  product_risk_score: number;
  booking_risk_score: number;
  risk_factors: string[];
  recommendations: string[];
  confidence_level: number;
  assessment_date: Date;
}
