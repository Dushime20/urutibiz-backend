// =====================================================
// BOOKING TYPES
// =====================================================

import type { PickupMethod, ProductPricing } from './product.types';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type InsuranceType = 'basic' | 'standard' | 'premium' | 'none';
export type ConditionType = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

// Enhanced comprehensive booking data interface
export interface BookingData {
  id: string;
  bookingNumber?: string; // Unique booking reference
  renterId: string;
  ownerId: string;
  productId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethodId?: string; // Reference to payment method used
  
  // Payment transaction IDs for tracking
  paymentTransactionId?: string; // Main payment transaction
  depositTransactionId?: string; // Security deposit transaction
  refundTransactionId?: string; // Refund transaction if applicable
  
  insuranceType?: InsuranceType;
  
  // Dates and times
  startDate: Date;
  endDate: Date;
  totalDays?: number; // Generated in database
  checkInTime?: Date;
  checkOutTime?: Date;
  pickupTime?: Date;
  returnTime?: Date;
  
  // Pickup and delivery information
  pickupMethod: PickupMethod;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCoordinates?: { lat: number; lng: number };
  deliveryCoordinates?: { lat: number; lng: number };
  
  // Pricing breakdown (matching database schema)
  baseAmount?: number;
  deliveryFee?: number;
  serviceFee?: number;
  insuranceFee?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  securityDeposit?: number;
  currency?: string;
  
  // Insurance information
  insurancePolicyNumber?: string;
  insurancePremium?: number;
  insuranceDetails?: Record<string, any>;
  
  // Legacy pricing structure (for backward compatibility)
  pricing?: ProductPricing;
  platformFee?: number;
  
  // AI and risk assessment
  aiRiskScore?: number;
  aiCompatibilityScore?: number;
  aiAssessment?: Record<string, any>;
  
  // Notes and instructions
  specialInstructions?: string;
  renterNotes?: string;
  ownerNotes?: string;
  adminNotes?: string;
  
  // Condition tracking
  initialCondition?: ConditionType;
  finalCondition?: ConditionType;
  damageReport?: string;
  damagePhotos?: string[];
  
  // Audit information
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Additional metadata
  metadata?: Record<string, any>;
  isRepeatBooking?: boolean;
  parentBookingId?: string;
}

export interface CreateBookingData {
  productId: string;
  startDate: string;
  endDate: string;
  pickupMethod: PickupMethod;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCoordinates?: { lat: number; lng: number };
  deliveryCoordinates?: { lat: number; lng: number };
  checkInTime?: string;
  checkOutTime?: string;
  specialInstructions?: string;
  renterNotes?: string;
  insuranceType?: InsuranceType;
  securityDeposit?: number;
  metadata?: Record<string, any>;
  parentBookingId?: string; // For repeat bookings
}

export interface UpdateBookingData {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethodId?: string; // Reference to payment method
  checkInTime?: Date;
  checkOutTime?: Date;
  pickupTime?: Date;
  returnTime?: Date;
  specialInstructions?: string;
  renterNotes?: string;
  ownerNotes?: string;
  adminNotes?: string;
  aiRiskScore?: number;
  aiCompatibilityScore?: number;
  initialCondition?: ConditionType;
  finalCondition?: ConditionType;
  damageReport?: string;
  damagePhotos?: string[];
  insuranceType?: InsuranceType;
  insurancePolicyNumber?: string;
  insuranceDetails?: Record<string, any>;
  lastModifiedBy?: string;
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, any>;
}

export interface BookingFilters {
  renterId?: string;
  ownerId?: string;
  productId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  insuranceType?: InsuranceType;
  startDate?: string;
  endDate?: string;
  bookingNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  hasInsurance?: boolean;
  isDamaged?: boolean;
}

// Legacy types for backward compatibility
export interface BookingPricing {
  basePrice: number;
  currency: string;
  totalDays: number;
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  securityDeposit?: number;
  discountAmount?: number;
  insuranceFee: number;
}

export interface BookingTimelineEvent {
  id: string;
  eventType: string;
  userId: string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
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
  bookingId: string;
  previousStatus?: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
  changedAt: Date;
}

export interface BookingSearchParams {
  userId?: string;
  productId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  bookingNumber?: string;
  insuranceType?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Insurance-related types
export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  coverage: {
    damageLimit: number;
    theftCoverage: boolean;
    liabilityCoverage: boolean;
    personalAccidentCoverage: boolean;
  };
  premium: number;
  deductible: number;
  terms: string[];
}

// AI assessment types
export interface AIAssessment {
  renterRiskScore: number;
  productRiskScore: number;
  bookingRiskScore: number;
  riskFactors: string[];
  recommendations: string[];
  confidenceLevel: number;
  assessmentDate: Date;
}
