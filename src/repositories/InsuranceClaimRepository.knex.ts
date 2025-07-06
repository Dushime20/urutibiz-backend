/**
 * Insurance Claims Repository
 * Data access layer for insurance claims with performance optimizations
 */

import { Knex } from 'knex';
import {
  InsuranceClaim,
  CreateInsuranceClaimRequest,
  UpdateInsuranceClaimRequest,
  InsuranceClaimFilters,
  InsuranceClaimWithDetails,
  InsuranceClaimError,
  InsurancePolicyStatus
} from '../types/insurance.types';
import { performanceTrack } from '../utils/PerformanceMonitor';

export class InsuranceClaimRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new insurance claim
   */
  @performanceTrack('InsuranceClaimRepository.create')
  async create(data: CreateInsuranceClaimRequest): Promise<InsuranceClaim> {
    try {
      // Generate claim number
      const claimNumber = await this.generateClaimNumber();
      
      const [claim] = await this.db('insurance_claims')
        .insert({
          policy_id: data.policyId,
          booking_id: data.bookingId,
          claimant_id: data.claimantId,
          claim_number: claimNumber,
          incident_date: data.incidentDate,
          claim_amount: data.claimAmount,
          incident_description: data.incidentDescription,
          damage_photos: data.damagePhotos
        })
        .returning('*');

      return this.mapToClaim(claim);
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to create insurance claim',
        'CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claim by ID
   */
  async findById(id: string): Promise<InsuranceClaim | null> {
    try {
      const claim = await this.db('insurance_claims')
        .where('id', id)
        .first();

      return claim ? this.mapToClaim(claim) : null;
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claim',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claim by claim number
   */
  async findByClaimNumber(claimNumber: string): Promise<InsuranceClaim | null> {
    try {
      const claim = await this.db('insurance_claims')
        .where('claim_number', claimNumber)
        .first();

      return claim ? this.mapToClaim(claim) : null;
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claim',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claims with filters and pagination (optimized single query)
   */
  @performanceTrack('InsuranceClaimRepository.findMany')
  async findMany(
    filters: InsuranceClaimFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ claims: InsuranceClaim[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      // Single query with count window function to avoid separate count query
      const query = this.db('insurance_claims')
        .select(
          '*',
          this.db.raw('COUNT(*) OVER() as total_count')
        );
      
      // Apply filters
      this.applyFilters(query, filters);
      
      const rows = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      if (rows.length === 0) {
        return { claims: [], total: 0 };
      }

      const total = parseInt(rows[0].total_count as string);
      const claims = rows.map(row => {
        // Remove total_count before mapping
        const { total_count, ...claimRow } = row;
        return this.mapToClaim(claimRow);
      });

      return { claims, total };
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claims',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claims by policy ID
   */
  async findByPolicyId(policyId: string): Promise<InsuranceClaim[]> {
    try {
      const claims = await this.db('insurance_claims')
        .where('policy_id', policyId)
        .orderBy('created_at', 'desc');

      return claims.map(claim => this.mapToClaim(claim));
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claims for policy',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claims by claimant ID
   */
  async findByClaimantId(claimantId: string): Promise<InsuranceClaim[]> {
    try {
      const claims = await this.db('insurance_claims')
        .where('claimant_id', claimantId)
        .orderBy('created_at', 'desc');

      return claims.map(claim => this.mapToClaim(claim));
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claims for claimant',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance claim with full details
   */
  async findByIdWithDetails(id: string): Promise<InsuranceClaimWithDetails | null> {
    try {
      const claim = await this.db('insurance_claims as ic')
        .leftJoin('insurance_policies as ip', 'ic.policy_id', 'ip.id')
        .leftJoin('users as claimant', 'ic.claimant_id', 'claimant.id')
        .leftJoin('users as processor', 'ic.processed_by', 'processor.id')
        .select(
          'ic.*',
          'ip.policy_number',
          'ip.insurance_type',
          'ip.coverage_amount',
          'claimant.name as claimant_name',
          'claimant.email as claimant_email',
          'processor.name as processor_name',
          'processor.email as processor_email'
        )
        .where('ic.id', id)
        .first();

      if (!claim) return null;

      const claimWithDetails: InsuranceClaimWithDetails = {
        ...this.mapToClaim(claim),
        policy: {
          id: claim.policy_id,
          bookingId: claim.booking_id,
          policyNumber: claim.policy_number,
          insuranceType: claim.insurance_type,
          coverageAmount: parseFloat(claim.coverage_amount),
          premiumAmount: 0, // Would need to join more data
          deductibleAmount: 0,
          status: InsurancePolicyStatus.ACTIVE, // Would need to join more data
          validFrom: new Date(),
          validUntil: new Date(),
          createdAt: new Date()
        },
        claimant: {
          id: claim.claimant_id,
          name: claim.claimant_name,
          email: claim.claimant_email
        },
        processor: claim.processed_by ? {
          id: claim.processed_by,
          name: claim.processor_name,
          email: claim.processor_email
        } : undefined
      };

      return claimWithDetails;
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch insurance claim details',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Update insurance claim
   */
  async update(id: string, data: UpdateInsuranceClaimRequest): Promise<InsuranceClaim> {
    try {
      const updateData: any = {};
      
      if (data.status !== undefined) updateData.status = data.status;
      if (data.approvedAmount !== undefined) updateData.approved_amount = data.approvedAmount;
      if (data.processedBy !== undefined) updateData.processed_by = data.processedBy;
      if (data.processingNotes !== undefined) updateData.processing_notes = data.processingNotes;
      if (data.aiFraudScore !== undefined) updateData.ai_fraud_score = data.aiFraudScore;
      if (data.aiDamageAssessment !== undefined) updateData.ai_damage_assessment = data.aiDamageAssessment;
      if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt;

      const [claim] = await this.db('insurance_claims')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!claim) {
        throw new InsuranceClaimError(
          'Insurance claim not found',
          'NOT_FOUND',
          404
        );
      }

      return this.mapToClaim(claim);
    } catch (error) {
      if (error instanceof InsuranceClaimError) throw error;
      throw new InsuranceClaimError(
        'Failed to update insurance claim',
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Delete insurance claim
   */
  async delete(id: string): Promise<void> {
    try {
      const deletedCount = await this.db('insurance_claims')
        .where('id', id)
        .del();

      if (deletedCount === 0) {
        throw new InsuranceClaimError(
          'Insurance claim not found',
          'NOT_FOUND',
          404
        );
      }
    } catch (error) {
      if (error instanceof InsuranceClaimError) throw error;
      throw new InsuranceClaimError(
        'Failed to delete insurance claim',
        'DELETE_ERROR',
        500
      );
    }
  }

  /**
   * Get claims requiring AI assessment
   */
  async findClaimsForAIAssessment(): Promise<InsuranceClaim[]> {
    try {
      const claims = await this.db('insurance_claims')
        .where('status', 'submitted')
        .whereNull('ai_fraud_score')
        .orderBy('created_at', 'asc')
        .limit(50); // Batch process

      return claims.map(claim => this.mapToClaim(claim));
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch claims for AI assessment',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get high-risk claims based on AI fraud score
   */
  async findHighRiskClaims(threshold = 0.7): Promise<InsuranceClaim[]> {
    try {
      const claims = await this.db('insurance_claims')
        .where('ai_fraud_score', '>=', threshold)
        .whereIn('status', ['submitted', 'investigating'])
        .orderBy('ai_fraud_score', 'desc');

      return claims.map(claim => this.mapToClaim(claim));
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to fetch high-risk claims',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Generate unique claim number with deterministic approach
   */
  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Use timestamp + random for better uniqueness, avoiding recursion
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    const claimNumber = `CLM${year}${month}${timestamp}${random}`;

    // Single validation query with retry limit
    let attempts = 0;
    let finalClaimNumber = claimNumber;
    
    while (attempts < 3) {
      const existing = await this.db('insurance_claims')
        .where('claim_number', finalClaimNumber)
        .first();

      if (!existing) {
        return finalClaimNumber;
      }
      
      // Generate new suffix if collision occurs
      attempts++;
      const newRandom = Math.random().toString(36).substring(2, 4).toUpperCase();
      finalClaimNumber = `CLM${year}${month}${timestamp}${newRandom}${attempts}`;
    }

    // Fallback: Use UUID suffix if all attempts fail
    const uuid = require('crypto').randomUUID().substring(0, 8).toUpperCase();
    return `CLM${year}${month}${uuid}`;
  }

  /**
   * Apply filters to query (optimized map-based approach)
   */
  private applyFilters(query: Knex.QueryBuilder, filters: InsuranceClaimFilters): void {
    // Define filter mappings for batch processing
    const filterMappings: Record<string, { column: string; operator: string }> = {
      policyId: { column: 'policy_id', operator: '=' },
      bookingId: { column: 'booking_id', operator: '=' },
      claimantId: { column: 'claimant_id', operator: '=' },
      status: { column: 'status', operator: '=' },
      processedBy: { column: 'processed_by', operator: '=' },
      incidentDateAfter: { column: 'incident_date', operator: '>=' },
      incidentDateBefore: { column: 'incident_date', operator: '<=' },
      createdAfter: { column: 'created_at', operator: '>=' },
      createdBefore: { column: 'created_at', operator: '<=' },
      minClaimAmount: { column: 'claim_amount', operator: '>=' },
      maxClaimAmount: { column: 'claim_amount', operator: '<=' },
      aiFraudScoreMin: { column: 'ai_fraud_score', operator: '>=' },
      aiFraudScoreMax: { column: 'ai_fraud_score', operator: '<=' },
    };

    // Batch apply all filters in one pass
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const mapping = filterMappings[key];
        if (mapping) {
          query.where(mapping.column, mapping.operator, value);
        }
      }
    });
  }

  /**
   * Batch create multiple insurance claims (optimized for bulk operations)
   */
  async batchCreate(claimsData: CreateInsuranceClaimRequest[]): Promise<InsuranceClaim[]> {
    try {
      const batchSize = 100; // Process in batches to avoid memory issues
      const results: InsuranceClaim[] = [];
      
      for (let i = 0; i < claimsData.length; i += batchSize) {
        const batch = claimsData.slice(i, i + batchSize);
        
        // Process batch in transaction for atomicity
        const batchResults = await this.db.transaction(async (trx) => {
          const insertData = await Promise.all(
            batch.map(async (data) => ({
              policy_id: data.policyId,
              booking_id: data.bookingId,
              claimant_id: data.claimantId,
              claim_number: await this.generateClaimNumber(),
              incident_date: data.incidentDate,
              claim_amount: data.claimAmount,
              incident_description: data.incidentDescription,
              damage_photos: data.damagePhotos,
              created_at: new Date()
            }))
          );

          const insertedClaims = await trx('insurance_claims')
            .insert(insertData)
            .returning('*');

          return insertedClaims.map(claim => this.mapToClaim(claim));
        });
        
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to batch create insurance claims',
        'BATCH_CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Batch update multiple insurance claims
   */
  async batchUpdate(updates: Array<{ id: string; data: UpdateInsuranceClaimRequest }>): Promise<InsuranceClaim[]> {
    try {
      const batchSize = 50;
      const results: InsuranceClaim[] = [];
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchResults = await this.db.transaction(async (trx) => {
          const updatePromises = batch.map(async ({ id, data }) => {
            const updateData: any = {};
            
            if (data.status !== undefined) updateData.status = data.status;
            if (data.approvedAmount !== undefined) updateData.approved_amount = data.approvedAmount;
            if (data.processedBy !== undefined) updateData.processed_by = data.processedBy;
            if (data.processingNotes !== undefined) updateData.processing_notes = data.processingNotes;
            if (data.aiFraudScore !== undefined) updateData.ai_fraud_score = data.aiFraudScore;
            if (data.aiDamageAssessment !== undefined) updateData.ai_damage_assessment = data.aiDamageAssessment;
            if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt;

            const [claim] = await trx('insurance_claims')
              .where('id', id)
              .update(updateData)
              .returning('*');

            return claim ? this.mapToClaim(claim) : null;
          });

          const batchResults = await Promise.all(updatePromises);
          return batchResults.filter(claim => claim !== null) as InsuranceClaim[];
        });
        
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to batch update insurance claims',
        'BATCH_UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Optimized search with full-text capabilities
   */
  async searchClaims(
    searchTerm: string, 
    filters: InsuranceClaimFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ claims: InsuranceClaim[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const query = this.db('insurance_claims')
        .select('*', this.db.raw('COUNT(*) OVER() as total_count'))
        .where((builder) => {
          builder
            .where('claim_number', 'ilike', `%${searchTerm}%`)
            .orWhere('incident_description', 'ilike', `%${searchTerm}%`)
            .orWhere('processing_notes', 'ilike', `%${searchTerm}%`);
        });

      // Apply additional filters
      this.applyFilters(query, filters);

      const rows = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      if (rows.length === 0) {
        return { claims: [], total: 0 };
      }

      const total = parseInt(rows[0].total_count as string);
      const claims = rows.map(row => {
        const { total_count, ...claimRow } = row;
        return this.mapToClaim(claimRow);
      });

      return { claims, total };
    } catch (error) {
      throw new InsuranceClaimError(
        'Failed to search insurance claims',
        'SEARCH_ERROR',
        500
      );
    }
  }

  // Static caches for optimized parsing
  private static dateCache = new Map<string, Date>();
  private static numericCache = new Map<string, number>();
  
  /**
   * Map database row to InsuranceClaim (optimized with caching)
   */
  private mapToClaim(row: any): InsuranceClaim {
    return {
      id: row.id,
      policyId: row.policy_id,
      bookingId: row.booking_id,
      claimantId: row.claimant_id,
      claimNumber: row.claim_number,
      incidentDate: this.parseDate(row.incident_date),
      claimAmount: this.parseNumeric(row.claim_amount),
      approvedAmount: row.approved_amount ? this.parseNumeric(row.approved_amount) : undefined,
      incidentDescription: row.incident_description,
      damagePhotos: row.damage_photos,
      status: row.status,
      processedBy: row.processed_by,
      processingNotes: row.processing_notes,
      aiFraudScore: row.ai_fraud_score ? this.parseNumeric(row.ai_fraud_score) : undefined,
      aiDamageAssessment: row.ai_damage_assessment,
      createdAt: this.parseDate(row.created_at),
      resolvedAt: row.resolved_at ? this.parseDate(row.resolved_at) : undefined
    };
  }

  /**
   * Optimized date parsing with memoization
   */
  private parseDate(dateString: string): Date {
    if (!InsuranceClaimRepository.dateCache.has(dateString)) {
      InsuranceClaimRepository.dateCache.set(dateString, new Date(dateString));
      
      // Prevent memory leaks by limiting cache size
      if (InsuranceClaimRepository.dateCache.size > 1000) {
        const firstKey = InsuranceClaimRepository.dateCache.keys().next().value;
        if (firstKey !== undefined) {
          InsuranceClaimRepository.dateCache.delete(firstKey);
        }
      }
    }
    return InsuranceClaimRepository.dateCache.get(dateString)!;
  }

  /**
   * Optimized numeric parsing with memoization
   */
  private parseNumeric(value: string | number): number {
    const key = String(value);
    if (!InsuranceClaimRepository.numericCache.has(key)) {
      InsuranceClaimRepository.numericCache.set(key, parseFloat(key));
      
      // Prevent memory leaks by limiting cache size
      if (InsuranceClaimRepository.numericCache.size > 1000) {
        const firstKey = InsuranceClaimRepository.numericCache.keys().next().value;
        if (firstKey !== undefined) {
          InsuranceClaimRepository.numericCache.delete(firstKey);
        }
      }
    }
    return InsuranceClaimRepository.numericCache.get(key)!;
  }
}
