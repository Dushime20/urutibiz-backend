// =====================================================
// REVIEW REPOSITORY (Database Implementation)
// =====================================================

import { 
  ReviewData, 
  CreateReviewData, 
  UpdateReviewData, 
  ReviewFilters,
  ReviewSearchParams,
  UserReviewAnalytics,
  ModerationQueueItem,
  ModerationStatus,
  ReviewType,
  ReviewStats,
  RatingValue
} from '../types/review.types';
import { getDatabase } from '@/config/database';

export class ReviewRepositoryKnex {
  private db = getDatabase();

  /**
   * Create a new review
   */
  async create(data: CreateReviewData): Promise<ReviewData> {
    const [review] = await this.db('reviews')
      .insert({
        booking_id: data.bookingId,
        reviewer_id: data.reviewerId,
        reviewed_user_id: data.reviewedUserId,
        overall_rating: data.overallRating,
        communication_rating: data.communicationRating,
        condition_rating: data.conditionRating,
        value_rating: data.valueRating,
        delivery_rating: data.deliveryRating,
        title: data.title,
        comment: data.comment,
        ai_sentiment_score: data.aiSentimentScore,
        ai_toxicity_score: data.aiToxicityScore,
        ai_helpfulness_score: data.aiHelpfulnessScore,
        is_flagged: data.isFlagged || false,
        moderation_status: data.moderationStatus || 'pending',
        is_verified_booking: data.isVerifiedBooking || false,
        review_type: data.reviewType,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        created_by: data.createdBy || 'user',
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return this.mapDatabaseToReviewData(review);
  }

  /**
   * Get review by ID
   */
  async findById(id: string): Promise<ReviewData | null> {
    const review = await this.db('reviews')
      .where('id', id)
      .first();

    return review ? this.mapDatabaseToReviewData(review) : null;
  }

  /**
   * Find all reviews with filters
   */
  async findAll(filters?: ReviewFilters): Promise<ReviewData[]> {
    let query = this.db('reviews');

    if (filters) {
      if (filters.bookingId) {
        query = query.where('booking_id', filters.bookingId);
      }
      if (filters.reviewerId) {
        query = query.where('reviewer_id', filters.reviewerId);
      }
      if (filters.reviewedUserId) {
        query = query.where('reviewed_user_id', filters.reviewedUserId);
      }
      if (filters.overallRating) {
        query = query.where('overall_rating', filters.overallRating);
      }
      if (filters.moderationStatus) {
        query = query.where('moderation_status', filters.moderationStatus);
      }
      if (filters.reviewType) {
        query = query.where('review_type', filters.reviewType);
      }
      if (filters.isFlagged !== undefined) {
        query = query.where('is_flagged', filters.isFlagged);
      }
      if (filters.isVerifiedBooking !== undefined) {
        query = query.where('is_verified_booking', filters.isVerifiedBooking);
      }
    }

    const reviews = await query.orderBy('created_at', 'desc');
    return reviews.map(review => this.mapDatabaseToReviewData(review));
  }

  /**
   * Find reviews with pagination
   */
  async findWithPagination(params: ReviewSearchParams): Promise<{
    reviews: ReviewData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, ...filters } = params;
    
    let query = this.db('reviews');

    // Apply filters
    if (filters.bookingId) {
      query = query.where('booking_id', filters.bookingId);
    }
    if (filters.reviewerId) {
      query = query.where('reviewer_id', filters.reviewerId);
    }
    if (filters.reviewedUserId) {
      query = query.where('reviewed_user_id', filters.reviewedUserId);
    }
    if (filters.overallRating) {
      if (Array.isArray(filters.overallRating)) {
        query = query.whereIn('overall_rating', filters.overallRating);
      } else {
        query = query.where('overall_rating', filters.overallRating);
      }
    }
    if (filters.moderationStatus) {
      query = query.where('moderation_status', filters.moderationStatus);
    }
    if (filters.reviewType) {
      query = query.where('review_type', filters.reviewType);
    }
    if (filters.isFlagged !== undefined) {
      query = query.where('is_flagged', filters.isFlagged);
    }
    if (filters.isVerifiedBooking !== undefined) {
      query = query.where('is_verified_booking', filters.isVerifiedBooking);
    }

    // Get total count
    const totalResult = await query.clone().count('id as count').first();
    const total = totalResult?.count || 0;

    // Get paginated results
    const reviews = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      reviews: reviews.map(review => this.mapDatabaseToReviewData(review)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find reviews by booking ID
   */
  async findByBookingId(bookingId: string): Promise<ReviewData[]> {
    const reviews = await this.db('reviews')
      .where('booking_id', bookingId)
      .orderBy('created_at', 'desc');

    return reviews.map(review => this.mapDatabaseToReviewData(review));
  }

  /**
   * Find reviews by reviewer ID
   */
  async findByReviewerId(reviewerId: string): Promise<ReviewData[]> {
    const reviews = await this.db('reviews')
      .where('reviewer_id', reviewerId)
      .orderBy('created_at', 'desc');

    return reviews.map(review => this.mapDatabaseToReviewData(review));
  }

  /**
   * Find reviews by reviewed user ID
   */
  async findByReviewedUserId(reviewedUserId: string): Promise<ReviewData[]> {
    const reviews = await this.db('reviews')
      .where('reviewed_user_id', reviewedUserId)
      .orderBy('created_at', 'desc');

    return reviews.map(review => this.mapDatabaseToReviewData(review));
  }

  /**
   * Update a review
   */
  async update(id: string, updates: UpdateReviewData): Promise<ReviewData | null> {
    const updateData: any = {};

    if (updates.overallRating !== undefined) updateData.overall_rating = updates.overallRating;
    if (updates.communicationRating !== undefined) updateData.communication_rating = updates.communicationRating;
    if (updates.conditionRating !== undefined) updateData.condition_rating = updates.conditionRating;
    if (updates.valueRating !== undefined) updateData.value_rating = updates.valueRating;
    if (updates.deliveryRating !== undefined) updateData.delivery_rating = updates.deliveryRating;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.aiSentimentScore !== undefined) updateData.ai_sentiment_score = updates.aiSentimentScore;
    if (updates.aiToxicityScore !== undefined) updateData.ai_toxicity_score = updates.aiToxicityScore;
    if (updates.aiHelpfulnessScore !== undefined) updateData.ai_helpfulness_score = updates.aiHelpfulnessScore;
    if (updates.isFlagged !== undefined) updateData.is_flagged = updates.isFlagged;
    if (updates.moderationStatus !== undefined) updateData.moderation_status = updates.moderationStatus;
    if (updates.response !== undefined) updateData.response = updates.response;
    if (updates.responseDate !== undefined) updateData.response_date = updates.responseDate;
    if (updates.metadata !== undefined) updateData.metadata = JSON.stringify(updates.metadata);

    updateData.updated_at = this.db.fn.now();

    const [updatedReview] = await this.db('reviews')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return updatedReview ? this.mapDatabaseToReviewData(updatedReview) : null;
  }

  /**
   * Delete a review
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db('reviews')
      .where('id', id)
      .del();

    return result > 0;
  }

  /**
   * Add response to a review
   */
  async addResponse(id: string, response: string): Promise<ReviewData | null> {
    const [updatedReview] = await this.db('reviews')
      .where('id', id)
      .update({
        response,
        response_date: this.db.fn.now(),
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return updatedReview ? this.mapDatabaseToReviewData(updatedReview) : null;
  }

  /**
   * Map database record to ReviewData
   */
  private mapDatabaseToReviewData(dbReview: any): ReviewData {
    return {
      id: dbReview.id,
      bookingId: dbReview.booking_id,
      reviewerId: dbReview.reviewer_id,
      reviewedUserId: dbReview.reviewed_user_id,
      overallRating: dbReview.overall_rating,
      communicationRating: dbReview.communication_rating,
      conditionRating: dbReview.condition_rating,
      valueRating: dbReview.value_rating,
      deliveryRating: dbReview.delivery_rating,
      title: dbReview.title,
      comment: dbReview.comment,
      aiSentimentScore: dbReview.ai_sentiment_score,
      aiToxicityScore: dbReview.ai_toxicity_score,
      aiHelpfulnessScore: dbReview.ai_helpfulness_score,
      isFlagged: dbReview.is_flagged,
      moderationStatus: dbReview.moderation_status,
      moderatedBy: dbReview.moderated_by,
      moderatedAt: dbReview.moderated_at,
      response: dbReview.response,
      responseDate: dbReview.response_date,
      isVerifiedBooking: dbReview.is_verified_booking,
      reviewType: dbReview.review_type,
      metadata: dbReview.metadata ? JSON.parse(dbReview.metadata) : null,
      createdAt: dbReview.created_at,
      updatedAt: dbReview.updated_at,
      createdBy: dbReview.created_by,
      updatedBy: dbReview.updated_by
    };
  }
} 