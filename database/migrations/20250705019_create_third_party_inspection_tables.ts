import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Add third-party inspection fields to product_inspections table
  const hasProductInspections = await knex.schema.hasTable('product_inspections');
  if (hasProductInspections) {
    const hasIsThirdParty = await knex.schema.hasColumn('product_inspections', 'is_third_party_inspection');
    if (!hasIsThirdParty) {
      await knex.schema.alterTable('product_inspections', (table) => {
    table.boolean('is_third_party_inspection').defaultTo(false).notNullable();
    table.string('inspection_tier', 20).nullable(); // 'standard' (120-point) or 'advanced' (240-point) - Dubizzle's model
    table.decimal('inspection_score', 5, 2).nullable(); // 0-100 with 2 decimal places
    table.integer('total_points').nullable(); // Total points for this inspection (120 or 240 for Dubizzle model)
    table.string('overall_rating', 20).nullable(); // excellent, good, fair, poor, very_poor
    table.uuid('public_report_id').nullable();
    table.string('certification_level', 50).nullable(); // Inspector certification level
    table.jsonb('category_criteria').nullable(); // Category-specific criteria scores
    
    // International/Global Support
    table.uuid('country_id').nullable(); // Country where inspection is performed
    table.string('region', 100).nullable(); // Region (e.g., "EU", "GCC", "APAC")
    table.string('timezone', 50).nullable(); // Timezone of inspection location
    table.decimal('latitude', 10, 8).nullable(); // GPS latitude for location-based matching
    table.decimal('longitude', 11, 8).nullable(); // GPS longitude for location-based matching
    table.string('currency', 3).nullable(); // Currency code (e.g., "USD", "EUR", "AED")
    table.decimal('inspection_cost', 10, 2).nullable(); // Cost of inspection in local currency
    table.jsonb('regulatory_notes').nullable(); // Country/region-specific regulatory compliance notes
      });
    }
  }

  // 2. Create inspection_criteria_templates table
  await knex.schema.createTable('inspection_criteria_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('category_id').notNullable();
    table.string('category_name', 100).notNullable(); // For quick reference
    table.string('template_name', 200).notNullable();
    table.text('description').nullable();
    table.jsonb('criteria').notNullable(); // Array of criteria with weights
    table.string('inspection_tier', 20).nullable(); // 'standard' (120-point) or 'advanced' (240-point) - Dubizzle's model
    table.integer('total_points').defaultTo(100).notNullable(); // 120 for standard, 240 for advanced (Dubizzle)
    
    // International/Global Support
    table.uuid('country_id').nullable(); // NULL = global template, specific UUID = country-specific
    table.string('region', 100).nullable(); // e.g., "EU", "NA", "APAC", "MEA"
    table.string('locale', 10).nullable(); // e.g., "en-US", "ar-AE", "fr-FR"
    table.jsonb('translations').nullable(); // Multi-language support: { "en": {...}, "ar": {...} }
    table.jsonb('regulatory_compliance').nullable(); // Country/region-specific compliance requirements
    
    table.boolean('is_active').defaultTo(true).notNullable();
    table.boolean('is_global').defaultTo(false).notNullable(); // Global template available everywhere
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index('category_id');
    table.index('country_id');
    table.index('region');
    table.index('is_active');
    table.index('is_global');
  });

  // 3. Create inspection_scores table (detailed scoring for each criterion)
  const hasInspectionScores = await knex.schema.hasTable('inspection_scores');
  const hasProductInspectionsForScores = await knex.schema.hasTable('product_inspections');
  if (!hasInspectionScores && hasProductInspectionsForScores) {
    await knex.schema.createTable('inspection_scores', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('inspection_id').notNullable();
      table.string('criterion_id', 100).notNullable(); // ID from criteria template
      table.string('criterion_name', 200).notNullable();
      table.decimal('score', 5, 2).notNullable(); // Points awarded
      table.decimal('max_score', 5, 2).notNullable(); // Maximum possible points
      table.text('notes').nullable();
      table.jsonb('evidence').nullable(); // Photos, documents, etc.
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index('inspection_id');
      table.index('criterion_id');
    });
    
    // Add foreign key conditionally
    if (hasProductInspectionsForScores) {
      await knex.schema.alterTable('inspection_scores', (table) => {
        table.foreign('inspection_id').references('id').inTable('product_inspections').onDelete('CASCADE');
      });
    }
  }

  // 4. Create inspector_certifications table
  const hasInspectorCertifications = await knex.schema.hasTable('inspector_certifications');
  const hasUsersForCertifications = await knex.schema.hasTable('users');
  if (!hasInspectorCertifications) {
    await knex.schema.createTable('inspector_certifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('inspector_id').notNullable(); // User ID with inspector role
      table.string('certification_type', 100).notNullable(); // e.g., "automotive", "electronics", "general"
      table.string('certification_level', 50).notNullable(); // e.g., "certified", "expert", "master"
      table.string('certifying_body', 200).nullable();
      table.string('certificate_number', 100).nullable();
      table.date('issued_date').nullable();
      table.date('expiry_date').nullable();
      table.jsonb('specializations').nullable(); // Array of specializations
      
      // International/Global Support
      table.uuid('country_id').nullable(); // Country where certification is valid
      table.string('region', 100).nullable(); // Regional validity (e.g., "EU", "GCC")
      table.jsonb('valid_countries').nullable(); // Array of country IDs where certification is valid
      table.string('international_standard', 100).nullable(); // e.g., "ISO 17020", "IAC", "NABL"
      table.boolean('internationally_recognized').defaultTo(false).notNullable();
      
      table.integer('total_inspections').defaultTo(0).notNullable();
      table.decimal('average_rating', 3, 2).defaultTo(0).notNullable(); // 0-5 stars
      table.boolean('is_active').defaultTo(true).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index('inspector_id');
      table.index('certification_type');
      table.index('country_id');
      table.index('region');
      table.index('is_active');
    });
    
    // Add foreign key conditionally
    if (hasUsersForCertifications) {
      await knex.schema.alterTable('inspector_certifications', (table) => {
        table.foreign('inspector_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }
  }

  // 5. Create public_inspection_reports table
  const hasPublicReports = await knex.schema.hasTable('public_inspection_reports');
  const hasProductInspectionsForReports = await knex.schema.hasTable('product_inspections');
  const hasProductsForReports = await knex.schema.hasTable('products');
  if (!hasPublicReports) {
    await knex.schema.createTable('public_inspection_reports', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('inspection_id').notNullable();
      table.uuid('product_id').notNullable();
      table.decimal('overall_score', 5, 2).notNullable();
      table.string('overall_rating', 20).notNullable();
      table.jsonb('category_scores').nullable(); // Breakdown by category
      table.jsonb('highlights').nullable(); // Key positive points
      table.jsonb('concerns').nullable(); // Key concerns/issues
      table.text('summary').nullable(); // Brief summary for public view
      table.text('recommendations').nullable();
      
      // International/Global Support
      table.jsonb('translations').nullable(); // Multi-language content: { "en": {...}, "ar": {...} }
      table.string('primary_language', 10).defaultTo('en').notNullable(); // Primary language of report
      table.uuid('country_id').nullable(); // Country where inspection was performed
      table.string('region', 100).nullable(); // Region where inspection was performed
      table.string('timezone', 50).nullable(); // Timezone of inspection location
      table.jsonb('regulatory_compliance').nullable(); // Compliance with local regulations
      
      table.boolean('is_passed').defaultTo(false).notNullable(); // Pass/Fail status
      table.date('inspection_date').notNullable();
      table.date('expiry_date').nullable(); // When inspection expires (e.g., 6 months)
      table.boolean('is_public').defaultTo(true).notNullable();
      table.integer('view_count').defaultTo(0).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index('inspection_id');
      table.index('product_id');
      table.index('country_id');
      table.index('region');
      table.index('is_public');
      table.index('overall_score');
      table.index('inspection_date');
    });
    
    // Add foreign keys conditionally
    if (hasProductInspectionsForReports && hasProductsForReports) {
      await knex.schema.alterTable('public_inspection_reports', (table) => {
        table.foreign('inspection_id').references('id').inTable('product_inspections').onDelete('CASCADE');
        table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
      });
    }
  }

  // 6. Add indexes to product_inspections for third-party inspections
  if (hasProductInspections) {
    const hasIsThirdPartyForIndex = await knex.schema.hasColumn('product_inspections', 'is_third_party_inspection');
    if (hasIsThirdPartyForIndex) {
      await knex.schema.alterTable('product_inspections', (table) => {
        table.index('is_third_party_inspection');
        table.index('inspection_score');
        table.index('overall_rating');
        table.index('country_id');
        table.index('region');
        // Spatial index for location-based queries (PostgreSQL PostGIS extension recommended)
        // table.index(['latitude', 'longitude'], 'idx_inspection_location');
      });
    }
  }
  
  // 7. Create inspector_locations table for location-based assignment
  const hasInspectorLocations = await knex.schema.hasTable('inspector_locations');
  const hasUsersForLocations = await knex.schema.hasTable('users');
  if (!hasInspectorLocations) {
    await knex.schema.createTable('inspector_locations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('inspector_id').notNullable();
      table.uuid('country_id').nullable();
      table.string('city', 100).nullable();
      table.string('state_province', 100).nullable();
      table.string('postal_code', 20).nullable();
      table.decimal('latitude', 10, 8).nullable();
      table.decimal('longitude', 11, 8).nullable();
      table.decimal('service_radius_km', 8, 2).defaultTo(50).notNullable(); // Service radius in kilometers
      table.boolean('is_primary').defaultTo(false).notNullable();
      table.boolean('is_active').defaultTo(true).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      // Indexes
      table.index('inspector_id');
      table.index('country_id');
      table.index('is_active');
      // Spatial index for location-based queries
      // table.index(['latitude', 'longitude'], 'idx_inspector_location');
    });
    
    // Add foreign key conditionally
    if (hasUsersForLocations) {
      await knex.schema.alterTable('inspector_locations', (table) => {
        table.foreign('inspector_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('inspector_locations');
  await knex.schema.dropTableIfExists('public_inspection_reports');
  await knex.schema.dropTableIfExists('inspector_certifications');
  await knex.schema.dropTableIfExists('inspection_scores');
  await knex.schema.dropTableIfExists('inspection_criteria_templates');
  
  // Remove columns from product_inspections
  await knex.schema.alterTable('product_inspections', (table) => {
    table.dropIndex('region');
    table.dropIndex('country_id');
    table.dropIndex('overall_rating');
    table.dropIndex('inspection_score');
    table.dropIndex('is_third_party_inspection');
    table.dropColumn('regulatory_notes');
    table.dropColumn('inspection_cost');
    table.dropColumn('currency');
    table.dropColumn('longitude');
    table.dropColumn('latitude');
    table.dropColumn('timezone');
    table.dropColumn('region');
    table.dropColumn('country_id');
    table.dropColumn('category_criteria');
    table.dropColumn('certification_level');
    table.dropColumn('public_report_id');
    table.dropColumn('overall_rating');
    table.dropColumn('total_points');
    table.dropColumn('inspection_tier');
    table.dropColumn('inspection_score');
    table.dropColumn('is_third_party_inspection');
  });
}

