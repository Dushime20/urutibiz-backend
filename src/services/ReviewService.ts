// =====================================================
// REVIEW SERVICE
// =====================================================

import { 
  ReviewData, 
  CreateReviewData, 
  UpdateReviewData, 
  ReviewFilters, 
  ReviewSearchParams,
  UserReviewAnalytics,
  ReviewStats,
  ModerationQueueItem,
  ModerationAction,
  AIAnalysisResult,
  ModerationStatus
} from '../types/review.types';
import { ReviewRepositoryKnex } from '../repositories/ReviewRepository.knex';

export class ReviewService {
  private reviewRepository: ReviewRepositoryKnex;

  constructor() {
    this.reviewRepository = new ReviewRepositoryKnex();
  }

  /**
   * Create a new review
   */
  async createReview(reviewData: CreateReviewData): Promise<ReviewData> {
    console.log('ReviewService.createReview called with data:', reviewData);
    
    try {
      // Validate business rules
      console.log('Validating review data...');
      await this.validateCreateReview(reviewData);
      console.log('Review validation passed');

      // Perform AI analysis on review content
      console.log('Performing AI analysis...');
      const aiAnalysis = await this.performAIAnalysis(reviewData);
      console.log('AI analysis completed:', aiAnalysis);

      // Create review with AI analysis results
      console.log('Creating review in database...');
      const review = await this.reviewRepository.create({
        ...reviewData,
        ...(aiAnalysis.sentimentScore && { aiSentimentScore: aiAnalysis.sentimentScore }),
        ...(aiAnalysis.toxicityScore && { aiToxicityScore: aiAnalysis.toxicityScore }),
        ...(aiAnalysis.helpfulnessScore && { aiHelpfulnessScore: aiAnalysis.helpfulnessScore }),
        isFlagged: aiAnalysis.flagRecommendation,
        moderationStatus: aiAnalysis.flagRecommendation ? 'flagged' : 'pending'
      } as CreateReviewData);

      // Log review creation
      console.log(`Review created successfully: ${review.id} by reviewer ${review.reviewerId}`);

      // Update product review count and average rating
      await this.updateProductReviewStats(reviewData.bookingId);

      return review;
    } catch (error) {
      console.error('Error in ReviewService.createReview:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        reviewData
      });
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<ReviewData | null> {
    return await this.reviewRepository.findById(id);
  }

  /**
   * Update a review
   */
  async updateReview(id: string, updates: UpdateReviewData): Promise<ReviewData | null> {
    const existingReview = await this.reviewRepository.findById(id);
    if (!existingReview) {
      throw new Error('Review not found');
    }

    // Validate update permissions
    await this.validateUpdateReview(existingReview, updates);

    // If content is being updated, re-run AI analysis
    if (updates.title || updates.comment) {
      const aiAnalysis = await this.performAIAnalysis({
        title: updates.title || existingReview.title || '',
        comment: updates.comment || existingReview.comment || ''
      });

      updates.aiSentimentScore = aiAnalysis.sentimentScore;
      updates.aiToxicityScore = aiAnalysis.toxicityScore;
      updates.aiHelpfulnessScore = aiAnalysis.helpfulnessScore;
      
      // Re-flag if necessary
      if (aiAnalysis.flagRecommendation && !existingReview.isFlagged) {
        updates.isFlagged = true;
        updates.moderationStatus = 'flagged';
      }
    }

    return await this.reviewRepository.update(id, updates);
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<boolean> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Validate deletion permissions
    await this.validateDeleteReview(review);

    return await this.reviewRepository.delete(id);
  }

  /**
   * Find reviews with filters and pagination
   */
  async findReviews(params: ReviewSearchParams): Promise<{
    reviews: ReviewData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, ...filters } = params;
    
    const allReviews = await this.reviewRepository.findAll(filters);
    const total = allReviews.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const reviews = allReviews.slice(startIndex, startIndex + limit);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get reviews for a specific booking
   */
  async getReviewsForBooking(bookingId: string): Promise<ReviewData[]> {
    return await this.reviewRepository.findByBookingId(bookingId);
  }

  /**
   * Get reviews by a specific reviewer
   */
  async getReviewsByReviewer(reviewerId: string, params?: ReviewSearchParams): Promise<ReviewData[]> {
    const filters = { ...params, reviewerId };
    return await this.reviewRepository.findAll(filters);
  }

  /**
   * Get reviews for a specific user (being reviewed)
   */
  async getReviewsForUser(reviewedUserId: string, params?: ReviewSearchParams): Promise<ReviewData[]> {
    const filters = { ...params, reviewedUserId };
    return await this.reviewRepository.findAll(filters);
  }

  /**
   * Get reviews for a specific product
   */
  async getReviewsByProduct(productId: string, filters?: { moderationStatus?: ModerationStatus }): Promise<ReviewData[]> {
    return await this.reviewRepository.findByProductId(productId, filters);
  }

  /**
   * Add response to a review
   */
  async addReviewResponse(reviewId: string, response: string, respondedBy: string): Promise<ReviewData | null> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Validate response permissions
    if (review.reviewedUserId !== respondedBy) {
      throw new Error('Only the reviewed user can respond to this review');
    }

    if (review.response) {
      throw new Error('Review already has a response');
    }

    return await this.reviewRepository.update(reviewId, {
      response,
      responseDate: new Date()
    });
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(_filters?: ReviewFilters): Promise<ModerationQueueItem[]> {
    return await this.reviewRepository.getModerationQueue();
  }

  /**
   * Moderate a review
   */
  async moderateReview(action: ModerationAction): Promise<ReviewData | null> {
    const { reviewId, action: moderationStatus, notes, moderatedBy } = action;

    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Validate moderation action
    await this.validateModerationAction(review, action);

    return await this.reviewRepository.update(reviewId, {
      moderationStatus,
      moderationNotes: notes,
      moderatedBy,
      moderatedAt: new Date(),
      isFlagged: moderationStatus === 'flagged'
    });
  }

  /**
   * Bulk moderate reviews
   */
  async bulkModerateReviews(actions: ModerationAction[]): Promise<{
    succeeded: string[];
    failed: { reviewId: string; error: string }[];
  }> {
    const succeeded: string[] = [];
    const failed: { reviewId: string; error: string }[] = [];

    for (const action of actions) {
      try {
        await this.moderateReview(action);
        succeeded.push(action.reviewId);
      } catch (error) {
        failed.push({
          reviewId: action.reviewId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { succeeded, failed };
  }

  /**
   * Get user review analytics
   */
  async getUserReviewAnalytics(userId: string): Promise<UserReviewAnalytics> {
    const analytics = await this.reviewRepository.getUserAnalytics(userId);
    if (!analytics) {
      throw new Error('Unable to retrieve user analytics');
    }
    return analytics;
  }

  /**
   * Get review statistics
   */
  async getReviewStats(filters?: ReviewFilters): Promise<ReviewStats> {
    return await this.reviewRepository.getReviewStats(filters);
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Validate review creation
   */
  private async validateCreateReview(reviewData: CreateReviewData): Promise<void> {
    console.log('Starting review validation with data:', reviewData);
    
    // Check if reviewer and reviewed user are different
    if (reviewData.reviewerId === reviewData.reviewedUserId) {
      console.error('Self-review attempt:', { reviewerId: reviewData.reviewerId, reviewedUserId: reviewData.reviewedUserId });
      throw new Error('Users cannot review themselves');
    }
    console.log('Self-review check passed');

    // Check if review already exists for this booking and reviewer
    console.log('Checking for existing reviews...');
    const existingReviews = await this.reviewRepository.findByBookingId(reviewData.bookingId);
    console.log('Found existing reviews:', existingReviews.length);
    
    const existingReview = existingReviews.find(r => 
      r.reviewerId === reviewData.reviewerId && 
      r.reviewedUserId === reviewData.reviewedUserId
    );

    if (existingReview) {
      console.error('Duplicate review found:', existingReview);
      throw new Error('Review already exists for this booking and user combination');
    }
    console.log('Duplicate review check passed');

    // Validate rating values
    console.log('Validating ratings...');
    this.validateRatings(reviewData);
    console.log('Rating validation passed');

    // Validate content length
    console.log('Validating content...');
    this.validateContent(reviewData);
    console.log('Content validation passed');
    
    console.log('All validation checks passed');
  }

  /**
   * Validate review update
   */
  private async validateUpdateReview(existingReview: ReviewData, updates: UpdateReviewData): Promise<void> {
    // Only the reviewer can update content
    if ((updates.title || updates.comment) && updates.updatedBy !== existingReview.reviewerId) {
      throw new Error('Only the reviewer can update review content');
    }

    // Validate ratings if being updated
    if (updates.overallRating || updates.communicationRating || updates.conditionRating || 
        updates.valueRating || updates.deliveryRating) {
      this.validateRatings(updates);
    }

    // Validate content if being updated
    if (updates.title || updates.comment) {
      this.validateContent(updates);
    }
  }

  /**
   * Validate review deletion
   */
  private async validateDeleteReview(review: ReviewData): Promise<void> {
    // Reviews can only be deleted within 24 hours of creation
    const createdAt = new Date(review.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      throw new Error('Reviews can only be deleted within 24 hours of creation');
    }

    // Approved reviews cannot be deleted
    if (review.moderationStatus === 'approved') {
      throw new Error('Approved reviews cannot be deleted');
    }
  }

  /**
   * Validate moderation action
   */
  private async validateModerationAction(review: ReviewData, action: ModerationAction): Promise<void> {
    // Check if review is already moderated
    if (review.moderationStatus === 'approved' || review.moderationStatus === 'rejected') {
      throw new Error('Review has already been moderated');
    }

    // Validate moderator permissions (in real app, check moderator role)
    if (!action.moderatedBy) {
      throw new Error('Moderator ID is required');
    }
  }

  /**
   * Validate rating values
   */
  private validateRatings(data: Partial<CreateReviewData | UpdateReviewData>): void {
    console.log('Validating ratings:', {
      overallRating: data.overallRating,
      communicationRating: data.communicationRating,
      conditionRating: data.conditionRating,
      valueRating: data.valueRating,
      deliveryRating: data.deliveryRating
    });
    
    const ratings = [
      data.overallRating,
      data.communicationRating,
      data.conditionRating,
      data.valueRating,
      data.deliveryRating
    ].filter(rating => rating !== undefined);

    console.log('Ratings to validate:', ratings);

    for (const rating of ratings) {
      if (rating !== null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
        console.error('Invalid rating:', rating);
        throw new Error('Ratings must be integers between 1 and 5');
      }
    }

    // Overall rating is required for new reviews
    if ('overallRating' in data && data.overallRating === undefined) {
      console.error('Missing overall rating');
      throw new Error('Overall rating is required');
    }
    
    console.log('Rating validation passed');
  }

  /**
   * Validate content length and quality
   */
  private validateContent(data: Partial<CreateReviewData | UpdateReviewData>): void {
    console.log('Validating content:', {
      title: data.title,
      comment: data.comment,
      titleLength: data.title?.length,
      commentLength: data.comment?.length
    });
    
    if (data.title && data.title.length > 200) {
      console.error('Title too long:', data.title.length);
      throw new Error('Review title cannot exceed 200 characters');
    }

    if (data.comment && data.comment.length > 2000) {
      console.error('Comment too long:', data.comment.length);
      throw new Error('Review comment cannot exceed 2000 characters');
    }

    // Check for spam patterns (basic implementation)
    const content = `${data.title || ''} ${data.comment || ''}`.toLowerCase();
    console.log('Content for spam check:', content);
    
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /[^\w\s]{5,}/, // Too many special characters
      /(https?:\/\/[^\s]+){3,}/ // Multiple URLs
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        console.error('Spam detected with pattern:', pattern);
        throw new Error('Content appears to be spam');
      }
    }
    
    console.log('Content validation passed');
  }

  /**
   * Perform AI analysis on review content
   */
  private async performAIAnalysis(data: Partial<CreateReviewData>): Promise<AIAnalysisResult> {
    const content = `${data.title || ''} ${data.comment || ''}`.trim();
    
    if (!content) {
      return {
        sentimentScore: 0,
        toxicityScore: 0,
        helpfulnessScore: 0.5,
        flagRecommendation: false,
        confidence: 1.0,
        keywords: [],
        topics: []
      };
    }

    // Simulate AI analysis (in production, call actual AI service)
    const words = content.toLowerCase().split(/\s+/);
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disgusting', 'useless'];
    
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    const sentimentScore = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / Math.max(1, words.length / 10)));

    // Simple toxicity detection
    const toxicWords = ['stupid', 'idiot', 'scam', 'fraud', 'cheat', 'liar', 'terrible'];
    const toxicCount = words.filter(word => toxicWords.includes(word)).length;
    const toxicityScore = Math.min(1, toxicCount / 3);

    // Simple helpfulness score based on length and detail
    const helpfulnessScore = Math.min(1, Math.max(0.1, content.length / 100));

    // Flag if high toxicity or suspicious patterns
    const flagRecommendation = toxicityScore > 0.7 || content.includes('http') || /(.)\1{5,}/.test(content);

    return {
      sentimentScore,
      toxicityScore,
      helpfulnessScore,
      flagRecommendation,
      confidence: 0.8,
      keywords: words.slice(0, 10),
      topics: ['general']
    };
  }

  /**
   * Update product review count and average rating
   */
  private async updateProductReviewStats(bookingId: string): Promise<void> {
    try {
      const db = require('@/config/database').getDatabase();
      
      // Get the product ID from the booking
      const booking = await db('bookings')
        .select('product_id')
        .where('id', bookingId)
        .first();

      if (!booking) {
        console.error('Booking not found for review stats update:', bookingId);
        return;
      }

      // Calculate new review count and average rating
      const stats = await db('reviews')
        .select(
          db.raw('COUNT(*) as review_count'),
          db.raw('AVG(overall_rating) as average_rating')
        )
        .join('bookings', 'reviews.booking_id', 'bookings.id')
        .where('bookings.product_id', booking.product_id)
        .first();

      // Update the product
      await db('products')
        .where('id', booking.product_id)
        .update({
          review_count: stats.review_count || 0,
          average_rating: stats.average_rating || 0,
          updated_at: db.fn.now()
        });

      console.log(`Updated product ${booking.product_id} review stats:`, {
        review_count: stats.review_count,
        average_rating: stats.average_rating
      });
    } catch (error) {
      console.error('Error updating product review stats:', error);
    }
  }
}
