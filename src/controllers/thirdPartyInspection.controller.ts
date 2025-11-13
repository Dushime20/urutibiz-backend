import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/responseHelper';
import ThirdPartyInspectionService from '@/services/thirdPartyInspection.service';
import { AuthenticatedRequest } from '@/types';
import {
  ThirdPartyInspectionRequest,
  CompleteThirdPartyInspectionRequest,
  CreateCriteriaTemplateRequest,
  CreateInspectorCertificationRequest
} from '@/types/thirdPartyInspection.types';

export class ThirdPartyInspectionController extends BaseController {
  /**
   * Create a third-party professional inspection
   * POST /api/v1/third-party-inspections
   */
  public createThirdPartyInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const userId = req.user.id;
    const body = req.body as ThirdPartyInspectionRequest;

    // Validate required fields
    if (!body.productId || !body.categoryId || !body.scheduledAt) {
      return ResponseHelper.error(res, 'Missing required fields: productId, categoryId, scheduledAt', 400);
    }

    const result = await ThirdPartyInspectionService.createThirdPartyInspection(body, userId);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to create third-party inspection', 400);
    }

    this.logAction('CREATE_THIRD_PARTY_INSPECTION', userId, result.data?.id, body);

    return ResponseHelper.success(res, 'Third-party inspection created successfully', result.data);
  });

  /**
   * Complete a third-party inspection
   * POST /api/v1/third-party-inspections/:id/complete
   */
  public completeThirdPartyInspection = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const body = req.body as CompleteThirdPartyInspectionRequest;

    // Validate required fields
    if (!body.scores || !Array.isArray(body.scores) || body.scores.length === 0) {
      return ResponseHelper.error(res, 'Missing required field: scores (array)', 400);
    }

    if (body.isPassed === undefined) {
      return ResponseHelper.error(res, 'Missing required field: isPassed', 400);
    }

    body.inspectionId = id;

    const result = await ThirdPartyInspectionService.completeThirdPartyInspection(body);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to complete inspection', 400);
    }

    this.logAction('COMPLETE_THIRD_PARTY_INSPECTION', userId, id, {
      score: result.data?.inspection?.inspectionScore,
      rating: result.data?.inspection?.overallRating
    });

    return ResponseHelper.success(res, 'Inspection completed successfully', result.data);
  });

  /**
   * Get criteria template for a category
   * GET /api/v1/third-party-inspections/criteria/:categoryId
   */
  public getCriteriaTemplate = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId } = req.params;

    const result = await ThirdPartyInspectionService.getCriteriaTemplate(categoryId);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get criteria template', 400);
    }

    return ResponseHelper.success(res, 'Criteria template retrieved successfully', result.data);
  });

  /**
   * Get public inspection report for a product
   * GET /api/v1/third-party-inspections/public-reports/:productId
   */
  public getPublicReport = this.asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const result = await ThirdPartyInspectionService.getPublicReport(productId);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get public report', 400);
    }

    // Increment view count if report exists
    if (result.data) {
      const { PublicInspectionReportRepository } = await import('@/repositories/PublicInspectionReportRepository');
      const reportRepo = new PublicInspectionReportRepository();
      await reportRepo.incrementViewCount(result.data.id);
    }

    return ResponseHelper.success(res, 'Public report retrieved successfully', result.data);
  });

  /**
   * Get all public reports for a product
   * GET /api/v1/third-party-inspections/public-reports/:productId/all
   */
  public getPublicReports = this.asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const result = await ThirdPartyInspectionService.getPublicReports(productId);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to get public reports', 400);
    }

    return ResponseHelper.success(res, 'Public reports retrieved successfully', result.data);
  });
}

export default new ThirdPartyInspectionController();

