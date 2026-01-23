import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('category_regulations');
  
  if (!hasTable) {
    await knex.schema.createTable('category_regulations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FKs to avoid ordering issues
      table.uuid('category_id').notNullable();
      table.uuid('country_id').notNullable();
      
      // Basic regulations
      table.boolean('is_allowed').defaultTo(true).notNullable();
      table.boolean('requires_license').defaultTo(false).notNullable();
      table.string('license_type', 100);
      table.integer('min_age_requirement');
      table.integer('max_rental_days');
      table.text('special_requirements');
      
      // Insurance requirements
      table.boolean('mandatory_insurance').defaultTo(false).notNullable();
      table.decimal('min_coverage_amount', 10, 2);
      
      // Additional regulatory fields
      table.decimal('max_liability_amount', 10, 2);
      table.boolean('requires_background_check').defaultTo(false).notNullable();
      table.text('prohibited_activities');
      table.jsonb('seasonal_restrictions');
      table.jsonb('documentation_required');
      table.enum('compliance_level', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).defaultTo('MEDIUM').notNullable();
      
      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
      
      // Soft delete support
      table.timestamp('deleted_at', { useTz: true });
      
      // Indexes
      table.index(['category_id']);
      table.index(['country_id']);
      table.index(['is_allowed']);
      table.index(['requires_license']);
      table.index(['compliance_level']);
      table.index(['mandatory_insurance']);
      
      // Unique constraint for category-country combination
      table.unique(['category_id', 'country_id']);
    });

    // Conditionally add FKs if referenced tables exist
    const hasCategories = await knex.schema.hasTable('categories');
    const hasCountries = await knex.schema.hasTable('countries');
    
    await knex.schema.alterTable('category_regulations', (table) => {
      if (hasCategories) {
        table.foreign('category_id').references('categories.id').onDelete('CASCADE');
      }
      if (hasCountries) {
        table.foreign('country_id').references('countries.id').onDelete('CASCADE');
      }
    });
  }

  // Insert sample data only if referenced tables exist
  const hasCategories = await knex.schema.hasTable('categories');
  const hasCountries = await knex.schema.hasTable('countries');
  
  if (hasCategories && hasCountries) {
    try {
      await knex('category_regulations').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          category_id: '650e8400-e29b-41d4-a716-446655440001', // Electronics
          country_id: '750e8400-e29b-41d4-a716-446655440001', // Uruguay
          is_allowed: true,
          requires_license: false,
          min_age_requirement: 18,
          max_rental_days: 30,
          special_requirements: 'Valid identification required. Items must be returned in original condition.',
          mandatory_insurance: true,
          min_coverage_amount: 50000.00,
          max_liability_amount: 100000.00,
          requires_background_check: false,
          prohibited_activities: 'Commercial resale, modification of devices',
          seasonal_restrictions: JSON.stringify({
            summer: { max_days: 45, special_rate: true },
            winter: { max_days: 30 }
          }),
          documentation_required: JSON.stringify([
            'government_id',
            'proof_of_address',
            'insurance_certificate'
          ]),
          compliance_level: 'MEDIUM',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          category_id: '650e8400-e29b-41d4-a716-446655440002', // Vehicles
          country_id: '750e8400-e29b-41d4-a716-446655440001', // Uruguay
          is_allowed: true,
          requires_license: true,
          license_type: 'DRIVER_LICENSE_CLASS_B',
          min_age_requirement: 21,
          max_rental_days: 90,
          special_requirements: 'Valid driver license required. International driving permit for foreign nationals.',
          mandatory_insurance: true,
          min_coverage_amount: 200000.00,
          max_liability_amount: 500000.00,
          requires_background_check: true,
          prohibited_activities: 'Racing, off-road driving in restricted areas, commercial transport',
          seasonal_restrictions: JSON.stringify({
            rainy_season: { 
              additional_requirements: ['weather_training'],
              max_consecutive_days: 14
            }
          }),
          documentation_required: JSON.stringify([
            'driver_license',
            'passport_or_id',
            'credit_card',
            'insurance_policy'
          ]),
          compliance_level: 'HIGH',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          category_id: '650e8400-e29b-41d4-a716-446655440003', // Sports Equipment
          country_id: '750e8400-e29b-41d4-a716-446655440002', // Argentina
          is_allowed: true,
          requires_license: false,
          min_age_requirement: 16,
          max_rental_days: 14,
          special_requirements: 'Safety briefing required for high-risk equipment. Waiver must be signed.',
          mandatory_insurance: true,
          min_coverage_amount: 25000.00,
          max_liability_amount: 75000.00,
          requires_background_check: false,
          prohibited_activities: 'Professional competitions, extreme sports without supervision',
          seasonal_restrictions: JSON.stringify({
            peak_season: { 
              advance_booking_required: true,
              max_days: 7
            }
          }),
          documentation_required: JSON.stringify([
            'identification',
            'emergency_contact',
            'medical_clearance'
          ]),
          compliance_level: 'MEDIUM',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          category_id: '650e8400-e29b-41d4-a716-446655440004', // Tools & Machinery
          country_id: '750e8400-e29b-41d4-a716-446655440003', // Brazil
          is_allowed: true,
          requires_license: true,
          license_type: 'MACHINERY_OPERATOR_CERTIFICATE',
          min_age_requirement: 25,
          max_rental_days: 60,
          special_requirements: 'Certified operator training required. Safety equipment must be provided.',
          mandatory_insurance: true,
          min_coverage_amount: 150000.00,
          max_liability_amount: 300000.00,
          requires_background_check: true,
          prohibited_activities: 'Unauthorized modifications, operation without safety gear',
          seasonal_restrictions: JSON.stringify({
            wet_season: {
              restricted_equipment: ['outdoor_power_tools'],
              additional_safety: true
            }
          }),
          documentation_required: JSON.stringify([
            'operator_license',
            'safety_certification',
            'employer_authorization',
            'insurance_proof'
          ]),
          compliance_level: 'CRITICAL',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          category_id: '650e8400-e29b-41d4-a716-446655440005', // Recreational Items
          country_id: '750e8400-e29b-41d4-a716-446655440004', // Chile
          is_allowed: true,
          requires_license: false,
          min_age_requirement: 14,
          max_rental_days: 21,
          special_requirements: 'Parental consent required for minors. Care and maintenance instructions provided.',
          mandatory_insurance: false,
          min_coverage_amount: null,
          max_liability_amount: 15000.00,
          requires_background_check: false,
          prohibited_activities: 'Commercial use, rental to third parties',
          seasonal_restrictions: JSON.stringify({
            holiday_season: {
              extended_hours: true,
              max_days: 28
            }
          }),
          documentation_required: JSON.stringify([
            'identification',
            'contact_information'
          ]),
          compliance_level: 'LOW',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } catch (err) {
      
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('category_regulations');
}