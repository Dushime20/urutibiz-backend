import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import RiskManagementService from '@/services/riskManagement.service';
import { AuthenticatedRequest } from '@/types';
import { Request, Response } from 'express';
import {
  CreateRiskProfileRequest,
  UpdateRiskProfileRequest,
  RiskAssessmentRequest,
  ComplianceCheckRequest,
  PolicyViolationRequest
} from '@/types/riskManagement.types';

export class RiskManagementController extends BaseController {

  // =====================================================
  // RISK PROFILE MANAGEMENT
  // =====================================================

  /**
   * Create a new risk profile for a product
   * POST /api/v1/risk-management/profiles
   */
  public createRiskProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const profileData: CreateRiskProfileRequest = req.body;
    
    // Validate required fields
    if (!profileData.productId || !profileData.categoryId || !profileData.riskLevel) {
      return this.handleBadRequest(res, 'Missing required fields: productId, categoryId, riskLevel');
    }

    const result = await RiskManagementService.createRiskProfile(profileData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create risk profile', 400);
    }

    this.logAction('CREATE_RISK_PROFILE', req.user.id, result.data.id, profileData);

    return ResponseHelper.success(res, 'Risk profile created successfully', result.data);
  });

  /**
   * Get risk profile by product ID
   * GET /api/v1/risk-management/profiles/product/:productId
   */
  public getRiskProfileByProduct = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;

    const result = await RiskManagementService.getRiskProfileByProduct(productId);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Risk profile');
    }

    this.logAction('GET_RISK_PROFILE', req.user.id, productId);

    return ResponseHelper.success(res, 'Risk profile retrieved successfully', result.data);
  });

  /**
   * Get all risk profiles with pagination and filtering
   * GET /api/v1/risk-management/profiles
   */
  public getRiskProfiles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      riskLevel: req.query.riskLevel as string,
      categoryId: req.query.categoryId as string,
      search: req.query.search as string
    };

    const result = await RiskManagementService.getRiskProfiles(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get risk profiles', 400);
    }

    this.logAction('GET_RISK_PROFILES', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Risk profiles retrieved successfully', result.data);
  });

  // =====================================================
  // RISK ASSESSMENT
  // =====================================================

  /**
   * Perform risk assessment
   * POST /api/v1/risk-management/assess
   */
  public assessRisk = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const assessmentData: RiskAssessmentRequest = req.body;
    
    // Validate required fields
    if (!assessmentData.productId || !assessmentData.renterId) {
      return this.handleBadRequest(res, 'Missing required fields: productId, renterId');
    }

    const result = await RiskManagementService.assessRisk(assessmentData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to assess risk', 400);
    }

    this.logAction('ASSESS_RISK', req.user.id, assessmentData.productId, assessmentData);

    return ResponseHelper.success(res, 'Risk assessment completed successfully', result.data);
  });

  // =====================================================
  // COMPLIANCE CHECKING
  // =====================================================

  /**
   * Check compliance for a booking
   * POST /api/v1/risk-management/compliance/check
   */
  public checkCompliance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const complianceData: ComplianceCheckRequest = req.body;
    
    // Validate required fields
    if (!complianceData.bookingId || !complianceData.productId || !complianceData.renterId) {
      return this.handleBadRequest(res, 'Missing required fields: bookingId, productId, renterId');
    }

    const result = await RiskManagementService.checkCompliance(complianceData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to check compliance', 400);
    }

    this.logAction('CHECK_COMPLIANCE', req.user.id, complianceData.bookingId, complianceData);

    return ResponseHelper.success(res, 'Compliance check completed successfully', result.data);
  });

  /**
   * Get compliance status for a booking
   * GET /api/v1/risk-management/compliance/booking/:bookingId
   */
  public getComplianceStatus = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    // Get booking details to extract product and renter IDs
    const db = require('@/config/database').getDatabase();
    const booking = await db('bookings').where('id', bookingId).first();
    
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    const complianceData: ComplianceCheckRequest = {
      bookingId,
      productId: booking.product_id,
      renterId: booking.renter_id,
      forceCheck: true
    };

    const result = await RiskManagementService.checkCompliance(complianceData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get compliance status', 400);
    }

    this.logAction('GET_COMPLIANCE_STATUS', req.user.id, bookingId);

    return ResponseHelper.success(res, 'Compliance status retrieved successfully', result.data);
  });

  // =====================================================
  // POLICY VIOLATION MANAGEMENT
  // =====================================================

  /**
   * Record a policy violation
   * POST /api/v1/risk-management/violations
   */
  public recordViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const violationData: PolicyViolationRequest = req.body;
    
    // Validate required fields
    if (!violationData.bookingId || !violationData.productId || !violationData.renterId || 
        !violationData.violationType || !violationData.severity || !violationData.description) {
      return this.handleBadRequest(res, 'Missing required fields: bookingId, productId, renterId, violationType, severity, description');
    }

    const result = await RiskManagementService.recordViolation(violationData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to record violation', 400);
    }

    this.logAction('RECORD_VIOLATION', req.user.id, violationData.bookingId, violationData);

    return ResponseHelper.success(res, 'Policy violation recorded successfully', result.data);
  });

  /**
   * Get policy violations with pagination and filtering
   * GET /api/v1/risk-management/violations
   */
  public getViolations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      severity: req.query.severity as string,
      bookingId: req.query.bookingId as string,
      productId: req.query.productId as string
    };

    const result = await RiskManagementService.getViolations(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get violations', 400);
    }

    this.logAction('GET_VIOLATIONS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Violations retrieved successfully', result.data);
  });

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get risk management statistics
   * GET /api/v1/risk-management/stats
   */
  public getRiskManagementStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await RiskManagementService.getRiskManagementStats();
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get statistics', 400);
    }

    this.logAction('GET_RISK_STATS', req.user.id);

    return ResponseHelper.success(res, 'Risk management statistics retrieved successfully', result.data);
  });

  // =====================================================
  // AUTOMATED ENFORCEMENT
  // =====================================================

  /**
   * Trigger automated compliance enforcement
   * POST /api/v1/risk-management/enforce
   */
  public triggerEnforcement = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return this.handleBadRequest(res, 'Missing required field: bookingId');
    }

    // Get booking details
    const db = require('@/config/database').getDatabase();
    const booking = await db('bookings').where('id', bookingId).first();
    
    if (!booking) {
      return this.handleNotFound(res, 'Booking');
    }

    // Check compliance
    const complianceData: ComplianceCheckRequest = {
      bookingId,
      productId: booking.product_id,
      renterId: booking.renter_id,
      forceCheck: true
    };

    const complianceResult = await RiskManagementService.checkCompliance(complianceData);
    
    if (!complianceResult.success) {
      return ResponseHelper.error(res, complianceResult.error || 'Failed to check compliance', 400);
    }

    const compliance = complianceResult.data!;

    // If not compliant, record violations
    if (!compliance.isCompliant) {
      for (const requirement of compliance.missingRequirements) {
        const violationData: PolicyViolationRequest = {
          bookingId,
          productId: booking.product_id,
          renterId: booking.renter_id,
          violationType: requirement,
          severity: 'high',
          description: `Missing ${requirement.toLowerCase().replace('_', ' ')}`,
          penaltyAmount: 100
        };

        await RiskManagementService.recordViolation(violationData);
      }
    }

    this.logAction('TRIGGER_ENFORCEMENT', req.user.id, bookingId);

    return ResponseHelper.success(res, 'Enforcement triggered successfully', {
      compliance: compliance,
      violationsRecorded: compliance.missingRequirements.length
    });
  });

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  /**
   * Bulk create risk profiles for products
   * POST /api/v1/risk-management/profiles/bulk
   */
  public bulkCreateRiskProfiles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { profiles } = req.body;
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return this.handleBadRequest(res, 'profiles array is required and must not be empty');
    }

    const results = [];
    const errors = [];

    for (const profileData of profiles) {
      const result = await RiskManagementService.createRiskProfile(profileData);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          profile: profileData,
          error: result.error
        });
      }
    }

    this.logAction('BULK_CREATE_RISK_PROFILES', req.user.id, null, { count: profiles.length });

    return ResponseHelper.success(res, 'Bulk risk profile creation completed', {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  });

  /**
   * Bulk assess risk for multiple products/renters
   * POST /api/v1/risk-management/assess/bulk
   */
  public bulkAssessRisk = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { assessments } = req.body;
    
    if (!Array.isArray(assessments) || assessments.length === 0) {
      return this.handleBadRequest(res, 'assessments array is required and must not be empty');
    }

    const results = [];
    const errors = [];

    for (const assessmentData of assessments) {
      const result = await RiskManagementService.assessRisk(assessmentData);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          assessment: assessmentData,
          error: result.error
        });
      }
    }

    this.logAction('BULK_ASSESS_RISK', req.user.id, null, { count: assessments.length });

    return ResponseHelper.success(res, 'Bulk risk assessment completed', {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  });
}

export default new RiskManagementController();
