export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';

export type KycStatus = 'unverified' | 'basic' | 'pending_review' | 'verified' | 'rejected' | 'suspended' | 'expired';

export type VerificationType =
  | 'national_id'
  | 'passport'
  | 'driving_license'
  | 'address'
  | 'selfie';

export interface UserVerification {
  aiProcessingStatus: string;
  id: string;
  userId: string;
  verificationType: VerificationType;
  documentNumber?: string;
  documentImageUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  // Global address fields
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  // Legacy address fields (for backward compatibility)
  addressLine?: string;
  district?: string;
  // OCR extracted fields (optional)
  ocrData?: Record<string, any>;
  // Selfie/liveness fields (optional)
  selfieImageUrl?: string;
  livenessScore?: number;
  // AI profile verification score (optional)
  aiProfileScore?: number;
}

export interface SubmitVerificationRequest {
  verificationType: VerificationType;
  documentNumber?: string;
  documentImageUrl?: string;
  // Global address fields
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  // Legacy address fields (for backward compatibility)
  addressLine?: string;
  district?: string;
  // Selfie
  selfieImageUrl?: string;
}

export interface ReviewVerificationRequest {
  verificationId: string;
  status: VerificationStatus;
  notes?: string;
}

export interface UpdateVerificationRequest {
  verificationType?: VerificationType;
  documentNumber?: string;
  documentImageUrl?: string;
  // Global address fields
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  // Legacy address fields (for backward compatibility)
  addressLine?: string;
  district?: string;
  // Selfie
  selfieImageUrl?: string;
}
