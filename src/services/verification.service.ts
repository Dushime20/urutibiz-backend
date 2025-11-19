import { getDatabase } from '@/config/database';
import { ServiceResponse } from '@/types';
import {
  VerificationStatus,
  VerificationType,
  DocumentType,
  VerificationMethod,
  TrustScoreLevel,
  VerificationProvider,
  VerificationDocument,
  IdentityVerification,
  AddressVerification,
  PhoneVerification,
  EmailVerification,
  BankAccountVerification,
  TrustScore,
  TrustBadge,
  VerificationSession,
  StartVerificationRequest,
  CompleteVerificationRequest,
  UpdateTrustScoreRequest,
  GetVerificationStatusRequest,
  GetTrustScoreRequest,
  VerificationResponse,
  TrustScoreResponse,
  VerificationStatusResponse,
  VerificationFilters,
  TrustScoreFilters,
  VerificationStats
} from '@/types/verification.types';

export class VerificationService {
  private db = getDatabase();

  // =====================================================
  // VERIFICATION SESSION MANAGEMENT
  // =====================================================

  /**
   * Start a new verification session
   */
  async startVerification(data: StartVerificationRequest): Promise<ServiceResponse<VerificationResponse>> {
    try {
      const sessionId = require('uuid').v4();
      const sessionToken = require('crypto').randomBytes(32).toString('hex');

      const session: VerificationSession = {
        id: sessionId,
        userId: data.userId,
        sessionToken,
        verificationTypes: data.verificationTypes,
        status: VerificationStatus.PENDING,
        progress: {
          completed: 0,
          total: data.verificationTypes.length,
          currentStep: 'Starting verification process...'
        },
        metadata: {
          userAgent: data.metadata?.userAgent || '',
          ipAddress: data.metadata?.ipAddress || '',
          location: (() => {
            const loc = data.metadata?.location;
            if (!loc || !('coordinates' in loc)) return undefined;
            const coords = loc.coordinates as any;
            if (coords && typeof coords === 'object' && 
                typeof coords.lat === 'number' && 
                typeof coords.lng === 'number') {
              return {
                country: loc.country || '',
                city: loc.city || '',
                coordinates: {
                  lat: coords.lat,
                  lng: coords.lng
                }
              };
            }
            return undefined;
          })(),
          deviceInfo: {
            type: 'desktop', // This would be determined from user agent
            os: 'unknown',
            browser: 'unknown'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      await this.db('verification_sessions').insert({
        id: session.id,
        user_id: session.userId,
        session_token: session.sessionToken,
        verification_types: JSON.stringify(session.verificationTypes),
        status: session.status,
        progress: JSON.stringify(session.progress),
        metadata: JSON.stringify(session.metadata),
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        expired_at: session.expiredAt
      });

      // Initialize verification records for each type
      for (const type of data.verificationTypes) {
        await this.initializeVerificationRecord(data.userId, type);
      }

      const response: VerificationResponse = {
        success: true,
        data: {
          sessionId: session.id,
          status: session.status,
          progress: session.progress,
          nextSteps: this.getNextSteps(data.verificationTypes),
          estimatedTime: this.getEstimatedTime(data.verificationTypes)
        }
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('[VerificationService] Start verification error:', error);
      return { success: false, error: 'Failed to start verification session' };
    }
  }

  /**
   * Complete verification process
   */
  async completeVerification(data: CompleteVerificationRequest): Promise<ServiceResponse<VerificationResponse>> {
    try {
      const session = await this.getVerificationSession(data.sessionId);
      if (!session.success) {
        return { success: false, error: 'Verification session not found' };
      }

      const verificationSession = session.data!;

      // Process each verification type
      for (const [type, verificationData] of Object.entries(data.verificationData)) {
        await this.processVerificationType(verificationSession.userId, type as VerificationType, verificationData);
      }

      // Update session progress
      const progress = {
        completed: verificationSession.progress.completed + 1,
        total: verificationSession.progress.total,
        currentStep: 'Verification completed successfully'
      };

      await this.db('verification_sessions')
        .where('id', data.sessionId)
        .update({
          status: VerificationStatus.VERIFIED,
          progress: JSON.stringify(progress),
          completed_at: new Date(),
          updated_at: new Date()
        });

      // Calculate trust score
      await this.calculateTrustScore(verificationSession.userId);

      const response: VerificationResponse = {
        success: true,
        data: {
          sessionId: data.sessionId,
          status: VerificationStatus.VERIFIED,
          progress,
          nextSteps: ['Verification completed successfully'],
          estimatedTime: 0
        }
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('[VerificationService] Complete verification error:', error);
      return { success: false, error: 'Failed to complete verification' };
    }
  }

  // =====================================================
  // TRUST SCORE MANAGEMENT
  // =====================================================

  /**
   * Calculate trust score for a user
   */
  async calculateTrustScore(userId: string): Promise<ServiceResponse<TrustScore>> {
    try {
      // Get all verification data for the user
      const verifications = await this.getUserVerifications(userId);
      
      // Calculate individual component scores
      const identityScore = await this.calculateIdentityScore(verifications.identity);
      const transactionScore = await this.calculateTransactionScore(userId);
      const reviewScore = await this.calculateReviewScore(userId);
      const socialScore = await this.calculateSocialScore(verifications.identity);
      const responseScore = await this.calculateResponseScore(userId);

      // Calculate weighted overall score
      const overallScore = Math.round(
        (identityScore * 0.25) +
        (transactionScore * 0.25) +
        (reviewScore * 0.25) +
        (socialScore * 0.15) +
        (responseScore * 0.10)
      );

      const level = this.getTrustScoreLevel(overallScore);

      const trustScore: TrustScore = {
        id: require('uuid').v4(),
        userId,
        overallScore,
        level,
        breakdown: {
          identityVerification: {
            score: identityScore,
            weight: 0.25,
            factors: {
              documentQuality: verifications.identity ? 85 : 0,
              biometricMatch: verifications.identity ? 90 : 0,
              livenessScore: verifications.identity ? 95 : 0
            }
          },
          transactionHistory: {
            score: transactionScore,
            weight: 0.25,
            factors: {
              completionRate: 95,
              cancellationRate: 5,
              disputeRate: 2,
              averageRating: 4.5
            }
          },
          userReviews: {
            score: reviewScore,
            weight: 0.25,
            factors: {
              averageRating: 4.3,
              reviewCount: 15,
              responseRate: 90,
              reviewQuality: 85
            }
          },
          socialProof: {
            score: socialScore,
            weight: 0.15,
            factors: {
              linkedinVerification: verifications.identity?.socialMediaVerification?.linkedin?.verified ? 100 : 0,
              socialConnections: 75,
              professionalStatus: 80,
              accountAge: 70
            }
          },
          responseTime: {
            score: responseScore,
            weight: 0.10,
            factors: {
              averageResponseTime: 2.5,
              availabilityScore: 90,
              communicationQuality: 85
            }
          }
        },
        badges: await this.calculateBadges(userId, overallScore),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save or update trust score
      await this.saveTrustScore(trustScore);

      return { success: true, data: trustScore };
    } catch (error) {
      console.error('[VerificationService] Calculate trust score error:', error);
      return { success: false, error: 'Failed to calculate trust score' };
    }
  }

  /**
   * Get trust score for a user
   */
  async getTrustScore(data: GetTrustScoreRequest): Promise<ServiceResponse<TrustScoreResponse>> {
    try {
      const result = await this.db('trust_scores')
        .where('user_id', data.userId)
        .first();

      if (!result) {
        return { success: false, error: 'Trust score not found' };
      }

      const trustScore: TrustScore = {
        id: result.id,
        userId: result.user_id,
        overallScore: result.overall_score,
        level: result.level,
        breakdown: JSON.parse(result.breakdown || '{}'),
        badges: JSON.parse(result.badges || '[]'),
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      const response: TrustScoreResponse = {
        success: true,
        data: {
          overallScore: trustScore.overallScore,
          level: trustScore.level,
          breakdown: data.includeBreakdown ? trustScore.breakdown : undefined,
          badges: data.includeBadges ? trustScore.badges : undefined,
          recommendations: this.getTrustScoreRecommendations(trustScore)
        }
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('[VerificationService] Get trust score error:', error);
      return { success: false, error: 'Failed to get trust score' };
    }
  }

  // =====================================================
  // VERIFICATION STATUS MANAGEMENT
  // =====================================================

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(data: GetVerificationStatusRequest): Promise<ServiceResponse<VerificationStatusResponse>> {
    try {
      const verifications = await this.getUserVerifications(data.userId);
      const trustScoreResult = await this.calculateTrustScore(data.userId);
      const trustScore = trustScoreResult.success && trustScoreResult.data
        ? trustScoreResult.data
        : this.createDefaultTrustScore(data.userId);

      const overallStatus = this.determineOverallStatus(verifications);

      const response: VerificationStatusResponse = {
        success: true,
        data: {
          userId: data.userId,
          verifications,
          overallStatus,
          trustScore
        }
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('[VerificationService] Get verification status error:', error);
      return { success: false, error: 'Failed to get verification status' };
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async initializeVerificationRecord(userId: string, type: VerificationType): Promise<void> {
    const id = require('uuid').v4();

    switch (type) {
      case VerificationType.IDENTITY:
        await this.db('identity_verifications').insert({
          id,
          user_id: userId,
          status: VerificationStatus.PENDING,
          documents: JSON.stringify([]),
          biometric_data: JSON.stringify({}),
          social_media_verification: JSON.stringify({}),
          created_at: new Date(),
          updated_at: new Date()
        });
        break;

      case VerificationType.ADDRESS:
        await this.db('address_verifications').insert({
          id,
          user_id: userId,
          address: JSON.stringify({}),
          verification_methods: JSON.stringify({}),
          status: VerificationStatus.PENDING,
          confidence: 0,
          documents: JSON.stringify([]),
          created_at: new Date(),
          updated_at: new Date()
        });
        break;

      case VerificationType.PHONE:
        await this.db('phone_verifications').insert({
          id,
          user_id: userId,
          phone_number: '',
          country_code: '',
          verification_methods: JSON.stringify({}),
          status: VerificationStatus.PENDING,
          attempts: 0,
          max_attempts: 3,
          created_at: new Date(),
          updated_at: new Date()
        });
        break;

      case VerificationType.EMAIL:
        await this.db('email_verifications').insert({
          id,
          user_id: userId,
          email: '',
          verification_methods: JSON.stringify({}),
          status: VerificationStatus.PENDING,
          attempts: 0,
          max_attempts: 3,
          created_at: new Date(),
          updated_at: new Date()
        });
        break;

      case VerificationType.BANK_ACCOUNT:
        await this.db('bank_account_verifications').insert({
          id,
          user_id: userId,
          bank_account: JSON.stringify({}),
          verification_methods: JSON.stringify({}),
          status: VerificationStatus.PENDING,
          confidence: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
        break;
    }
  }

  private async processVerificationType(userId: string, type: VerificationType, data: any): Promise<void> {
    switch (type) {
      case VerificationType.IDENTITY:
        await this.processIdentityVerification(userId, data);
        break;
      case VerificationType.ADDRESS:
        await this.processAddressVerification(userId, data);
        break;
      case VerificationType.PHONE:
        await this.processPhoneVerification(userId, data);
        break;
      case VerificationType.EMAIL:
        await this.processEmailVerification(userId, data);
        break;
      case VerificationType.BANK_ACCOUNT:
        await this.processBankAccountVerification(userId, data);
        break;
    }
  }

  private createDefaultTrustScore(userId: string): TrustScore {
    return {
      id: '',
      userId,
      overallScore: 0,
      level: TrustScoreLevel.LOW,
      breakdown: {
        identityVerification: {
          score: 0,
          weight: 0.25 as 0.25,
          factors: {
            documentQuality: 0,
            biometricMatch: 0,
            livenessScore: 0
          }
        },
        transactionHistory: {
          score: 0,
          weight: 0.25 as 0.25,
          factors: {
            completionRate: 0,
            cancellationRate: 0,
            disputeRate: 0,
            averageRating: 0
          }
        },
        userReviews: {
          score: 0,
          weight: 0.25 as 0.25,
          factors: {
            averageRating: 0,
            reviewCount: 0,
            responseRate: 0,
            reviewQuality: 0
          }
        },
        socialProof: {
          score: 0,
          weight: 0.15 as 0.15,
          factors: {
            linkedinVerification: 0,
            socialConnections: 0,
            professionalStatus: 0,
            accountAge: 0
          }
        },
        responseTime: {
          score: 0,
          weight: 0.10 as 0.10,
          factors: {
            averageResponseTime: 0,
            availabilityScore: 0,
            communicationQuality: 0
          }
        }
      },
      badges: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async processIdentityVerification(userId: string, data: any): Promise<void> {
    // Implementation would process identity verification
    await this.db('identity_verifications')
      .where('user_id', userId)
      .update({
        status: VerificationStatus.VERIFIED,
        documents: JSON.stringify(data.documents || []),
        biometric_data: JSON.stringify(data.biometricData || {}),
        completed_at: new Date(),
        updated_at: new Date()
      });
  }

  private async processAddressVerification(userId: string, data: any): Promise<void> {
    // Implementation would process address verification
    await this.db('address_verifications')
      .where('user_id', userId)
      .update({
        status: VerificationStatus.VERIFIED,
        address: JSON.stringify(data.address || {}),
        documents: JSON.stringify(data.documents || []),
        confidence: 0.95,
        verified_at: new Date(),
        updated_at: new Date()
      });
  }

  private async processPhoneVerification(userId: string, data: any): Promise<void> {
    // Implementation would process phone verification
    await this.db('phone_verifications')
      .where('user_id', userId)
      .update({
        status: VerificationStatus.VERIFIED,
        phone_number: data.phoneNumber || '',
        country_code: data.countryCode || '',
        verified_at: new Date(),
        updated_at: new Date()
      });
  }

  private async processEmailVerification(userId: string, data: any): Promise<void> {
    // Implementation would process email verification
    await this.db('email_verifications')
      .where('user_id', userId)
      .update({
        status: VerificationStatus.VERIFIED,
        email: data.email || '',
        verified_at: new Date(),
        updated_at: new Date()
      });
  }

  private async processBankAccountVerification(userId: string, data: any): Promise<void> {
    // Implementation would process bank account verification
    await this.db('bank_account_verifications')
      .where('user_id', userId)
      .update({
        status: VerificationStatus.VERIFIED,
        bank_account: JSON.stringify(data.bankAccount || {}),
        confidence: 0.90,
        verified_at: new Date(),
        updated_at: new Date()
      });
  }

  private async getUserVerifications(userId: string): Promise<any> {
    const [identity, address, phone, email, bankAccount] = await Promise.all([
      this.db('identity_verifications').where('user_id', userId).first(),
      this.db('address_verifications').where('user_id', userId).first(),
      this.db('phone_verifications').where('user_id', userId).first(),
      this.db('email_verifications').where('user_id', userId).first(),
      this.db('bank_account_verifications').where('user_id', userId).first()
    ]);

    return {
      identity: identity ? this.mapIdentityVerification(identity) : undefined,
      address: address ? this.mapAddressVerification(address) : undefined,
      phone: phone ? this.mapPhoneVerification(phone) : undefined,
      email: email ? this.mapEmailVerification(email) : undefined,
      bankAccount: bankAccount ? this.mapBankAccountVerification(bankAccount) : undefined
    };
  }

  private mapIdentityVerification(data: any): IdentityVerification {
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      documents: JSON.parse(data.documents || '[]'),
      biometricData: JSON.parse(data.biometric_data || '{}'),
      socialMediaVerification: JSON.parse(data.social_media_verification || '{}'),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    };
  }

  private mapAddressVerification(data: any): AddressVerification {
    return {
      id: data.id,
      userId: data.user_id,
      address: JSON.parse(data.address || '{}'),
      verificationMethods: JSON.parse(data.verification_methods || '{}'),
      status: data.status,
      confidence: data.confidence,
      documents: JSON.parse(data.documents || '[]'),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verifiedAt: data.verified_at
    };
  }

  private mapPhoneVerification(data: any): PhoneVerification {
    return {
      id: data.id,
      userId: data.user_id,
      phoneNumber: data.phone_number,
      countryCode: data.country_code,
      verificationMethods: JSON.parse(data.verification_methods || '{}'),
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verifiedAt: data.verified_at
    };
  }

  private mapEmailVerification(data: any): EmailVerification {
    return {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      verificationMethods: JSON.parse(data.verification_methods || '{}'),
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verifiedAt: data.verified_at
    };
  }

  private mapBankAccountVerification(data: any): BankAccountVerification {
    return {
      id: data.id,
      userId: data.user_id,
      bankAccount: JSON.parse(data.bank_account || '{}'),
      verificationMethods: JSON.parse(data.verification_methods || '{}'),
      status: data.status,
      confidence: data.confidence,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      verifiedAt: data.verified_at
    };
  }

  private async getVerificationSession(sessionId: string): Promise<ServiceResponse<VerificationSession>> {
    try {
      const result = await this.db('verification_sessions')
        .where('id', sessionId)
        .first();

      if (!result) {
        return { success: false, error: 'Verification session not found' };
      }

      const session: VerificationSession = {
        id: result.id,
        userId: result.user_id,
        sessionToken: result.session_token,
        verificationTypes: JSON.parse(result.verification_types || '[]'),
        status: result.status,
        progress: JSON.parse(result.progress || '{}'),
        metadata: JSON.parse(result.metadata || '{}'),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        completedAt: result.completed_at,
        expiredAt: result.expired_at
      };

      return { success: true, data: session };
    } catch (error) {
      console.error('[VerificationService] Get verification session error:', error);
      return { success: false, error: 'Failed to get verification session' };
    }
  }

  private getNextSteps(verificationTypes: VerificationType[]): string[] {
    const steps = [];
    
    if (verificationTypes.includes(VerificationType.IDENTITY)) {
      steps.push('Upload government-issued ID');
      steps.push('Take a selfie for biometric verification');
    }
    
    if (verificationTypes.includes(VerificationType.ADDRESS)) {
      steps.push('Upload utility bill or bank statement');
    }
    
    if (verificationTypes.includes(VerificationType.PHONE)) {
      steps.push('Enter phone number and verify with SMS');
    }
    
    if (verificationTypes.includes(VerificationType.EMAIL)) {
      steps.push('Verify email address');
    }
    
    if (verificationTypes.includes(VerificationType.BANK_ACCOUNT)) {
      steps.push('Add bank account for verification');
    }
    
    return steps;
  }

  private getEstimatedTime(verificationTypes: VerificationType[]): number {
    let totalTime = 0;
    
    verificationTypes.forEach(type => {
      switch (type) {
        case VerificationType.IDENTITY:
          totalTime += 15; // 15 minutes
          break;
        case VerificationType.ADDRESS:
          totalTime += 10; // 10 minutes
          break;
        case VerificationType.PHONE:
          totalTime += 5; // 5 minutes
          break;
        case VerificationType.EMAIL:
          totalTime += 3; // 3 minutes
          break;
        case VerificationType.BANK_ACCOUNT:
          totalTime += 10; // 10 minutes
          break;
      }
    });
    
    return totalTime;
  }

  private async calculateIdentityScore(identity?: IdentityVerification): Promise<number> {
    if (!identity || identity.status !== VerificationStatus.VERIFIED) {
      return 0;
    }
    
    let score = 0;
    
    // Document quality
    if (identity.documents.length > 0) {
      score += 30;
    }
    
    // Biometric verification
    if (identity.biometricData.faceRecognition.confidence > 0.9) {
      score += 40;
    }
    
    // Social media verification
    if (identity.socialMediaVerification.linkedin?.verified) {
      score += 30;
    }
    
    return Math.min(score, 100);
  }

  private async calculateTransactionScore(userId: string): Promise<number> {
    // This would query actual transaction data
    // For now, return a mock score
    return 85;
  }

  private async calculateReviewScore(userId: string): Promise<number> {
    // This would query actual review data
    // For now, return a mock score
    return 80;
  }

  private async calculateSocialScore(identity?: IdentityVerification): Promise<number> {
    if (!identity) {
      return 0;
    }
    
    let score = 0;
    
    if (identity.socialMediaVerification.linkedin?.verified) {
      score += 50;
    }
    
    if (identity.socialMediaVerification.facebook?.verified) {
      score += 30;
    }
    
    if (identity.socialMediaVerification.google?.verified) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private async calculateResponseScore(userId: string): Promise<number> {
    // This would query actual response time data
    // For now, return a mock score
    return 75;
  }

  private getTrustScoreLevel(score: number): TrustScoreLevel {
    if (score >= 96) return TrustScoreLevel.EXCELLENT;
    if (score >= 81) return TrustScoreLevel.VERY_HIGH;
    if (score >= 61) return TrustScoreLevel.HIGH;
    if (score >= 31) return TrustScoreLevel.MEDIUM;
    return TrustScoreLevel.LOW;
  }

  private async calculateBadges(userId: string, score: number): Promise<TrustBadge[]> {
    const badges: TrustBadge[] = [];
    
    if (score >= 90) {
      badges.push({
        id: require('uuid').v4(),
        name: 'Trusted Member',
        description: 'High trust score with excellent verification',
        icon: 'shield-check',
        color: 'green',
        requirements: {
          minScore: 90,
          verificationTypes: [VerificationType.IDENTITY]
        },
        earnedAt: new Date()
      });
    }
    
    if (score >= 80) {
      badges.push({
        id: require('uuid').v4(),
        name: 'Verified User',
        description: 'Complete identity verification',
        icon: 'check-circle',
        color: 'blue',
        requirements: {
          minScore: 80,
          verificationTypes: [VerificationType.IDENTITY, VerificationType.PHONE]
        },
        earnedAt: new Date()
      });
    }
    
    return badges;
  }

  private async saveTrustScore(trustScore: TrustScore): Promise<void> {
    await this.db('trust_scores')
      .insert({
        id: trustScore.id,
        user_id: trustScore.userId,
        overall_score: trustScore.overallScore,
        level: trustScore.level,
        breakdown: JSON.stringify(trustScore.breakdown),
        badges: JSON.stringify(trustScore.badges),
        created_at: trustScore.createdAt,
        updated_at: trustScore.updatedAt
      })
      .onConflict('user_id')
      .merge({
        overall_score: trustScore.overallScore,
        level: trustScore.level,
        breakdown: JSON.stringify(trustScore.breakdown),
        badges: JSON.stringify(trustScore.badges),
        updated_at: trustScore.updatedAt
      });
  }

  private getTrustScoreRecommendations(trustScore: TrustScore): string[] {
    const recommendations = [];
    
    if (trustScore.overallScore < 50) {
      recommendations.push('Complete identity verification to increase your trust score');
      recommendations.push('Add more verification methods like phone and email');
    }
    
    if (trustScore.overallScore < 70) {
      recommendations.push('Connect your social media accounts for additional verification');
      recommendations.push('Complete more transactions to build your transaction history');
    }
    
    if (trustScore.overallScore < 90) {
      recommendations.push('Maintain high response rates to improve your score');
      recommendations.push('Keep your profile information up to date');
    }
    
    return recommendations;
  }

  private determineOverallStatus(verifications: any): VerificationStatus {
    const statuses = Object.values(verifications)
      .filter((v): v is { status: VerificationStatus } => v !== undefined && v !== null && typeof v === 'object' && 'status' in v)
      .map(v => v.status);
    
    if (statuses.length === 0) {
      return VerificationStatus.PENDING;
    }
    
    if (statuses.every(s => s === VerificationStatus.VERIFIED)) {
      return VerificationStatus.VERIFIED;
    }
    
    if (statuses.some(s => s === VerificationStatus.REJECTED)) {
      return VerificationStatus.REJECTED;
    }
    
    return VerificationStatus.IN_PROGRESS;
  }
}

export default new VerificationService();
