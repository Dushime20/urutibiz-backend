/**
 * Add Performance Indexes for Insurance Claims
 * Migration to add critical indexes for query optimization
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if insurance_claims table exists before adding indexes
  const hasInsuranceClaims = await knex.schema.hasTable('insurance_claims');
  if (hasInsuranceClaims) {
    await knex.schema.alterTable('insurance_claims', (table) => {
      // Primary query indexes
      table.index(['policy_id'], 'idx_insurance_claims_policy_id');
      table.index(['booking_id'], 'idx_insurance_claims_booking_id');
      table.index(['claimant_id'], 'idx_insurance_claims_claimant_id');
      table.index(['status'], 'idx_insurance_claims_status');
      table.index(['processed_by'], 'idx_insurance_claims_processed_by');
      
      // Unique constraint on claim_number for fast lookups
      table.unique(['claim_number'], { indexName: 'idx_insurance_claims_claim_number_unique' });
      
      // Date range query indexes
      table.index(['incident_date'], 'idx_insurance_claims_incident_date');
      table.index(['created_at'], 'idx_insurance_claims_created_at');
      table.index(['resolved_at'], 'idx_insurance_claims_resolved_at');
      
      // Amount range query indexes
      table.index(['claim_amount'], 'idx_insurance_claims_claim_amount');
      table.index(['approved_amount'], 'idx_insurance_claims_approved_amount');
      
      // AI assessment indexes
      table.index(['ai_fraud_score'], 'idx_insurance_claims_ai_fraud_score');
      
      // Composite indexes for common filter combinations
      table.index(['status', 'created_at'], 'idx_insurance_claims_status_created');
      table.index(['policy_id', 'status'], 'idx_insurance_claims_policy_status');
      table.index(['claimant_id', 'created_at'], 'idx_insurance_claims_claimant_created');
      
      // AI assessment composite index
      table.index(['status', 'ai_fraud_score'], 'idx_insurance_claims_status_ai_score');
    });
  }

  // Check if insurance_policies table exists before adding indexes
  const hasInsurancePolicies = await knex.schema.hasTable('insurance_policies');
  if (hasInsurancePolicies) {
    await knex.schema.alterTable('insurance_policies', (table) => {
      // Primary query indexes
      table.index(['booking_id'], 'idx_insurance_policies_booking_id');
      table.index(['insurance_type'], 'idx_insurance_policies_insurance_type');
      table.index(['status'], 'idx_insurance_policies_status');
      table.index(['provider_name'], 'idx_insurance_policies_provider_name');
      
      // Unique constraint on policy_number
      table.unique(['policy_number'], { indexName: 'idx_insurance_policies_policy_number_unique' });
      
      // Date range indexes
      table.index(['valid_from'], 'idx_insurance_policies_valid_from');
      table.index(['valid_until'], 'idx_insurance_policies_valid_until');
      table.index(['created_at'], 'idx_insurance_policies_created_at');
      
      // Amount indexes
      table.index(['coverage_amount'], 'idx_insurance_policies_coverage_amount');
      table.index(['premium_amount'], 'idx_insurance_policies_premium_amount');
      
      // Composite indexes for common queries
      table.index(['booking_id', 'status'], 'idx_insurance_policies_booking_status');
      table.index(['insurance_type', 'status'], 'idx_insurance_policies_type_status');
      table.index(['valid_from', 'valid_until'], 'idx_insurance_policies_validity_period');
    });
  }

  console.log('✅ Performance indexes added successfully (skipped tables that do not exist yet)');
}

export async function down(knex: Knex): Promise<void> {
  // Check if insurance_claims table exists before dropping indexes
  const hasInsuranceClaims = await knex.schema.hasTable('insurance_claims');
  if (hasInsuranceClaims) {
    await knex.schema.alterTable('insurance_claims', (table) => {
      table.dropIndex(['policy_id'], 'idx_insurance_claims_policy_id');
      table.dropIndex(['booking_id'], 'idx_insurance_claims_booking_id');
      table.dropIndex(['claimant_id'], 'idx_insurance_claims_claimant_id');
      table.dropIndex(['status'], 'idx_insurance_claims_status');
      table.dropIndex(['processed_by'], 'idx_insurance_claims_processed_by');
      table.dropUnique(['claim_number'], 'idx_insurance_claims_claim_number_unique');
      table.dropIndex(['incident_date'], 'idx_insurance_claims_incident_date');
      table.dropIndex(['created_at'], 'idx_insurance_claims_created_at');
      table.dropIndex(['resolved_at'], 'idx_insurance_claims_resolved_at');
      table.dropIndex(['claim_amount'], 'idx_insurance_claims_claim_amount');
      table.dropIndex(['approved_amount'], 'idx_insurance_claims_approved_amount');
      table.dropIndex(['ai_fraud_score'], 'idx_insurance_claims_ai_fraud_score');
      table.dropIndex(['status', 'created_at'], 'idx_insurance_claims_status_created');
      table.dropIndex(['policy_id', 'status'], 'idx_insurance_claims_policy_status');
      table.dropIndex(['claimant_id', 'created_at'], 'idx_insurance_claims_claimant_created');
      table.dropIndex(['status', 'ai_fraud_score'], 'idx_insurance_claims_status_ai_score');
    });
  }

  // Check if insurance_policies table exists before dropping indexes
  const hasInsurancePolicies = await knex.schema.hasTable('insurance_policies');
  if (hasInsurancePolicies) {
    await knex.schema.alterTable('insurance_policies', (table) => {
      table.dropIndex(['booking_id'], 'idx_insurance_policies_booking_id');
      table.dropIndex(['insurance_type'], 'idx_insurance_policies_insurance_type');
      table.dropIndex(['status'], 'idx_insurance_policies_status');
      table.dropIndex(['provider_name'], 'idx_insurance_policies_provider_name');
      table.dropUnique(['policy_number'], 'idx_insurance_policies_policy_number_unique');
      table.dropIndex(['valid_from'], 'idx_insurance_policies_valid_from');
      table.dropIndex(['valid_until'], 'idx_insurance_policies_valid_until');
      table.dropIndex(['created_at'], 'idx_insurance_policies_created_at');
      table.dropIndex(['coverage_amount'], 'idx_insurance_policies_coverage_amount');
      table.dropIndex(['premium_amount'], 'idx_insurance_policies_premium_amount');
      table.dropIndex(['booking_id', 'status'], 'idx_insurance_policies_booking_status');
      table.dropIndex(['insurance_type', 'status'], 'idx_insurance_policies_type_status');
      table.dropIndex(['valid_from', 'valid_until'], 'idx_insurance_policies_validity_period');
    });
  }

  console.log('✅ Performance indexes removed successfully (skipped tables that do not exist)');
}
