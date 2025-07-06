/**
 * Insurance Controller
 * HTTP request handlers for insurance policies and claims
 */

import { Request, Response } from 'express';
import { InsuranceService } from '../services/InsuranceService';
import {
  CreateInsurancePolicyRequest,
  UpdateInsurancePolicyRequest,
  CreateInsuranceClaimRequest,
  UpdateInsuranceClaimRequest,
  InsurancePolicyFilters,
  InsuranceClaimFilters,
  InsurancePolicyError,
  InsuranceClaimError
} from '../types/insurance.types';

export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  // ==================== INSURANCE POLICIES ====================

  /**
   * Create a new insurance policy
   * POST /api/v1/insurance/policies
   */
  async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      const policyData: CreateInsurancePolicyRequest = req.body;
      const policy = await this.insuranceService.createPolicy(policyData);

      res.status(201).json({
        success: true,
        message: 'Insurance policy created successfully',
        data: policy
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get insurance policy by ID
   * GET /api/v1/insurance/policies/:id
   */
  async getPolicyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const policy = await this.insuranceService.getPolicyById(id);

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get insurance policies with filters
   * GET /api/v1/insurance/policies
   */
  async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      const filters: InsurancePolicyFilters = {};
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Extract filters from query parameters
      if (req.query.bookingId) filters.bookingId = req.query.bookingId as string;
      if (req.query.insuranceType) filters.insuranceType = req.query.insuranceType as any;
      if (req.query.status) filters.status = req.query.status as any;
      if (req.query.providerName) filters.providerName = req.query.providerName as string;
      if (req.query.validFrom) filters.validFrom = new Date(req.query.validFrom as string);
      if (req.query.validUntil) filters.validUntil = new Date(req.query.validUntil as string);
      if (req.query.createdAfter) filters.createdAfter = new Date(req.query.createdAfter as string);
      if (req.query.createdBefore) filters.createdBefore = new Date(req.query.createdBefore as string);

      const result = await this.insuranceService.getPolicies(filters, page, limit);

      res.json({
        success: true,
        data: result.policies,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get policies by booking ID
   * GET /api/v1/insurance/policies/booking/:bookingId
   */
  async getPoliciesByBookingId(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const policies = await this.insuranceService.getPoliciesByBookingId(bookingId);

      res.json({
        success: true,
        data: policies
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Update insurance policy
   * PUT /api/v1/insurance/policies/:id
   */
  async updatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateInsurancePolicyRequest = req.body;
      const policy = await this.insuranceService.updatePolicy(id, updateData);

      res.json({
        success: true,
        message: 'Insurance policy updated successfully',
        data: policy
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Cancel insurance policy
   * POST /api/v1/insurance/policies/:id/cancel
   */
  async cancelPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const policy = await this.insuranceService.cancelPolicy(id, reason);

      res.json({
        success: true,
        message: 'Insurance policy cancelled successfully',
        data: policy
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ==================== INSURANCE CLAIMS ====================

  /**
   * Create a new insurance claim
   * POST /api/v1/insurance/claims
   */
  async createClaim(req: Request, res: Response): Promise<void> {
    try {
      const claimData: CreateInsuranceClaimRequest = req.body;
      const claim = await this.insuranceService.createClaim(claimData);

      res.status(201).json({
        success: true,
        message: 'Insurance claim submitted successfully',
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get insurance claim by ID
   * GET /api/v1/insurance/claims/:id
   */
  async getClaimById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const claim = await this.insuranceService.getClaimById(id);

      res.json({
        success: true,
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get insurance claims with filters
   * GET /api/v1/insurance/claims
   */
  async getClaims(req: Request, res: Response): Promise<void> {
    try {
      const filters: InsuranceClaimFilters = {};
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Extract filters from query parameters
      if (req.query.policyId) filters.policyId = req.query.policyId as string;
      if (req.query.bookingId) filters.bookingId = req.query.bookingId as string;
      if (req.query.claimantId) filters.claimantId = req.query.claimantId as string;
      if (req.query.status) filters.status = req.query.status as any;
      if (req.query.processedBy) filters.processedBy = req.query.processedBy as string;
      if (req.query.incidentDateAfter) filters.incidentDateAfter = new Date(req.query.incidentDateAfter as string);
      if (req.query.incidentDateBefore) filters.incidentDateBefore = new Date(req.query.incidentDateBefore as string);
      if (req.query.createdAfter) filters.createdAfter = new Date(req.query.createdAfter as string);
      if (req.query.createdBefore) filters.createdBefore = new Date(req.query.createdBefore as string);
      if (req.query.minClaimAmount) filters.minClaimAmount = parseFloat(req.query.minClaimAmount as string);
      if (req.query.maxClaimAmount) filters.maxClaimAmount = parseFloat(req.query.maxClaimAmount as string);
      if (req.query.aiFraudScoreMin) filters.aiFraudScoreMin = parseFloat(req.query.aiFraudScoreMin as string);
      if (req.query.aiFraudScoreMax) filters.aiFraudScoreMax = parseFloat(req.query.aiFraudScoreMax as string);

      const result = await this.insuranceService.getClaims(filters, page, limit);

      res.json({
        success: true,
        data: result.claims,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get claims by claimant ID
   * GET /api/v1/insurance/claims/claimant/:claimantId
   */
  async getClaimsByClaimantId(req: Request, res: Response): Promise<void> {
    try {
      const { claimantId } = req.params;
      const claims = await this.insuranceService.getClaimsByClaimantId(claimantId);

      res.json({
        success: true,
        data: claims
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Update insurance claim
   * PUT /api/v1/insurance/claims/:id
   */
  async updateClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateInsuranceClaimRequest = req.body;
      const claim = await this.insuranceService.updateClaim(id, updateData);

      res.json({
        success: true,
        message: 'Insurance claim updated successfully',
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Approve insurance claim
   * POST /api/v1/insurance/claims/:id/approve
   */
  async approveClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approvedAmount, processedBy, notes } = req.body;

      if (!approvedAmount || !processedBy) {
        res.status(400).json({
          success: false,
          error: 'Approved amount and processor ID are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      const claim = await this.insuranceService.approveClaim(id, approvedAmount, processedBy, notes);

      res.json({
        success: true,
        message: 'Insurance claim approved successfully',
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Deny insurance claim
   * POST /api/v1/insurance/claims/:id/deny
   */
  async denyClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { processedBy, reason } = req.body;

      if (!processedBy || !reason) {
        res.status(400).json({
          success: false,
          error: 'Processor ID and denial reason are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      const claim = await this.insuranceService.denyClaim(id, processedBy, reason);

      res.json({
        success: true,
        message: 'Insurance claim denied',
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Mark claim as paid
   * POST /api/v1/insurance/claims/:id/mark-paid
   */
  async markClaimAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const claim = await this.insuranceService.markClaimAsPaid(id);

      res.json({
        success: true,
        message: 'Insurance claim marked as paid',
        data: claim
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get insurance analytics
   * GET /api/v1/insurance/analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      let dateRange: { from: Date; to: Date } | undefined;

      if (req.query.from && req.query.to) {
        dateRange = {
          from: new Date(req.query.from as string),
          to: new Date(req.query.to as string)
        };
      }

      const analytics = await this.insuranceService.getInsuranceAnalytics(dateRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get insurance types
   * GET /api/v1/insurance/types
   */
  async getInsuranceTypes(_req: Request, res: Response): Promise<void> {
    try {
      const types = [
        'travel_insurance',
        'cancellation_insurance',
        'medical_insurance',
        'baggage_insurance',
        'activity_insurance',
        'comprehensive_insurance',
        'liability_insurance'
      ];

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get claim statuses
   * GET /api/v1/insurance/claim-statuses
   */
  async getClaimStatuses(_req: Request, res: Response): Promise<void> {
    try {
      const statuses = [
        'submitted',
        'investigating',
        'approved',
        'denied',
        'paid'
      ];

      res.json({
        success: true,
        data: statuses
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, res: Response): void {
    console.error('Insurance controller error:', error);

    if (error instanceof InsurancePolicyError || error instanceof InsuranceClaimError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}
