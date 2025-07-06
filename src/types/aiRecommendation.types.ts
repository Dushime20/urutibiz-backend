/**
 * AI Recommendation Types
 * Comprehensive type definitions for AI-powered recommendations system
 */

// Base enums and types
export enum RecommendationType {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  CONTENT_BASED = 'content_based',
  HYBRID = 'hybrid',
  TRENDING = 'trending',
  LOCATION_BASED = 'location_based',
  BEHAVIOR_BASED = 'behavior_based',
  CATEGORY_BASED = 'category_based',
  PRICE_BASED = 'price_based'
}

export enum InteractionActionType {
  VIEW = 'view',
  SEARCH = 'search',
  CLICK = 'click',
  BOOK = 'book',
  FAVORITE = 'favorite',
  SHARE = 'share',
  RATE = 'rate',
  REVIEW = 'review',
  COMPARE = 'compare',
  FILTER = 'filter'
}

export enum TargetType {
  PRODUCT = 'product',
  CATEGORY = 'category',
  USER = 'user',
  SEARCH_RESULT = 'search_result',
  RECOMMENDATION = 'recommendation',
  LISTING = 'listing'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown'
}

// AI Recommendation interfaces
export interface AIRecommendation {
  id: string;
  userId: string;
  productId: string;
  recommendationType: RecommendationType;
  confidenceScore: number; // 0-1
  rankingPosition?: number;
  context?: Record<string, any>;
  reasoning?: string;
  wasClicked: boolean;
  wasBooked: boolean;
  clickedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateAIRecommendationRequest {
  userId: string;
  productId: string;
  recommendationType: RecommendationType;
  confidenceScore: number;
  rankingPosition?: number;
  context?: Record<string, any>;
  reasoning?: string;
  expiresAt?: Date;
}

export interface UpdateAIRecommendationRequest {
  confidenceScore?: number;
  rankingPosition?: number;
  context?: Record<string, any>;
  reasoning?: string;
  wasClicked?: boolean;
  wasBooked?: boolean;
  clickedAt?: Date;
  expiresAt?: Date;
}

export interface AIRecommendationFilters {
  userId?: string;
  productId?: string;
  recommendationType?: RecommendationType;
  minConfidence?: number;
  maxConfidence?: number;
  wasClicked?: boolean;
  wasBooked?: boolean;
  isActive?: boolean; // Not expired
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'confidence_score' | 'ranking_position';
  sortOrder?: 'ASC' | 'DESC';
}

// User Interaction interfaces
export interface UserInteraction {
  id: string;
  userId?: string;
  sessionId?: string;
  actionType: InteractionActionType;
  targetType?: TargetType;
  targetId?: string;
  pageUrl?: string;
  referrerUrl?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateUserInteractionRequest {
  userId?: string;
  sessionId?: string;
  actionType: InteractionActionType;
  targetType?: TargetType;
  targetId?: string;
  pageUrl?: string;
  referrerUrl?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  metadata?: Record<string, any>;
}

export interface UserInteractionFilters {
  userId?: string;
  sessionId?: string;
  actionType?: InteractionActionType;
  targetType?: TargetType;
  targetId?: string;
  deviceType?: DeviceType;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'action_type';
  sortOrder?: 'ASC' | 'DESC';
}

// AI Model Metrics interfaces
export interface AIModelMetric {
  id: string;
  modelName: string;
  modelVersion: string;
  metricName: string;
  metricValue: number;
  dataDate: Date;
  createdAt: Date;
}

export interface CreateAIModelMetricRequest {
  modelName: string;
  modelVersion: string;
  metricName: string;
  metricValue: number;
  dataDate: Date;
}

export interface UpdateAIModelMetricRequest {
  metricValue?: number;
  dataDate?: Date;
}

export interface AIModelMetricFilters {
  modelName?: string;
  modelVersion?: string;
  metricName?: string;
  minValue?: number;
  maxValue?: number;
  dataDateAfter?: Date;
  dataDateBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'data_date' | 'metric_value';
  sortOrder?: 'ASC' | 'DESC';
}

// Analytics and reporting interfaces
export interface RecommendationAnalytics {
  totalRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageConfidenceScore: number;
  topPerformingTypes: Array<{
    type: RecommendationType;
    count: number;
    ctr: number;
    conversionRate: number;
  }>;
  performanceByDate: Array<{
    date: string;
    recommendations: number;
    clicks: number;
    bookings: number;
  }>;
}

export interface UserBehaviorAnalytics {
  totalInteractions: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topActions: Array<{
    actionType: InteractionActionType;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    deviceType: DeviceType;
    count: number;
    percentage: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    interactions: number;
  }>;
}

export interface ModelPerformanceAnalytics {
  models: Array<{
    modelName: string;
    modelVersion: string;
    metricsCount: number;
    latestMetrics: Array<{
      metricName: string;
      metricValue: number;
      dataDate: Date;
    }>;
  }>;
  trendData: Array<{
    date: string;
    modelName: string;
    metricName: string;
    value: number;
  }>;
}

// Response interfaces
export interface AIRecommendationResponse {
  recommendations: AIRecommendation[];
  total: number;
  hasMore: boolean;
  analytics?: RecommendationAnalytics;
}

export interface UserInteractionResponse {
  interactions: UserInteraction[];
  total: number;
  hasMore: boolean;
  analytics?: UserBehaviorAnalytics;
}

export interface AIModelMetricResponse {
  metrics: AIModelMetric[];
  total: number;
  hasMore: boolean;
  analytics?: ModelPerformanceAnalytics;
}

// Recommendation generation interfaces
export interface GenerateRecommendationsRequest {
  userId: string;
  limit?: number;
  excludeProductIds?: string[];
  recommendationTypes?: RecommendationType[];
  contextData?: Record<string, any>;
}

export interface RecommendationContext {
  currentProduct?: string;
  searchQuery?: string;
  categoryId?: string;
  priceRange?: { min: number; max: number };
  locationId?: string;
  userPreferences?: Record<string, any>;
  sessionData?: Record<string, any>;
}

// Error types
export class AIRecommendationError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'GENERATION_ERROR' | 'EXPIRED' = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'AIRecommendationError';
  }
}

export class UserInteractionError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'TRACKING_ERROR' = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'UserInteractionError';
  }
}

export class AIModelMetricError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'METRIC_ERROR' = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'AIModelMetricError';
  }
}
