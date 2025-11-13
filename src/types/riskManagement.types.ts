// =====================================================
// RISK MANAGEMENT TYPES
// =====================================================

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EnforcementLevel {
  LENIENT = 'lenient',
  MODERATE = 'moderate',
  STRICT = 'strict',
  VERY_STRICT = 'very_strict'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
  GRACE_PERIOD = 'grace_period',
  EXEMPT = 'exempt'
}

export interface ProductRiskProfile {
  id: string;
  productId: string;
  categoryId: string;
  riskLevel: RiskLevel;
  mandatoryRequirements: {
    insurance: boolean;
    inspection: boolean;
    minCoverage?: number;
    inspectionTypes: string[];
    complianceDeadlineHours: number;
  };
  riskFactors: string[];
  mitigationStrategies: string[];
  enforcementLevel: EnforcementLevel;
  autoEnforcement: boolean;
  gracePeriodHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  productId: string;
  renterId: string;
  bookingId: string;
  overallRiskScore: number; // 0-100
  riskFactors: {
    productRisk: number;
    renterRisk: number;
    bookingRisk: number;
    seasonalRisk: number;
  };
  recommendations: string[];
  mandatoryRequirements: {
    insurance: boolean;
    inspection: boolean;
    minCoverage?: number;
    inspectionTypes: string[];
  };
  complianceStatus: ComplianceStatus;
  assessmentDate: Date;
  expiresAt: Date;
}

export interface ComplianceCheck {
  bookingId: string;
  productId: string;
  renterId: string;
  isCompliant: boolean;
  missingRequirements: string[];
  complianceScore: number; // 0-100
  status: ComplianceStatus;
  gracePeriodEndsAt?: Date;
  enforcementActions: EnforcementAction[];
  lastCheckedAt: Date;
}

export interface EnforcementAction {
  id: string;
  bookingId?: string;
  productId?: string;
  renterId?: string;
  type: 'BLOCK_BOOKING' | 'REQUIRE_INSURANCE' | 'REQUIRE_INSPECTION' | 'SEND_NOTIFICATION' | 'ESCALATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  requiredAction: string;
  deadline?: Date;
  executedAt?: Date;
  executedBy?: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  createdAt?: Date;
}

export interface PolicyViolation {
  id: string;
  bookingId: string;
  productId: string;
  renterId: string;
  violationType: 'MISSING_INSURANCE' | 'MISSING_INSPECTION' | 'INADEQUATE_COVERAGE' | 'EXPIRED_COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolutionActions: string[];
  penaltyAmount?: number;
  status: 'active' | 'resolved' | 'escalated';
}

export interface RiskManagementConfig {
  id: string;
  categoryId: string;
  countryId: string;
  
  // Risk thresholds
  lowRiskThreshold: number;    // 0-30
  mediumRiskThreshold: number;  // 31-60
  highRiskThreshold: number;   // 61-85
  criticalRiskThreshold: number; // 86-100
  
  // Enforcement settings
  enforcementLevel: EnforcementLevel;
  autoEnforcement: boolean;
  gracePeriodHours: number;
  
  // Insurance requirements
  mandatoryInsurance: boolean;
  minCoverageAmount?: number;
  maxDeductible?: number;
  
  // Inspection requirements
  mandatoryInspection: boolean;
  inspectionTypes: string[];
  inspectionDeadlineHours: number;
  
  // Compliance tracking
  complianceTracking: boolean;
  violationPenalties: {
    firstViolation: number;
    repeatViolation: number;
    criticalViolation: number;
  };
  
  // Notifications
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    inAppNotifications: boolean;
    escalationThreshold: number;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRiskProfileRequest {
  productId: string;
  categoryId: string;
  riskLevel: RiskLevel;
  mandatoryRequirements: {
    insurance: boolean;
    inspection: boolean;
    minCoverage?: number;
    inspectionTypes: string[];
    complianceDeadlineHours: number;
  };
  riskFactors: string[];
  mitigationStrategies: string[];
  enforcementLevel: EnforcementLevel;
  autoEnforcement: boolean;
  gracePeriodHours: number;
}

export interface UpdateRiskProfileRequest {
  riskLevel?: RiskLevel;
  mandatoryRequirements?: {
    insurance?: boolean;
    inspection?: boolean;
    minCoverage?: number;
    inspectionTypes?: string[];
    complianceDeadlineHours?: number;
  };
  riskFactors?: string[];
  mitigationStrategies?: string[];
  enforcementLevel?: EnforcementLevel;
  autoEnforcement?: boolean;
  gracePeriodHours?: number;
}

export interface RiskAssessmentRequest {
  productId: string;
  renterId: string;
  bookingId?: string;
  includeRecommendations?: boolean;
}

export interface ComplianceCheckRequest {
  bookingId: string;
  productId: string;
  renterId: string;
  forceCheck?: boolean;
}

export interface PolicyViolationRequest {
  bookingId: string;
  productId: string;
  renterId: string;
  violationType: string;
  severity: string;
  description: string;
  penaltyAmount?: number;
}

// =====================================================
// RISK MANAGEMENT FILTERS
// =====================================================

export interface RiskProfileFilters {
  productId?: string;
  categoryId?: string;
  riskLevel?: RiskLevel;
  enforcementLevel?: EnforcementLevel;
  autoEnforcement?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ComplianceFilters {
  bookingId?: string;
  productId?: string;
  renterId?: string;
  complianceStatus?: ComplianceStatus;
  isCompliant?: boolean;
  gracePeriodActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ViolationFilters {
  bookingId?: string;
  productId?: string;
  renterId?: string;
  violationType?: string;
  severity?: string;
  status?: string;
  detectedFrom?: Date;
  detectedTo?: Date;
  page?: number;
  limit?: number;
}

// =====================================================
// RISK MANAGEMENT RESPONSES
// =====================================================

export interface RiskAssessmentResponse {
  success: boolean;
  data?: RiskAssessment;
  error?: string;
}

export interface ComplianceCheckResponse {
  success: boolean;
  data?: ComplianceCheck;
  error?: string;
}

export interface PolicyViolationResponse {
  success: boolean;
  data?: PolicyViolation;
  error?: string;
}

export interface RiskProfileResponse {
  success: boolean;
  data?: ProductRiskProfile;
  error?: string;
}

export interface RiskManagementStats {
  totalRiskProfiles: number;
  complianceRate: number;
  violationRate: number;
  averageRiskScore: number;
  enforcementActions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}
