import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create product_risk_profiles table
  await knex.schema.createTable('product_risk_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable();
    table.uuid('category_id').notNullable();
    
    // Risk level and requirements
    table.enum('risk_level', ['low', 'medium', 'high', 'critical']).notNullable();
    table.boolean('mandatory_insurance').defaultTo(false);
    table.boolean('mandatory_inspection').defaultTo(false);
    table.decimal('min_coverage', 12, 2);
    table.json('inspection_types').defaultTo('[]');
    table.integer('compliance_deadline_hours').defaultTo(24);
    
    // Risk factors and mitigation
    table.json('risk_factors').defaultTo('[]');
    table.json('mitigation_strategies').defaultTo('[]');
    
    // Enforcement settings
    table.enum('enforcement_level', ['lenient', 'moderate', 'strict', 'very_strict']).defaultTo('moderate');
    table.boolean('auto_enforcement').defaultTo(true);
    table.integer('grace_period_hours').defaultTo(2);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('product_id');
    table.index('category_id');
    table.index('risk_level');
    table.index('enforcement_level');
    
    // Foreign key constraints
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');
  });

  // Create risk_assessments table
  await knex.schema.createTable('risk_assessments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable();
    table.uuid('renter_id').notNullable();
    table.uuid('booking_id');
    
    // Risk scores
    table.integer('overall_risk_score').notNullable(); // 0-100
    table.integer('product_risk_score').notNullable();
    table.integer('renter_risk_score').notNullable();
    table.integer('booking_risk_score').notNullable();
    table.integer('seasonal_risk_score').notNullable();
    
    // Assessment data
    table.json('risk_factors').defaultTo('{}');
    table.json('recommendations').defaultTo('[]');
    table.json('mandatory_requirements').defaultTo('{}');
    table.enum('compliance_status', ['compliant', 'non_compliant', 'pending', 'grace_period', 'exempt']).defaultTo('pending');
    
    // Timestamps
    table.timestamp('assessment_date').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('product_id');
    table.index('renter_id');
    table.index('booking_id');
    table.index('overall_risk_score');
    table.index('assessment_date');
    table.index('expires_at');
    
    // Foreign key constraints
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
  });

  // Create compliance_checks table
  await knex.schema.createTable('compliance_checks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable();
    table.uuid('product_id').notNullable();
    table.uuid('renter_id').notNullable();
    
    // Compliance status
    table.boolean('is_compliant').notNullable();
    table.json('missing_requirements').defaultTo('[]');
    table.integer('compliance_score').notNullable(); // 0-100
    table.enum('status', ['compliant', 'non_compliant', 'pending', 'grace_period', 'exempt']).notNullable();
    
    // Grace period
    table.timestamp('grace_period_ends_at');
    
    // Enforcement actions
    table.json('enforcement_actions').defaultTo('[]');
    
    // Timestamps
    table.timestamp('last_checked_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('booking_id');
    table.index('product_id');
    table.index('renter_id');
    table.index('is_compliant');
    table.index('status');
    table.index('last_checked_at');
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create policy_violations table
  await knex.schema.createTable('policy_violations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable();
    table.uuid('product_id').notNullable();
    table.uuid('renter_id').notNullable();
    
    // Violation details
    table.enum('violation_type', ['missing_insurance', 'missing_inspection', 'inadequate_coverage', 'expired_compliance']).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.text('description').notNullable();
    
    // Resolution
    table.timestamp('detected_at').defaultTo(knex.fn.now());
    table.timestamp('resolved_at');
    table.json('resolution_actions').defaultTo('[]');
    table.decimal('penalty_amount', 12, 2);
    table.enum('status', ['active', 'resolved', 'escalated']).defaultTo('active');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('booking_id');
    table.index('product_id');
    table.index('renter_id');
    table.index('violation_type');
    table.index('severity');
    table.index('status');
    table.index('detected_at');
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create enforcement_actions table
  await knex.schema.createTable('enforcement_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable();
    table.uuid('product_id').notNullable();
    table.uuid('renter_id').notNullable();
    
    // Action details
    table.enum('action_type', ['block_booking', 'require_insurance', 'require_inspection', 'send_notification', 'escalate']).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.text('message').notNullable();
    table.text('required_action').notNullable();
    table.timestamp('deadline');
    
    // Execution
    table.timestamp('executed_at');
    table.enum('status', ['pending', 'executed', 'failed', 'cancelled']).defaultTo('pending');
    table.text('execution_notes');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('booking_id');
    table.index('product_id');
    table.index('renter_id');
    table.index('action_type');
    table.index('severity');
    table.index('status');
    table.index('deadline');
    
    // Foreign key constraints
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('renter_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Create risk_management_configs table
  await knex.schema.createTable('risk_management_configs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('category_id').notNullable();
    table.uuid('country_id').notNullable();
    
    // Risk thresholds
    table.integer('low_risk_threshold').defaultTo(30);
    table.integer('medium_risk_threshold').defaultTo(60);
    table.integer('high_risk_threshold').defaultTo(85);
    table.integer('critical_risk_threshold').defaultTo(95);
    
    // Enforcement settings
    table.enum('enforcement_level', ['lenient', 'moderate', 'strict', 'very_strict']).defaultTo('moderate');
    table.boolean('auto_enforcement').defaultTo(true);
    table.integer('grace_period_hours').defaultTo(2);
    
    // Insurance requirements
    table.boolean('mandatory_insurance').defaultTo(false);
    table.decimal('min_coverage_amount', 12, 2);
    table.decimal('max_deductible', 12, 2);
    
    // Inspection requirements
    table.boolean('mandatory_inspection').defaultTo(false);
    table.json('inspection_types').defaultTo('[]');
    table.integer('inspection_deadline_hours').defaultTo(24);
    
    // Compliance tracking
    table.boolean('compliance_tracking').defaultTo(true);
    table.json('violation_penalties').defaultTo('{}');
    
    // Notification settings
    table.json('notification_settings').defaultTo('{}');
    
    // Status
    table.boolean('is_active').defaultTo(true);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('category_id');
    table.index('country_id');
    table.index('enforcement_level');
    table.index('is_active');
    
    // Foreign key constraints
    table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');
    table.foreign('country_id').references('id').inTable('countries').onDelete('CASCADE');
  });

  // Note: Default risk management configurations can be inserted via API endpoints
  // after categories and countries are properly set up in the system
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('risk_management_configs');
  await knex.schema.dropTableIfExists('enforcement_actions');
  await knex.schema.dropTableIfExists('policy_violations');
  await knex.schema.dropTableIfExists('compliance_checks');
  await knex.schema.dropTableIfExists('risk_assessments');
  await knex.schema.dropTableIfExists('product_risk_profiles');
}
