/**
 * Insurance Policies and Claims Migration
 * Creates tables for managing insurance policies and claims processing
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create insurance_type enum
  await knex.raw(`
    CREATE TYPE insurance_type AS ENUM (
      'travel_insurance',
      'cancellation_insurance',
      'medical_insurance',
      'baggage_insurance',
      'activity_insurance',
      'comprehensive_insurance',
      'liability_insurance'
    );
  `);

  // Create insurance_policies table
  await knex.schema.createTable('insurance_policies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').notNullable().references('id').inTable('bookings');
    table.string('policy_number', 100).unique().notNullable();
    
    // Policy details
    table.specificType('insurance_type', 'insurance_type').notNullable();
    table.decimal('coverage_amount', 10, 2).notNullable();
    table.decimal('premium_amount', 10, 2).notNullable();
    table.decimal('deductible_amount', 10, 2).defaultTo(0);
    
    // Coverage details
    table.jsonb('coverage_details');
    table.text('terms_and_conditions');
    
    // Status
    table.string('status', 20).defaultTo('active');
    table.comment('active, expired, claimed, cancelled');
    
    // Provider information
    table.string('provider_name', 100);
    table.string('provider_policy_id', 255);
    
    // Validity period
    table.timestamp('valid_from', { useTz: true }).notNullable();
    table.timestamp('valid_until', { useTz: true }).notNullable();
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['booking_id']);
    table.index(['policy_number']);
    table.index(['status']);
    table.index(['valid_from', 'valid_until']);
  });

  // Create insurance_claims table
  await knex.schema.createTable('insurance_claims', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('policy_id').notNullable().references('id').inTable('insurance_policies');
    table.uuid('booking_id').notNullable().references('id').inTable('bookings');
    table.uuid('claimant_id').notNullable().references('id').inTable('users');
    
    // Claim details
    table.string('claim_number', 100).unique().notNullable();
    table.timestamp('incident_date', { useTz: true }).notNullable();
    table.decimal('claim_amount', 10, 2).notNullable();
    table.decimal('approved_amount', 10, 2);
    
    // Incident description
    table.text('incident_description').notNullable();
    table.specificType('damage_photos', 'text[]');
    
    // Processing
    table.string('status', 20).defaultTo('submitted');
    table.comment('submitted, investigating, approved, denied, paid');
    table.uuid('processed_by').references('id').inTable('users');
    table.text('processing_notes');
    
    // AI assessment
    table.decimal('ai_fraud_score', 3, 2);
    table.jsonb('ai_damage_assessment');
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('resolved_at', { useTz: true });
    
    // Indexes
    table.index(['policy_id']);
    table.index(['booking_id']);
    table.index(['claimant_id']);
    table.index(['claim_number']);
    table.index(['status']);
    table.index(['incident_date']);
    table.index(['created_at']);
  });

  // Add constraints
  await knex.raw(`
    ALTER TABLE insurance_policies 
    ADD CONSTRAINT check_policy_status 
    CHECK (status IN ('active', 'expired', 'claimed', 'cancelled'));
  `);

  await knex.raw(`
    ALTER TABLE insurance_policies 
    ADD CONSTRAINT check_valid_period 
    CHECK (valid_until > valid_from);
  `);

  await knex.raw(`
    ALTER TABLE insurance_claims 
    ADD CONSTRAINT check_claim_status 
    CHECK (status IN ('submitted', 'investigating', 'approved', 'denied', 'paid'));
  `);

  await knex.raw(`
    ALTER TABLE insurance_claims 
    ADD CONSTRAINT check_fraud_score 
    CHECK (ai_fraud_score >= 0 AND ai_fraud_score <= 1);
  `);

  await knex.raw(`
    ALTER TABLE insurance_claims 
    ADD CONSTRAINT check_approved_amount 
    CHECK (approved_amount IS NULL OR approved_amount <= claim_amount);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('insurance_claims');
  await knex.schema.dropTableIfExists('insurance_policies');
  await knex.raw('DROP TYPE IF EXISTS insurance_type');
}
