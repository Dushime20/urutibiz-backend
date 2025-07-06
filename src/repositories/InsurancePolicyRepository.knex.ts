/**
 * Insurance Policy Repository
 * Data access layer for insurance policies
 */

import { Knex } from 'knex';
import {
  InsurancePolicy,
  CreateInsurancePolicyRequest,
  UpdateInsurancePolicyRequest,
  InsurancePolicyFilters,
  InsurancePolicyWithDetails,
  InsurancePolicyError
} from '../types/insurance.types';

export class InsurancePolicyRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new insurance policy
   */
  async create(data: CreateInsurancePolicyRequest): Promise<InsurancePolicy> {
    try {
      // Generate policy number
      const policyNumber = await this.generatePolicyNumber();
      
      const [policy] = await this.db('insurance_policies')
        .insert({
          ...data,
          policy_number: policyNumber,
          booking_id: data.bookingId,
          insurance_type: data.insuranceType,
          coverage_amount: data.coverageAmount,
          premium_amount: data.premiumAmount,
          deductible_amount: data.deductibleAmount || 0,
          coverage_details: data.coverageDetails,
          terms_and_conditions: data.termsAndConditions,
          provider_name: data.providerName,
          provider_policy_id: data.providerPolicyId,
          valid_from: data.validFrom,
          valid_until: data.validUntil
        })
        .returning('*');

      return this.mapToPolicy(policy);
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to create insurance policy',
        'CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance policy by ID
   */
  async findById(id: string): Promise<InsurancePolicy | null> {
    try {
      const policy = await this.db('insurance_policies')
        .where('id', id)
        .first();

      return policy ? this.mapToPolicy(policy) : null;
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to fetch insurance policy',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance policy by policy number
   */
  async findByPolicyNumber(policyNumber: string): Promise<InsurancePolicy | null> {
    try {
      const policy = await this.db('insurance_policies')
        .where('policy_number', policyNumber)
        .first();

      return policy ? this.mapToPolicy(policy) : null;
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to fetch insurance policy',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance policies with filters and pagination
   */
  async findMany(
    filters: InsurancePolicyFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ policies: InsurancePolicy[]; total: number }> {
    try {
      const query = this.db('insurance_policies');
      
      // Apply filters
      this.applyFilters(query, filters);
      
      // Get total count
      const totalQuery = query.clone();
      const [{ count }] = await totalQuery.count('* as count');
      const total = parseInt(count as string);
      
      // Apply pagination
      const offset = (page - 1) * limit;
      const policies = await query
        .limit(limit)
        .offset(offset)
        .orderBy('created_at', 'desc');

      return {
        policies: policies.map(policy => this.mapToPolicy(policy)),
        total
      };
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to fetch insurance policies',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance policies by booking ID
   */
  async findByBookingId(bookingId: string): Promise<InsurancePolicy[]> {
    try {
      const policies = await this.db('insurance_policies')
        .where('booking_id', bookingId)
        .orderBy('created_at', 'desc');

      return policies.map(policy => this.mapToPolicy(policy));
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to fetch insurance policies for booking',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get insurance policy with full details
   */
  async findByIdWithDetails(id: string): Promise<InsurancePolicyWithDetails | null> {
    try {
      const policy = await this.db('insurance_policies as ip')
        .leftJoin('bookings as b', 'ip.booking_id', 'b.id')
        .leftJoin('users as u', 'b.user_id', 'u.id')
        .select(
          'ip.*',
          'b.customer_name',
          'b.destination',
          'b.start_date',
          'b.end_date'
        )
        .where('ip.id', id)
        .first();

      if (!policy) return null;

      // Get related claims
      const claims = await this.db('insurance_claims')
        .where('policy_id', id)
        .orderBy('created_at', 'desc');

      const policyWithDetails: InsurancePolicyWithDetails = {
        ...this.mapToPolicy(policy),
        booking: {
          id: policy.booking_id,
          customerName: policy.customer_name,
          destination: policy.destination,
          startDate: policy.start_date,
          endDate: policy.end_date
        },
        claims: claims.map(claim => this.mapToClaim(claim))
      };

      return policyWithDetails;
    } catch (error) {
      throw new InsurancePolicyError(
        'Failed to fetch insurance policy details',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Update insurance policy
   */
  async update(id: string, data: UpdateInsurancePolicyRequest): Promise<InsurancePolicy> {
    try {
      const updateData: any = {};
      
      if (data.status !== undefined) updateData.status = data.status;
      if (data.coverageDetails !== undefined) updateData.coverage_details = data.coverageDetails;
      if (data.termsAndConditions !== undefined) updateData.terms_and_conditions = data.termsAndConditions;
      if (data.providerName !== undefined) updateData.provider_name = data.providerName;
      if (data.providerPolicyId !== undefined) updateData.provider_policy_id = data.providerPolicyId;
      if (data.validFrom !== undefined) updateData.valid_from = data.validFrom;
      if (data.validUntil !== undefined) updateData.valid_until = data.validUntil;

      const [policy] = await this.db('insurance_policies')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!policy) {
        throw new InsurancePolicyError(
          'Insurance policy not found',
          'NOT_FOUND',
          404
        );
      }

      return this.mapToPolicy(policy);
    } catch (error) {
      if (error instanceof InsurancePolicyError) throw error;
      throw new InsurancePolicyError(
        'Failed to update insurance policy',
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Delete insurance policy
   */
  async delete(id: string): Promise<void> {
    try {
      const deletedCount = await this.db('insurance_policies')
        .where('id', id)
        .del();

      if (deletedCount === 0) {
        throw new InsurancePolicyError(
          'Insurance policy not found',
          'NOT_FOUND',
          404
        );
      }
    } catch (error) {
      if (error instanceof InsurancePolicyError) throw error;
      throw new InsurancePolicyError(
        'Failed to delete insurance policy',
        'DELETE_ERROR',
        500
      );
    }
  }

  /**
   * Check if policy is valid for a given date
   */
  async isValidOnDate(policyId: string, date: Date): Promise<boolean> {
    try {
      const policy = await this.db('insurance_policies')
        .where('id', policyId)
        .where('status', 'active')
        .where('valid_from', '<=', date)
        .where('valid_until', '>=', date)
        .first();

      return !!policy;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique policy number
   */
  private async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const policyNumber = `POL${year}${randomSuffix}`;

    // Check if already exists
    const existing = await this.db('insurance_policies')
      .where('policy_number', policyNumber)
      .first();

    if (existing) {
      return this.generatePolicyNumber(); // Recursive retry
    }

    return policyNumber;
  }

  /**
   * Apply filters to query
   */
  private applyFilters(query: Knex.QueryBuilder, filters: InsurancePolicyFilters): void {
    if (filters.bookingId) {
      query.where('booking_id', filters.bookingId);
    }
    if (filters.insuranceType) {
      query.where('insurance_type', filters.insuranceType);
    }
    if (filters.status) {
      query.where('status', filters.status);
    }
    if (filters.providerName) {
      query.where('provider_name', 'ilike', `%${filters.providerName}%`);
    }
    if (filters.validFrom) {
      query.where('valid_from', '>=', filters.validFrom);
    }
    if (filters.validUntil) {
      query.where('valid_until', '<=', filters.validUntil);
    }
    if (filters.createdAfter) {
      query.where('created_at', '>=', filters.createdAfter);
    }
    if (filters.createdBefore) {
      query.where('created_at', '<=', filters.createdBefore);
    }
  }

  /**
   * Map database row to InsurancePolicy
   */
  private mapToPolicy(row: any): InsurancePolicy {
    return {
      id: row.id,
      bookingId: row.booking_id,
      policyNumber: row.policy_number,
      insuranceType: row.insurance_type,
      coverageAmount: parseFloat(row.coverage_amount),
      premiumAmount: parseFloat(row.premium_amount),
      deductibleAmount: parseFloat(row.deductible_amount || 0),
      coverageDetails: row.coverage_details,
      termsAndConditions: row.terms_and_conditions,
      status: row.status,
      providerName: row.provider_name,
      providerPolicyId: row.provider_policy_id,
      validFrom: new Date(row.valid_from),
      validUntil: new Date(row.valid_until),
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Map database row to InsuranceClaim (helper)
   */
  private mapToClaim(row: any): any {
    return {
      id: row.id,
      policyId: row.policy_id,
      bookingId: row.booking_id,
      claimantId: row.claimant_id,
      claimNumber: row.claim_number,
      incidentDate: new Date(row.incident_date),
      claimAmount: parseFloat(row.claim_amount),
      approvedAmount: row.approved_amount ? parseFloat(row.approved_amount) : undefined,
      incidentDescription: row.incident_description,
      damagePhotos: row.damage_photos,
      status: row.status,
      processedBy: row.processed_by,
      processingNotes: row.processing_notes,
      aiFraudScore: row.ai_fraud_score ? parseFloat(row.ai_fraud_score) : undefined,
      aiDamageAssessment: row.ai_damage_assessment,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined
    };
  }
}
