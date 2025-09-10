// =====================================================
// VIOLATION TYPES
// =====================================================

export interface ViolationData {
  id: string;
  userId: string;
  productId?: string;
  bookingId?: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  category: ViolationCategory;
  title: string;
  description: string;
  evidence?: ViolationEvidence[];
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  reportedBy: string; // User ID who reported the violation
  assignedTo?: string; // Moderator/Admin ID assigned to handle
  status: ViolationStatus;
  resolution?: ViolationResolution;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface CreateViolationRequest {
  userId: string;
  productId?: string;
  bookingId?: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  category: ViolationCategory;
  title: string;
  description: string;
  evidence?: ViolationEvidence[];
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  metadata?: Record<string, any>;
}

export interface UpdateViolationRequest {
  status?: ViolationStatus;
  assignedTo?: string;
  resolution?: ViolationResolution;
  metadata?: Record<string, any>;
}

export interface ViolationEvidence {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'text';
  url?: string;
  filename?: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ViolationResolution {
  action: ViolationAction;
  reason: string;
  penalty?: {
    type: 'warning' | 'fine' | 'suspension' | 'ban' | 'restriction';
    amount?: number;
    duration?: number; // in days
    details?: string;
  };
  resolvedBy: string;
  resolvedAt: Date;
  notes?: string;
}

export type ViolationType = 
  | 'fraud' 
  | 'harassment' 
  | 'property_damage' 
  | 'payment_fraud' 
  | 'fake_listing' 
  | 'safety_violation' 
  | 'terms_violation' 
  | 'spam' 
  | 'inappropriate_content' 
  | 'unauthorized_use' 
  | 'other';

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ViolationCategory = 
  | 'user_behavior' 
  | 'product_quality' 
  | 'payment_issues' 
  | 'safety_concerns' 
  | 'content_policy' 
  | 'fraud' 
  | 'technical' 
  | 'other';

export type ViolationStatus = 
  | 'reported' 
  | 'under_review' 
  | 'investigating' 
  | 'resolved' 
  | 'dismissed' 
  | 'escalated' 
  | 'closed';

export type ViolationAction = 
  | 'warning' 
  | 'fine' 
  | 'suspension' 
  | 'ban' 
  | 'restriction' 
  | 'dismiss' 
  | 'escalate' 
  | 'no_action';

export interface ViolationFilters {
  userId?: string;
  productId?: string;
  bookingId?: string;
  violationType?: ViolationType;
  severity?: ViolationSeverity;
  category?: ViolationCategory;
  status?: ViolationStatus;
  reportedBy?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ViolationStats {
  total: number;
  byStatus: Record<ViolationStatus, number>;
  bySeverity: Record<ViolationSeverity, number>;
  byCategory: Record<ViolationCategory, number>;
  byType: Record<ViolationType, number>;
  resolved: number;
  pending: number;
  escalated: number;
}

export interface ViolationReport {
  violation: ViolationData;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  product?: {
    id: string;
    name: string;
    status: string;
  };
  booking?: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
