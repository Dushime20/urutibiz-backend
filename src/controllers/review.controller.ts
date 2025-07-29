// =====================================================
// REVIEW CONTROLLER
// =====================================================

import { Request, Response } from 'express';
import { 
  CreateReviewData, 
  UpdateReviewData, 
  ReviewSearchParams,
  ModerationAction 
} from '../types/review.types';
import { ReviewService } from '../services/ReviewService';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * Create a new review
   * POST /api/reviews
   */
  createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewData: CreateReviewData = req.body;
      
      // Log the incoming request data
      console.log('Review creation request:', {
        body: req.body,
        user: (req as any).user,
        headers: req.headers
      });
      
      // Add reviewer ID from authenticated user (in production, from auth middleware)
      if (!reviewData.reviewerId && (req as any).user?.id) {
        reviewData.reviewerId = (req as any).user.id;
        console.log('Set reviewerId from authenticated user:', reviewData.reviewerId);
      }

      // Validate required fields before proceeding
      if (!reviewData.bookingId) {
        console.error('Missing bookingId in review data');
        return res.status(400).json({
          success: false,
          error: 'bookingId is required'
        });
      }

      if (!reviewData.reviewedUserId) {
        console.error('Missing reviewedUserId in review data');
        return res.status(400).json({
          success: false,
          error: 'reviewedUserId is required'
        });
      }

      if (!reviewData.overallRating) {
        console.error('Missing overallRating in review data');
        return res.status(400).json({
          success: false,
          error: 'overallRating is required'
        });
      }

      if (!reviewData.reviewerId) {
        console.error('Missing reviewerId in review data');
        return res.status(400).json({
          success: false,
          error: 'reviewerId is required (user must be authenticated)'
        });
      }

      console.log('Validated review data:', reviewData);

      const review = await this.reviewService.createReview(reviewData);
      
      res.status(201).json({
        success: true,
        data: review,
        message: 'Review created successfully'
      });
    } catch (error) {
      console.error('Review creation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body,
        user: (req as any).user
      });
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create review'
      });
    }
  };

  /**
   * Get review by ID
   * GET /api/reviews/:id
   */
  getReviewById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReviewById(id);
      
      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      res.json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get review'
      });
    }
  };

  /**
   * Update a review
   * PUT /api/reviews/:id
   */
  updateReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateReviewData = req.body;
      
      // Add updater ID from authenticated user
      if ((req as any).user?.id) {
        updates.updatedBy = (req as any).user.id;
      }

      const review = await this.reviewService.updateReview(id, updates);
      
      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      res.json({
        success: true,
        data: review,
        message: 'Review updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update review'
      });
    }
  };

  /**
   * Delete a review
   * DELETE /api/reviews/:id
   */
  deleteReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.reviewService.deleteReview(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete review'
      });
    }
  };

  /**
   * Find reviews with filters and pagination
   * GET /api/reviews
   */
  findReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: ReviewSearchParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
        
        // Filters
        bookingId: req.query.bookingId as string,
        reviewerId: req.query.reviewerId as string,
        reviewedUserId: req.query.reviewedUserId as string,
        overallRating: req.query.overallRating ? 
          (Array.isArray(req.query.overallRating) ? 
            req.query.overallRating.map(r => parseInt(r as string)) : 
            [parseInt(req.query.overallRating as string)]) as any : undefined,
        moderationStatus: req.query.moderationStatus as any,
        reviewType: req.query.reviewType as any,
        isFlagged: req.query.isFlagged === 'true' ? true : 
                   req.query.isFlagged === 'false' ? false : undefined,
        isVerifiedBooking: req.query.isVerifiedBooking === 'true' ? true : 
                          req.query.isVerifiedBooking === 'false' ? false : undefined,
        hasResponse: req.query.hasResponse === 'true' ? true : 
                    req.query.hasResponse === 'false' ? false : undefined,
        
        // Rating ranges
        overallRatingMin: req.query.overallRatingMin ? 
          parseInt(req.query.overallRatingMin as string) : undefined,
        overallRatingMax: req.query.overallRatingMax ? 
          parseInt(req.query.overallRatingMax as string) : undefined,
        
        // AI score filters
        sentimentScoreMin: req.query.sentimentScoreMin ? 
          parseFloat(req.query.sentimentScoreMin as string) : undefined,
        sentimentScoreMax: req.query.sentimentScoreMax ? 
          parseFloat(req.query.sentimentScoreMax as string) : undefined,
        toxicityScoreMin: req.query.toxicityScoreMin ? 
          parseFloat(req.query.toxicityScoreMin as string) : undefined,
        toxicityScoreMax: req.query.toxicityScoreMax ? 
          parseFloat(req.query.toxicityScoreMax as string) : undefined,
        helpfulnessScoreMin: req.query.helpfulnessScoreMin ? 
          parseFloat(req.query.helpfulnessScoreMin as string) : undefined,
        helpfulnessScoreMax: req.query.helpfulnessScoreMax ? 
          parseFloat(req.query.helpfulnessScoreMax as string) : undefined,
        
        // Date filters
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
        responseAfter: req.query.responseAfter ? new Date(req.query.responseAfter as string) : undefined,
        responseBefore: req.query.responseBefore ? new Date(req.query.responseBefore as string) : undefined
      };

      const result = await this.reviewService.findReviews(params);
      
      res.json({
        success: true,
        data: result.reviews,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find reviews'
      });
    }
  };

  /**
   * Get reviews for a specific booking
   * GET /api/reviews/booking/:bookingId
   */
  getReviewsForBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const reviews = await this.reviewService.getReviewsForBooking(bookingId);
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reviews for booking'
      });
    }
  };

  /**
   * Get reviews by a specific reviewer
   * GET /api/reviews/reviewer/:reviewerId
   */
  getReviewsByReviewer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reviewerId } = req.params;
      const reviews = await this.reviewService.getReviewsByReviewer(reviewerId);
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reviews by reviewer'
      });
    }
  };

  /**
   * Get reviews for a specific user (being reviewed)
   * GET /api/reviews/user/:userId
   */
  getReviewsForUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const reviews = await this.reviewService.getReviewsForUser(userId);
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reviews for user'
      });
    }
  };

  /**
   * Add response to a review
   * POST /api/reviews/:id/response
   */
  addReviewResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const respondedBy = (req as any).user?.id; // From auth middleware
      
      if (!response) {
        res.status(400).json({
          success: false,
          error: 'Response text is required'
        });
        return;
      }

      if (!respondedBy) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const review = await this.reviewService.addReviewResponse(id, response, respondedBy);
      
      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      res.json({
        success: true,
        data: review,
        message: 'Response added successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add response'
      });
    }
  };

  /**
   * Get moderation queue
   * GET /api/reviews/moderation/queue
   */
  getModerationQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check moderator permissions (in production, use auth middleware)
      if (!(req as any).user?.isModerator) {
        res.status(403).json({
          success: false,
          error: 'Moderator access required'
        });
        return;
      }

      const queue = await this.reviewService.getModerationQueue();
      
      res.json({
        success: true,
        data: queue
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get moderation queue'
      });
    }
  };

  /**
   * Moderate a review
   * POST /api/reviews/:id/moderate
   */
  moderateReview = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check moderator permissions
      if (!(req as any).user?.isModerator) {
        res.status(403).json({
          success: false,
          error: 'Moderator access required'
        });
        return;
      }

      const { id } = req.params;
      const { action, notes } = req.body;
      const moderatedBy = (req as any).user.id;

      const moderationAction: ModerationAction = {
        reviewId: id,
        action,
        notes,
        moderatedBy
      };

      const review = await this.reviewService.moderateReview(moderationAction);
      
      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found'
        });
        return;
      }

      res.json({
        success: true,
        data: review,
        message: 'Review moderated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to moderate review'
      });
    }
  };

  /**
   * Bulk moderate reviews
   * POST /api/reviews/moderation/bulk
   */
  bulkModerateReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check moderator permissions
      if (!(req as any).user?.isModerator) {
        res.status(403).json({
          success: false,
          error: 'Moderator access required'
        });
        return;
      }

      const { actions } = req.body;
      const moderatedBy = (req as any).user.id;

      // Add moderatedBy to all actions
      const moderationActions: ModerationAction[] = actions.map((action: any) => ({
        ...action,
        moderatedBy
      }));

      const result = await this.reviewService.bulkModerateReviews(moderationActions);
      
      res.json({
        success: true,
        data: result,
        message: `Bulk moderation completed: ${result.succeeded.length} succeeded, ${result.failed.length} failed`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk moderate reviews'
      });
    }
  };

  /**
   * Get user review analytics
   * GET /api/reviews/analytics/user/:userId
   */
  getUserReviewAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const analytics = await this.reviewService.getUserReviewAnalytics(userId);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user analytics'
      });
    }
  };

  /**
   * Get review statistics
   * GET /api/reviews/analytics/stats
   */
  getReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filters from query params (similar to findReviews)
      const filters = {
        bookingId: req.query.bookingId as string,
        reviewerId: req.query.reviewerId as string,
        reviewedUserId: req.query.reviewedUserId as string,
        moderationStatus: req.query.moderationStatus as any,
        reviewType: req.query.reviewType as any,
        isFlagged: req.query.isFlagged === 'true' ? true : 
                   req.query.isFlagged === 'false' ? false : undefined,
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
      };

      const stats = await this.reviewService.getReviewStats(filters);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get review stats'
      });
    }
  };
}
