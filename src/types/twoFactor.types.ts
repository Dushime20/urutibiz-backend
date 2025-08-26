// =====================================================
// TWO-FACTOR AUTHENTICATION TYPES
// =====================================================

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  userId: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
  hasSecret: boolean;
  hasBackupCodes: boolean;
}

export interface TwoFactorBackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export interface EnableTwoFactorRequest {
  userId: string;
}

export interface VerifyTwoFactorRequest {
  userId: string;
  token: string;
}

export interface DisableTwoFactorRequest {
  userId: string;
  currentPassword: string;
}

export interface GenerateBackupCodesRequest {
  userId: string;
  currentPassword: string;
}

export interface VerifyBackupCodeRequest {
  userId: string;
  backupCode: string;
}

export interface TwoFactorResponse {
  success: boolean;
  message: string;
  data?: any;
}
