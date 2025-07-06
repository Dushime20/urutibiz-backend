// =====================================================
// REVIEW REPOSITORY
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

/**
 * In-memory repository for reviews
 * This is a temporary implementation for development and testing.
 * In production, this should be replaced with a proper database implementation.
 */
export class ReviewRepository {
  private reviews: Map<string, ReviewData> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize with sample data for development and testing
   */
  private initializeSampleData(): void {
    const sampleReviews: ReviewData[] = [
      {
        id: 'review_001',
        bookingId: 'booking_001',
        reviewerId: 'user_001',
        reviewedUserId: 'user_002',
        overallRating: 5,
        communicationRating: 5,
        conditionRating: 5,
        valueRating: 4,
        deliveryRating: 5,
        title: 'Excellent camera equipment and service!',
        comment: 'The camera equipment was in perfect condition and exactly as described. The owner was very responsive and helpful throughout the rental process. Pickup was smooth and the equipment worked flawlessly during my photoshoot. Highly recommended!',
        aiSentimentScore: 0.85,
        aiToxicityScore: 0.02,
        aiHelpfulnessScore: 0.92,
        isFlagged: false,
        moderationStatus: 'approved',
        moderatedBy: 'admin_system',
        moderatedAt: new Date('2025-07-05T10:00:00Z'),
        isVerifiedBooking: true,
        reviewType: 'renter_to_owner',
        metadata: {
          rental_duration: '3 days',
          equipment_type: 'camera',
          experience_level: 'professional'
        },
        createdAt: new Date('2025-07-05T09:30:00Z'),
        createdBy: 'user'
      },
      {
        id: 'review_002',
        bookingId: 'booking_001',
        reviewerId: 'user_002',
        reviewedUserId: 'user_001',
        overallRating: 4,
        communicationRating: 5,
        conditionRating: 4,
        valueRating: 4,
        deliveryRating: 4,
        title: 'Great renter, very careful with equipment',
        comment: 'The renter was punctual, communicative, and took excellent care of my camera equipment. Everything was returned in the same condition it was rented. Would definitely rent to them again.',
        aiSentimentScore: 0.72,
        aiToxicityScore: 0.01,
        aiHelpfulnessScore: 0.78,
        isFlagged: false,
        moderationStatus: 'approved',
        moderatedBy: 'admin_system',
        moderatedAt: new Date('2025-07-05T11:00:00Z'),
        isVerifiedBooking: true,
        reviewType: 'owner_to_renter',
        metadata: {
          return_condition: 'excellent',
          communication_quality: 'excellent'
        },
        createdAt: new Date('2025-07-05T10:30:00Z'),
        createdBy: 'user'
      },
      {
        id: 'review_003',
        bookingId: 'booking_002',
        reviewerId: 'user_003',
        reviewedUserId: 'user_004',
        overallRating: 3,
        communicationRating: 2,
        conditionRating: 4,
        valueRating: 3,
        deliveryRating: 2,
        title: 'Equipment was good but communication could be better',
        comment: 'The equipment worked fine and was as described, but the owner was slow to respond to messages and pickup was delayed by 30 minutes without notice.',
        aiSentimentScore: -0.15,
        aiToxicityScore: 0.12,
        aiHelpfulnessScore: 0.65,
        isFlagged: false,
        moderationStatus: 'approved',
        moderatedBy: 'admin_system',
        moderatedAt: new Date('2025-07-05T12:00:00Z'),
        response: 'Thank you for the feedback. I apologize for the delay and will work on improving my communication.',
        responseDate: new Date('2025-07-05T14:00:00Z'),
        isVerifiedBooking: true,
        reviewType: 'renter_to_owner',
        metadata: {
          delay_minutes: 30,
          response_time: 'slow'
        },
        createdAt: new Date('2025-07-05T11:30:00Z'),
        createdBy: 'user'
      },
      {
        id: 'review_004',
        bookingId: 'booking_003',
        reviewerId: 'user_005',
        reviewedUserId: 'user_001',
        overallRating: 1,
        communicationRating: 1,
        conditionRating: 2,
        valueRating: 1,
        deliveryRating: 1,
        title: 'Terrible experience, equipment was broken',
        comment: 'This was a horrible experience. The equipment was clearly damaged and the owner was completely unresponsive. Complete waste of money and ruined my event.',
        aiSentimentScore: -0.92,
        aiToxicityScore: 0.78,
        aiHelpfulnessScore: 0.45,
        isFlagged: true,
        moderationStatus: 'flagged',
        moderationNotes: 'Flagged for high toxicity score and unverified booking',
        isVerifiedBooking: false,
        reviewType: 'renter_to_owner',
        metadata: {
          equipment_issues: ['damaged_lens', 'battery_dead'],
          escalated: true
        },
        createdAt: new Date('2025-07-05T13:00:00Z'),
        createdBy: 'user'
      }
    ];

    sampleReviews.forEach(review => {
      this.reviews.set(review.id, review);
    });

    this.nextId = sampleReviews.length + 1;
  }

  /**
   * Generate a new unique ID for a review
   */
  private generateId(): string {
    return `review_${String(this.nextId++).padStart(3, '0')}`;
  }

  /**
   * Create a new review
   */
  async create(data: CreateReviewData): Promise<ReviewData> {
    const now = new Date();
    
    // Basic AI analysis simulation (in production, call actual AI service)
    const aiAnalysis = this.simulateAIAnalysis(data.title, data.comment);
    
    const review: ReviewData = {
      id: this.generateId(),
      bookingId: data.bookingId,
      reviewerId: data.reviewerId,
      reviewedUserId: data.reviewedUserId,
      overallRating: data.overallRating,
      communicationRating: data.communicationRating || null,
      conditionRating: data.conditionRating || null,
      valueRating: data.valueRating || null,
      deliveryRating: data.deliveryRating || null,
      title: data.title || null,
      comment: data.comment || null,
      aiSentimentScore: aiAnalysis.sentimentScore,
      aiToxicityScore: aiAnalysis.toxicityScore,
      aiHelpfulnessScore: aiAnalysis.helpfulnessScore,
      isFlagged: aiAnalysis.flagRecommendation,
      moderationStatus: aiAnalysis.flagRecommendation ? 'flagged' : 'pending',
      moderationNotes: null,
      moderatedBy: null,
      moderatedAt: null,
      response: null,
      responseDate: null,
      metadata: data.metadata || null,
      isVerifiedBooking: true, // In production, check against actual booking
      reviewType: data.reviewType || this.determineReviewType(data.reviewerId, data.reviewedUserId),
      createdAt: now,
      updatedAt: null,
      createdBy: data.createdBy || null,
      updatedBy: null
    };

    this.reviews.set(review.id, review);
    return { ...review };
  }

  /**
   * Find a review by ID
   */
  async findById(id: string): Promise<ReviewData | null> {
    const review = this.reviews.get(id);
    return review ? { ...review } : null;
  }

  /**
   * Find all reviews with optional filters
   */
  async findAll(filters?: ReviewFilters): Promise<ReviewData[]> {
    let reviews = Array.from(this.reviews.values());

    if (filters) {
      reviews = this.applyFilters(reviews, filters);
    }

    return reviews.map(review => ({ ...review }));
  }

  /**
   * Find reviews with search and pagination
   */
  async findWithPagination(params: ReviewSearchParams): Promise<{
    reviews: ReviewData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let reviews = Array.from(this.reviews.values());

    // Apply filters
    if (params) {
      reviews = this.applyFilters(reviews, params);
    }

    // Apply search
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      reviews = reviews.filter(review => 
        review.id.toLowerCase().includes(searchTerm) ||
        review.title?.toLowerCase().includes(searchTerm) ||
        review.comment?.toLowerCase().includes(searchTerm) ||
        review.response?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      reviews.sort((a, b) => {
        const aValue = a[params.sortBy!];
        const bValue = b[params.sortBy!];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) return params.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return params.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    } else {
      // Default sort by createdAt desc
      reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = reviews.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedReviews = reviews.slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews.map(review => ({ ...review })),
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Find reviews by booking ID
   */
  async findByBookingId(bookingId: string): Promise<ReviewData[]> {
    return this.findAll({ bookingId });
  }

  /**
   * Find reviews by reviewer ID
   */
  async findByReviewerId(reviewerId: string): Promise<ReviewData[]> {
    return this.findAll({ reviewerId });
  }

  /**
   * Find reviews for a specific user (reviewed user)
   */
  async findByReviewedUserId(reviewedUserId: string): Promise<ReviewData[]> {
    return this.findAll({ reviewedUserId });
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(): Promise<ModerationQueueItem[]> {
    const reviews = await this.findAll({ 
      moderationStatus: ['pending', 'flagged'] 
    });

    return reviews
      .map(review => ({
        id: review.id,
        bookingId: review.bookingId,
        reviewerId: review.reviewerId,
        reviewedUserId: review.reviewedUserId,
        overallRating: review.overallRating,
        title: review.title || undefined,
        comment: review.comment || undefined,
        aiSentimentScore: review.aiSentimentScore || undefined,
        aiToxicityScore: review.aiToxicityScore || undefined,
        aiHelpfulnessScore: review.aiHelpfulnessScore || undefined,
        isFlagged: review.isFlagged,
        moderationStatus: review.moderationStatus,
        createdAt: review.createdAt,
        reviewerName: `User ${review.reviewerId}`, // In production, join with users table
        reviewedUserName: `User ${review.reviewedUserId}`
      }))
      .sort((a, b) => {
        // Priority: flagged first, then by toxicity score, then by date
        if (a.isFlagged && !b.isFlagged) return -1;
        if (!a.isFlagged && b.isFlagged) return 1;
        
        const aToxicity = a.aiToxicityScore || 0;
        const bToxicity = b.aiToxicityScore || 0;
        if (aToxicity !== bToxicity) return bToxicity - aToxicity;
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Update a review
   */
  async update(id: string, updates: UpdateReviewData): Promise<ReviewData | null> {
    const review = this.reviews.get(id);
    if (!review) {
      return null;
    }

    const now = new Date();
    const updatedReview: ReviewData = {
      ...review,
      ...updates,
      updatedAt: now,
      // If moderation status is being updated, set moderated timestamp
      moderatedAt: updates.moderationStatus ? updates.moderatedAt || now : review.moderatedAt
    };

    this.reviews.set(id, updatedReview);
    return { ...updatedReview };
  }

  /**
   * Update moderation status
   */
  async updateModerationStatus(
    id: string, 
    status: ModerationStatus, 
    moderatedBy: string,
    notes?: string
  ): Promise<ReviewData | null> {
    return this.update(id, { 
      moderationStatus: status,
      moderatedBy,
      moderationNotes: notes,
      moderatedAt: new Date()
    });
  }

  /**
   * Add response to review
   */
  async addResponse(id: string, response: string): Promise<ReviewData | null> {
    return this.update(id, { 
      response,
      responseDate: new Date()
    });
  }

  /**
   * Delete a review (soft delete by setting status to rejected)
   */
  async delete(id: string): Promise<boolean> {
    const review = await this.update(id, { 
      moderationStatus: 'rejected',
      updatedBy: 'system'
    });
    return review !== null;
  }

  /**
   * Hard delete a review (remove from memory)
   */
  async hardDelete(id: string): Promise<boolean> {
    return this.reviews.delete(id);
  }

  /**
   * Get user review analytics
   */
  async getUserAnalytics(userId: string): Promise<UserReviewAnalytics | null> {
    const userReviews = await this.findByReviewedUserId(userId);
    
    if (userReviews.length === 0) {
      return null;
    }

    const approvedReviews = userReviews.filter(r => r.moderationStatus === 'approved');
    const flaggedReviews = userReviews.filter(r => r.isFlagged);
    const reviewsWithResponse = userReviews.filter(r => r.response);
    const verifiedReviews = userReviews.filter(r => r.isVerifiedBooking);

    const latestReview = userReviews.reduce((latest, current) => 
      current.createdAt > latest.createdAt ? current : latest
    );

    return {
      userId,
      totalReviews: userReviews.length,
      approvedReviews: approvedReviews.length,
      flaggedReviews: flaggedReviews.length,
      avgOverallRating: this.calculateAverage(approvedReviews, 'overallRating'),
      avgCommunicationRating: this.calculateAverage(approvedReviews, 'communicationRating'),
      avgConditionRating: this.calculateAverage(approvedReviews, 'conditionRating'),
      avgValueRating: this.calculateAverage(approvedReviews, 'valueRating'),
      avgDeliveryRating: this.calculateAverage(approvedReviews, 'deliveryRating'),
      avgSentimentScore: this.calculateAverage(approvedReviews, 'aiSentimentScore'),
      responsesCount: reviewsWithResponse.length,
      latestReviewDate: latestReview.createdAt,
      verifiedReviewsCount: verifiedReviews.length
    };
  }

  /**
   * Get review statistics
   */
  async getReviewStats(filters?: ReviewFilters): Promise<ReviewStats> {
    let reviews = Array.from(this.reviews.values());
    
    if (filters) {
      reviews = this.applyFilters(reviews, filters);
    }

    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        moderationStatusBreakdown: {
          pending: 0,
          approved: 0,
          rejected: 0,
          flagged: 0
        },
        reviewTypeBreakdown: {
          renter_to_owner: 0,
          owner_to_renter: 0
        },
        flaggedReviewsCount: 0,
        verifiedReviewsCount: 0,
        averageSentimentScore: 0,
        averageToxicityScore: 0,
        averageHelpfulnessScore: 0,
        responseRate: 0,
        monthlyTrends: []
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution: Record<RatingValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.overallRating]++;
    });

    // Calculate moderation status breakdown
    const moderationStatusBreakdown: Record<ModerationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0
    };
    reviews.forEach(review => {
      moderationStatusBreakdown[review.moderationStatus]++;
    });

    // Calculate review type breakdown
    const reviewTypeBreakdown: Record<ReviewType, number> = {
      renter_to_owner: 0,
      owner_to_renter: 0
    };
    reviews.forEach(review => {
      const type = review.reviewType || 'renter_to_owner';
      reviewTypeBreakdown[type]++;
    });

    // Calculate other metrics
    const flaggedReviewsCount = reviews.filter(r => r.isFlagged).length;
    const verifiedReviewsCount = reviews.filter(r => r.isVerifiedBooking).length;
    const reviewsWithResponses = reviews.filter(r => r.response).length;
    const responseRate = totalReviews > 0 ? reviewsWithResponses / totalReviews : 0;

    // Calculate AI score averages
    const sentimentScores = reviews
      .map(r => r.aiSentimentScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageSentimentScore = sentimentScores.length > 0 
      ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
      : 0;

    const toxicityScores = reviews
      .map(r => r.aiToxicityScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageToxicityScore = toxicityScores.length > 0 
      ? toxicityScores.reduce((sum, score) => sum + score, 0) / toxicityScores.length 
      : 0;

    const helpfulnessScores = reviews
      .map(r => r.aiHelpfulnessScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageHelpfulnessScore = helpfulnessScores.length > 0 
      ? helpfulnessScores.reduce((sum, score) => sum + score, 0) / helpfulnessScores.length 
      : 0;

    // Calculate monthly trends (simplified)
    const monthlyTrends = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= monthStart && reviewDate <= monthEnd;
      });

      const monthName = monthStart.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthRating = monthReviews.length > 0 
        ? monthReviews.reduce((sum, r) => sum + r.overallRating, 0) / monthReviews.length 
        : 0;

      monthlyTrends.push({
        month: monthName,
        count: monthReviews.length,
        averageRating: Math.round(monthRating * 10) / 10
      });
    }

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      moderationStatusBreakdown,
      reviewTypeBreakdown,
      flaggedReviewsCount,
      verifiedReviewsCount,
      averageSentimentScore: Math.round(averageSentimentScore * 100) / 100,
      averageToxicityScore: Math.round(averageToxicityScore * 100) / 100,
      averageHelpfulnessScore: Math.round(averageHelpfulnessScore * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      monthlyTrends
    };
  }

  /**
   * Apply filters to reviews array
   */
  private applyFilters(reviews: ReviewData[], filters: ReviewFilters): ReviewData[] {
    return reviews.filter(review => {
      if (filters.bookingId && review.bookingId !== filters.bookingId) return false;
      if (filters.reviewerId && review.reviewerId !== filters.reviewerId) return false;
      if (filters.reviewedUserId && review.reviewedUserId !== filters.reviewedUserId) return false;
      
      if (filters.overallRating) {
        const ratings = Array.isArray(filters.overallRating) ? filters.overallRating : [filters.overallRating];
        if (!ratings.includes(review.overallRating)) return false;
      }
      
      if (filters.moderationStatus) {
        const statuses = Array.isArray(filters.moderationStatus) ? filters.moderationStatus : [filters.moderationStatus];
        if (!statuses.includes(review.moderationStatus)) return false;
      }
      
      if (filters.reviewType && review.reviewType !== filters.reviewType) return false;
      if (filters.isFlagged !== undefined && review.isFlagged !== filters.isFlagged) return false;
      if (filters.isVerifiedBooking !== undefined && review.isVerifiedBooking !== filters.isVerifiedBooking) return false;
      if (filters.hasResponse !== undefined) {
        const hasResponse = review.response !== null;
        if (hasResponse !== filters.hasResponse) return false;
      }
      
      // Rating range filters
      if (filters.overallRatingMin && review.overallRating < filters.overallRatingMin) return false;
      if (filters.overallRatingMax && review.overallRating > filters.overallRatingMax) return false;
      
      // AI score filters
      if (filters.sentimentScoreMin && (review.aiSentimentScore || 0) < filters.sentimentScoreMin) return false;
      if (filters.sentimentScoreMax && (review.aiSentimentScore || 0) > filters.sentimentScoreMax) return false;
      if (filters.toxicityScoreMin && (review.aiToxicityScore || 0) < filters.toxicityScoreMin) return false;
      if (filters.toxicityScoreMax && (review.aiToxicityScore || 0) > filters.toxicityScoreMax) return false;
      if (filters.helpfulnessScoreMin && (review.aiHelpfulnessScore || 0) < filters.helpfulnessScoreMin) return false;
      if (filters.helpfulnessScoreMax && (review.aiHelpfulnessScore || 0) > filters.helpfulnessScoreMax) return false;
      
      // Date filters
      if (filters.createdAfter && review.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && review.createdAt > filters.createdBefore) return false;
      if (filters.responseAfter && (!review.responseDate || review.responseDate < filters.responseAfter)) return false;
      if (filters.responseBefore && (!review.responseDate || review.responseDate > filters.responseBefore)) return false;
      
      return true;
    });
  }

  /**
   * Calculate average for a numeric field, ignoring null values
   */
  private calculateAverage(reviews: ReviewData[], field: keyof ReviewData): number {
    const values = reviews
      .map(r => r[field])
      .filter(v => v !== null && v !== undefined && typeof v === 'number') as number[];
    
    if (values.length === 0) return 0;
    return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2));
  }

  /**
   * Simulate AI analysis (replace with actual AI service in production)
   */
  private simulateAIAnalysis(title?: string, comment?: string): {
    sentimentScore: number;
    toxicityScore: number;
    helpfulnessScore: number;
    flagRecommendation: boolean;
  } {
    const text = `${title || ''} ${comment || ''}`.toLowerCase();
    
    // Simple sentiment analysis simulation
    const positiveWords = ['excellent', 'great', 'good', 'amazing', 'perfect', 'recommend', 'helpful'];
    const negativeWords = ['terrible', 'horrible', 'awful', 'broken', 'damaged', 'waste', 'ruined'];
    const toxicWords = ['stupid', 'idiot', 'scam', 'fraud', 'liar'];
    
    let sentimentScore = 0;
    let toxicityScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) sentimentScore += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) sentimentScore -= 0.3;
    });
    
    toxicWords.forEach(word => {
      if (text.includes(word)) toxicityScore += 0.4;
    });
    
    // Normalize scores
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
    toxicityScore = Math.max(0, Math.min(1, toxicityScore));
    
    // Helpfulness based on length and sentiment
    const textLength = text.length;
    const helpfulnessScore = Math.min(1, (textLength / 200) * 0.5 + (sentimentScore + 1) * 0.25);
    
    const flagRecommendation = toxicityScore > 0.5 || sentimentScore < -0.8;
    
    return {
      sentimentScore: Number(sentimentScore.toFixed(3)),
      toxicityScore: Number(toxicityScore.toFixed(3)),
      helpfulnessScore: Number(helpfulnessScore.toFixed(3)),
      flagRecommendation
    };
  }

  /**
   * Determine review type based on user roles (simplified)
   */
  private determineReviewType(reviewerId: string, reviewedUserId: string): ReviewType {
    // In production, check actual booking to determine who is owner/renter
    // For now, use simple logic
    return reviewerId.localeCompare(reviewedUserId) < 0 ? 'renter_to_owner' : 'owner_to_renter';
  }

  /**
   * Get all reviews (for development/debugging)
   */
  async getAllReviews(): Promise<ReviewData[]> {
    return Array.from(this.reviews.values()).map(review => ({ ...review }));
  }

  /**
   * Clear all reviews (for testing)
   */
  async clearAll(): Promise<void> {
    this.reviews.clear();
    this.nextId = 1;
  }

  /**
   * Get review count
   */
  async getCount(filters?: ReviewFilters): Promise<number> {
    const reviews = await this.findAll(filters);
    return reviews.length;
  }
}
