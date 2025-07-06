/**
 * Insurance Service
 * Business logic for insurance policies and claims management
 */

import { Knex } from 'knex';
import {
  InsurancePolicy,
  InsuranceClaim,
  CreateInsurancePolicyRequest,
  UpdateInsurancePolicyRequest,
  CreateInsuranceClaimRequest,
  UpdateInsuranceClaimRequest,
  InsurancePolicyFilters,
  InsuranceClaimFilters,
  InsuranceAnalytics,
  AIFraudAssessment,
  AIDamageAssessment,
  InsurancePolicyError,
  InsuranceClaimError,
  InsurancePolicyStatus,
  InsuranceClaimStatus
} from '../types/insurance.types';
import { InsurancePolicyRepository } from '../repositories/InsurancePolicyRepository.knex';
import { InsuranceClaimRepository } from '../repositories/InsuranceClaimRepository.knex';

export class InsuranceService {
  private policyRepo: InsurancePolicyRepository;
  private claimRepo: InsuranceClaimRepository;

  constructor(private db: Knex) {
    this.policyRepo = new InsurancePolicyRepository(db);
    this.claimRepo = new InsuranceClaimRepository(db);
  }

  // ==================== INSURANCE POLICIES ====================

  /**
   * Create a new insurance policy
   */
  async createPolicy(data: CreateInsurancePolicyRequest): Promise<InsurancePolicy> {
    // Validate policy data
    await this.validatePolicyData(data);

    // Check if booking already has active policies of this type
    const existingPolicies = await this.policyRepo.findByBookingId(data.bookingId);
    const conflictingPolicy = existingPolicies.find(
      policy => policy.insuranceType === data.insuranceType && 
                policy.status === InsurancePolicyStatus.ACTIVE
    );

    if (conflictingPolicy) {
      throw new InsurancePolicyError(
        'An active policy of this type already exists for this booking',
        'DUPLICATE_POLICY',
        409
      );
    }

    return await this.policyRepo.create(data);
  }

  /**
   * Get insurance policy by ID
   */
  async getPolicyById(id: string): Promise<InsurancePolicy> {
    const policy = await this.policyRepo.findById(id);
    if (!policy) {
      throw new InsurancePolicyError('Insurance policy not found', 'NOT_FOUND', 404);
    }
    return policy;
  }

  /**
   * Get insurance policies with filters
   */
  async getPolicies(
    filters: InsurancePolicyFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ policies: InsurancePolicy[]; total: number; page: number; totalPages: number }> {
    const result = await this.policyRepo.findMany(filters, page, limit);
    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Get policies by booking ID
   */
  async getPoliciesByBookingId(bookingId: string): Promise<InsurancePolicy[]> {
    return await this.policyRepo.findByBookingId(bookingId);
  }

  /**
   * Update insurance policy
   */
  async updatePolicy(id: string, data: UpdateInsurancePolicyRequest): Promise<InsurancePolicy> {
    // Validate update data
    if (data.validFrom && data.validUntil && data.validFrom >= data.validUntil) {
      throw new InsurancePolicyError(
        'Valid from date must be before valid until date',
        'INVALID_DATE_RANGE',
        400
      );
    }

    return await this.policyRepo.update(id, data);
  }

  /**
   * Cancel insurance policy
   */
  async cancelPolicy(id: string, _reason?: string): Promise<InsurancePolicy> {
    const policy = await this.getPolicyById(id);
    
    if (policy.status !== InsurancePolicyStatus.ACTIVE) {
      throw new InsurancePolicyError(
        'Only active policies can be cancelled',
        'INVALID_STATUS',
        400
      );
    }

    // Check for pending claims
    const pendingClaims = await this.claimRepo.findByPolicyId(id);
    const hasPendingClaims = pendingClaims.some(
      claim => [InsuranceClaimStatus.SUBMITTED, InsuranceClaimStatus.INVESTIGATING].includes(claim.status)
    );

    if (hasPendingClaims) {
      throw new InsurancePolicyError(
        'Cannot cancel policy with pending claims',
        'PENDING_CLAIMS',
        400
      );
    }

    return await this.policyRepo.update(id, { 
      status: InsurancePolicyStatus.CANCELLED 
    });
  }

  // ==================== INSURANCE CLAIMS ====================

  /**
   * Create a new insurance claim
   */
  async createClaim(data: CreateInsuranceClaimRequest): Promise<InsuranceClaim> {
    // Validate claim data
    await this.validateClaimData(data);

    // Check if policy is valid for the incident date
    const isValidPolicy = await this.policyRepo.isValidOnDate(data.policyId, data.incidentDate);
    if (!isValidPolicy) {
      throw new InsuranceClaimError(
        'Policy is not valid for the incident date',
        'INVALID_POLICY',
        400
      );
    }

    const claim = await this.claimRepo.create(data);

    // Trigger AI assessment asynchronously
    this.triggerAIAssessment(claim.id).catch(error => {
      console.error('Failed to trigger AI assessment:', error);
    });

    return claim;
  }

  /**
   * Get insurance claim by ID
   */
  async getClaimById(id: string): Promise<InsuranceClaim> {
    const claim = await this.claimRepo.findById(id);
    if (!claim) {
      throw new InsuranceClaimError('Insurance claim not found', 'NOT_FOUND', 404);
    }
    return claim;
  }

  /**
   * Get insurance claims with filters
   */
  async getClaims(
    filters: InsuranceClaimFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ claims: InsuranceClaim[]; total: number; page: number; totalPages: number }> {
    const result = await this.claimRepo.findMany(filters, page, limit);
    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Get claims by claimant ID
   */
  async getClaimsByClaimantId(claimantId: string): Promise<InsuranceClaim[]> {
    return await this.claimRepo.findByClaimantId(claimantId);
  }

  /**
   * Update insurance claim
   */
  async updateClaim(id: string, data: UpdateInsuranceClaimRequest): Promise<InsuranceClaim> {
    const existingClaim = await this.getClaimById(id);

    // Business logic validations
    if (data.status === InsuranceClaimStatus.APPROVED && !data.approvedAmount) {
      throw new InsuranceClaimError(
        'Approved amount is required when approving a claim',
        'MISSING_APPROVED_AMOUNT',
        400
      );
    }

    if (data.approvedAmount && data.approvedAmount > existingClaim.claimAmount) {
      throw new InsuranceClaimError(
        'Approved amount cannot exceed claim amount',
        'INVALID_APPROVED_AMOUNT',
        400
      );
    }

    // Set resolved date for final statuses
    if (data.status && 
        [InsuranceClaimStatus.APPROVED, InsuranceClaimStatus.DENIED, InsuranceClaimStatus.PAID]
          .includes(data.status) && 
        !data.resolvedAt) {
      data.resolvedAt = new Date();
    }

    return await this.claimRepo.update(id, data);
  }

  /**
   * Process claim approval
   */
  async approveClaim(
    id: string, 
    approvedAmount: number, 
    processedBy: string, 
    notes?: string
  ): Promise<InsuranceClaim> {
    return await this.updateClaim(id, {
      status: InsuranceClaimStatus.APPROVED,
      approvedAmount,
      processedBy,
      processingNotes: notes,
      resolvedAt: new Date()
    });
  }

  /**
   * Process claim denial
   */
  async denyClaim(
    id: string, 
    processedBy: string, 
    reason: string
  ): Promise<InsuranceClaim> {
    return await this.updateClaim(id, {
      status: InsuranceClaimStatus.DENIED,
      processedBy,
      processingNotes: reason,
      resolvedAt: new Date()
    });
  }

  /**
   * Mark claim as paid
   */
  async markClaimAsPaid(id: string): Promise<InsuranceClaim> {
    const claim = await this.getClaimById(id);
    
    if (claim.status !== InsuranceClaimStatus.APPROVED) {
      throw new InsuranceClaimError(
        'Only approved claims can be marked as paid',
        'INVALID_STATUS',
        400
      );
    }

    return await this.updateClaim(id, {
      status: InsuranceClaimStatus.PAID
    });
  }

  // ==================== AI ASSESSMENT ====================

  /**
   * Trigger AI fraud and damage assessment for a claim
   */
  private async triggerAIAssessment(claimId: string): Promise<void> {
    try {
      const claim = await this.getClaimById(claimId);
      
      // Simulate AI fraud assessment
      const fraudAssessment = await this.performFraudAssessment(claim);
      
      // Simulate AI damage assessment
      const damageAssessment = await this.performDamageAssessment(claim);
      
      // Update claim with AI results
      await this.claimRepo.update(claimId, {
        aiFraudScore: fraudAssessment.fraudScore,
        aiDamageAssessment: damageAssessment
      });

      // If high fraud risk, mark for investigation
      if (fraudAssessment.fraudScore > 0.7) {
        await this.claimRepo.update(claimId, {
          status: InsuranceClaimStatus.INVESTIGATING,
          processingNotes: `High fraud risk detected (${fraudAssessment.fraudScore}). Flagged for manual review.`
        });
      }

    } catch (error) {
      console.error('AI assessment failed for claim:', claimId, error);
    }
  }

  /**
   * Perform AI fraud assessment (simulated)
   */
  private async performFraudAssessment(claim: InsuranceClaim): Promise<AIFraudAssessment> {
    // Simulate AI fraud detection logic
    let fraudScore = Math.random() * 0.3; // Base random score 0-0.3

    // Risk factors that increase fraud score
    const riskFactors: string[] = [];

    // High claim amount relative to typical claims
    if (claim.claimAmount > 10000) {
      fraudScore += 0.2;
      riskFactors.push('High claim amount');
    }

    // Incident very recent to policy start
    const daysSincePolicyStart = Math.floor((claim.incidentDate.getTime() - claim.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePolicyStart < 7) {
      fraudScore += 0.3;
      riskFactors.push('Incident occurred shortly after policy creation');
    }

    // Weekend incident (higher fraud risk)
    const isWeekend = [0, 6].includes(claim.incidentDate.getDay());
    if (isWeekend) {
      fraudScore += 0.1;
      riskFactors.push('Incident occurred on weekend');
    }

    // No damage photos provided
    if (!claim.damagePhotos || claim.damagePhotos.length === 0) {
      fraudScore += 0.2;
      riskFactors.push('No damage photos provided');
    }

    // Cap fraud score at 1.0
    fraudScore = Math.min(fraudScore, 1.0);

    const riskLevel: 'low' | 'medium' | 'high' = 
      fraudScore < 0.3 ? 'low' : 
      fraudScore < 0.7 ? 'medium' : 'high';

    return {
      fraudScore,
      riskLevel,
      riskFactors,
      recommendations: riskLevel === 'high' ? 
        ['Manual review required', 'Verify documentation', 'Contact claimant'] :
        ['Standard processing'],
      confidence: 0.8 + Math.random() * 0.2 // 0.8-1.0
    };
  }

  /**
   * Perform AI damage assessment (simulated)
   */
  private async performDamageAssessment(claim: InsuranceClaim): Promise<AIDamageAssessment> {
    // Simulate damage assessment based on claim description and amount
    const description = claim.incidentDescription.toLowerCase();
    
    let estimatedCost = claim.claimAmount * (0.8 + Math.random() * 0.4); // ±20% of claimed
    let damageCategory = 'General damage';
    let severityLevel: 'minor' | 'moderate' | 'severe' | 'total' = 'moderate';

    // Categorize based on description keywords
    if (description.includes('total') || description.includes('destroyed')) {
      severityLevel = 'total';
      damageCategory = 'Total loss';
      estimatedCost = claim.claimAmount;
    } else if (description.includes('theft') || description.includes('stolen')) {
      damageCategory = 'Theft';
      severityLevel = 'total';
    } else if (description.includes('medical') || description.includes('injury')) {
      damageCategory = 'Medical';
      severityLevel = 'moderate';
    } else if (description.includes('baggage') || description.includes('luggage')) {
      damageCategory = 'Baggage damage';
      severityLevel = 'minor';
      estimatedCost = Math.min(estimatedCost, 2000); // Cap baggage claims
    }

    return {
      estimatedCost: Math.round(estimatedCost),
      damageCategory,
      severityLevel,
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
      detectedItems: ['Item analysis pending'],
      recommendations: [
        severityLevel === 'total' ? 'Request additional documentation' : 'Standard verification'
      ]
    };
  }

  // ==================== ANALYTICS ====================

  /**
   * Get comprehensive insurance analytics
   */
  async getInsuranceAnalytics(dateRange?: { from: Date; to: Date }): Promise<InsuranceAnalytics> {
    const policyQuery = this.db('insurance_policies');
    const claimQuery = this.db('insurance_claims');

    if (dateRange) {
      policyQuery.whereBetween('created_at', [dateRange.from, dateRange.to]);
      claimQuery.whereBetween('created_at', [dateRange.from, dateRange.to]);
    }

    // Policy statistics
    const policyStats = await policyQuery
      .select('status')
      .count('* as count')
      .groupBy('status');

    const totalPolicies = policyStats.reduce((sum, stat) => sum + parseInt(stat.count as string), 0);
    const activePolicies = policyStats.find(s => s.status === 'active')?.count || 0;
    const expiredPolicies = policyStats.find(s => s.status === 'expired')?.count || 0;
    const claimedPolicies = policyStats.find(s => s.status === 'claimed')?.count || 0;
    const cancelledPolicies = policyStats.find(s => s.status === 'cancelled')?.count || 0;

    // Claim statistics
    const claimStats = await claimQuery
      .select('status')
      .count('* as count')
      .sum('claim_amount as total_amount')
      .sum('approved_amount as total_approved')
      .groupBy('status');

    const totalClaims = claimStats.reduce((sum, stat) => sum + parseInt(stat.count as string), 0);
    const submittedClaims = claimStats.find(s => s.status === 'submitted')?.count || 0;
    const investigatingClaims = claimStats.find(s => s.status === 'investigating')?.count || 0;
    const approvedClaims = claimStats.find(s => s.status === 'approved')?.count || 0;
    const deniedClaims = claimStats.find(s => s.status === 'denied')?.count || 0;
    const paidClaims = claimStats.find(s => s.status === 'paid')?.count || 0;

    const totalClaimAmount = claimStats.reduce((sum, stat) => sum + parseFloat(stat.total_amount || 0), 0);
    const totalApprovedAmount = claimStats.reduce((sum, stat) => sum + parseFloat(stat.total_approved || 0), 0);

    // Processing time analysis
    const processingTimes = await this.db('insurance_claims')
      .whereNotNull('resolved_at')
      .select(
        this.db.raw('AVG(EXTRACT(DAY FROM (resolved_at - created_at))) as avg_days')
      )
      .first();

    // Fraud detection metrics
    const fraudMetrics = await this.db('insurance_claims')
      .whereNotNull('ai_fraud_score')
      .select(
        this.db.raw('COUNT(*) as total_assessments'),
        this.db.raw('COUNT(CASE WHEN ai_fraud_score > 0.7 THEN 1 END) as high_risk_claims'),
        this.db.raw('AVG(ai_fraud_score) as avg_fraud_score')
      )
      .first();

    return {
      totalPolicies: parseInt(totalPolicies as any),
      activePolicies: parseInt(activePolicies as any),
      expiredPolicies: parseInt(expiredPolicies as any),
      claimedPolicies: parseInt(claimedPolicies as any),
      cancelledPolicies: parseInt(cancelledPolicies as any),

      totalClaims: parseInt(totalClaims as any),
      submittedClaims: parseInt(submittedClaims as any),
      investigatingClaims: parseInt(investigatingClaims as any),
      approvedClaims: parseInt(approvedClaims as any),
      deniedClaims: parseInt(deniedClaims as any),
      paidClaims: parseInt(paidClaims as any),

      totalClaimAmount,
      totalApprovedAmount,
      averageClaimAmount: totalClaims > 0 ? totalClaimAmount / totalClaims : 0,
      averageApprovedAmount: (parseInt(approvedClaims as any) + parseInt(paidClaims as any)) > 0 ? 
        totalApprovedAmount / (parseInt(approvedClaims as any) + parseInt(paidClaims as any)) : 0,

      claimApprovalRate: totalClaims > 0 ? 
        (parseInt(approvedClaims as any) + parseInt(paidClaims as any)) / totalClaims : 0,
      averageProcessingDays: parseFloat(processingTimes?.avg_days || 0),

      fraudDetectionMetrics: {
        totalAssessments: parseInt(fraudMetrics?.total_assessments || 0),
        highRiskClaims: parseInt(fraudMetrics?.high_risk_claims || 0),
        averageFraudScore: parseFloat(fraudMetrics?.avg_fraud_score || 0)
      }
    };
  }

  // ==================== VALIDATION ====================

  /**
   * Validate policy creation data
   */
  private async validatePolicyData(data: CreateInsurancePolicyRequest): Promise<void> {
    if (data.coverageAmount <= 0) {
      throw new InsurancePolicyError('Coverage amount must be positive', 'INVALID_COVERAGE', 400);
    }

    if (data.premiumAmount <= 0) {
      throw new InsurancePolicyError('Premium amount must be positive', 'INVALID_PREMIUM', 400);
    }

    if (data.validFrom >= data.validUntil) {
      throw new InsurancePolicyError('Valid from date must be before valid until date', 'INVALID_DATE_RANGE', 400);
    }

    // Verify booking exists (you might want to add this check)
    // const booking = await this.bookingRepo.findById(data.bookingId);
    // if (!booking) {
    //   throw new InsurancePolicyError('Booking not found', 'BOOKING_NOT_FOUND', 404);
    // }
  }

  /**
   * Validate claim creation data
   */
  private async validateClaimData(data: CreateInsuranceClaimRequest): Promise<void> {
    if (data.claimAmount <= 0) {
      throw new InsuranceClaimError('Claim amount must be positive', 'INVALID_AMOUNT', 400);
    }

    if (data.incidentDate > new Date()) {
      throw new InsuranceClaimError('Incident date cannot be in the future', 'INVALID_DATE', 400);
    }

    if (!data.incidentDescription || data.incidentDescription.trim().length < 10) {
      throw new InsuranceClaimError('Incident description must be at least 10 characters', 'INVALID_DESCRIPTION', 400);
    }

    // Verify policy exists and is active
    const policy = await this.policyRepo.findById(data.policyId);
    if (!policy) {
      throw new InsuranceClaimError('Insurance policy not found', 'POLICY_NOT_FOUND', 404);
    }
  }
}
