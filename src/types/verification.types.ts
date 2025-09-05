// =====================================================
// ADVANCED VERIFICATION & TRUST SYSTEM TYPES
// =====================================================

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export enum VerificationType {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  PHONE = 'phone',
  EMAIL = 'email',
  BANK_ACCOUNT = 'bank_account',
  SOCIAL_MEDIA = 'social_media',
  PROFESSIONAL = 'professional',
  BIOMETRIC = 'biometric'
}

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  GOVERNMENT_CORRESPONDENCE = 'government_correspondence'
}

export enum VerificationMethod {
  OCR = 'ocr',
  BIOMETRIC = 'biometric',
  LIVENESS_DETECTION = 'liveness_detection',
  MANUAL_REVIEW = 'manual_review',
  AUTOMATED_CHECK = 'automated_check'
}

export enum TrustScoreLevel {
  LOW = 'low',           // 0-30
  MEDIUM = 'medium',     // 31-60
  HIGH = 'high',         // 61-80
  VERY_HIGH = 'very_high', // 81-95
  EXCELLENT = 'excellent'  // 96-100
}

export enum VerificationProvider {
  JUMIO = 'jumio',
  ONFIDO = 'onfido',
  TRULIOO = 'trulioo',
  ID_ME = 'id_me',
  CLEAR = 'clear'
}

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  provider: VerificationProvider;
  method: VerificationMethod;
  confidence: number; // 0-1
  status: VerificationStatus;
  metadata: {
    documentNumber?: string;
    expiryDate?: Date;
    issueDate?: Date;
    issuingAuthority?: string;
    country?: string;
  };
  files: {
    frontImage?: string;
    backImage?: string;
    selfieImage?: string;
    livenessVideo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface IdentityVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  biometricData: {
    faceRecognition: {
      confidence: number;
      livenessScore: number;
      qualityScore: number;
    };
    fingerprintScan?: {
      confidence: number;
      qualityScore: number;
    };
    voiceRecognition?: {
      confidence: number;
      qualityScore: number;
    };
  };
  socialMediaVerification: {
    linkedin?: {
      verified: boolean;
      profileUrl: string;
      connectionCount: number;
      professionalStatus: string;
    };
    facebook?: {
      verified: boolean;
      profileUrl: string;
      friendCount: number;
      accountAge: number;
    };
    google?: {
      verified: boolean;
      profileUrl: string;
      accountAge: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AddressVerification {
  id: string;
  userId: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  verificationMethods: {
    utilityBill: boolean;
    bankStatement: boolean;
    governmentCorrespondence: boolean;
    geolocationVerification: boolean;
  };
  status: VerificationStatus;
  confidence: number;
  documents: VerificationDocument[];
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}

export interface PhoneVerification {
  id: string;
  userId: string;
  phoneNumber: string;
  countryCode: string;
  verificationMethods: {
    sms: boolean;
    voiceCall: boolean;
    whatsapp: boolean;
  };
  status: VerificationStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}

export interface EmailVerification {
  id: string;
  userId: string;
  email: string;
  verificationMethods: {
    emailLink: boolean;
    emailCode: boolean;
    domainVerification: boolean;
  };
  status: VerificationStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}

export interface BankAccountVerification {
  id: string;
  userId: string;
  bankAccount: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountType: 'checking' | 'savings';
    country: string;
  };
  verificationMethods: {
    microDeposits: boolean;
    instantVerification: boolean;
    bankStatement: boolean;
  };
  status: VerificationStatus;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}

export interface TrustScore {
  id: string;
  userId: string;
  overallScore: number; // 0-100
  level: TrustScoreLevel;
  breakdown: {
    identityVerification: {
      score: number;
      weight: 0.25;
      factors: {
        documentQuality: number;
        biometricMatch: number;
        livenessScore: number;
      };
    };
    transactionHistory: {
      score: number;
      weight: 0.25;
      factors: {
        completionRate: number;
        cancellationRate: number;
        disputeRate: number;
        averageRating: number;
      };
    };
    userReviews: {
      score: number;
      weight: 0.25;
      factors: {
        averageRating: number;
        reviewCount: number;
        responseRate: number;
        reviewQuality: number;
      };
    };
    socialProof: {
      score: number;
      weight: 0.15;
      factors: {
        linkedinVerification: number;
        socialConnections: number;
        professionalStatus: number;
        accountAge: number;
      };
    };
    responseTime: {
      score: number;
      weight: 0.10;
      factors: {
        averageResponseTime: number;
        availabilityScore: number;
        communicationQuality: number;
      };
    };
  };
  badges: TrustBadge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: {
    minScore: number;
    verificationTypes: VerificationType[];
    transactionCount?: number;
    reviewCount?: number;
  };
  earnedAt: Date;
  expiresAt?: Date;
}

export interface VerificationSession {
  id: string;
  userId: string;
  sessionToken: string;
  verificationTypes: VerificationType[];
  status: VerificationStatus;
  progress: {
    completed: number;
    total: number;
    currentStep: string;
  };
  metadata: {
    userAgent: string;
    ipAddress: string;
    location?: {
      country: string;
      city: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    deviceInfo: {
      type: 'mobile' | 'desktop' | 'tablet';
      os: string;
      browser: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiredAt?: Date;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface StartVerificationRequest {
  userId: string;
  verificationTypes: VerificationType[];
  documents?: {
    type: DocumentType;
    frontImage: string;
    backImage?: string;
    selfieImage?: string;
  }[];
  metadata?: {
    userAgent: string;
    ipAddress: string;
    location?: {
      country: string;
      city: string;
    };
  };
}

export interface CompleteVerificationRequest {
  sessionId: string;
  verificationData: {
    identity?: {
      documents: VerificationDocument[];
      biometricData: any;
    };
    address?: {
      address: any;
      documents: VerificationDocument[];
    };
    phone?: {
      phoneNumber: string;
      countryCode: string;
      verificationCode: string;
    };
    email?: {
      email: string;
      verificationCode: string;
    };
    bankAccount?: {
      bankAccount: any;
      verificationMethod: string;
    };
  };
}

export interface UpdateTrustScoreRequest {
  userId: string;
  factors: {
    transactionCompleted?: boolean;
    reviewReceived?: {
      rating: number;
      quality: number;
    };
    responseTime?: number;
    cancellation?: boolean;
    dispute?: boolean;
  };
}

export interface GetVerificationStatusRequest {
  userId: string;
  verificationTypes?: VerificationType[];
}

export interface GetTrustScoreRequest {
  userId: string;
  includeBreakdown?: boolean;
  includeBadges?: boolean;
}

// =====================================================
// RESPONSE TYPES
// =====================================================

export interface VerificationResponse {
  success: boolean;
  data?: {
    sessionId: string;
    status: VerificationStatus;
    progress: {
      completed: number;
      total: number;
      currentStep: string;
    };
    nextSteps: string[];
    estimatedTime: number; // minutes
  };
  error?: string;
}

export interface TrustScoreResponse {
  success: boolean;
  data?: {
    overallScore: number;
    level: TrustScoreLevel;
    breakdown?: any;
    badges?: TrustBadge[];
    recommendations: string[];
  };
  error?: string;
}

export interface VerificationStatusResponse {
  success: boolean;
  data?: {
    userId: string;
    verifications: {
      identity?: IdentityVerification;
      address?: AddressVerification;
      phone?: PhoneVerification;
      email?: EmailVerification;
      bankAccount?: BankAccountVerification;
    };
    overallStatus: VerificationStatus;
    trustScore: TrustScore;
  };
  error?: string;
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface VerificationFilters {
  userId?: string;
  status?: VerificationStatus;
  type?: VerificationType;
  provider?: VerificationProvider;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface TrustScoreFilters {
  userId?: string;
  minScore?: number;
  maxScore?: number;
  level?: TrustScoreLevel;
  hasBadges?: boolean;
  page?: number;
  limit?: number;
}

// =====================================================
// STATISTICS TYPES
// =====================================================

export interface VerificationStats {
  totalVerifications: number;
  verifiedUsers: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  averageVerificationTime: number; // minutes
  verificationSuccessRate: number; // percentage
  trustScoreDistribution: {
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    excellent: number;
  };
  providerPerformance: {
    provider: VerificationProvider;
    successRate: number;
    averageTime: number;
    cost: number;
  }[];
  fraudDetection: {
    totalAttempts: number;
    detectedFraud: number;
    falsePositives: number;
    accuracy: number;
  };
}
