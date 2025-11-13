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
import { NotificationEngine } from '@/services/notification/NotificationEngine';
import { NotificationType } from '@/services/notification/types';

export class RiskManagementService {
  private db = getDatabase();
  private notificationEngine: NotificationEngine;

  constructor() {
    this.notificationEngine = new NotificationEngine();
  }

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
    
    return mapping[riskLevel.toLowerCase() as keyof typeof mapping] || 'moderate';
  }

  /**
   * Safely parse JSON array with fallback handling
   */
  private safeParseJsonArray(value: any): string[] {
    try {
      if (Array.isArray(value)) {
        return value;
      } else if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          // If not JSON, treat as comma-separated string
          return value.split(',').map((s: string) => s.trim());
        }
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
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
        mandatoryInsurance: data.mandatoryRequirements?.insurance || false,
        mandatoryInspection: data.mandatoryRequirements?.inspection || false,
        minCoverage: data.mandatoryRequirements?.minCoverage || 10000,
        inspectionTypes: data.mandatoryRequirements?.inspectionTypes || [],
        complianceDeadlineHours: data.mandatoryRequirements?.complianceDeadlineHours || 72,
        riskFactors: data.riskFactors || [],
        mitigationStrategies: data.mitigationStrategies || [],
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
        is_active: true, // New profiles are active by default
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
        .where('is_active', true) // Only get active profiles
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
          inspectionTypes: this.safeParseJsonArray(result.inspection_types),
          complianceDeadlineHours: result.compliance_deadline_hours
        },
        riskFactors: this.safeParseJsonArray(result.risk_factors),
        mitigationStrategies: this.safeParseJsonArray(result.mitigation_strategies),
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
   * Get risk profile by ID
   */
  async getRiskProfile(id: string): Promise<ServiceResponse<ProductRiskProfile>> {
    try {
      const result = await this.db('product_risk_profiles')
        .where('id', id)
        .where('is_active', true) // Only get active profiles
        .first();

      if (!result) {
        return { success: false, error: 'Risk profile not found' };
      }

      // Get product and category info
      const product = await this.db('products').where('id', result.product_id).first();
      const category = await this.db('categories').where('id', result.category_id).first();

      const riskProfile: ProductRiskProfile = {
        id: result.id,
        productId: result.product_id,
        categoryId: result.category_id,
        riskLevel: result.risk_level,
        mandatoryRequirements: {
          insurance: result.mandatory_insurance,
          inspection: result.mandatory_inspection,
          minCoverage: result.min_coverage,
          inspectionTypes: this.safeParseJsonArray(result.inspection_types),
          complianceDeadlineHours: result.compliance_deadline_hours
        },
        riskFactors: this.safeParseJsonArray(result.risk_factors),
        mitigationStrategies: this.safeParseJsonArray(result.mitigation_strategies),
        enforcementLevel: result.enforcement_level,
        autoEnforcement: result.auto_enforcement,
        gracePeriodHours: result.grace_period_hours,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return { success: true, data: riskProfile };
    } catch (error) {
      console.error('[RiskManagementService] Get risk profile by ID error:', error);
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
        .where('prp.is_active', true) // Only get active profiles
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
        .leftJoin('categories as c', 'prp.category_id', 'c.id')
        .where('prp.is_active', true); // Only count active profiles

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
          if (Array.isArray(profile.inspection_types)) {
            // Already an array
            inspectionTypes = profile.inspection_types;
          } else if (typeof profile.inspection_types === 'string') {
            // Try to parse as JSON first
            try {
              inspectionTypes = JSON.parse(profile.inspection_types);
            } catch {
              // If not JSON, treat as comma-separated string
              inspectionTypes = profile.inspection_types.split(',').map((s: string) => s.trim());
            }
          } else {
            inspectionTypes = [];
          }
        } catch (error) {
          inspectionTypes = [];
        }
        
        try {
          if (Array.isArray(profile.risk_factors)) {
            // Already an array
            riskFactors = profile.risk_factors;
          } else if (typeof profile.risk_factors === 'string') {
            // Try to parse as JSON first
            try {
              riskFactors = JSON.parse(profile.risk_factors);
            } catch {
              // If not JSON, treat as comma-separated string
              riskFactors = profile.risk_factors.split(',').map((s: string) => s.trim());
            }
          } else {
            riskFactors = [];
          }
        } catch (error) {
          riskFactors = [];
        }
        
        try {
          if (Array.isArray(profile.mitigation_strategies)) {
            // Already an array
            mitigationStrategies = profile.mitigation_strategies;
          } else if (typeof profile.mitigation_strategies === 'string') {
            // Try to parse as JSON first
            try {
              mitigationStrategies = JSON.parse(profile.mitigation_strategies);
            } catch {
              // If not JSON, treat as comma-separated string
              mitigationStrategies = profile.mitigation_strategies.split(',').map((s: string) => s.trim());
            }
          } else {
            mitigationStrategies = [];
          }
        } catch (error) {
          mitigationStrategies = [];
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

  /**
   * Update a risk profile
   */
  async updateRiskProfile(id: string, data: UpdateRiskProfileRequest): Promise<ServiceResponse<ProductRiskProfile>> {
    try {
      // Check if risk profile exists
      const existing = await this.db('product_risk_profiles')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Risk profile not found' };
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date()
      };

      // Update risk level if provided
      if (data.riskLevel) {
        updateData.risk_level = data.riskLevel;
        // Update enforcement level based on risk level
        updateData.enforcement_level = this.mapRiskLevelToEnforcementLevel(data.riskLevel);
      }

      // Update mandatory requirements if provided
      if (data.mandatoryRequirements) {
        if (data.mandatoryRequirements.insurance !== undefined) {
          updateData.mandatory_insurance = data.mandatoryRequirements.insurance;
        }
        if (data.mandatoryRequirements.inspection !== undefined) {
          updateData.mandatory_inspection = data.mandatoryRequirements.inspection;
        }
        if (data.mandatoryRequirements.minCoverage !== undefined) {
          updateData.min_coverage = data.mandatoryRequirements.minCoverage;
        }
        if (data.mandatoryRequirements.inspectionTypes !== undefined) {
          updateData.inspection_types = JSON.stringify(data.mandatoryRequirements.inspectionTypes);
        }
        if (data.mandatoryRequirements.complianceDeadlineHours !== undefined) {
          updateData.compliance_deadline_hours = data.mandatoryRequirements.complianceDeadlineHours;
        }
      }

      // Update risk factors if provided
      if (data.riskFactors !== undefined) {
        updateData.risk_factors = JSON.stringify(data.riskFactors);
      }

      // Update mitigation strategies if provided
      if (data.mitigationStrategies !== undefined) {
        updateData.mitigation_strategies = JSON.stringify(data.mitigationStrategies);
      }

      // Update enforcement level if provided
      if (data.enforcementLevel) {
        updateData.enforcement_level = data.enforcementLevel;
      }

      // Update auto enforcement if provided
      if (data.autoEnforcement !== undefined) {
        updateData.auto_enforcement = data.autoEnforcement;
      }

      // Update grace period if provided
      if (data.gracePeriodHours !== undefined) {
        updateData.grace_period_hours = data.gracePeriodHours;
      }

      // Update the risk profile
      await this.db('product_risk_profiles')
        .where('id', id)
        .update(updateData);

      // Get the updated profile
      const result = await this.getRiskProfileByProduct(existing.product_id);
      return result;
    } catch (error) {
      console.error('[RiskManagementService] Update risk profile error:', error);
      return { success: false, error: 'Failed to update risk profile' };
    }
  }

  /**
   * Soft delete a risk profile (mark as inactive)
   */
  async deleteRiskProfile(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Check if risk profile exists
      const existing = await this.db('product_risk_profiles')
        .where('id', id)
        .where('is_active', true) // Only find active profiles
        .first();

      if (!existing) {
        return { success: false, error: 'Risk profile not found or already deleted' };
      }

      // Soft delete: Mark as inactive
      await this.db('product_risk_profiles')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date()
        });

      return { success: true, data: true };
    } catch (error) {
      console.error('[RiskManagementService] Delete risk profile error:', error);
      return { success: false, error: 'Failed to delete risk profile' };
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

      // Store assessment in database
      try {
        const assessmentId = require('uuid').v4();
        await this.db('risk_assessments').insert({
          id: assessmentId,
          product_id: productId,
          renter_id: renterId,
          booking_id: bookingId || null,
          overall_risk_score: overallRiskScore,
          product_risk_score: productRisk,
          renter_risk_score: renterRisk,
          booking_risk_score: bookingRisk,
          seasonal_risk_score: seasonalRisk,
          risk_factors: JSON.stringify({
            productRisk,
            renterRisk,
            bookingRisk,
            seasonalRisk
          }),
          recommendations: JSON.stringify(recommendations),
          mandatory_requirements: JSON.stringify(mandatoryRequirements),
          compliance_status: ComplianceStatus.PENDING,
          assessment_date: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      } catch (dbError) {
        console.warn('[RiskManagementService] Failed to store assessment in database:', dbError);
        // Continue even if storage fails
      }

      return { success: true, data: assessment };
    } catch (error) {
      console.error('[RiskManagementService] Risk assessment error:', error);
      return { success: false, error: 'Failed to assess risk' };
    }
  }

  /**
   * Get risk assessments with pagination and filtering
   */
  async getRiskAssessments(filters: any): Promise<ServiceResponse<any>> {
    try {
      const { page = 1, limit = 20, productId, renterId, bookingId, riskLevel, complianceStatus } = filters;
      const offset = (page - 1) * limit;

      let query = this.db('risk_assessments as ra')
        .leftJoin('products as p', 'ra.product_id', 'p.id')
        .leftJoin('users as u', 'ra.renter_id', 'u.id')
        .select(
          'ra.id',
          'ra.product_id',
          'ra.renter_id',
          'ra.booking_id',
          'ra.overall_risk_score',
          'ra.product_risk_score',
          'ra.renter_risk_score',
          'ra.booking_risk_score',
          'ra.seasonal_risk_score',
          'ra.risk_factors',
          'ra.recommendations',
          'ra.mandatory_requirements',
          'ra.compliance_status',
          'ra.assessment_date',
          'ra.expires_at',
          'ra.created_at',
          'ra.updated_at',
          'p.title as product_name',
          'u.first_name as renter_first_name',
          'u.last_name as renter_last_name',
          'u.email as renter_email'
        );

      // Apply filters
      if (productId) {
        query = query.where('ra.product_id', productId);
      }
      if (renterId) {
        query = query.where('ra.renter_id', renterId);
      }
      if (bookingId) {
        query = query.where('ra.booking_id', bookingId);
      }
      if (complianceStatus) {
        query = query.where('ra.compliance_status', complianceStatus);
      }

      // Get total count
      const countQuery = this.db('risk_assessments as ra');
      if (productId) countQuery.where('ra.product_id', productId);
      if (renterId) countQuery.where('ra.renter_id', renterId);
      if (bookingId) countQuery.where('ra.booking_id', bookingId);
      if (complianceStatus) countQuery.where('ra.compliance_status', complianceStatus);

      const countResult = await countQuery.count('* as total').first();
      const total = parseInt(countResult?.total as string || '0');

      // Get paginated results
      const assessments = await query
        .orderBy('ra.assessment_date', 'desc')
        .limit(limit)
        .offset(offset);

      // Transform results
      const transformedAssessments = assessments.map(assessment => {
        const overallScore = assessment.overall_risk_score;
        let determinedRiskLevel = 'low';
        if (overallScore >= 85) determinedRiskLevel = 'critical';
        else if (overallScore >= 60) determinedRiskLevel = 'high';
        else if (overallScore >= 30) determinedRiskLevel = 'medium';

        // Filter by risk level if provided
        if (riskLevel && determinedRiskLevel !== riskLevel) {
          return null;
        }

        return {
          id: assessment.id,
          productId: assessment.product_id,
          renterId: assessment.renter_id,
          bookingId: assessment.booking_id,
          overallRiskScore: assessment.overall_risk_score,
          riskFactors: {
            productRisk: assessment.product_risk_score,
            renterRisk: assessment.renter_risk_score,
            bookingRisk: assessment.booking_risk_score,
            seasonalRisk: assessment.seasonal_risk_score
          },
          recommendations: this.safeParseJsonArray(assessment.recommendations),
          mandatoryRequirements: assessment.mandatory_requirements ? 
            (typeof assessment.mandatory_requirements === 'string' ? 
              JSON.parse(assessment.mandatory_requirements) : 
              assessment.mandatory_requirements) : {},
          complianceStatus: assessment.compliance_status,
          assessmentDate: assessment.assessment_date,
          expiresAt: assessment.expires_at,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at,
          productName: assessment.product_name,
          renterName: `${assessment.renter_first_name || ''} ${assessment.renter_last_name || ''}`.trim(),
          renterEmail: assessment.renter_email
        };
      }).filter(Boolean);

      return {
        success: true,
        data: {
          assessments: transformedAssessments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('[RiskManagementService] Get risk assessments error:', error);
      return { success: false, error: 'Failed to get risk assessments' };
    }
  }

  /**
   * Get risk assessment by ID
   */
  async getRiskAssessment(id: string): Promise<ServiceResponse<RiskAssessment>> {
    try {
      const assessment = await this.db('risk_assessments as ra')
        .leftJoin('products as p', 'ra.product_id', 'p.id')
        .leftJoin('users as u', 'ra.renter_id', 'u.id')
        .where('ra.id', id)
        .select(
          'ra.id',
          'ra.product_id',
          'ra.renter_id',
          'ra.booking_id',
          'ra.overall_risk_score',
          'ra.product_risk_score',
          'ra.renter_risk_score',
          'ra.booking_risk_score',
          'ra.seasonal_risk_score',
          'ra.risk_factors',
          'ra.recommendations',
          'ra.mandatory_requirements',
          'ra.compliance_status',
          'ra.assessment_date',
          'ra.expires_at',
          'ra.created_at',
          'ra.updated_at',
          'p.title as product_name',
          'u.first_name as renter_first_name',
          'u.last_name as renter_last_name',
          'u.email as renter_email'
        )
        .first();

      if (!assessment) {
        return { success: false, error: 'Risk assessment not found' };
      }

      const result: RiskAssessment = {
        productId: assessment.product_id,
        renterId: assessment.renter_id,
        bookingId: assessment.booking_id || '',
        overallRiskScore: assessment.overall_risk_score,
        riskFactors: {
          productRisk: assessment.product_risk_score,
          renterRisk: assessment.renter_risk_score,
          bookingRisk: assessment.booking_risk_score,
          seasonalRisk: assessment.seasonal_risk_score
        },
        recommendations: this.safeParseJsonArray(assessment.recommendations),
        mandatoryRequirements: assessment.mandatory_requirements ? 
          (typeof assessment.mandatory_requirements === 'string' ? 
            JSON.parse(assessment.mandatory_requirements) : 
            assessment.mandatory_requirements) : {},
        complianceStatus: assessment.compliance_status as ComplianceStatus,
        assessmentDate: assessment.assessment_date,
        expiresAt: assessment.expires_at
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('[RiskManagementService] Get risk assessment error:', error);
      return { success: false, error: 'Failed to get risk assessment' };
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

      // Calculate grace period end time if applicable
      let gracePeriodEndsAt: Date | null = profile.gracePeriodHours > 0
        ? new Date(Date.now() + profile.gracePeriodHours * 60 * 60 * 1000)
        : null;

      // Check insurance compliance
      if (profile.mandatoryRequirements.insurance) {
        const hasInsurance = await this.checkInsuranceCompliance(bookingId);
        if (!hasInsurance) {
          missingRequirements.push('MISSING_INSURANCE');
          const actionId = require('uuid').v4();
          const action: EnforcementAction = {
            id: actionId,
            type: 'REQUIRE_INSURANCE',
            severity: 'HIGH',
            message: 'Insurance is mandatory for this product',
            requiredAction: 'Purchase insurance coverage',
            deadline: new Date(Date.now() + profile.complianceDeadlineHours * 60 * 60 * 1000),
            status: 'PENDING'
          };
          enforcementActions.push(action);
          
          // Store enforcement action in database
          await this.storeEnforcementAction(bookingId, productId, renterId, action);
        }
      }

      // Check inspection compliance
      if (profile.mandatoryRequirements.inspection) {
        const hasInspection = await this.checkInspectionCompliance(bookingId);
        if (!hasInspection) {
          missingRequirements.push('MISSING_INSPECTION');
          const actionId = require('uuid').v4();
          const action: EnforcementAction = {
            id: actionId,
            type: 'REQUIRE_INSPECTION',
            severity: 'HIGH',
            message: 'Inspection is mandatory for this product',
            requiredAction: 'Schedule and complete inspection',
            deadline: new Date(Date.now() + profile.complianceDeadlineHours * 60 * 60 * 1000),
            status: 'PENDING'
          };
          enforcementActions.push(action);
          
          // Store enforcement action in database
          await this.storeEnforcementAction(bookingId, productId, renterId, action);
        }
      }

      // Determine compliance status with grace period consideration
      const isCompliant = missingRequirements.length === 0;
      let complianceStatus: ComplianceStatus;
      
      if (isCompliant) {
        complianceStatus = ComplianceStatus.COMPLIANT;
      } else if (gracePeriodEndsAt && new Date() < gracePeriodEndsAt) {
        complianceStatus = ComplianceStatus.GRACE_PERIOD;
      } else {
        complianceStatus = ComplianceStatus.NON_COMPLIANT;
      }

      // Calculate compliance score
      const complianceScore = isCompliant ? 100 : Math.max(0, 100 - (missingRequirements.length * 25));

      // Set grace period end date if in grace period
      if (!isCompliant && profile.gracePeriodHours > 0 && !gracePeriodEndsAt) {
        // Calculate grace period end date
        gracePeriodEndsAt = new Date(Date.now() + profile.gracePeriodHours * 60 * 60 * 1000);
      }
      
      // Check if we're still within grace period
      if (!isCompliant && gracePeriodEndsAt && new Date() < gracePeriodEndsAt) {
        complianceStatus = ComplianceStatus.GRACE_PERIOD;
      }

      const complianceCheck: ComplianceCheck = {
        bookingId,
        productId,
        renterId,
        isCompliant,
        missingRequirements,
        complianceScore,
        status: complianceStatus,
        gracePeriodEndsAt: gracePeriodEndsAt || undefined,
        enforcementActions,
        lastCheckedAt: new Date()
      };

      // Store compliance check in database
      try {
        // Check if compliance check already exists for this booking
        const existing = await this.db('compliance_checks')
          .where('booking_id', bookingId)
          .first();

        const complianceData = {
          booking_id: bookingId,
          product_id: productId,
          renter_id: renterId,
          is_compliant: isCompliant,
          missing_requirements: JSON.stringify(missingRequirements),
          compliance_score: complianceScore,
          status: complianceStatus,
          grace_period_ends_at: gracePeriodEndsAt,
          enforcement_actions: JSON.stringify(enforcementActions),
          last_checked_at: new Date()
        };

        if (existing) {
          // Update existing compliance check
          await this.db('compliance_checks')
            .where('booking_id', bookingId)
            .update(complianceData);
        } else {
          // Create new compliance check
          const complianceId = require('uuid').v4();
          await this.db('compliance_checks').insert({
            id: complianceId,
            ...complianceData
          });
        }
      } catch (dbError) {
        console.warn('[RiskManagementService] Failed to store compliance check in database:', dbError);
        // Continue even if storage fails
      }

      return { success: true, data: complianceCheck };
    } catch (error) {
      console.error('[RiskManagementService] Compliance check error:', error);
      return { success: false, error: 'Failed to check compliance' };
    }
  }

  /**
   * Get compliance status for a booking
   */
  async getComplianceStatus(bookingId: string): Promise<ServiceResponse<ComplianceCheck>> {
    try {
      const compliance = await this.db('compliance_checks')
        .where('booking_id', bookingId)
        .orderBy('last_checked_at', 'desc')
        .first();

      if (!compliance) {
        return { success: false, error: 'Compliance check not found' };
      }

      const complianceCheck: ComplianceCheck = {
        bookingId: compliance.booking_id,
        productId: compliance.product_id,
        renterId: compliance.renter_id,
        isCompliant: compliance.is_compliant,
        missingRequirements: this.safeParseJsonArray(compliance.missing_requirements),
        complianceScore: compliance.compliance_score,
        status: compliance.status as ComplianceStatus,
        gracePeriodEndsAt: compliance.grace_period_ends_at || undefined,
        enforcementActions: compliance.enforcement_actions ? 
          (typeof compliance.enforcement_actions === 'string' ? 
            JSON.parse(compliance.enforcement_actions) : 
            compliance.enforcement_actions) : [],
        lastCheckedAt: compliance.last_checked_at
      };

      return { success: true, data: complianceCheck };
    } catch (error) {
      console.error('[RiskManagementService] Get compliance status error:', error);
      return { success: false, error: 'Failed to get compliance status' };
    }
  }

  /**
   * Get compliance checks with pagination and filtering
   */
  async getComplianceChecks(filters: any): Promise<ServiceResponse<any>> {
    try {
      const { page = 1, limit = 20, bookingId, productId, renterId, complianceStatus } = filters;
      const offset = (page - 1) * limit;

      let query = this.db('compliance_checks as cc')
        .leftJoin('bookings as b', 'cc.booking_id', 'b.id')
        .leftJoin('products as p', 'cc.product_id', 'p.id')
        .leftJoin('users as u', 'cc.renter_id', 'u.id')
        .select(
          'cc.id',
          'cc.booking_id',
          'cc.product_id',
          'cc.renter_id',
          'cc.is_compliant',
          'cc.missing_requirements',
          'cc.compliance_score',
          'cc.status',
          'cc.grace_period_ends_at',
          'cc.enforcement_actions',
          'cc.last_checked_at',
          'cc.created_at',
          'cc.updated_at',
          'p.title as product_name',
          'u.first_name as renter_first_name',
          'u.last_name as renter_last_name',
          'u.email as renter_email'
        );

      // Apply filters
      if (bookingId) {
        query = query.where('cc.booking_id', bookingId);
      }
      if (productId) {
        query = query.where('cc.product_id', productId);
      }
      if (renterId) {
        query = query.where('cc.renter_id', renterId);
      }
      if (complianceStatus) {
        query = query.where('cc.status', complianceStatus);
      }

      // Get total count
      const countQuery = this.db('compliance_checks as cc');
      if (bookingId) countQuery.where('cc.booking_id', bookingId);
      if (productId) countQuery.where('cc.product_id', productId);
      if (renterId) countQuery.where('cc.renter_id', renterId);
      if (complianceStatus) countQuery.where('cc.status', complianceStatus);

      const countResult = await countQuery.count('* as total').first();
      const total = parseInt(countResult?.total as string || '0');

      // Get paginated results
      const checks = await query
        .orderBy('cc.last_checked_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Transform results
      const transformedChecks = checks.map(check => ({
        id: check.id,
        bookingId: check.booking_id,
        productId: check.product_id,
        renterId: check.renter_id,
        isCompliant: check.is_compliant,
        missingRequirements: this.safeParseJsonArray(check.missing_requirements),
        complianceScore: check.compliance_score,
        status: check.status,
        gracePeriodEndsAt: check.grace_period_ends_at || undefined,
        enforcementActions: check.enforcement_actions ? 
          (typeof check.enforcement_actions === 'string' ? 
            JSON.parse(check.enforcement_actions) : 
            check.enforcement_actions) : [],
        lastCheckedAt: check.last_checked_at,
        createdAt: check.created_at,
        updatedAt: check.updated_at,
        productName: check.product_name,
        renterName: `${check.renter_first_name || ''} ${check.renter_last_name || ''}`.trim(),
        renterEmail: check.renter_email
      }));

      return {
        success: true,
        data: {
          checks: transformedChecks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('[RiskManagementService] Get compliance checks error:', error);
      return { success: false, error: 'Failed to get compliance checks' };
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
        status: 'active' as const
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

  /**
   * Update a policy violation
   */
  async updateViolation(id: string, data: {
    severity?: string;
    description?: string;
    penaltyAmount?: number;
    status?: 'active' | 'resolved' | 'escalated';
  }): Promise<ServiceResponse<PolicyViolation>> {
    try {
      // Check if violation exists
      const existing = await this.db('policy_violations')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Violation not found' };
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date()
      };

      if (data.severity !== undefined) {
        updateData.severity = data.severity;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.penaltyAmount !== undefined) {
        updateData.penalty_amount = data.penaltyAmount;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'resolved' && !existing.resolved_at) {
          updateData.resolved_at = new Date();
        }
      }

      // Update the violation
      await this.db('policy_violations')
        .where('id', id)
        .update(updateData);

      // Get the updated violation
      const updated = await this.db('policy_violations')
        .where('id', id)
        .first();

      const violation: PolicyViolation = {
        id: updated.id,
        bookingId: updated.booking_id,
        productId: updated.product_id,
        renterId: updated.renter_id,
        violationType: updated.violation_type as any,
        severity: updated.severity as any,
        description: updated.description,
        detectedAt: updated.detected_at,
        resolvedAt: updated.resolved_at || undefined,
        resolutionActions: this.safeParseJsonArray(updated.resolution_actions),
        penaltyAmount: updated.penalty_amount,
        status: updated.status as any
      };

      return { success: true, data: violation };
    } catch (error) {
      console.error('[RiskManagementService] Update violation error:', error);
      return { success: false, error: 'Failed to update violation' };
    }
  }

  /**
   * Resolve a policy violation
   */
  async resolveViolation(id: string, resolutionData: {
    resolutionActions: string[];
    resolutionNotes?: string;
  }): Promise<ServiceResponse<PolicyViolation>> {
    try {
      // Check if violation exists
      const existing = await this.db('policy_violations')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Violation not found' };
      }

      // Update violation to resolved status
      await this.db('policy_violations')
        .where('id', id)
        .update({
          status: 'resolved',
          resolved_at: new Date(),
          resolution_actions: JSON.stringify(resolutionData.resolutionActions),
          updated_at: new Date()
        });

      // Get the updated violation
      const updated = await this.db('policy_violations')
        .where('id', id)
        .first();

      const violation: PolicyViolation = {
        id: updated.id,
        bookingId: updated.booking_id,
        productId: updated.product_id,
        renterId: updated.renter_id,
        violationType: updated.violation_type as any,
        severity: updated.severity as any,
        description: updated.description,
        detectedAt: updated.detected_at,
        resolvedAt: updated.resolved_at || undefined,
        resolutionActions: this.safeParseJsonArray(updated.resolution_actions),
        penaltyAmount: updated.penalty_amount,
        status: updated.status as any
      };

      return { success: true, data: violation };
    } catch (error) {
      console.error('[RiskManagementService] Resolve violation error:', error);
      return { success: false, error: 'Failed to resolve violation' };
    }
  }

  /**
   * Get violation by ID
   */
  async getViolation(id: string): Promise<ServiceResponse<PolicyViolation>> {
    try {
      const violation = await this.db('policy_violations as pv')
        .leftJoin('bookings as b', 'pv.booking_id', 'b.id')
        .leftJoin('products as p', 'pv.product_id', 'p.id')
        .leftJoin('users as u', 'pv.renter_id', 'u.id')
        .where('pv.id', id)
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
        )
        .first();

      if (!violation) {
        return { success: false, error: 'Violation not found' };
      }

      const result: PolicyViolation = {
        id: violation.id,
        bookingId: violation.booking_id,
        productId: violation.product_id,
        renterId: violation.renter_id,
        violationType: violation.violation_type as any,
        severity: violation.severity as any,
        description: violation.description,
        detectedAt: violation.detected_at,
        resolvedAt: violation.resolved_at || undefined,
        resolutionActions: this.safeParseJsonArray(violation.resolution_actions),
        penaltyAmount: violation.penalty_amount,
        status: violation.status as any
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('[RiskManagementService] Get violation error:', error);
      return { success: false, error: 'Failed to get violation' };
    }
  }

  /**
   * Assign violation to inspector
   */
  async assignViolation(id: string, inspectorId: string): Promise<ServiceResponse<PolicyViolation>> {
    try {
      // Check if violation exists
      const existing = await this.db('policy_violations')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Violation not found' };
      }

      // Check if inspector exists
      const inspector = await this.db('users')
        .where('id', inspectorId)
        .where('role', 'inspector')
        .first();

      if (!inspector) {
        return { success: false, error: 'Inspector not found or invalid role' };
      }

      // Update violation with inspector assignment
      await this.db('policy_violations')
        .where('id', id)
        .update({
          inspector_id: inspectorId,
          updated_at: new Date()
        });

      // Get the updated violation
      const updated = await this.db('policy_violations')
        .where('id', id)
        .first();

      const violation: PolicyViolation = {
        id: updated.id,
        bookingId: updated.booking_id,
        productId: updated.product_id,
        renterId: updated.renter_id,
        violationType: updated.violation_type as any,
        severity: updated.severity as any,
        description: updated.description,
        detectedAt: updated.detected_at,
        resolvedAt: updated.resolved_at || undefined,
        resolutionActions: this.safeParseJsonArray(updated.resolution_actions),
        penaltyAmount: updated.penalty_amount,
        status: updated.status as any
      };

      return { success: true, data: violation };
    } catch (error) {
      console.error('[RiskManagementService] Assign violation error:', error);
      return { success: false, error: 'Failed to assign violation' };
    }
  }

  /**
   * Delete violation (soft delete)
   */
  async deleteViolation(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Check if violation exists
      const existing = await this.db('policy_violations')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Violation not found' };
      }

      // Soft delete by setting status to 'deleted' or removing from active records
      await this.db('policy_violations')
        .where('id', id)
        .update({
          status: 'deleted',
          updated_at: new Date()
        });

      return { success: true, data: true };
    } catch (error) {
      console.error('[RiskManagementService] Delete violation error:', error);
      return { success: false, error: 'Failed to delete violation' };
    }
  }

  // =====================================================
  // ENFORCEMENT ACTION MANAGEMENT
  // =====================================================

  /**
   * Store enforcement action in database
   */
  private async storeEnforcementAction(
    bookingId: string,
    productId: string,
    renterId: string,
    action: EnforcementAction
  ): Promise<void> {
    try {
      await this.db('enforcement_actions').insert({
        id: action.id,
        booking_id: bookingId,
        product_id: productId,
        renter_id: renterId,
        action_type: action.type.toLowerCase(),
        severity: action.severity,
        message: action.message,
        required_action: action.requiredAction,
        deadline: action.deadline,
        status: action.status,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('[RiskManagementService] Store enforcement action error:', error);
      // Don't throw - continue even if storage fails
    }
  }

  /**
   * Execute enforcement action
   */
  async executeEnforcementAction(actionId: string): Promise<ServiceResponse<EnforcementAction>> {
    try {
      // Get the enforcement action
      const action = await this.db('enforcement_actions')
        .where('id', actionId)
        .first();

      if (!action) {
        return { success: false, error: 'Enforcement action not found' };
      }

      if (action.status !== 'pending') {
        return { success: false, error: `Action already ${action.status}` };
      }

      let executionSuccess = false;
      let executionNotes = '';

      // Execute based on action type
      switch (action.action_type.toUpperCase()) {
        case 'BLOCK_BOOKING':
          executionSuccess = await this.executeBlockBooking(action.booking_id);
          executionNotes = executionSuccess 
            ? 'Booking blocked successfully' 
            : 'Failed to block booking';
          break;

        case 'REQUIRE_INSURANCE':
          executionSuccess = await this.executeRequireInsurance(action.booking_id, action.renter_id);
          executionNotes = executionSuccess 
            ? 'Insurance requirement notification sent' 
            : 'Failed to send insurance requirement notification';
          break;

        case 'REQUIRE_INSPECTION':
          executionSuccess = await this.executeRequireInspection(action.booking_id, action.renter_id);
          executionNotes = executionSuccess 
            ? 'Inspection requirement notification sent' 
            : 'Failed to send inspection requirement notification';
          break;

        case 'SEND_NOTIFICATION':
          executionSuccess = await this.executeSendNotification(action.booking_id, action.renter_id, action.message);
          executionNotes = executionSuccess 
            ? 'Notification sent successfully' 
            : 'Failed to send notification';
          break;

        case 'ESCALATE':
          executionSuccess = await this.executeEscalate(action.booking_id, action.product_id);
          executionNotes = executionSuccess 
            ? 'Escalated to admin for review' 
            : 'Failed to escalate';
          break;

        default:
          executionNotes = `Unknown action type: ${action.action_type}`;
      }

      // Update action status
      await this.db('enforcement_actions')
        .where('id', actionId)
        .update({
          status: executionSuccess ? 'executed' : 'failed',
          executed_at: executionSuccess ? new Date() : null,
          execution_notes: executionNotes,
          updated_at: new Date()
        });

      // Get updated action
      const updated = await this.db('enforcement_actions')
        .where('id', actionId)
        .first();

      const enforcementAction: EnforcementAction = {
        id: updated.id,
        type: updated.action_type as any,
        severity: updated.severity as any,
        message: updated.message,
        requiredAction: updated.required_action,
        deadline: updated.deadline,
        executedAt: updated.executed_at || undefined,
        status: updated.status as any
      };

      return { success: true, data: enforcementAction };
    } catch (error) {
      console.error('[RiskManagementService] Execute enforcement action error:', error);
      return { success: false, error: 'Failed to execute enforcement action' };
    }
  }

  /**
   * Approve enforcement action
   */
  async approveEnforcementAction(actionId: string, approverId: string): Promise<ServiceResponse<EnforcementAction>> {
    try {
      // Get the enforcement action
      const action = await this.db('enforcement_actions')
        .where('id', actionId)
        .first();

      if (!action) {
        return { success: false, error: 'Enforcement action not found' };
      }

      if (action.status !== 'pending') {
        return { success: false, error: `Action already ${action.status}` };
      }

      // Update action to approved status
      await this.db('enforcement_actions')
        .where('id', actionId)
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date(),
          updated_at: new Date()
        });

      // Get updated action
      const updated = await this.db('enforcement_actions')
        .where('id', actionId)
        .first();

      const enforcementAction: EnforcementAction = {
        id: updated.id,
        type: updated.action_type as any,
        severity: updated.severity as any,
        message: updated.message,
        requiredAction: updated.required_action,
        deadline: updated.deadline,
        executedAt: updated.executed_at || undefined,
        status: updated.status as any
      };

      return { success: true, data: enforcementAction };
    } catch (error) {
      console.error('[RiskManagementService] Approve enforcement action error:', error);
      return { success: false, error: 'Failed to approve enforcement action' };
    }
  }

  /**
   * Execute block booking action
   */
  private async executeBlockBooking(bookingId: string): Promise<boolean> {
    try {
      // Update booking status to blocked/cancelled
      await this.db('bookings')
        .where('id', bookingId)
        .update({
          status: 'cancelled', // or 'blocked' if you have that status
          updated_at: new Date()
        });
      return true;
    } catch (error) {
      console.error('[RiskManagementService] Block booking error:', error);
      return false;
    }
  }

  /**
   * Execute require insurance action
   */
  private async executeRequireInsurance(bookingId: string, renterId: string): Promise<boolean> {
    try {
      // Get booking and product details
      const booking = await this.db('bookings')
        .where('id', bookingId)
        .first();
      
      if (!booking) return false;

      const product = await this.db('products')
        .where('id', booking.product_id)
        .first();

      // Send notification to renter
      await this.notificationEngine.sendNotification({
        type: NotificationType.RISK_COMPLIANCE_REQUIRED,
        recipientId: renterId,
        title: 'Insurance Required',
        message: `Insurance is required for booking ${booking.booking_number || bookingId}. Please purchase insurance coverage to proceed.`,
        data: {
          bookingId,
          productId: booking.product_id,
          requirement: 'insurance',
          productName: product?.title || 'Product'
        }
      });

      return true;
    } catch (error) {
      console.error('[RiskManagementService] Require insurance error:', error);
      return false;
    }
  }

  /**
   * Execute require inspection action
   */
  private async executeRequireInspection(bookingId: string, renterId: string): Promise<boolean> {
    try {
      // Get booking and product details
      const booking = await this.db('bookings')
        .where('id', bookingId)
        .first();
      
      if (!booking) return false;

      const product = await this.db('products')
        .where('id', booking.product_id)
        .first();

      // Send notification to renter
      await this.notificationEngine.sendNotification({
        type: NotificationType.RISK_COMPLIANCE_REQUIRED,
        recipientId: renterId,
        title: 'Inspection Required',
        message: `Inspection is required for booking ${booking.booking_number || bookingId}. Please schedule and complete the inspection.`,
        data: {
          bookingId,
          productId: booking.product_id,
          requirement: 'inspection',
          productName: product?.title || 'Product'
        }
      });

      return true;
    } catch (error) {
      console.error('[RiskManagementService] Require inspection error:', error);
      return false;
    }
  }

  /**
   * Execute send notification action
   */
  private async executeSendNotification(bookingId: string, renterId: string, message: string): Promise<boolean> {
    try {
      // Get booking details
      const booking = await this.db('bookings')
        .where('id', bookingId)
        .first();
      
      if (!booking) return false;

      // Send notification
      await this.notificationEngine.sendNotification({
        type: NotificationType.RISK_COMPLIANCE_REQUIRED,
        recipientId: renterId,
        title: 'Compliance Notice',
        message: message,
        data: {
          bookingId,
          productId: booking.product_id
        }
      });

      return true;
    } catch (error) {
      console.error('[RiskManagementService] Send notification error:', error);
      return false;
    }
  }

  /**
   * Execute escalate action
   */
  private async executeEscalate(bookingId: string, productId: string): Promise<boolean> {
    try {
      // Get admin users
      const admins = await this.db('users')
        .whereIn('role', ['admin', 'super_admin'])
        .select('id');

      // Send notification to all admins
      const notificationPromises = admins.map(admin =>
        this.notificationEngine.sendNotification({
          type: NotificationType.RISK_ESCALATION,
          recipientId: admin.id,
          title: 'Risk Management Escalation',
          message: `Booking ${bookingId} requires admin review due to compliance issues.`,
          data: {
            bookingId,
            productId,
            escalationReason: 'Compliance violation'
          }
        })
      );

      await Promise.allSettled(notificationPromises);
      return true;
    } catch (error) {
      console.error('[RiskManagementService] Escalate error:', error);
      return false;
    }
  }

  /**
   * Get enforcement actions for a booking
   */
  async getEnforcementActions(bookingId: string): Promise<ServiceResponse<EnforcementAction[]>> {
    try {
      const actions = await this.db('enforcement_actions')
        .where('booking_id', bookingId)
        .orderBy('created_at', 'desc');

      const enforcementActions: EnforcementAction[] = actions.map(action => ({
        id: action.id,
        type: action.action_type as any,
        severity: action.severity as any,
        message: action.message,
        requiredAction: action.required_action,
        deadline: action.deadline,
        executedAt: action.executed_at || undefined,
        status: action.status as any
      }));

      return { success: true, data: enforcementActions };
    } catch (error) {
      console.error('[RiskManagementService] Get enforcement actions error:', error);
      return { success: false, error: 'Failed to get enforcement actions' };
    }
  }

  /**
   * Get all enforcement actions with filters and pagination
   */
  async getAllEnforcementActions(filters?: {
    status?: string[];
    actionType?: string[];
    bookingId?: string;
    productId?: string;
    renterId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }, page: number = 1, limit: number = 20): Promise<ServiceResponse<{
    data: EnforcementAction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      let query = this.db('enforcement_actions');

      // Apply filters
      if (filters?.status?.length) {
        query = query.whereIn('status', filters.status);
      }
      if (filters?.actionType?.length) {
        query = query.whereIn('action_type', filters.actionType.map(t => t.toLowerCase()));
      }
      if (filters?.bookingId) {
        query = query.where('booking_id', filters.bookingId);
      }
      if (filters?.productId) {
        query = query.where('product_id', filters.productId);
      }
      if (filters?.renterId) {
        query = query.where('renter_id', filters.renterId);
      }
      if (filters?.startDate) {
        query = query.where('created_at', '>=', new Date(filters.startDate));
      }
      if (filters?.endDate) {
        query = query.where('created_at', '<=', new Date(filters.endDate));
      }
      if (filters?.search) {
        query = query.where(function() {
          this.where('message', 'like', `%${filters!.search}%`)
            .orWhere('required_action', 'like', `%${filters!.search}%`);
        });
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = parseInt(totalResult?.count as string || '0');

      // Apply pagination and ordering
      const actions = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      const enforcementActions: EnforcementAction[] = actions.map(action => ({
        id: action.id,
        bookingId: action.booking_id,
        productId: action.product_id,
        renterId: action.renter_id,
        type: action.action_type.toUpperCase() as any,
        severity: action.severity as any,
        message: action.message,
        requiredAction: action.required_action,
        deadline: action.deadline || undefined,
        executedAt: action.executed_at || undefined,
        executedBy: action.executed_by || undefined,
        status: action.status.toUpperCase() as any,
        createdAt: action.created_at
      }));

      return {
        success: true,
        data: {
          data: enforcementActions,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[RiskManagementService] Get all enforcement actions error:', error);
      return { success: false, error: 'Failed to get enforcement actions' };
    }
  }

  // =====================================================
  // RISK MANAGEMENT CONFIGURATION
  // =====================================================

  /**
   * Create risk management configuration
   */
  async createRiskManagementConfig(data: {
    categoryId: string;
    countryId: string;
    lowRiskThreshold?: number;
    mediumRiskThreshold?: number;
    highRiskThreshold?: number;
    criticalRiskThreshold?: number;
    enforcementLevel?: string;
    autoEnforcement?: boolean;
    gracePeriodHours?: number;
    mandatoryInsurance?: boolean;
    minCoverageAmount?: number;
    mandatoryInspection?: boolean;
    inspectionTypes?: string[];
    inspectionDeadlineHours?: number;
  }): Promise<ServiceResponse<RiskManagementConfig>> {
    try {
      const configId = require('uuid').v4();

      const configData = {
        id: configId,
        category_id: data.categoryId,
        country_id: data.countryId,
        low_risk_threshold: data.lowRiskThreshold ?? 30,
        medium_risk_threshold: data.mediumRiskThreshold ?? 60,
        high_risk_threshold: data.highRiskThreshold ?? 85,
        critical_risk_threshold: data.criticalRiskThreshold ?? 95,
        enforcement_level: data.enforcementLevel ?? 'moderate',
        auto_enforcement: data.autoEnforcement ?? true,
        grace_period_hours: data.gracePeriodHours ?? 24,
        mandatory_insurance: data.mandatoryInsurance ?? false,
        min_coverage_amount: data.minCoverageAmount,
        mandatory_inspection: data.mandatoryInspection ?? false,
        inspection_types: JSON.stringify(data.inspectionTypes || []),
        inspection_deadline_hours: data.inspectionDeadlineHours ?? 24,
        compliance_tracking: true,
        violation_penalties: JSON.stringify({
          firstViolation: 50,
          repeatViolation: 100,
          criticalViolation: 200
        }),
        notification_settings: JSON.stringify({
          emailNotifications: true,
          smsNotifications: false,
          inAppNotifications: true,
          escalationThreshold: 3
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.db('risk_management_configs').insert(configData);

      // Get the created config
      const created = await this.db('risk_management_configs')
        .where('id', configId)
        .first();

      const config: RiskManagementConfig = {
        id: created.id,
        categoryId: created.category_id,
        countryId: created.country_id,
        lowRiskThreshold: created.low_risk_threshold,
        mediumRiskThreshold: created.medium_risk_threshold,
        highRiskThreshold: created.high_risk_threshold,
        criticalRiskThreshold: created.critical_risk_threshold,
        enforcementLevel: created.enforcement_level as any,
        autoEnforcement: created.auto_enforcement,
        gracePeriodHours: created.grace_period_hours,
        mandatoryInsurance: created.mandatory_insurance,
        minCoverageAmount: created.min_coverage_amount,
        mandatoryInspection: created.mandatory_inspection,
        inspectionTypes: this.safeParseJsonArray(created.inspection_types),
        inspectionDeadlineHours: created.inspection_deadline_hours,
        complianceTracking: created.compliance_tracking,
        violationPenalties: JSON.parse(created.violation_penalties || '{}'),
        notificationSettings: JSON.parse(created.notification_settings || '{}'),
        isActive: created.is_active,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      };

      return { success: true, data: config };
    } catch (error) {
      console.error('[RiskManagementService] Create config error:', error);
      return { success: false, error: 'Failed to create risk management config' };
    }
  }

  /**
   * Get risk management configuration
   */
  async getRiskManagementConfig(categoryId: string, countryId: string): Promise<ServiceResponse<RiskManagementConfig>> {
    try {
      const config = await this.db('risk_management_configs')
        .where('category_id', categoryId)
        .where('country_id', countryId)
        .where('is_active', true)
        .first();

      if (!config) {
        return { success: false, error: 'Risk management config not found' };
      }

      const riskConfig: RiskManagementConfig = {
        id: config.id,
        categoryId: config.category_id,
        countryId: config.country_id,
        lowRiskThreshold: config.low_risk_threshold,
        mediumRiskThreshold: config.medium_risk_threshold,
        highRiskThreshold: config.high_risk_threshold,
        criticalRiskThreshold: config.critical_risk_threshold,
        enforcementLevel: config.enforcement_level as any,
        autoEnforcement: config.auto_enforcement,
        gracePeriodHours: config.grace_period_hours,
        mandatoryInsurance: config.mandatory_insurance,
        minCoverageAmount: config.min_coverage_amount,
        mandatoryInspection: config.mandatory_inspection,
        inspectionTypes: this.safeParseJsonArray(config.inspection_types),
        inspectionDeadlineHours: config.inspection_deadline_hours,
        complianceTracking: config.compliance_tracking,
        violationPenalties: JSON.parse(config.violation_penalties || '{}'),
        notificationSettings: JSON.parse(config.notification_settings || '{}'),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      };

      return { success: true, data: riskConfig };
    } catch (error) {
      console.error('[RiskManagementService] Get config error:', error);
      return { success: false, error: 'Failed to get risk management config' };
    }
  }

  /**
   * Update risk management configuration
   */
  async updateRiskManagementConfig(
    id: string,
    data: Partial<RiskManagementConfig>
  ): Promise<ServiceResponse<RiskManagementConfig>> {
    try {
      const existing = await this.db('risk_management_configs')
        .where('id', id)
        .first();

      if (!existing) {
        return { success: false, error: 'Risk management config not found' };
      }

      const updateData: any = {
        updated_at: new Date()
      };

      if (data.lowRiskThreshold !== undefined) updateData.low_risk_threshold = data.lowRiskThreshold;
      if (data.mediumRiskThreshold !== undefined) updateData.medium_risk_threshold = data.mediumRiskThreshold;
      if (data.highRiskThreshold !== undefined) updateData.high_risk_threshold = data.highRiskThreshold;
      if (data.criticalRiskThreshold !== undefined) updateData.critical_risk_threshold = data.criticalRiskThreshold;
      if (data.enforcementLevel !== undefined) updateData.enforcement_level = data.enforcementLevel;
      if (data.autoEnforcement !== undefined) updateData.auto_enforcement = data.autoEnforcement;
      if (data.gracePeriodHours !== undefined) updateData.grace_period_hours = data.gracePeriodHours;
      if (data.mandatoryInsurance !== undefined) updateData.mandatory_insurance = data.mandatoryInsurance;
      if (data.minCoverageAmount !== undefined) updateData.min_coverage_amount = data.minCoverageAmount;
      if (data.mandatoryInspection !== undefined) updateData.mandatory_inspection = data.mandatoryInspection;
      if (data.inspectionTypes !== undefined) updateData.inspection_types = JSON.stringify(data.inspectionTypes);
      if (data.inspectionDeadlineHours !== undefined) updateData.inspection_deadline_hours = data.inspectionDeadlineHours;
      if (data.complianceTracking !== undefined) updateData.compliance_tracking = data.complianceTracking;
      if (data.violationPenalties !== undefined) updateData.violation_penalties = JSON.stringify(data.violationPenalties);
      if (data.notificationSettings !== undefined) updateData.notification_settings = JSON.stringify(data.notificationSettings);
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await this.db('risk_management_configs')
        .where('id', id)
        .update(updateData);

      // Get updated config
      const updated = await this.db('risk_management_configs')
        .where('id', id)
        .first();

      const config: RiskManagementConfig = {
        id: updated.id,
        categoryId: updated.category_id,
        countryId: updated.country_id,
        lowRiskThreshold: updated.low_risk_threshold,
        mediumRiskThreshold: updated.medium_risk_threshold,
        highRiskThreshold: updated.high_risk_threshold,
        criticalRiskThreshold: updated.critical_risk_threshold,
        enforcementLevel: updated.enforcement_level as any,
        autoEnforcement: updated.auto_enforcement,
        gracePeriodHours: updated.grace_period_hours,
        mandatoryInsurance: updated.mandatory_insurance,
        minCoverageAmount: updated.min_coverage_amount,
        mandatoryInspection: updated.mandatory_inspection,
        inspectionTypes: this.safeParseJsonArray(updated.inspection_types),
        inspectionDeadlineHours: updated.inspection_deadline_hours,
        complianceTracking: updated.compliance_tracking,
        violationPenalties: JSON.parse(updated.violation_penalties || '{}'),
        notificationSettings: JSON.parse(updated.notification_settings || '{}'),
        isActive: updated.is_active,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      };

      return { success: true, data: config };
    } catch (error) {
      console.error('[RiskManagementService] Update config error:', error);
      return { success: false, error: 'Failed to update risk management config' };
    }
  }

  /**
   * Get all risk management configurations
   */
  async getRiskManagementConfigs(filters: {
    categoryId?: string;
    countryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse<any>> {
    try {
      const { page = 1, limit = 20, categoryId, countryId, isActive } = filters;
      const offset = (page - 1) * limit;

      let query = this.db('risk_management_configs');

      if (categoryId) query = query.where('category_id', categoryId);
      if (countryId) query = query.where('country_id', countryId);
      if (isActive !== undefined) query = query.where('is_active', isActive);

      const total = await query.clone().count('* as count').first();
      const configs = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const transformedConfigs = configs.map(config => ({
        id: config.id,
        categoryId: config.category_id,
        countryId: config.country_id,
        lowRiskThreshold: config.low_risk_threshold,
        mediumRiskThreshold: config.medium_risk_threshold,
        highRiskThreshold: config.high_risk_threshold,
        criticalRiskThreshold: config.critical_risk_threshold,
        enforcementLevel: config.enforcement_level,
        autoEnforcement: config.auto_enforcement,
        gracePeriodHours: config.grace_period_hours,
        mandatoryInsurance: config.mandatory_insurance,
        minCoverageAmount: config.min_coverage_amount,
        mandatoryInspection: config.mandatory_inspection,
        inspectionTypes: this.safeParseJsonArray(config.inspection_types),
        inspectionDeadlineHours: config.inspection_deadline_hours,
        complianceTracking: config.compliance_tracking,
        violationPenalties: JSON.parse(config.violation_penalties || '{}'),
        notificationSettings: JSON.parse(config.notification_settings || '{}'),
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }));

      const totalCount = parseInt(total?.count as string || '0');
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          configs: transformedConfigs,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('[RiskManagementService] Get configs error:', error);
      return { success: false, error: 'Failed to get risk management configs' };
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

  /**
   * Get risk management trends
   */
  async getRiskManagementTrends(period: string = '30d'): Promise<ServiceResponse<any>> {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get trends data
      const [violationsTrend, complianceTrend, assessmentsTrend] = await Promise.all([
        // Violations trend
        this.db('policy_violations')
          .where('created_at', '>=', startDate)
          .select(this.db.raw('DATE(created_at) as date'))
          .count('* as count')
          .groupBy(this.db.raw('DATE(created_at)'))
          .orderBy('date', 'asc'),
        
        // Compliance trend
        this.db('compliance_checks')
          .where('last_checked_at', '>=', startDate)
          .select(this.db.raw('DATE(last_checked_at) as date'))
          .avg('compliance_score as avg_score')
          .groupBy(this.db.raw('DATE(last_checked_at)'))
          .orderBy('date', 'asc'),
        
        // Assessments trend
        this.db('risk_assessments')
          .where('assessment_date', '>=', startDate)
          .select(this.db.raw('DATE(assessment_date) as date'))
          .avg('overall_risk_score as avg_score')
          .groupBy(this.db.raw('DATE(assessment_date)'))
          .orderBy('date', 'asc')
      ]);

      const trends = {
        violations: violationsTrend.map((v: any) => ({
          date: v.date,
          count: parseInt(v.count as string || '0')
        })),
        compliance: complianceTrend.map((c: any) => ({
          date: c.date,
          avgScore: Math.round(parseFloat(c.avg_score as string || '0'))
        })),
        assessments: assessmentsTrend.map((a: any) => ({
          date: a.date,
          avgScore: Math.round(parseFloat(a.avg_score as string || '0'))
        }))
      };

      return { success: true, data: trends };
    } catch (error) {
      console.error('[RiskManagementService] Get trends error:', error);
      return { success: false, error: 'Failed to get trends' };
    }
  }

  /**
   * Get dashboard widgets data
   */
  async getDashboardWidgets(): Promise<ServiceResponse<any>> {
    try {
      const [
        totalProfiles,
        activeViolations,
        pendingEnforcements,
        complianceRate,
        recentViolations,
        recentAssessments
      ] = await Promise.all([
        // Total risk profiles
        this.db('product_risk_profiles')
          .where('is_active', true)
          .count('* as count')
          .first(),
        
        // Active violations
        this.db('policy_violations')
          .where('status', 'active')
          .count('* as count')
          .first(),
        
        // Pending enforcements
        this.db('enforcement_actions')
          .where('status', 'pending')
          .count('* as count')
          .first(),
        
        // Compliance rate
        this.calculateComplianceRate(),
        
        // Recent violations (last 5)
        this.db('policy_violations')
          .orderBy('created_at', 'desc')
          .limit(5)
          .select('id', 'violation_type', 'severity', 'status', 'created_at'),
        
        // Recent assessments (last 5)
        this.db('risk_assessments')
          .orderBy('assessment_date', 'desc')
          .limit(5)
          .select('id', 'overall_risk_score', 'compliance_status', 'assessment_date')
      ]);

      const widgets = {
        totalProfiles: parseInt(totalProfiles?.count as string || '0'),
        activeViolations: parseInt(activeViolations?.count as string || '0'),
        pendingEnforcements: parseInt(pendingEnforcements?.count as string || '0'),
        complianceRate: Math.round(complianceRate),
        recentViolations: recentViolations.map((v: any) => ({
          id: v.id,
          type: v.violation_type,
          severity: v.severity,
          status: v.status,
          createdAt: v.created_at
        })),
        recentAssessments: recentAssessments.map((a: any) => ({
          id: a.id,
          riskScore: a.overall_risk_score,
          complianceStatus: a.compliance_status,
          assessmentDate: a.assessment_date
        }))
      };

      return { success: true, data: widgets };
    } catch (error) {
      console.error('[RiskManagementService] Get dashboard widgets error:', error);
      return { success: false, error: 'Failed to get dashboard widgets' };
    }
  }

  private async calculateComplianceRate(): Promise<number> {
    try {
      const total = await this.db('compliance_checks').count('* as count').first();
      const compliant = await this.db('compliance_checks')
        .where('is_compliant', true)
        .count('* as count')
        .first();
      
      const totalCount = parseInt(total?.count as string || '0');
      const compliantCount = parseInt(compliant?.count as string || '0');
      
      return totalCount > 0 ? (compliantCount / totalCount) * 100 : 0;
    } catch (error) {
      console.error('[RiskManagementService] Calculate compliance rate error:', error);
      return 0;
    }
  }

  private async calculateViolationRate(): Promise<number> {
    try {
      const totalBookings = await this.db('bookings').count('* as count').first();
      const violations = await this.db('policy_violations')
        .where('status', 'active')
        .count('* as count')
        .first();
      
      const totalCount = parseInt(totalBookings?.count as string || '0');
      const violationCount = parseInt(violations?.count as string || '0');
      
      return totalCount > 0 ? (violationCount / totalCount) * 100 : 0;
    } catch (error) {
      console.error('[RiskManagementService] Calculate violation rate error:', error);
      return 0;
    }
  }

  private async calculateAverageRiskScore(): Promise<number> {
    try {
      const result = await this.db('risk_assessments')
        .avg('overall_risk_score as avg')
        .first();
      
      return result?.avg ? Math.round(parseFloat(result.avg as string)) : 0;
    } catch (error) {
      console.error('[RiskManagementService] Calculate average risk score error:', error);
      return 0;
    }
  }

  private async getEnforcementActionStats() {
    try {
      const total = await this.db('enforcement_actions').count('* as count').first();
      const successful = await this.db('enforcement_actions')
        .where('status', 'executed')
        .count('* as count')
        .first();
      const failed = await this.db('enforcement_actions')
        .where('status', 'failed')
        .count('* as count')
        .first();
      const pending = await this.db('enforcement_actions')
        .where('status', 'pending')
        .count('* as count')
        .first();
      
      return {
        total: parseInt(total?.count as string || '0'),
        successful: parseInt(successful?.count as string || '0'),
        failed: parseInt(failed?.count as string || '0'),
        pending: parseInt(pending?.count as string || '0')
      };
    } catch (error) {
      console.error('[RiskManagementService] Get enforcement action stats error:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0
      };
    }
  }

  private async getRiskDistribution() {
    try {
      const low = await this.db('product_risk_profiles')
        .where('risk_level', 'low')
        .where('is_active', true)
        .count('* as count')
        .first();
      const medium = await this.db('product_risk_profiles')
        .where('risk_level', 'medium')
        .where('is_active', true)
        .count('* as count')
        .first();
      const high = await this.db('product_risk_profiles')
        .where('risk_level', 'high')
        .where('is_active', true)
        .count('* as count')
        .first();
      const critical = await this.db('product_risk_profiles')
        .where('risk_level', 'critical')
        .where('is_active', true)
        .count('* as count')
        .first();
      
      return {
        low: parseInt(low?.count as string || '0'),
        medium: parseInt(medium?.count as string || '0'),
        high: parseInt(high?.count as string || '0'),
        critical: parseInt(critical?.count as string || '0')
      };
    } catch (error) {
      console.error('[RiskManagementService] Get risk distribution error:', error);
      return {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };
    }
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
