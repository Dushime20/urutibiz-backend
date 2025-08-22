// Moderation types from provided attachment
export interface ModerationRule {
  id: string;
  name: string;
  type: 'content' | 'behavior' | 'fraud' | 'spam' | 'image';
  category: 'user' | 'product' | 'booking' | 'review' | 'message';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  conditions: ModerationCondition[];
  actions: ModerationAction[];
  thresholds: {
    autoAction: number;
    humanReview: number;
    immediate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface ModerationCondition {
  field: string;
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'regex' | 'ml_confidence';
  value: string | number;
  weight: number;
}
export interface ModerationAction {
  type: 'flag' | 'warn' | 'suspend' | 'ban' | 'require_review' | 'auto_reject' | 'quarantine';
  duration?: number;
  escalation?: boolean;
  notification?: boolean;
  metadata?: Record<string, any>;
}
export interface ModerationResult {
  id: string;
  resourceType: 'user' | 'product' | 'booking' | 'review' | 'message';
  resourceId: string;
  ruleId: string;
  ruleName: string;
  score: number;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'escalated';
  triggeredConditions: string[];
  appliedActions: ModerationAction[];
  reviewRequired: boolean;
  moderatorId?: string;
  moderatorDecision?: 'approve' | 'reject' | 'escalate';
  moderatorNotes?: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
export interface ContentAnalysis {
  textAnalysis: {
    toxicity: number;
    profanity: number;
    spam: number;
    sentiment: number;
    language: string;
    topics: string[];
    readabilityScore: number;
  };
  imageAnalysis?: {
    inappropriateContent: number;
    qualityScore: number;
    duplicateDetection: number;
    faceDetection: boolean;
    objectDetection: string[];
  };
  fraudIndicators: {
    suspiciousPatterns: string[];
    riskScore: number;
    priceAnomaly: number;
    locationMismatch: boolean;
  };
}
export interface BehaviorAnalysis {
  userId: string;
  timeframe: string;
  metrics: {
    loginFrequency: number;
    sessionDuration: number;
    bookingPatterns: number;
    messageVolume: number;
    reportCount: number;
    cancellationRate: number;
    responseTime: number;
  };
  anomalies: {
    rapidSignups: boolean;
    suspiciousIPs: boolean;
    bulkActions: boolean;
    coordinatedBehavior: boolean;
  };
  riskScore: number;
  confidence: number;
}
export interface FraudDetection {
  bookingId: string;
  indicators: {
    rapidBooking: boolean;
    newAccount: boolean;
    locationMismatch: boolean;
    paymentAnomalies: boolean;
    priceManipulation: boolean;
    coordinatedAttack: boolean;
  };
  riskScore: number;
  confidence: number;
  recommendedAction: 'approve' | 'review' | 'reject' | 'investigate';
}
export interface ModerationQueue {
  id: string;
  type: 'content' | 'behavior' | 'fraud' | 'appeal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resourceType: string;
  resourceId: string;
  assignedModerator?: string;
  status: 'pending' | 'in_review' | 'completed' | 'escalated';
  automatedScore: number;
  humanReviewRequired: boolean;
  deadline: Date;
  createdAt: Date;
}
export interface ModerationMetrics {
  period: string;
  totalItems: number;
  automated: {
    approved: number;
    rejected: number;
    flagged: number;
    escalated: number;
  };
  manual: {
    reviewed: number;
    approved: number;
    rejected: number;
    escalated: number;
  };
  performance: {
    accuracyRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    avgProcessingTime: number;
  };
  categories: {
    [key: string]: {
      count: number;
      accuracy: number;
    };
  };
}
export interface ModerationConfig {
  globalSettings: {
    enabled: boolean;
    defaultSeverity: 'low' | 'medium' | 'high';
    humanReviewThreshold: number;
    autoActionThreshold: number;
    appealWindow: number;
  };
  contentModeration: {
    textAnalysis: boolean;
    imageAnalysis: boolean;
    languageDetection: boolean;
    sentimentAnalysis: boolean;
    topicClassification: boolean;
  };
  behaviorMonitoring: {
    enabled: boolean;
    trackingWindow: number;
    anomalyDetection: boolean;
    patternRecognition: boolean;
  };
  fraudDetection: {
    enabled: boolean;
    mlModels: boolean;
    riskThresholds: { low: number; medium: number; high: number };
  };
  notifications: {
    adminAlerts: boolean;
    userNotifications: boolean;
    escalationAlerts: boolean;
    reportFrequency: 'realtime' | 'hourly' | 'daily';
  };
}

/**
 * Moderation Action Data - Stores individual moderation actions with reasons
 */
export interface ModerationActionData {
  id: string;
  resourceType: 'user' | 'product' | 'review' | 'booking' | 'message';
  resourceId: string;
  action: 'approve' | 'reject' | 'flag' | 'quarantine' | 'delete' | 'draft' | 'ban' | 'suspend' | 'activate' | 'warn';
  reason?: string;
  moderatorId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
