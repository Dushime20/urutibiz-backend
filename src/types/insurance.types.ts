/**
 * Insurance Types
 * Type definitions for insurance policies and claims
 */

// Enums
export enum InsuranceType {
  TRAVEL_INSURANCE = 'travel_insurance',
  CANCELLATION_INSURANCE = 'cancellation_insurance',
  MEDICAL_INSURANCE = 'medical_insurance',
  BAGGAGE_INSURANCE = 'baggage_insurance',
  ACTIVITY_INSURANCE = 'activity_insurance',
  COMPREHENSIVE_INSURANCE = 'comprehensive_insurance',
  LIABILITY_INSURANCE = 'liability_insurance'
}

export enum InsurancePolicyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLAIMED = 'claimed',
  CANCELLED = 'cancelled'
}

export enum InsuranceClaimStatus {
  SUBMITTED = 'submitted',
  INVESTIGATING = 'investigating',
  APPROVED = 'approved',
  DENIED = 'denied',
  PAID = 'paid'
}

// Base interfaces
export interface InsurancePolicy {
  id: string;
  bookingId: string;
  policyNumber: string;
  
  // Policy details
  insuranceType: InsuranceType;
  coverageAmount: number;
  premiumAmount: number;
  deductibleAmount: number;
  
  // Coverage details
  coverageDetails?: Record<string, any>;
  termsAndConditions?: string;
  
  // Status
  status: InsurancePolicyStatus;
  
  // Provider information
  providerName?: string;
  providerPolicyId?: string;
  
  // Validity period
  validFrom: Date;
  validUntil: Date;
  
  createdAt: Date;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  bookingId: string;
  claimantId: string;
  
  // Claim details
  claimNumber: string;
  incidentDate: Date;
  claimAmount: number;
  approvedAmount?: number;
  
  // Incident description
  incidentDescription: string;
  damagePhotos?: string[];
  
  // Processing
  status: InsuranceClaimStatus;
  processedBy?: string;
  processingNotes?: string;
  
  // AI assessment
  aiFraudScore?: number; // 0-1
  aiDamageAssessment?: Record<string, any>;
  
  createdAt: Date;
  resolvedAt?: Date;
}

// Request/Response interfaces
export interface CreateInsurancePolicyRequest {
  bookingId: string;
  insuranceType: InsuranceType;
  coverageAmount: number;
  premiumAmount: number;
  deductibleAmount?: number;
  coverageDetails?: Record<string, any>;
  termsAndConditions?: string;
  providerName?: string;
  providerPolicyId?: string;
  validFrom: Date;
  validUntil: Date;
}

export interface UpdateInsurancePolicyRequest {
  status?: InsurancePolicyStatus;
  coverageDetails?: Record<string, any>;
  termsAndConditions?: string;
  providerName?: string;
  providerPolicyId?: string;
  validFrom?: Date;
  validUntil?: Date;
}

export interface CreateInsuranceClaimRequest {
  policyId: string;
  bookingId: string;
  claimantId: string;
  incidentDate: Date;
  claimAmount: number;
  incidentDescription: string;
  damagePhotos?: string[];
}

export interface UpdateInsuranceClaimRequest {
  status?: InsuranceClaimStatus;
  approvedAmount?: number;
  processedBy?: string;
  processingNotes?: string;
  aiFraudScore?: number;
  aiDamageAssessment?: Record<string, any>;
  resolvedAt?: Date;
}

// Detailed response interfaces
export interface InsurancePolicyWithDetails extends InsurancePolicy {
  booking?: {
    id: string;
    customerName: string;
    destination: string;
    startDate: Date;
    endDate: Date;
  };
  claims?: InsuranceClaim[];
}

export interface InsuranceClaimWithDetails extends InsuranceClaim {
  policy?: InsurancePolicy;
  claimant?: {
    id: string;
    name: string;
    email: string;
  };
  processor?: {
    id: string;
    name: string;
    email: string;
  };
}

// Search and filter interfaces
export interface InsurancePolicyFilters {
  bookingId?: string;
  insuranceType?: InsuranceType;
  status?: InsurancePolicyStatus;
  providerName?: string;
  validFrom?: Date;
  validUntil?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface InsuranceClaimFilters {
  policyId?: string;
  bookingId?: string;
  claimantId?: string;
  status?: InsuranceClaimStatus;
  processedBy?: string;
  incidentDateAfter?: Date;
  incidentDateBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  minClaimAmount?: number;
  maxClaimAmount?: number;
  aiFraudScoreMin?: number;
  aiFraudScoreMax?: number;
}

// Analytics interfaces
export interface InsuranceAnalytics {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  claimedPolicies: number;
  cancelledPolicies: number;
  
  totalClaims: number;
  submittedClaims: number;
  investigatingClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  paidClaims: number;
  
  totalClaimAmount: number;
  totalApprovedAmount: number;
  averageClaimAmount: number;
  averageApprovedAmount: number;
  
  claimApprovalRate: number;
  averageProcessingDays: number;
  
  fraudDetectionMetrics: {
    totalAssessments: number;
    highRiskClaims: number; // fraud score > 0.7
    averageFraudScore: number;
  };
}

export interface InsuranceTypeAnalytics {
  insuranceType: InsuranceType;
  totalPolicies: number;
  totalClaims: number;
  claimRate: number; // claims per policy
  averageClaimAmount: number;
  totalPremiumRevenue: number;
}

// Error classes
export class InsurancePolicyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'InsurancePolicyError';
  }
}

export class InsuranceClaimError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'InsuranceClaimError';
  }
}

// Validation interfaces
export interface InsurancePolicyValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface InsuranceClaimValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  fraudRiskLevel?: 'low' | 'medium' | 'high';
}

// AI assessment interfaces
export interface AIFraudAssessment {
  fraudScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  confidence: number; // 0-1
}

export interface AIDamageAssessment {
  estimatedCost: number;
  damageCategory: string;
  severityLevel: 'minor' | 'moderate' | 'severe' | 'total';
  confidence: number; // 0-1
  detectedItems: string[];
  recommendations: string[];
}
