import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ResponseHelper } from '@/utils/response';
import ThirdPartyInspectionService from '@/services/thirdPartyInspection.service';
import { AuthenticatedRequest } from '@/types';
import {
  ThirdPartyInspectionRequest,
  CompleteThirdPartyInspectionRequest
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
    if (!body.productId || !body.categoryId || !body.scheduledAt || !body.bookingId) {
      return ResponseHelper.error(res, 'Missing required fields: productId, categoryId, scheduledAt, bookingId', 400);
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

  /**
   * Process payment for inspection
   * POST /api/v1/third-party-inspections/:id/pay
   */
  public processInspectionPayment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (this.handleValidationErrors(req as any, res)) return;

    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethodId, amount, currency, provider } = req.body;

    if (!paymentMethodId || !amount || !currency) {
      return ResponseHelper.error(res, 'Missing required fields: paymentMethodId, amount, currency', 400);
    }

    const result = await ThirdPartyInspectionService.processInspectionPayment(
      id,
      { paymentMethodId, amount, currency, provider },
      userId
    );

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Payment processing failed', 400);
    }

    this.logAction('PROCESS_INSPECTION_PAYMENT', userId, id, { amount, currency });

    return ResponseHelper.success(res, 'Inspection payment processed successfully', result.data);
  });

  /**
   * Get bookings for product owner (to select booking for inspection)
   * GET /api/v1/third-party-inspections/bookings/:productId
   */
  public getOwnerBookings = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await ThirdPartyInspectionService.getOwnerBookings(productId, userId);

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to retrieve bookings', 400);
    }

    return ResponseHelper.success(res, 'Bookings retrieved successfully', result.data);
  });

  /**
   * Get available inspectors for a category and location
   * GET /api/v1/third-party-inspections/available-inspectors
   */
  public getAvailableInspectors = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId, countryId, region, latitude, longitude, preferredLanguage } = req.query;

    if (!categoryId) {
      return ResponseHelper.error(res, 'Missing required parameter: categoryId', 400);
    }

    const locationParams = {
      countryId: countryId as string | undefined,
      region: region as string | undefined,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      preferredLanguage: preferredLanguage as string | undefined
    };

    const result = await ThirdPartyInspectionService.getAvailableInspectors(
      categoryId as string,
      Object.keys(locationParams).some(key => locationParams[key as keyof typeof locationParams] !== undefined)
        ? locationParams
        : undefined
    );

    if (!result.success) {
      return ResponseHelper.error(res, result.error || 'Failed to retrieve available inspectors', 400);
    }

    return ResponseHelper.success(res, 'Available inspectors retrieved successfully', result.data);
  });
}

export default new ThirdPartyInspectionController();

