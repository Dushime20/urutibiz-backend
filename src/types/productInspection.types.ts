// =====================================================
// PRODUCT INSPECTION TYPES
// =====================================================

export enum InspectionType {
  PRE_RENTAL = 'pre_rental',
  POST_RETURN = 'post_return'
}

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved'
}

export enum ItemCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged'
}

export enum PhotoType {
  GENERAL = 'general',
  DAMAGE = 'damage',
  CONDITION = 'condition',
  BEFORE = 'before',
  AFTER = 'after'
}

export enum DisputeType {
  DAMAGE_ASSESSMENT = 'damage_assessment',
  CONDITION_DISAGREEMENT = 'condition_disagreement',
  COST_DISPUTE = 'cost_dispute',
  OTHER = 'other'
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// =====================================================
// CORE INSPECTION INTERFACES
// =====================================================

export interface ProductInspection {
  id: string;
  productId: string;
  bookingId: string;
  inspectorId: string;
  renterId: string;
  ownerId: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  
  // Timestamps
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Location and notes
  inspectionLocation?: string;
  generalNotes?: string;
  ownerNotes?: string;
  renterNotes?: string;
  inspectorNotes?: string;
  
  // Dispute handling
  hasDispute: boolean;
  disputeReason?: string;
  disputeResolvedAt?: Date;
  resolvedBy?: string;
  
  // Related data (populated)
  product?: any;
  booking?: any;
  inspector?: any;
  renter?: any;
  owner?: any;
  items?: InspectionItem[];
  photos?: InspectionPhoto[];
  disputes?: InspectionDispute[];
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  itemName: string;
  description?: string;
  condition: ItemCondition;
  notes?: string;
  
  // Photos and evidence
  photos?: string[];
  damageEvidence?: any;
  
  // Cost implications
  repairCost: number;
  replacementCost: number;
  requiresRepair: boolean;
  requiresReplacement: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionPhoto {
  id: string;
  inspectionId: string;
  itemId?: string;
  photoUrl: string;
  cloudinaryPublicId?: string;
  caption?: string;
  photoType: PhotoType;
  
  // Metadata
  metadata?: any;
  takenAt: Date;
  createdAt: Date;
}

export interface InspectionDispute {
  id: string;
  inspectionId: string;
  raisedBy: string;
  disputeType: DisputeType;
  reason: string;
  evidence?: any;
  status: DisputeStatus;
  
  // Resolution
  resolutionNotes?: string;
  agreedAmount?: number;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateInspectionRequest {
  productId: string;
  bookingId: string;
  inspectorId: string;
  inspectionType: InspectionType;
  scheduledAt: Date;
  inspectionLocation?: string;
  generalNotes?: string;
}

export interface UpdateInspectionRequest {
  status?: InspectionStatus;
  startedAt?: Date;
  completedAt?: Date;
  inspectionLocation?: string;
  generalNotes?: string;
  ownerNotes?: string;
  renterNotes?: string;
  inspectorNotes?: string;
}

export interface CreateInspectionItemRequest {
  itemName: string;
  description?: string;
  condition: ItemCondition;
  notes?: string;
  photos?: string[];
  damageEvidence?: any;
  repairCost?: number;
  replacementCost?: number;
}

export interface UpdateInspectionItemRequest {
  itemName?: string;
  description?: string;
  condition?: ItemCondition;
  notes?: string;
  photos?: string[];
  damageEvidence?: any;
  repairCost?: number;
  replacementCost?: number;
  requiresRepair?: boolean;
  requiresReplacement?: boolean;
}

export interface CreateDisputeRequest {
  disputeType: DisputeType;
  reason: string;
  evidence?: any;
}

export interface ResolveDisputeRequest {
  resolutionNotes: string;
  agreedAmount?: number;
}

// =====================================================
// FILTER AND QUERY INTERFACES
// =====================================================

export interface InspectionFilters {
  productId?: string;
  bookingId?: string;
  inspectorId?: string;
  renterId?: string;
  ownerId?: string;
  inspectionType?: InspectionType;
  status?: InspectionStatus;
  hasDispute?: boolean;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  completedFrom?: Date;
  completedTo?: Date;
}

export interface InspectionItemFilters {
  inspectionId?: string;
  condition?: ItemCondition;
  requiresRepair?: boolean;
  requiresReplacement?: boolean;
}

// =====================================================
// BUSINESS LOGIC INTERFACES
// =====================================================

export interface InspectionSummary {
  totalInspections: number;
  completedInspections: number;
  pendingInspections: number;
  disputedInspections: number;
  totalDamageCost: number;
  averageInspectionTime: number;
}

export interface DamageAssessment {
  totalRepairCost: number;
  totalReplacementCost: number;
  itemsRequiringRepair: number;
  itemsRequiringReplacement: number;
  damageDetails: InspectionItem[];
}

export interface InspectionReport {
  inspection: ProductInspection;
  items: InspectionItem[];
  photos: InspectionPhoto[];
  damageAssessment: DamageAssessment;
  timeline: {
    scheduled: Date;
    started?: Date;
    completed?: Date;
    duration?: number;
  };
  participants: {
    inspector: any;
    renter: any;
    owner: any;
  };
}

// =====================================================
// NOTIFICATION INTERFACES
// =====================================================

export interface InspectionNotification {
  type: 'scheduled' | 'started' | 'completed' | 'disputed' | 'resolved';
  inspectionId: string;
  productId: string;
  bookingId: string;
  recipients: string[];
  message: string;
  data?: any;
}

// =====================================================
// VALIDATION INTERFACES
// =====================================================

export interface InspectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ItemValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
