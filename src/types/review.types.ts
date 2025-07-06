// =====================================================
// REVIEWS TYPES
// =====================================================

// Enums and Union Types
export type ModerationStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'flagged';

export type ReviewType = 
  | 'renter_to_owner' 
  | 'owner_to_renter';

export type RatingValue = 1 | 2 | 3 | 4 | 5;

// Main Review Interface
export interface ReviewData {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  
  // Ratings (1-5 scale)
  overallRating: RatingValue;
  communicationRating?: RatingValue | null;
  conditionRating?: RatingValue | null;
  valueRating?: RatingValue | null;
  deliveryRating?: RatingValue | null;
  
  // Review content
  title?: string | null;
  comment?: string | null;
  
  // AI moderation and content analysis
  aiSentimentScore?: number | null; // -1 to 1
  aiToxicityScore?: number | null; // 0 to 1
  aiHelpfulnessScore?: number | null; // 0 to 1
  isFlagged: boolean;
  moderationStatus: ModerationStatus;
  moderationNotes?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: Date | null;
  
  // Response from reviewed user
  response?: string | null;
  responseDate?: Date | null;
  
  // Additional metadata
  metadata?: Record<string, any> | null;
  isVerifiedBooking: boolean;
  reviewType?: ReviewType | null;
  
  // Audit fields
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

// Create Review Interface
export interface CreateReviewData {
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  
  // Ratings (only overall rating is required)
  overallRating: RatingValue;
  communicationRating?: RatingValue;
  conditionRating?: RatingValue;
  valueRating?: RatingValue;
  deliveryRating?: RatingValue;
  
  // Review content
  title?: string;
  comment?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  reviewType?: ReviewType;
  createdBy?: string;
}

// Update Review Interface
export interface UpdateReviewData {
  // Ratings
  overallRating?: RatingValue;
  communicationRating?: RatingValue;
  conditionRating?: RatingValue;
  valueRating?: RatingValue;
  deliveryRating?: RatingValue;
  
  // Content
  title?: string;
  comment?: string;
  
  // Moderation
  moderationStatus?: ModerationStatus;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
  isFlagged?: boolean;
  
  // AI scores (typically set by system)
  aiSentimentScore?: number;
  aiToxicityScore?: number;
  aiHelpfulnessScore?: number;
  
  // Response
  response?: string;
  responseDate?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
  updatedBy?: string;
}

// Review Filters for Queries
export interface ReviewFilters {
  bookingId?: string;
  reviewerId?: string;
  reviewedUserId?: string;
  overallRating?: RatingValue | RatingValue[];
  moderationStatus?: ModerationStatus | ModerationStatus[];
  reviewType?: ReviewType;
  isFlagged?: boolean;
  isVerifiedBooking?: boolean;
  hasResponse?: boolean;
  
  // Rating ranges
  overallRatingMin?: number;
  overallRatingMax?: number;
  
  // AI score filters
  sentimentScoreMin?: number;
  sentimentScoreMax?: number;
  toxicityScoreMin?: number;
  toxicityScoreMax?: number;
  helpfulnessScoreMin?: number;
  helpfulnessScoreMax?: number;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  responseAfter?: Date;
  responseBefore?: Date;
}

// Review Search and Pagination
export interface ReviewSearchParams extends ReviewFilters {
  page?: number;
  limit?: number;
  sortBy?: keyof ReviewData;
  sortOrder?: 'asc' | 'desc';
  search?: string; // For searching in title, comment, response
}

// Review Analytics Interfaces
export interface UserReviewAnalytics {
  userId: string;
  totalReviews: number;
  approvedReviews: number;
  flaggedReviews: number;
  avgOverallRating: number;
  avgCommunicationRating: number;
  avgConditionRating: number;
  avgValueRating: number;
  avgDeliveryRating: number;
  avgSentimentScore: number;
  responsesCount: number;
  latestReviewDate: Date;
  verifiedReviewsCount: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<RatingValue, number>;
  moderationStatusBreakdown: Record<ModerationStatus, number>;
  reviewTypeBreakdown: Record<ReviewType, number>;
  flaggedReviewsCount: number;
  verifiedReviewsCount: number;
  averageSentimentScore: number;
  averageToxicityScore: number;
  averageHelpfulnessScore: number;
  responseRate: number; // Percentage of reviews with responses
  monthlyTrends: Array<{
    month: string;
    count: number;
    averageRating: number;
  }>;
}

// Review Response Interfaces
export interface ReviewResponse {
  success: boolean;
  data?: ReviewData;
  message?: string;
  error?: string;
}

export interface ReviewListResponse {
  success: boolean;
  data?: ReviewData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface ReviewStatsResponse {
  success: boolean;
  data?: ReviewStats;
  message?: string;
  error?: string;
}

export interface UserReviewAnalyticsResponse {
  success: boolean;
  data?: UserReviewAnalytics;
  message?: string;
  error?: string;
}

// Review Moderation Interfaces
export interface ModerationQueueItem {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  overallRating: RatingValue;
  title?: string;
  comment?: string;
  aiSentimentScore?: number;
  aiToxicityScore?: number;
  aiHelpfulnessScore?: number;
  isFlagged: boolean;
  moderationStatus: ModerationStatus;
  createdAt: Date;
  reviewerName?: string;
  reviewedUserName?: string;
}

export interface ModerationAction {
  reviewId: string;
  action: ModerationStatus;
  notes?: string;
  moderatedBy: string;
}

export interface ModerationResponse {
  success: boolean;
  data?: ReviewData;
  message?: string;
  error?: string;
}

// AI Analysis Interfaces
export interface AIAnalysisRequest {
  text: string; // title + comment combined
  reviewId?: string;
}

export interface AIAnalysisResult {
  sentimentScore: number; // -1 to 1
  toxicityScore: number; // 0 to 1
  helpfulnessScore: number; // 0 to 1
  flagRecommendation: boolean;
  confidence: number; // 0 to 1
  keywords: string[];
  topics: string[];
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: AIAnalysisResult;
  message?: string;
  error?: string;
}

// Review Creation Workflow Interfaces
export interface ReviewSubmissionRequest {
  bookingId: string;
  reviewedUserId: string;
  overallRating: RatingValue;
  communicationRating?: RatingValue;
  conditionRating?: RatingValue;
  valueRating?: RatingValue;
  deliveryRating?: RatingValue;
  title?: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface ReviewSubmissionResponse {
  success: boolean;
  reviewId?: string;
  status: 'submitted' | 'pending_moderation' | 'auto_approved';
  message?: string;
  error?: string;
  moderationRequired?: boolean;
}

// Review Response (Reply) Interfaces
export interface ReviewReplyRequest {
  reviewId: string;
  response: string;
  metadata?: Record<string, any>;
}

export interface ReviewReplyResponse {
  success: boolean;
  data?: ReviewData;
  message?: string;
  error?: string;
}

// Bulk Operations Interfaces
export interface BulkModerationRequest {
  reviewIds: string[];
  action: ModerationStatus;
  notes?: string;
  moderatedBy: string;
}

export interface BulkModerationResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: Array<{
    reviewId: string;
    error: string;
  }>;
  message?: string;
}

// Review Reporting Interfaces
export interface ReviewReport {
  reviewId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
  description?: string;
  metadata?: Record<string, any>;
}

export interface ReviewReportResponse {
  success: boolean;
  reportId?: string;
  message?: string;
  error?: string;
}

// Validation Schemas
export interface ReviewValidationRules {
  overallRating: {
    required: true;
    min: 1;
    max: 5;
  };
  title: {
    maxLength: 255;
    minLength?: 5;
  };
  comment: {
    maxLength: 2000;
    minLength?: 10;
  };
  response: {
    maxLength: 1000;
    minLength?: 10;
  };
}

// Error Types
export class ReviewError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}

export class ReviewModerationError extends Error {
  constructor(
    message: string,
    public reviewId: string,
    public moderationStatus: ModerationStatus,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ReviewModerationError';
  }
}

export class ReviewValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any,
    public constraint?: string
  ) {
    super(message);
    this.name = 'ReviewValidationError';
  }
}

// Helper Types
export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<RatingValue, number>;
  latestReviews: ReviewData[];
}

export interface ReviewMetrics {
  daily: Array<{ date: string; count: number; averageRating: number }>;
  weekly: Array<{ week: string; count: number; averageRating: number }>;
  monthly: Array<{ month: string; count: number; averageRating: number }>;
}

// Export all types for external use
export type {
  ReviewData as Review,
  CreateReviewData as CreateReview,
  UpdateReviewData as UpdateReview,
};
