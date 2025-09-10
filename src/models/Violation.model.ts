// =====================================================
// VIOLATION MODEL
// =====================================================

import { ViolationData, CreateViolationRequest, UpdateViolationRequest } from '@/types/violation.types';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/config/database';

export class Violation implements Partial<ViolationData> {
  public id: string;
  public userId: string;
  public productId?: string;
  public bookingId?: string;
  public violationType: string;
  public severity: string;
  public category: string;
  public title: string;
  public description: string;
  public evidence?: any[];
  public location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  public reportedBy: string;
  public assignedTo?: string;
  public status: string;
  public resolution?: any;
  public metadata?: Record<string, any>;
  public createdAt: Date;
  public updatedAt: Date;
  public resolvedAt?: Date;

  constructor(data: Partial<ViolationData>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId || '';
    this.productId = data.productId;
    this.bookingId = data.bookingId;
    this.violationType = data.violationType || '';
    this.severity = data.severity || 'medium';
    this.category = data.category || 'other';
    this.title = data.title || '';
    this.description = data.description || '';
    this.evidence = data.evidence || [];
    this.location = data.location;
    this.reportedBy = data.reportedBy || '';
    this.assignedTo = data.assignedTo;
    this.status = data.status || 'reported';
    this.resolution = data.resolution;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.resolvedAt = data.resolvedAt;
  }

  /**
   * Create a new violation
   */
  static async create(data: CreateViolationRequest): Promise<ViolationData> {
    const db = getDatabase();
    
    const violationData = {
      id: uuidv4(),
      user_id: data.userId,
      product_id: data.productId || null,
      booking_id: data.bookingId || null,
      violation_type: data.violationType,
      severity: data.severity,
      category: data.category,
      title: data.title,
      description: data.description,
      location_address: data.location?.address || null,
      location_latitude: data.location?.coordinates?.latitude || null,
      location_longitude: data.location?.coordinates?.longitude || null,
      reported_by: data.reportedBy,
      assigned_to: null,
      status: 'reported',
      resolution_action: null,
      resolution_reason: null,
      penalty_type: null,
      penalty_amount: null,
      penalty_duration_days: null,
      penalty_details: null,
      resolved_by: null,
      resolved_at: null,
      resolution_notes: null,
      metadata: data.metadata || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    const [violation] = await db('violations')
      .insert(violationData)
      .returning('*');

    return Violation.mapDbToModel(violation);
  }

  /**
   * Find violation by ID
   */
  static async findById(id: string): Promise<ViolationData | null> {
    const db = getDatabase();
    
    const violation = await db('violations')
      .where({ id })
      .first();

    if (!violation) {
      return null;
    }

    return Violation.mapDbToModel(violation);
  }

  /**
   * Find violations with filters and pagination
   */
  static async findPaginated(
    filters: any = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    violations: ViolationData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    // Build query
    let query = db('violations')
      .select('*')
      .orderBy(sortBy, sortOrder);

    // Apply filters
    if (filters.userId) {
      query = query.where('user_id', filters.userId);
    }
    if (filters.productId) {
      query = query.where('product_id', filters.productId);
    }
    if (filters.bookingId) {
      query = query.where('booking_id', filters.bookingId);
    }
    if (filters.violationType) {
      query = query.where('violation_type', filters.violationType);
    }
    if (filters.severity) {
      query = query.where('severity', filters.severity);
    }
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.reportedBy) {
      query = query.where('reported_by', filters.reportedBy);
    }
    if (filters.assignedTo) {
      query = query.where('assigned_to', filters.assignedTo);
    }
    if (filters.dateFrom) {
      query = query.where('created_at', '>=', new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      query = query.where('created_at', '<=', new Date(filters.dateTo));
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(function() {
        this.where('title', 'ILIKE', searchTerm)
            .orWhere('description', 'ILIKE', searchTerm);
      });
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const [{ count: totalCount }] = await countQuery;
    const total = parseInt(totalCount as string);

    // Apply pagination
    const violations = await query
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      violations: violations.map(violation => Violation.mapDbToModel(violation)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Update violation
   */
  async update(data: UpdateViolationRequest): Promise<ViolationData> {
    const db = getDatabase();
    
    const updateData: any = {
      updated_at: new Date()
    };

    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.assignedTo !== undefined) {
      updateData.assigned_to = data.assignedTo;
    }
    if (data.resolution !== undefined) {
      updateData.resolution_action = data.resolution.action;
      updateData.resolution_reason = data.resolution.reason;
      updateData.penalty_type = data.resolution.penalty?.type;
      updateData.penalty_amount = data.resolution.penalty?.amount;
      updateData.penalty_duration_days = data.resolution.penalty?.duration;
      updateData.penalty_details = data.resolution.penalty?.details;
      updateData.resolved_by = data.resolution.resolvedBy;
      updateData.resolved_at = data.resolution.resolvedAt;
      updateData.resolution_notes = data.resolution.notes;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    const [updatedViolation] = await db('violations')
      .where({ id: this.id })
      .update(updateData)
      .returning('*');

    return Violation.mapDbToModel(updatedViolation);
  }

  /**
   * Add evidence to violation
   */
  async addEvidence(evidence: {
    type: 'image' | 'video' | 'document' | 'audio' | 'text';
    filename?: string;
    url?: string;
    description?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    uploadedBy: string;
  }): Promise<void> {
    const db = getDatabase();
    
    await db('violation_evidence').insert({
      id: uuidv4(),
      violation_id: this.id,
      type: evidence.type,
      filename: evidence.filename,
      url: evidence.url,
      description: evidence.description,
      file_size_bytes: evidence.fileSizeBytes,
      mime_type: evidence.mimeType,
      uploaded_by: evidence.uploadedBy,
      uploaded_at: new Date()
    });
  }

  /**
   * Add comment to violation
   */
  async addComment(comment: {
    content: string;
    type: 'investigation' | 'resolution' | 'escalation' | 'general';
    isInternal: boolean;
    authorId: string;
  }): Promise<void> {
    const db = getDatabase();
    
    await db('violation_comments').insert({
      id: uuidv4(),
      violation_id: this.id,
      content: comment.content,
      type: comment.type,
      is_internal: comment.isInternal,
      author_id: comment.authorId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  /**
   * Get violation statistics
   */
  static async getStats(): Promise<any> {
    const db = getDatabase();
    
    const [
      totalResult,
      statusResult,
      severityResult,
      categoryResult,
      typeResult
    ] = await Promise.all([
      db('violations').count('* as count'),
      db('violations').select('status').count('* as count').groupBy('status'),
      db('violations').select('severity').count('* as count').groupBy('severity'),
      db('violations').select('category').count('* as count').groupBy('category'),
      db('violations').select('violation_type').count('* as count').groupBy('violation_type')
    ]);

    const total = parseInt(totalResult[0].count as string);
    
    const byStatus = statusResult.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
    
    const bySeverity = severityResult.reduce((acc: any, row: any) => {
      acc[row.severity] = parseInt(row.count);
      return acc;
    }, {});
    
    const byCategory = categoryResult.reduce((acc: any, row: any) => {
      acc[row.category] = parseInt(row.count);
      return acc;
    }, {});
    
    const byType = typeResult.reduce((acc: any, row: any) => {
      acc[row.violation_type] = parseInt(row.count);
      return acc;
    }, {});

    return {
      total,
      byStatus,
      bySeverity,
      byCategory,
      byType,
      resolved: byStatus.resolved || 0,
      pending: (byStatus.reported || 0) + (byStatus.under_review || 0) + (byStatus.investigating || 0),
      escalated: byStatus.escalated || 0
    };
  }

  /**
   * Map database row to model
   */
  private static mapDbToModel(row: any): ViolationData {
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      bookingId: row.booking_id,
      violationType: row.violation_type,
      severity: row.severity,
      category: row.category,
      title: row.title,
      description: row.description,
      evidence: [], // Will be loaded separately if needed
      location: {
        address: row.location_address,
        coordinates: row.location_latitude && row.location_longitude ? {
          latitude: parseFloat(row.location_latitude),
          longitude: parseFloat(row.location_longitude)
        } : undefined
      },
      reportedBy: row.reported_by,
      assignedTo: row.assigned_to,
      status: row.status,
      resolution: row.resolution_action ? {
        action: row.resolution_action,
        reason: row.resolution_reason,
        penalty: row.penalty_type ? {
          type: row.penalty_type,
          amount: row.penalty_amount,
          duration: row.penalty_duration_days,
          details: row.penalty_details
        } : undefined,
        resolvedBy: row.resolved_by,
        resolvedAt: row.resolved_at,
        notes: row.resolution_notes
      } : undefined,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };
  }
}
