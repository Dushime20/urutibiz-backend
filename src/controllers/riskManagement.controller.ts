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
   * Get risk profile by ID
   * GET /api/v1/risk-management/profiles/:id
   */
  public getRiskProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await RiskManagementService.getRiskProfile(id);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Risk profile');
    }

    this.logAction('GET_RISK_PROFILE_BY_ID', req.user.id, id);

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

  /**
   * Update a risk profile
   * PUT /api/v1/risk-management/profiles/:id
   */
  public updateRiskProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updateData: UpdateRiskProfileRequest = req.body;

    const result = await RiskManagementService.updateRiskProfile(id, updateData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update risk profile', 400);
    }

    this.logAction('UPDATE_RISK_PROFILE', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'Risk profile updated successfully', result.data);
  });

  /**
   * Soft delete a risk profile (mark as inactive)
   * DELETE /api/v1/risk-management/profiles/:id
   */
  public deleteRiskProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await RiskManagementService.deleteRiskProfile(id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to delete risk profile', 400);
    }

    this.logAction('DELETE_RISK_PROFILE', req.user.id, id);

    return ResponseHelper.success(res, 'Risk profile deleted successfully', result.data);
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

  /**
   * Get risk assessments with pagination and filtering
   * GET /api/v1/risk-management/assessments
   */
  public getRiskAssessments = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      productId: req.query.productId as string,
      renterId: req.query.renterId as string,
      bookingId: req.query.bookingId as string,
      riskLevel: req.query.riskLevel as string,
      complianceStatus: req.query.complianceStatus as string
    };

    const result = await RiskManagementService.getRiskAssessments(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get assessments', 400);
    }

    this.logAction('GET_RISK_ASSESSMENTS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Assessments retrieved successfully', result.data);
  });

  /**
   * Get risk assessment by ID
   * GET /api/v1/risk-management/assessments/:id
   */
  public getRiskAssessment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await RiskManagementService.getRiskAssessment(id);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Risk assessment');
    }

    this.logAction('GET_RISK_ASSESSMENT', req.user.id, id);

    return ResponseHelper.success(res, 'Assessment retrieved successfully', result.data);
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

    const result = await RiskManagementService.getComplianceStatus(bookingId);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get compliance status', 400);
    }

    this.logAction('GET_COMPLIANCE_STATUS', req.user.id, bookingId);

    return ResponseHelper.success(res, 'Compliance status retrieved successfully', result.data);
  });

  /**
   * Get compliance checks with pagination and filtering
   * GET /api/v1/risk-management/compliance/checks
   */
  public getComplianceChecks = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      bookingId: req.query.bookingId as string,
      productId: req.query.productId as string,
      renterId: req.query.renterId as string,
      complianceStatus: req.query.complianceStatus as string
    };

    const result = await RiskManagementService.getComplianceChecks(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get compliance checks', 400);
    }

    this.logAction('GET_COMPLIANCE_CHECKS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Compliance checks retrieved successfully', result.data);
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

  /**
   * Get violation by ID
   * GET /api/v1/risk-management/violations/:id
   */
  public getViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await RiskManagementService.getViolation(id);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Violation');
    }

    this.logAction('GET_VIOLATION', req.user.id, id);

    return ResponseHelper.success(res, 'Violation retrieved successfully', result.data);
  });

  /**
   * Update a policy violation
   * PUT /api/v1/risk-management/violations/:id
   */
  public updateViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updateData = req.body;

    const result = await RiskManagementService.updateViolation(id, updateData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update violation', 400);
    }

    this.logAction('UPDATE_VIOLATION', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'Violation updated successfully', result.data);
  });

  /**
   * Assign violation to inspector
   * PATCH /api/v1/risk-management/violations/:id/assign
   */
  public assignViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const { inspectorId } = req.body;

    if (!inspectorId) {
      return this.handleBadRequest(res, 'Missing required field: inspectorId');
    }

    const result = await RiskManagementService.assignViolation(id, inspectorId);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to assign violation', 400);
    }

    this.logAction('ASSIGN_VIOLATION', req.user.id, id, { inspectorId });

    return ResponseHelper.success(res, 'Violation assigned successfully', result.data);
  });

  /**
   * Resolve a policy violation
   * POST /api/v1/risk-management/violations/:id/resolve
   */
  public resolveViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const resolutionData = req.body;

    // Validate required fields
    if (!resolutionData.resolutionActions || !Array.isArray(resolutionData.resolutionActions)) {
      return this.handleBadRequest(res, 'Missing required field: resolutionActions (array)');
    }

    const result = await RiskManagementService.resolveViolation(id, resolutionData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to resolve violation', 400);
    }

    this.logAction('RESOLVE_VIOLATION', req.user.id, id, resolutionData);

    return ResponseHelper.success(res, 'Violation resolved successfully', result.data);
  });

  /**
   * Delete violation (soft delete)
   * DELETE /api/v1/risk-management/violations/:id
   */
  public deleteViolation = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const result = await RiskManagementService.deleteViolation(id);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to delete violation', 400);
    }

    this.logAction('DELETE_VIOLATION', req.user.id, id);

    return ResponseHelper.success(res, 'Violation deleted successfully');
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

  /**
   * Get risk management trends
   * GET /api/v1/risk-management/trends
   */
  public getRiskManagementTrends = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const period = (req.query.period as string) || '30d';

    const result = await RiskManagementService.getRiskManagementTrends(period);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get trends', 400);
    }

    this.logAction('GET_RISK_MANAGEMENT_TRENDS', req.user.id, null, { period });

    return ResponseHelper.success(res, 'Trends retrieved successfully', result.data);
  });

  /**
   * Get dashboard widgets data
   * GET /api/v1/risk-management/dashboard/widgets
   */
  public getDashboardWidgets = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await RiskManagementService.getDashboardWidgets();
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get dashboard widgets', 400);
    }

    this.logAction('GET_DASHBOARD_WIDGETS', req.user.id);

    return ResponseHelper.success(res, 'Dashboard widgets retrieved successfully', result.data);
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

    // If not compliant, record violations and execute enforcement actions
    let violationsRecorded = 0;
    let actionsExecuted = 0;

    if (!compliance.isCompliant) {
      // Record violations for missing requirements
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

        const violationResult = await RiskManagementService.recordViolation(violationData);
        if (violationResult.success) {
          violationsRecorded++;
        }
      }

      // Execute enforcement actions if auto-enforcement is enabled
      const riskProfile = await RiskManagementService.getRiskProfileByProduct(booking.product_id);
      if (riskProfile.success && riskProfile.data?.autoEnforcement) {
        for (const action of compliance.enforcementActions) {
          if (action.status === 'PENDING') {
            const executeResult = await RiskManagementService.executeEnforcementAction(action.id);
            if (executeResult.success && executeResult.data?.status === 'executed') {
              actionsExecuted++;
            }
          }
        }
      }
    }

    this.logAction('TRIGGER_ENFORCEMENT', req.user.id, bookingId, {
      violationsRecorded,
      actionsExecuted
    });

    return ResponseHelper.success(res, 'Enforcement triggered successfully', {
      compliance: compliance,
      violationsRecorded,
      actionsExecuted
    });
  });

  /**
   * Execute a specific enforcement action
   * POST /api/v1/risk-management/enforce/:actionId
   */
  public executeEnforcementAction = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { actionId } = req.params;

    const result = await RiskManagementService.executeEnforcementAction(actionId);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to execute enforcement action', 400);
    }

    this.logAction('EXECUTE_ENFORCEMENT_ACTION', req.user.id, actionId);

    return ResponseHelper.success(res, 'Enforcement action executed successfully', result.data);
  });

  /**
   * Approve enforcement action
   * PATCH /api/v1/risk-management/enforce/:id/approve
   */
  public approveEnforcementAction = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const approverId = req.user.id;

    const result = await RiskManagementService.approveEnforcementAction(id, approverId);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to approve enforcement action', 400);
    }

    this.logAction('APPROVE_ENFORCEMENT_ACTION', req.user.id, id);

    return ResponseHelper.success(res, 'Enforcement action approved successfully', result.data);
  });

  /**
   * Get enforcement actions for a booking
   * GET /api/v1/risk-management/enforce/booking/:bookingId
   */
  public getEnforcementActions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    const result = await RiskManagementService.getEnforcementActions(bookingId);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get enforcement actions', 400);
    }

    this.logAction('GET_ENFORCEMENT_ACTIONS', req.user.id, bookingId);

    return ResponseHelper.success(res, 'Enforcement actions retrieved successfully', result.data);
  });

  /**
   * Get all enforcement actions with filters and pagination
   * GET /api/v1/risk-management/enforce
   */
  public getAllEnforcementActions = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = this.getPaginationParams(req as any);
    const filters = {
      status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[] : undefined,
      actionType: req.query.actionType ? (Array.isArray(req.query.actionType) ? req.query.actionType : [req.query.actionType]) as string[] : undefined,
      bookingId: req.query.bookingId as string | undefined,
      productId: req.query.productId as string | undefined,
      renterId: req.query.renterId as string | undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined
    };

    const result = await RiskManagementService.getAllEnforcementActions(filters, page, limit);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get enforcement actions', 400);
    }

    this.logAction('GET_ALL_ENFORCEMENT_ACTIONS', req.user.id, null, { filters, pagination: { page, limit } });

    return this.formatPaginatedResponse(res, 'Enforcement actions retrieved successfully', result.data);
  });

  // =====================================================
  // RISK MANAGEMENT CONFIGURATION
  // =====================================================

  /**
   * Create risk management configuration
   * POST /api/v1/risk-management/configs
   */
  public createRiskManagementConfig = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const configData = req.body;

    // Validate required fields
    if (!configData.categoryId || !configData.countryId) {
      return this.handleBadRequest(res, 'Missing required fields: categoryId, countryId');
    }

    const result = await RiskManagementService.createRiskManagementConfig(configData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create risk management config', 400);
    }

    this.logAction('CREATE_RISK_CONFIG', req.user.id, result.data.id, configData);

    return ResponseHelper.success(res, 'Risk management config created successfully', result.data);
  });

  /**
   * Get risk management configuration
   * GET /api/v1/risk-management/configs/:categoryId/:countryId
   */
  public getRiskManagementConfig = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId, countryId } = req.params;

    const result = await RiskManagementService.getRiskManagementConfig(categoryId, countryId);
    
    if (!result.success) {
      return this.handleNotFound(res, 'Risk management config');
    }

    this.logAction('GET_RISK_CONFIG', req.user.id, `${categoryId}/${countryId}`);

    return ResponseHelper.success(res, 'Risk management config retrieved successfully', result.data);
  });

  /**
   * Update risk management configuration
   * PUT /api/v1/risk-management/configs/:id
   */
  public updateRiskManagementConfig = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const updateData = req.body;

    const result = await RiskManagementService.updateRiskManagementConfig(id, updateData);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to update risk management config', 400);
    }

    this.logAction('UPDATE_RISK_CONFIG', req.user.id, id, updateData);

    return ResponseHelper.success(res, 'Risk management config updated successfully', result.data);
  });

  /**
   * Get all risk management configurations
   * GET /api/v1/risk-management/configs
   */
  public getRiskManagementConfigs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      categoryId: req.query.categoryId as string,
      countryId: req.query.countryId as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };

    const result = await RiskManagementService.getRiskManagementConfigs(filters);
    
    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get risk management configs', 400);
    }

    this.logAction('GET_RISK_CONFIGS', req.user.id, null, filters);

    return ResponseHelper.success(res, 'Risk management configs retrieved successfully', result.data);
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
