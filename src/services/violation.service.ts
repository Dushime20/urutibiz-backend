// =====================================================
// VIOLATION SERVICE
// =====================================================

import { ViolationData, CreateViolationRequest, UpdateViolationRequest, ViolationFilters, ViolationStats, ViolationAction, ViolationResolution } from '@/types/violation.types';
import { Violation } from '@/models/Violation.model';
import { getDatabase } from '@/config/database';

export class ViolationService {
  private static db = getDatabase();

  /**
   * Create a new violation
   */
  static async createViolation(data: CreateViolationRequest): Promise<{
    success: boolean;
    data?: ViolationData;
    error?: string;
  }> {
    try {
      // Validate required fields
      if (!data.userId || !data.title || !data.description) {
        return {
          success: false,
          error: 'Missing required fields: userId, title, description'
        };
      }

      // Validate violation type
      const validViolationTypes = [
        'fraud', 'harassment', 'property_damage', 'payment_fraud', 
        'fake_listing', 'safety_violation', 'terms_violation', 
        'spam', 'inappropriate_content', 'unauthorized_use', 'other'
      ];
      if (!validViolationTypes.includes(data.violationType)) {
        return {
          success: false,
          error: `Invalid violation type. Must be one of: ${validViolationTypes.join(', ')}`
        };
      }

      // Validate severity
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(data.severity)) {
        return {
          success: false,
          error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
        };
      }

      // Validate category
      const validCategories = [
        'user_behavior', 'product_quality', 'payment_issues', 
        'safety_concerns', 'content_policy', 'fraud', 'technical', 'other'
      ];
      if (!validCategories.includes(data.category)) {
        return {
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        };
      }

      // Check if user exists
      const user = await this.db('users').where({ id: data.userId }).first();
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Create violation - reportedBy will be set by the model or from authenticated user context
      const violation = await Violation.create(data);

      return {
        success: true,
        data: violation
      };
    } catch (error: any) {
      console.error('[ViolationService] Error creating violation:', error);
      return {
        success: false,
        error: error.message || 'Failed to create violation'
      };
    }
  }

  /**
   * Get violation by ID
   */
  static async getViolationById(id: string): Promise<{
    success: boolean;
    data?: ViolationData;
    error?: string;
  }> {
    try {
      const violation = await Violation.findById(id);
      
      if (!violation) {
        return {
          success: false,
          error: 'Violation not found'
        };
      }

      return {
        success: true,
        data: violation
      };
    } catch (error: any) {
      console.error('[ViolationService] Error getting violation:', error);
      return {
        success: false,
        error: error.message || 'Failed to get violation'
      };
    }
  }

  /**
   * Get violations with filters and pagination
   */
  static async getViolations(
    filters: ViolationFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    success: boolean;
    data?: {
      violations: ViolationData[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const result = await Violation.findPaginated(filters, page, limit, sortBy, sortOrder);

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('[ViolationService] Error getting violations:', error);
      return {
        success: false,
        error: error.message || 'Failed to get violations'
      };
    }
  }

  /**
   * Update violation
   */
  static async updateViolation(
    id: string,
    data: UpdateViolationRequest,
    updatedBy: string
  ): Promise<{
    success: boolean;
    data?: ViolationData;
    error?: string;
  }> {
    try {
      const violation = await Violation.findById(id);
      
      if (!violation) {
        return {
          success: false,
          error: 'Violation not found'
        };
      }

      // Create violation instance and update
      const violationInstance = new Violation(violation);
      const updatedViolation = await violationInstance.update(data);

      return {
        success: true,
        data: updatedViolation
      };
    } catch (error: any) {
      console.error('[ViolationService] Error updating violation:', error);
      return {
        success: false,
        error: error.message || 'Failed to update violation'
      };
    }
  }

  /**
   * Assign violation to moderator/admin
   */
  static async assignViolation(
    id: string,
    assignedTo: string,
    assignedBy: string
  ): Promise<{
    success: boolean;
    data?: ViolationData;
    error?: string;
  }> {
    try {
      // Check if assignee exists and has appropriate role
      const assignee = await this.db('users')
        .where({ id: assignedTo })
        .whereIn('role', ['admin', 'moderator'])
        .first();

      if (!assignee) {
        return {
          success: false,
          error: 'Assignee not found or does not have appropriate role'
        };
      }

      const result = await this.updateViolation(id, { assignedTo }, assignedBy);
      
      if (result.success) {
        // Add assignment comment
        const violationInstance = new Violation(result.data!);
        await violationInstance.addComment({
          content: `Violation assigned to ${assignee.first_name} ${assignee.last_name}`,
          type: 'investigation',
          isInternal: true,
          authorId: assignedBy
        });
      }

      return result;
    } catch (error: any) {
      console.error('[ViolationService] Error assigning violation:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign violation'
      };
    }
  }

  /**
   * Resolve violation
   */
  static async resolveViolation(
    id: string,
    resolution: {
      action: string;
      reason: string;
      penalty?: {
        type: string;
        amount?: number;
        duration?: number;
        details?: string;
      };
      notes?: string;
    },
    resolvedBy: string
  ): Promise<{
    success: boolean;
    data?: ViolationData;
    error?: string;
  }> {
    try {
      // Validate action type
      const validActions: ViolationAction[] = ['warning', 'fine', 'suspension', 'ban', 'restriction', 'dismiss', 'no_action'];
      if (!validActions.includes(resolution.action as ViolationAction)) {
        return {
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`
        };
      }

      const resolutionData: ViolationResolution = {
        action: resolution.action as ViolationAction,
        reason: resolution.reason,
        penalty: resolution.penalty ? {
          type: resolution.penalty.type as 'warning' | 'fine' | 'suspension' | 'ban' | 'restriction',
          amount: resolution.penalty.amount,
          duration: resolution.penalty.duration,
          details: resolution.penalty.details
        } : undefined,
        resolvedBy,
        resolvedAt: new Date(),
        notes: resolution.notes
      };

      const result = await this.updateViolation(id, {
        status: 'resolved',
        resolution: resolutionData
      }, resolvedBy);

      if (result.success) {
        // Add resolution comment
        const violationInstance = new Violation(result.data!);
        await violationInstance.addComment({
          content: `Violation resolved: ${resolution.action} - ${resolution.reason}`,
          type: 'resolution',
          isInternal: false,
          authorId: resolvedBy
        });
      }

      return result;
    } catch (error: any) {
      console.error('[ViolationService] Error resolving violation:', error);
      return {
        success: false,
        error: error.message || 'Failed to resolve violation'
      };
    }
  }

  /**
   * Add evidence to violation
   */
  static async addEvidence(
    violationId: string,
    evidence: {
      type: 'image' | 'video' | 'document' | 'audio' | 'text';
      filename?: string;
      url?: string;
      description?: string;
      fileSizeBytes?: number;
      mimeType?: string;
    },
    uploadedBy: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const violation = await Violation.findById(violationId);
      
      if (!violation) {
        return {
          success: false,
          error: 'Violation not found'
        };
      }

      const violationInstance = new Violation(violation);
      await violationInstance.addEvidence({
        ...evidence,
        uploadedBy
      });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('[ViolationService] Error adding evidence:', error);
      return {
        success: false,
        error: error.message || 'Failed to add evidence'
      };
    }
  }

  /**
   * Add comment to violation
   */
  static async addComment(
    violationId: string,
    comment: {
      content: string;
      type: 'investigation' | 'resolution' | 'escalation' | 'general';
      isInternal: boolean;
    },
    authorId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const violation = await Violation.findById(violationId);
      
      if (!violation) {
        return {
          success: false,
          error: 'Violation not found'
        };
      }

      const violationInstance = new Violation(violation);
      await violationInstance.addComment({
        ...comment,
        authorId
      });

      return {
        success: true
      };
    } catch (error: any) {
      console.error('[ViolationService] Error adding comment:', error);
      return {
        success: false,
        error: error.message || 'Failed to add comment'
      };
    }
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(): Promise<{
    success: boolean;
    data?: ViolationStats;
    error?: string;
  }> {
    try {
      const stats = await Violation.getStats();

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      console.error('[ViolationService] Error getting violation stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to get violation statistics'
      };
    }
  }

  /**
   * Get violations by user
   */
  static async getViolationsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: {
      violations: ViolationData[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const result = await Violation.findPaginated(
        { userId },
        page,
        limit,
        'created_at',
        'desc'
      );

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('[ViolationService] Error getting violations by user:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user violations'
      };
    }
  }

  /**
   * Get violations assigned to moderator/admin
   */
  static async getViolationsByAssignee(
    assigneeId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: {
      violations: ViolationData[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    error?: string;
  }> {
    try {
      const result = await Violation.findPaginated(
        { assignedTo: assigneeId },
        page,
        limit,
        'created_at',
        'desc'
      );

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('[ViolationService] Error getting violations by assignee:', error);
      return {
        success: false,
        error: error.message || 'Failed to get assigned violations'
      };
    }
  }
}

export default ViolationService;
