import { getDatabase } from '@/config/database';
import { ServiceResponse } from '@/types';
import {
  ProductRiskProfile,
  RiskAssessment,
  ComplianceCheck,
  PolicyViolation,
  RiskManagementConfig,
  CreateRiskProfileRequest,
  UpdateRiskProfileRequest,
  RiskAssessmentRequest,
  ComplianceCheckRequest,
  PolicyViolationRequest,
  RiskLevel,
  ComplianceStatus,
  EnforcementAction,
  RiskManagementStats
} from '@/types/riskManagement.types';

export class RiskManagementService {
  private db = getDatabase();

  /**
   * Map risk level to valid enforcement level
   */
  private mapRiskLevelToEnforcementLevel(riskLevel: string): string {
    const mapping = {
      'low': 'lenient',
      'medium': 'moderate', 
      'high': 'strict',
      'critical': 'very_strict'
    };
    
    return mapping[riskLevel.toLowerCase()] || 'moderate';
  }

  // =====================================================
  // RISK PROFILE MANAGEMENT
  // =====================================================

  /**
   * Create a new risk profile for a product
   */
  async createRiskProfile(data: CreateRiskProfileRequest): Promise<ServiceResponse<ProductRiskProfile>> {
    try {
      // Validate that the category exists
      const category = await this.db('categories')
        .where('id', data.categoryId)
        .first();
      
      if (!category) {
        return { 
          success: false, 
          error: `Category with ID ${data.categoryId} does not exist` 
        };
      }

      // Validate that the product exists
      const product = await this.db('products')
        .where('id', data.productId)
        .first();
      
      if (!product) {
        return { 
          success: false, 
          error: `Product with ID ${data.productId} does not exist` 
        };
      }

      // Check if risk profile already exists for this product
      const existingProfile = await this.db('product_risk_profiles')
        .where('product_id', data.productId)
        .first();
      
      if (existingProfile) {
        return { 
          success: false, 
          error: `Risk profile already exists for product ${data.productId}` 
        };
      }

      // Transform the data to match the expected structure
      const transformedData = {
        mandatoryInsurance: Array.isArray(data.mandatoryRequirements) ? true : data.mandatoryRequirements?.insurance || false,
        mandatoryInspection: Array.isArray(data.mandatoryRequirements) ? true : data.mandatoryRequirements?.inspection || false,
        minCoverage: Array.isArray(data.mandatoryRequirements) ? 10000 : data.mandatoryRequirements?.minCoverage || 10000,
        inspectionTypes: Array.isArray(data.mandatoryRequirements) ? ['pre_rental'] : data.mandatoryRequirements?.inspectionTypes || ['pre_rental'],
        complianceDeadlineHours: Array.isArray(data.mandatoryRequirements) ? 72 : data.mandatoryRequirements?.complianceDeadlineHours || 72,
        riskFactors: Array.isArray(data.riskFactors) ? { factors: data.riskFactors.map(rf => rf.name || rf) } : data.riskFactors || {},
        mitigationStrategies: data.mitigationStrategies || {},
        enforcementLevel: this.mapRiskLevelToEnforcementLevel(data.riskLevel),
        autoEnforcement: data.autoEnforcement !== undefined ? data.autoEnforcement : true,
        gracePeriodHours: data.gracePeriodHours || 24
      };

      const riskProfile: ProductRiskProfile = {
        id: require('uuid').v4(),
        productId: data.productId,
        categoryId: data.categoryId,
        riskLevel: data.riskLevel,
        mandatoryRequirements: {
          insurance: transformedData.mandatoryInsurance,
          inspection: transformedData.mandatoryInspection,
          minCoverage: transformedData.minCoverage,
          inspectionTypes: transformedData.inspectionTypes,
          complianceDeadlineHours: transformedData.complianceDeadlineHours
        },
        riskFactors: transformedData.riskFactors,
        mitigationStrategies: transformedData.mitigationStrategies,
        enforcementLevel: transformedData.enforcementLevel,
        autoEnforcement: transformedData.autoEnforcement,
        gracePeriodHours: transformedData.gracePeriodHours,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertData = {
        id: riskProfile.id,
        product_id: riskProfile.productId,
        category_id: riskProfile.categoryId,
        risk_level: riskProfile.riskLevel,
        mandatory_insurance: riskProfile.mandatoryRequirements.insurance,
        mandatory_inspection: riskProfile.mandatoryRequirements.inspection,
        min_coverage: riskProfile.mandatoryRequirements.minCoverage,
        inspection_types: JSON.stringify(riskProfile.mandatoryRequirements.inspectionTypes),
        compliance_deadline_hours: riskProfile.mandatoryRequirements.complianceDeadlineHours,
        risk_factors: JSON.stringify(riskProfile.riskFactors),
        mitigation_strategies: JSON.stringify(riskProfile.mitigationStrategies),
        enforcement_level: riskProfile.enforcementLevel,
        auto_enforcement: riskProfile.autoEnforcement,
        grace_period_hours: riskProfile.gracePeriodHours,
        created_at: riskProfile.createdAt,
        updated_at: riskProfile.updatedAt
      };

      await this.db('product_risk_profiles').insert(insertData);

      return { success: true, data: riskProfile };
    } catch (error) {
      console.error('[RiskManagementService] Create risk profile error:', error);
      return { success: false, error: 'Failed to create risk profile' };
    }
  }

  /**
   * Get risk profile by product ID
   */
  async getRiskProfileByProduct(productId: string): Promise<ServiceResponse<ProductRiskProfile>> {
    try {
      const result = await this.db('product_risk_profiles')
        .where('product_id', productId)
        .first();

      if (!result) {
        return { success: false, error: 'Risk profile not found' };
      }

      const riskProfile: ProductRiskProfile = {
        id: result.id,
        productId: result.product_id,
        categoryId: result.category_id,
        riskLevel: result.risk_level,
        mandatoryRequirements: {
          insurance: result.mandatory_insurance,
          inspection: result.mandatory_inspection,
          minCoverage: result.min_coverage,
          inspectionTypes: JSON.parse(result.inspection_types || '[]'),
          complianceDeadlineHours: result.compliance_deadline_hours
        },
        riskFactors: JSON.parse(result.risk_factors || '[]'),
        mitigationStrategies: JSON.parse(result.mitigation_strategies || '[]'),
        enforcementLevel: result.enforcement_level,
        autoEnforcement: result.auto_enforcement,
        gracePeriodHours: result.grace_period_hours,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return { success: true, data: riskProfile };
    } catch (error) {
      console.error('[RiskManagementService] Get risk profile error:', error);
      return { success: false, error: 'Failed to get risk profile' };
    }
  }

  /**
   * Get all risk profiles with pagination and filtering
   */
  async getRiskProfiles(filters: any): Promise<ServiceResponse<any>> {
    try {
      const { page = 1, limit = 20, riskLevel, categoryId, search } = filters;
      const offset = (page - 1) * limit;

      let query = this.db('product_risk_profiles as prp')
        .leftJoin('products as p', 'prp.product_id', 'p.id')
        .leftJoin('categories as c', 'prp.category_id', 'c.id')
        .select(
          'prp.id',
          'prp.product_id',
          'prp.category_id',
          'prp.risk_level',
          'prp.mandatory_insurance',
          'prp.mandatory_inspection',
          'prp.min_coverage',
          'prp.inspection_types',
          'prp.compliance_deadline_hours',
          'prp.risk_factors',
          'prp.mitigation_strategies',
          'prp.enforcement_level',
          'prp.auto_enforcement',
          'prp.grace_period_hours',
          'prp.created_at',
          'prp.updated_at',
          'p.title as product_name',
          'p.description as product_description',
          'c.name as category_name'
        );

      // Apply filters
      if (riskLevel) {
        query = query.where('prp.risk_level', riskLevel);
      }

      if (categoryId) {
        query = query.where('prp.category_id', categoryId);
      }

      if (search) {
        query = query.where(function() {
          this.where('p.title', 'ilike', `%${search}%`)
            .orWhere('p.description', 'ilike', `%${search}%`)
            .orWhere('c.name', 'ilike', `%${search}%`);
        });
      }

      // Get total count (separate query to avoid GROUP BY conflict)
      const countQuery = this.db('product_risk_profiles as prp')
        .leftJoin('products as p', 'prp.product_id', 'p.id')
        .leftJoin('categories as c', 'prp.category_id', 'c.id');

      // Apply same filters to count query
      if (riskLevel) {
        countQuery.where('prp.risk_level', riskLevel);
      }

      if (categoryId) {
        countQuery.where('prp.category_id', categoryId);
      }

      if (search) {
        countQuery.where(function() {
          this.where('p.title', 'ilike', `%${search}%`)
            .orWhere('p.description', 'ilike', `%${search}%`)
            .orWhere('c.name', 'ilike', `%${search}%`);
        });
      }

      const countResult = await countQuery.count('* as total').first();
      const total = parseInt(countResult?.total as string || '0');

      // Get paginated results
      const profiles = await query
        .orderBy('prp.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Transform the results with safe JSON parsing
      const transformedProfiles = profiles.map(profile => {
        // Safe JSON parsing with fallback
        let inspectionTypes = {};
        let riskFactors = {};
        let mitigationStrategies = {};
        
        try {
          inspectionTypes = profile.inspection_types 
            ? JSON.parse(profile.inspection_types) 
            : {};
        } catch (error) {
          console.warn(`[RiskManagementService] Invalid inspection_types JSON for profile ${profile.id}:`, profile.inspection_types);
          // Handle different data types
          if (Array.isArray(profile.inspection_types)) {
            // Already an array
            inspectionTypes = { types: profile.inspection_types };
          } else if (typeof profile.inspection_types === 'string') {
            // Plain text, convert to array
            inspectionTypes = { types: profile.inspection_types.split(',') };
          } else {
            // Fallback
            inspectionTypes = {};
          }
        }
        
        try {
          riskFactors = profile.risk_factors 
            ? JSON.parse(profile.risk_factors) 
            : {};
        } catch (error) {
          console.warn(`[RiskManagementService] Invalid risk_factors JSON for profile ${profile.id}:`, profile.risk_factors);
          // Handle different data types
          if (Array.isArray(profile.risk_factors)) {
            // Already an array
            riskFactors = { factors: profile.risk_factors };
          } else if (typeof profile.risk_factors === 'string') {
            // Plain text, convert to array
            riskFactors = { factors: profile.risk_factors.split(',') };
          } else {
            // Fallback
            riskFactors = {};
          }
        }
        
        try {
          mitigationStrategies = profile.mitigation_strategies 
            ? JSON.parse(profile.mitigation_strategies) 
            : {};
        } catch (error) {
          console.warn(`[RiskManagementService] Invalid mitigation_strategies JSON for profile ${profile.id}:`, profile.mitigation_strategies);
          mitigationStrategies = {};
        }

        return {
          id: profile.id,
          productId: profile.product_id,
          categoryId: profile.category_id,
          riskLevel: profile.risk_level,
          mandatoryInsurance: profile.mandatory_insurance,
          mandatoryInspection: profile.mandatory_inspection,
          minCoverage: profile.min_coverage,
          inspectionTypes,
          complianceDeadlineHours: profile.compliance_deadline_hours,
          riskFactors,
          mitigationStrategies,
          enforcementLevel: profile.enforcement_level,
          autoEnforcement: profile.auto_enforcement,
          gracePeriodHours: profile.grace_period_hours,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          productName: profile.product_name,
          productDescription: profile.product_description,
          categoryName: profile.category_name
        };
      });

      const totalPages = Math.ceil(total / limit);

      const result = {
        profiles: transformedProfiles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('[RiskManagementService] Get risk profiles error:', error);
      return { success: false, error: 'Failed to get risk profiles' };
    }
  }

  // =====================================================
  // RISK ASSESSMENT
  // =====================================================

  /**
   * Perform comprehensive risk assessment
   */
  async assessRisk(request: RiskAssessmentRequest): Promise<ServiceResponse<RiskAssessment>> {
    try {
      const { productId, renterId, bookingId, includeRecommendations = true } = request;

      // Get product and renter data
      const [product, renter, riskProfile] = await Promise.all([
        this.db('products').where('id', productId).first(),
        this.db('users').where('id', renterId).first(),
        this.getRiskProfileByProduct(productId)
      ]);

      if (!product || !renter) {
        return { success: false, error: 'Product or renter not found' };
      }

      // Calculate risk scores
      const productRisk = await this.calculateProductRisk(product, riskProfile.data);
      const renterRisk = await this.calculateRenterRisk(renter);
      const bookingRisk = await this.calculateBookingRisk(productId, renterId);
      const seasonalRisk = await this.calculateSeasonalRisk(product);

      // Calculate overall risk score
      const overallRiskScore = Math.round(
        (productRisk * 0.4) + 
        (renterRisk * 0.3) + 
        (bookingRisk * 0.2) + 
        (seasonalRisk * 0.1)
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallRiskScore);

      // Generate recommendations
      const recommendations = includeRecommendations 
        ? await this.generateRecommendations(riskLevel, productRisk, renterRisk, bookingRisk)
        : [];

      // Determine mandatory requirements
      const mandatoryRequirements = this.determineMandatoryRequirements(riskLevel, riskProfile.data);

      const assessment: RiskAssessment = {
        productId,
        renterId,
        bookingId: bookingId || '',
        overallRiskScore,
        riskFactors: {
          productRisk,
          renterRisk,
          bookingRisk,
          seasonalRisk
        },
        recommendations,
        mandatoryRequirements,
        complianceStatus: ComplianceStatus.PENDING,
        assessmentDate: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      return { success: true, data: assessment };
    } catch (error) {
      console.error('[RiskManagementService] Risk assessment error:', error);
      return { success: false, error: 'Failed to assess risk' };
    }
  }

  // =====================================================
  // COMPLIANCE CHECKING
  // =====================================================

  /**
   * Check compliance for a booking
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ServiceResponse<ComplianceCheck>> {
    try {
      const { bookingId, productId, renterId, forceCheck = false } = request;

      // Get booking and risk profile
      const [booking, riskProfile] = await Promise.all([
        this.db('bookings').where('id', bookingId).first(),
        this.getRiskProfileByProduct(productId)
      ]);

      if (!booking || !riskProfile.success) {
        return { success: false, error: 'Booking or risk profile not found' };
      }

      const profile = riskProfile.data!;
      const missingRequirements: string[] = [];
      const enforcementActions: EnforcementAction[] = [];

      // Check insurance compliance
      if (profile.mandatoryRequirements.insurance) {
        const hasInsurance = await this.checkInsuranceCompliance(bookingId);
        if (!hasInsurance) {
          missingRequirements.push('MISSING_INSURANCE');
          enforcementActions.push({
            id: require('uuid').v4(),
            type: 'REQUIRE_INSURANCE',
            severity: 'HIGH',
            message: 'Insurance is mandatory for this product',
            requiredAction: 'Purchase insurance coverage',
            deadline: new Date(Date.now() + profile.complianceDeadlineHours * 60 * 60 * 1000),
            status: 'PENDING'
          });
        }
      }

      // Check inspection compliance
      if (profile.mandatoryRequirements.inspection) {
        const hasInspection = await this.checkInspectionCompliance(bookingId);
        if (!hasInspection) {
          missingRequirements.push('MISSING_INSPECTION');
          enforcementActions.push({
            id: require('uuid').v4(),
            type: 'REQUIRE_INSPECTION',
            severity: 'HIGH',
            message: 'Inspection is mandatory for this product',
            requiredAction: 'Schedule and complete inspection',
            deadline: new Date(Date.now() + profile.complianceDeadlineHours * 60 * 60 * 1000),
            status: 'PENDING'
          });
        }
      }

      // Determine compliance status
      const isCompliant = missingRequirements.length === 0;
      const complianceStatus = isCompliant 
        ? ComplianceStatus.COMPLIANT 
        : ComplianceStatus.NON_COMPLIANT;

      // Calculate compliance score
      const complianceScore = isCompliant ? 100 : Math.max(0, 100 - (missingRequirements.length * 25));

      const complianceCheck: ComplianceCheck = {
        bookingId,
        productId,
        renterId,
        isCompliant,
        missingRequirements,
        complianceScore,
        status: complianceStatus,
        enforcementActions,
        lastCheckedAt: new Date()
      };

      return { success: true, data: complianceCheck };
    } catch (error) {
      console.error('[RiskManagementService] Compliance check error:', error);
      return { success: false, error: 'Failed to check compliance' };
    }
  }

  // =====================================================
  // POLICY VIOLATION MANAGEMENT
  // =====================================================

  /**
   * Record a policy violation
   */
  async recordViolation(request: PolicyViolationRequest): Promise<ServiceResponse<PolicyViolation>> {
    try {
      const violation: PolicyViolation = {
        id: require('uuid').v4(),
        bookingId: request.bookingId,
        productId: request.productId,
        renterId: request.renterId,
        violationType: request.violationType as any,
        severity: request.severity as any,
        description: request.description,
        detectedAt: new Date(),
        resolutionActions: [],
        penaltyAmount: request.penaltyAmount,
        status: 'ACTIVE'
      };

      await this.db('policy_violations').insert({
        id: violation.id,
        booking_id: violation.bookingId,
        product_id: violation.productId,
        renter_id: violation.renterId,
        violation_type: violation.violationType,
        severity: violation.severity,
        description: violation.description,
        detected_at: violation.detectedAt,
        resolution_actions: JSON.stringify(violation.resolutionActions),
        penalty_amount: violation.penaltyAmount,
        status: violation.status
      });

      return { success: true, data: violation };
    } catch (error) {
      console.error('[RiskManagementService] Record violation error:', error);
      return { success: false, error: 'Failed to record violation' };
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async calculateProductRisk(product: any, riskProfile?: ProductRiskProfile): Promise<number> {
    let score = 50; // Base score

    // Adjust based on product value
    if (product.price_per_day > 100) score += 20;
    if (product.price_per_day > 500) score += 30;

    // Adjust based on risk profile
    if (riskProfile) {
      switch (riskProfile.riskLevel) {
        case RiskLevel.LOW: score = Math.min(score, 30); break;
        case RiskLevel.MEDIUM: score = Math.min(score, 60); break;
        case RiskLevel.HIGH: score = Math.min(score, 80); break;
        case RiskLevel.CRITICAL: score = Math.min(score, 95); break;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateRenterRisk(renter: any): Promise<number> {
    let score = 30; // Base score for new users

    // Adjust based on user verification
    if (renter.is_verified) score -= 10;
    if (renter.kyc_status === 'verified') score -= 15;

    // Adjust based on user history (if available)
    const bookingCount = await this.db('bookings')
      .where('renter_id', renter.id)
      .count('* as count')
      .first();

    const count = parseInt(bookingCount?.count as string || '0');
    if (count > 10) score -= 10;
    if (count > 50) score -= 15;

    return Math.min(100, Math.max(0, score));
  }

  private async calculateBookingRisk(productId: string, renterId: string): Promise<number> {
    // Check for previous disputes
    const disputeCount = await this.db('inspection_disputes')
      .join('product_inspections', 'inspection_disputes.inspection_id', 'product_inspections.id')
      .where('product_inspections.product_id', productId)
      .count('* as count')
      .first();

    const disputes = parseInt(disputeCount?.count as string || '0');
    return Math.min(100, disputes * 20);
  }

  private async calculateSeasonalRisk(product: any): Promise<number> {
    // Simple seasonal risk calculation
    const month = new Date().getMonth();
    const isHighSeason = month >= 5 && month <= 8; // Summer months
    return isHighSeason ? 20 : 10;
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 85) return RiskLevel.CRITICAL;
    if (score >= 65) return RiskLevel.HIGH;
    if (score >= 35) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private async generateRecommendations(
    riskLevel: RiskLevel, 
    productRisk: number, 
    renterRisk: number, 
    bookingRisk: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      recommendations.push('Mandatory insurance coverage required');
      recommendations.push('Pre-rental inspection mandatory');
      recommendations.push('Consider additional security deposit');
    }

    if (renterRisk > 70) {
      recommendations.push('Enhanced user verification recommended');
      recommendations.push('Consider requiring references');
    }

    if (bookingRisk > 50) {
      recommendations.push('Monitor for potential disputes');
      recommendations.push('Consider mediation services');
    }

    return recommendations;
  }

  private determineMandatoryRequirements(riskLevel: RiskLevel, riskProfile?: ProductRiskProfile) {
    const requirements = {
      insurance: false,
      inspection: false,
      minCoverage: undefined as number | undefined,
      inspectionTypes: [] as string[]
    };

    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      requirements.insurance = true;
      requirements.inspection = true;
      requirements.minCoverage = 10000; // $10,000 minimum coverage
      requirements.inspectionTypes = ['pre_rental', 'post_return'];
    }

    if (riskProfile?.mandatoryRequirements) {
      requirements.insurance = riskProfile.mandatoryRequirements.insurance;
      requirements.inspection = riskProfile.mandatoryRequirements.inspection;
      requirements.minCoverage = riskProfile.mandatoryRequirements.minCoverage;
      requirements.inspectionTypes = riskProfile.mandatoryRequirements.inspectionTypes;
    }

    return requirements;
  }

  private async checkInsuranceCompliance(bookingId: string): Promise<boolean> {
    const insurance = await this.db('insurance_policies')
      .where('booking_id', bookingId)
      .where('status', 'active')
      .first();
    
    return !!insurance;
  }

  private async checkInspectionCompliance(bookingId: string): Promise<boolean> {
    const inspection = await this.db('product_inspections')
      .where('booking_id', bookingId)
      .where('status', 'completed')
      .first();
    
    return !!inspection;
  }

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get risk management statistics
   */
  async getRiskManagementStats(): Promise<ServiceResponse<RiskManagementStats>> {
    try {
      const [
        totalProfiles,
        complianceRate,
        violationRate,
        averageRiskScore,
        enforcementActions,
        riskDistribution
      ] = await Promise.all([
        this.db('product_risk_profiles').count('* as count').first(),
        this.calculateComplianceRate(),
        this.calculateViolationRate(),
        this.calculateAverageRiskScore(),
        this.getEnforcementActionStats(),
        this.getRiskDistribution()
      ]);

      const stats: RiskManagementStats = {
        totalRiskProfiles: parseInt(totalProfiles?.count as string || '0'),
        complianceRate,
        violationRate,
        averageRiskScore,
        enforcementActions,
        riskDistribution
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('[RiskManagementService] Get stats error:', error);
      return { success: false, error: 'Failed to get statistics' };
    }
  }

  private async calculateComplianceRate(): Promise<number> {
    // Implementation for compliance rate calculation
    return 85.5; // Placeholder
  }

  private async calculateViolationRate(): Promise<number> {
    // Implementation for violation rate calculation
    return 12.3; // Placeholder
  }

  private async calculateAverageRiskScore(): Promise<number> {
    // Implementation for average risk score calculation
    return 45.2; // Placeholder
  }

  private async getEnforcementActionStats() {
    // Implementation for enforcement action statistics
    return {
      total: 150,
      successful: 120,
      failed: 20,
      pending: 10
    };
  }

  private async getRiskDistribution() {
    // Implementation for risk distribution calculation
    return {
      low: 45,
      medium: 35,
      high: 15,
      critical: 5
    };
  }

  /**
   * Get policy violations with pagination and filtering
   */
  async getViolations(filters: any): Promise<ServiceResponse<any>> {
    try {
      const { page = 1, limit = 20, status, severity, bookingId, productId } = filters;
      const offset = (page - 1) * limit;

      let query = this.db('policy_violations as pv')
        .leftJoin('bookings as b', 'pv.booking_id', 'b.id')
        .leftJoin('products as p', 'pv.product_id', 'p.id')
        .leftJoin('users as u', 'pv.renter_id', 'u.id')
        .select(
          'pv.id',
          'pv.booking_id',
          'pv.product_id',
          'pv.renter_id',
          'pv.violation_type',
          'pv.description',
          'pv.severity',
          'pv.status',
          'pv.penalty_amount',
          'pv.resolution_actions',
          'pv.resolved_at',
          'pv.detected_at',
          'pv.created_at',
          'pv.updated_at',
          'p.title as product_name',
          'p.description as product_description',
          'u.first_name as violator_first_name',
          'u.last_name as violator_last_name',
          'u.email as violator_email'
        );

      // Apply filters
      if (status) {
        query = query.where('pv.status', status);
      }

      if (severity) {
        query = query.where('pv.severity', severity);
      }

      if (bookingId) {
        query = query.where('pv.booking_id', bookingId);
      }

      if (productId) {
        query = query.where('pv.product_id', productId);
      }

      // Get total count (separate query to avoid GROUP BY conflict)
      const countQuery = this.db('policy_violations as pv')
        .leftJoin('bookings as b', 'pv.booking_id', 'b.id')
        .leftJoin('products as p', 'pv.product_id', 'p.id')
        .leftJoin('users as u', 'pv.renter_id', 'u.id');

      // Apply same filters to count query
      if (status) {
        countQuery.where('pv.status', status);
      }

      if (severity) {
        countQuery.where('pv.severity', severity);
      }

      if (bookingId) {
        countQuery.where('pv.booking_id', bookingId);
      }

      if (productId) {
        countQuery.where('pv.product_id', productId);
      }

      const countResult = await countQuery.count('* as total').first();
      const total = parseInt(countResult?.total as string || '0');

      // Get paginated results
      const violations = await query
        .orderBy('pv.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Transform the results
      const transformedViolations = violations.map(violation => ({
        id: violation.id,
        bookingId: violation.booking_id,
        productId: violation.product_id,
        violatorId: violation.renter_id,
        violationType: violation.violation_type,
        description: violation.description,
        severity: violation.severity,
        status: violation.status,
        penaltyAmount: violation.penalty_amount,
        resolutionActions: violation.resolution_actions,
        resolvedAt: violation.resolved_at,
        detectedAt: violation.detected_at,
        createdAt: violation.created_at,
        updatedAt: violation.updated_at,
        productName: violation.product_name,
        productDescription: violation.product_description,
        violatorName: `${violation.violator_first_name || ''} ${violation.violator_last_name || ''}`.trim(),
        violatorEmail: violation.violator_email
      }));

      const totalPages = Math.ceil(total / limit);

      const result = {
        violations: transformedViolations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('[RiskManagementService] Get violations error:', error);
      return { success: false, error: 'Failed to get violations' };
    }
  }
}

export default new RiskManagementService();
