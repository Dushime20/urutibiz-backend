import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('category_regulations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    country_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'countries',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    
    // Basic regulations
    is_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    requires_license: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    license_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    min_age_requirement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    max_rental_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 365,
      },
    },
    special_requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // Insurance requirements
    mandatory_insurance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    min_coverage_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    
    // Additional regulatory fields
    max_liability_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    requires_background_check: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    prohibited_activities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    seasonal_restrictions: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    documentation_required: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    compliance_level: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      defaultValue: 'MEDIUM',
      allowNull: false,
    },
    
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    
    // Soft delete support
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes for better performance
  await queryInterface.addIndex('category_regulations', ['category_id'], {
    name: 'idx_category_regulations_category_id',
  });

  await queryInterface.addIndex('category_regulations', ['country_id'], {
    name: 'idx_category_regulations_country_id',
  });

  await queryInterface.addIndex('category_regulations', ['is_allowed'], {
    name: 'idx_category_regulations_is_allowed',
  });

  await queryInterface.addIndex('category_regulations', ['requires_license'], {
    name: 'idx_category_regulations_requires_license',
  });

  await queryInterface.addIndex('category_regulations', ['compliance_level'], {
    name: 'idx_category_regulations_compliance_level',
  });

  await queryInterface.addIndex('category_regulations', ['mandatory_insurance'], {
    name: 'idx_category_regulations_mandatory_insurance',
  });

  // Create unique constraint for category-country combination
  await queryInterface.addConstraint('category_regulations', {
    fields: ['category_id', 'country_id'],
    type: 'unique',
    name: 'unique_category_country_regulation',
  });

  // Insert sample data for testing
  await queryInterface.bulkInsert('category_regulations', [
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
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('category_regulations');
};
