// =====================================================
// HANDOVER & RETURN WORKFLOW TYPES
// =====================================================

export enum HandoverType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  MEETUP = 'meetup'
}

export enum HandoverStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum ReturnStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export interface Location {
  type: 'owner_location' | 'renter_location' | 'meeting_point';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  instructions?: string;
}

export interface ConditionReport {
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  damages: DamageItem[];
  wearAndTear: WearItem[];
  functionality: FunctionalityItem[];
  cleanliness: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  inspectorId?: string;
  inspectionDate: Date;
}

export interface DamageItem {
  id: string;
  type: 'scratch' | 'dent' | 'crack' | 'stain' | 'tear' | 'other';
  severity: 'minor' | 'moderate' | 'major';
  location: string;
  description: string;
  photoUrl?: string;
  estimatedRepairCost?: number;
}

export interface WearItem {
  id: string;
  type: 'normal_wear' | 'excessive_wear' | 'fading' | 'loosening';
  severity: 'minor' | 'moderate' | 'major';
  location: string;
  description: string;
  photoUrl?: string;
}

export interface FunctionalityItem {
  id: string;
  component: string;
  status: 'working' | 'partially_working' | 'not_working';
  description: string;
  notes?: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  description?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  included: boolean;
  photoUrl?: string;
  notes?: string;
}

export interface ConditionComparison {
  overallConditionChange: 'improved' | 'same' | 'worsened';
  newDamages: DamageItem[];
  resolvedDamages: string[]; // IDs of previously reported damages
  wearProgression: WearItem[];
  functionalityChanges: FunctionalityItem[];
  cleanlinessChange: 'improved' | 'same' | 'worsened';
  notes?: string;
}

export interface DamageReport {
  totalDamageCost: number;
  damages: DamageItem[];
  wearAndTear: WearItem[];
  functionalityIssues: FunctionalityItem[];
  recommendedActions: string[];
  estimatedRepairTime?: number;
  inspectorId: string;
  inspectionDate: Date;
}

export interface CleaningReport {
  cleanlinessScore: number; // 1-10
  cleaningRequired: boolean;
  cleaningItems: string[];
  estimatedCleaningCost?: number;
  notes?: string;
}

export interface MaintenanceItem {
  id: string;
  type: 'routine' | 'repair' | 'replacement' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedCost?: number;
  estimatedTime?: number;
  requiredBeforeNextRental: boolean;
}

export interface HandoverMessage {
  id: string;
  senderId: string;
  senderType: 'owner' | 'renter' | 'platform' | 'support';
  message: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'location';
  attachments?: string[];
  timestamp: Date;
  readBy: string[]; // User IDs who have read the message
}

export interface ReturnMessage {
  id: string;
  senderId: string;
  senderType: 'owner' | 'renter' | 'platform' | 'support' | 'inspector';
  message: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'location';
  attachments?: string[];
  timestamp: Date;
  readBy: string[];
}

export interface HandoverNotification {
  id: string;
  userId: string;
  handoverSessionId: string;
  type: 'reminder' | 'confirmation' | 'delay' | 'completion' | 'dispute' | 'emergency';
  channel: NotificationChannel;
  message: string;
  priority: NotificationPriority;
  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  status: NotificationStatus;
  metadata?: Record<string, any>;
}

export interface ReturnNotification {
  id: string;
  userId: string;
  returnSessionId: string;
  type: 'reminder' | 'confirmation' | 'delay' | 'completion' | 'dispute' | 'damage_alert';
  channel: NotificationChannel;
  message: string;
  priority: NotificationPriority;
  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  status: NotificationStatus;
  metadata?: Record<string, any>;
}

export interface HandoverSession {
  id: string;
  bookingId: string;
  ownerId: string;
  renterId: string;
  productId: string;
  
  // Handover Details
  handoverType: HandoverType;
  scheduledDateTime: Date;
  actualDateTime?: Date;
  location: Location;
  
  // Status Tracking
  status: HandoverStatus;
  handoverCode: string; // 6-digit verification code
  
  // Documentation
  preHandoverPhotos: string[];
  postHandoverPhotos: string[];
  conditionReport: ConditionReport;
  accessoryChecklist: AccessoryItem[];
  
  // Verification
  ownerSignature?: string;
  renterSignature?: string;
  witnessId?: string;
  
  // Communication
  messages: HandoverMessage[];
  notifications: HandoverNotification[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ReturnSession {
  id: string;
  bookingId: string;
  handoverSessionId: string;
  ownerId: string;
  renterId: string;
  productId: string;
  
  // Return Details
  returnType: HandoverType;
  scheduledDateTime: Date;
  actualDateTime?: Date;
  location: Location;
  
  // Status Tracking
  status: ReturnStatus;
  returnCode: string; // 6-digit verification code
  
  // Documentation
  preReturnPhotos: string[];
  postReturnPhotos: string[];
  conditionComparison: ConditionComparison;
  accessoryVerification: AccessoryItem[];
  
  // Assessment
  damageAssessment?: DamageReport;
  cleaningAssessment?: CleaningReport;
  maintenanceRequired?: MaintenanceItem[];
  
  // Verification
  ownerSignature?: string;
  renterSignature?: string;
  inspectorId?: string;
  
  // Communication
  messages: ReturnMessage[];
  notifications: ReturnNotification[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateHandoverSessionRequest {
  bookingId: string;
  handoverType: HandoverType;
  scheduledDateTime: Date;
  location: Location;
  notes?: string;
}

export interface UpdateHandoverSessionRequest {
  scheduledDateTime?: Date;
  location?: Location;
  status?: HandoverStatus;
  notes?: string;
}

export interface CompleteHandoverRequest {
  handoverCode: string;
  conditionReport: ConditionReport;
  accessoryChecklist: AccessoryItem[];
  ownerSignature?: string;
  renterSignature?: string;
  photos?: string[];
  notes?: string;
}

export interface CreateReturnSessionRequest {
  bookingId: string;
  handoverSessionId: string;
  returnType: HandoverType;
  scheduledDateTime: Date;
  location: Location;
  notes?: string;
}

export interface UpdateReturnSessionRequest {
  scheduledDateTime?: Date;
  location?: Location;
  status?: ReturnStatus;
  notes?: string;
}

export interface CompleteReturnRequest {
  returnCode: string;
  conditionComparison: ConditionComparison;
  accessoryVerification: AccessoryItem[];
  ownerSignature?: string;
  renterSignature?: string;
  photos?: string[];
  notes?: string;
}

export interface SendMessageRequest {
  handoverSessionId?: string;
  returnSessionId?: string;
  message: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'location';
  attachments?: string[];
}

export interface ScheduleNotificationRequest {
  userId: string;
  handoverSessionId?: string;
  returnSessionId?: string;
  type: string;
  channel: NotificationChannel;
  message: string;
  priority: NotificationPriority;
  scheduledAt: Date;
  metadata?: Record<string, any>;
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface HandoverSessionFilters {
  bookingId?: string;
  ownerId?: string;
  renterId?: string;
  productId?: string;
  status?: HandoverStatus;
  handoverType?: HandoverType;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  page?: number;
  limit?: number;
}

export interface ReturnSessionFilters {
  bookingId?: string;
  handoverSessionId?: string;
  ownerId?: string;
  renterId?: string;
  productId?: string;
  status?: ReturnStatus;
  returnType?: HandoverType;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  page?: number;
  limit?: number;
}

export interface MessageFilters {
  handoverSessionId?: string;
  returnSessionId?: string;
  senderId?: string;
  messageType?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  userId?: string;
  handoverSessionId?: string;
  returnSessionId?: string;
  type?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  page?: number;
  limit?: number;
}

// =====================================================
// RESPONSE TYPES
// =====================================================

export interface HandoverSessionResponse {
  success: boolean;
  data?: HandoverSession;
  error?: string;
}

export interface ReturnSessionResponse {
  success: boolean;
  data?: ReturnSession;
  error?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: HandoverMessage | ReturnMessage;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: HandoverNotification | ReturnNotification;
  error?: string;
}

export interface HandoverReturnStats {
  totalHandovers: number;
  totalReturns: number;
  handoverSuccessRate: number;
  returnOnTimeRate: number;
  averageHandoverTime: number; // minutes
  averageReturnProcessingTime: number; // minutes
  disputeRate: number;
  userSatisfactionScore: number;
  statusDistribution: {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    disputed: number;
  };
  typeDistribution: {
    pickup: number;
    delivery: number;
    meetup: number;
  };
}
