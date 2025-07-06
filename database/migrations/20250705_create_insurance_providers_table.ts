import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('insurance_providers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [2, 100],
      },
    },
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    contact_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    supported_categories: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
    },
    api_endpoint: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    api_credentials: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    
    // Additional fields for enhanced functionality
    provider_type: {
      type: DataTypes.ENUM('TRADITIONAL', 'DIGITAL', 'PEER_TO_PEER', 'GOVERNMENT', 'MUTUAL'),
      allowNull: false,
      defaultValue: 'TRADITIONAL',
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0,
      },
    },
    coverage_types: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    min_coverage_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    max_coverage_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    deductible_options: {
      type: DataTypes.ARRAY(DataTypes.DECIMAL),
      allowNull: true,
      defaultValue: [],
    },
    processing_time_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 365,
      },
    },
    languages_supported: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1,
      },
    },
    integration_status: {
      type: DataTypes.ENUM('NOT_INTEGRATED', 'TESTING', 'LIVE', 'DEPRECATED'),
      allowNull: false,
      defaultValue: 'NOT_INTEGRATED',
    },
    
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes for better performance
  await queryInterface.addIndex('insurance_providers', ['country_id'], {
    name: 'idx_insurance_providers_country_id',
  });

  await queryInterface.addIndex('insurance_providers', ['is_active'], {
    name: 'idx_insurance_providers_is_active',
  });

  await queryInterface.addIndex('insurance_providers', ['provider_type'], {
    name: 'idx_insurance_providers_provider_type',
  });

  await queryInterface.addIndex('insurance_providers', ['integration_status'], {
    name: 'idx_insurance_providers_integration_status',
  });

  await queryInterface.addIndex('insurance_providers', ['rating'], {
    name: 'idx_insurance_providers_rating',
  });

  await queryInterface.addIndex('insurance_providers', ['supported_categories'], {
    name: 'idx_insurance_providers_supported_categories',
    using: 'gin',
  });

  await queryInterface.addIndex('insurance_providers', ['coverage_types'], {
    name: 'idx_insurance_providers_coverage_types',
    using: 'gin',
  });

  await queryInterface.addIndex('insurance_providers', ['languages_supported'], {
    name: 'idx_insurance_providers_languages_supported',
    using: 'gin',
  });

  // Composite indexes for common queries
  await queryInterface.addIndex('insurance_providers', ['country_id', 'is_active'], {
    name: 'idx_insurance_providers_country_active',
  });

  await queryInterface.addIndex('insurance_providers', ['country_id', 'provider_type'], {
    name: 'idx_insurance_providers_country_type',
  });

  await queryInterface.addIndex('insurance_providers', ['is_active', 'integration_status'], {
    name: 'idx_insurance_providers_active_status',
  });

  // Insert sample data for testing
  await queryInterface.bulkInsert('insurance_providers', [
    // United States providers
    {
      id: '11111111-1111-1111-1111-111111111111',
      country_id: '11111111-1111-1111-1111-111111111111', // USA
      provider_name: 'Allstate Insurance',
      display_name: 'Allstate',
      logo_url: 'https://cdn.allstate.com/logo.png',
      contact_info: {
        phone: '+1-800-ALLSTATE',
        email: 'support@allstate.com',
        website: 'https://www.allstate.com',
        address: {
          street: '2775 Sanders Rd',
          city: 'Northbrook',
          state: 'IL',
          zip: '60062',
          country: 'USA'
        }
      },
      supported_categories: ['22222222-2222-2222-2222-222222222222'], // Vehicles
      api_endpoint: 'https://api.allstate.com/v1',
      api_credentials: {
        client_id: 'encrypted_client_id',
        client_secret: 'encrypted_secret',
        api_version: 'v1'
      },
      is_active: true,
      provider_type: 'TRADITIONAL',
      license_number: 'IL-INS-2023-001',
      rating: 4.2,
      coverage_types: ['LIABILITY', 'COMPREHENSIVE', 'COLLISION', 'PERSONAL_INJURY'],
      min_coverage_amount: 25000.00,
      max_coverage_amount: 500000.00,
      deductible_options: [250, 500, 1000, 2500],
      processing_time_days: 3,
      languages_supported: ['en', 'es'],
      commission_rate: 0.0850,
      integration_status: 'LIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      country_id: '11111111-1111-1111-1111-111111111111', // USA
      provider_name: 'Lemonade Insurance',
      display_name: 'Lemonade',
      logo_url: 'https://cdn.lemonade.com/logo.png',
      contact_info: {
        phone: '+1-844-733-8666',
        email: 'help@lemonade.com',
        website: 'https://www.lemonade.com',
        address: {
          street: '5 Crosby St',
          city: 'New York',
          state: 'NY',
          zip: '10013',
          country: 'USA'
        }
      },
      supported_categories: ['33333333-3333-3333-3333-333333333333'], // Electronics
      api_endpoint: 'https://api.lemonade.com/v2',
      api_credentials: {
        client_id: 'encrypted_lemonade_id',
        api_key: 'encrypted_api_key',
        webhook_secret: 'encrypted_webhook'
      },
      is_active: true,
      provider_type: 'DIGITAL',
      license_number: 'NY-DIG-2023-005',
      rating: 4.7,
      coverage_types: ['THEFT', 'DAMAGE', 'LIABILITY', 'PERSONAL_PROPERTY'],
      min_coverage_amount: 5000.00,
      max_coverage_amount: 100000.00,
      deductible_options: [0, 250, 500],
      processing_time_days: 1,
      languages_supported: ['en'],
      commission_rate: 0.1200,
      integration_status: 'LIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // Canada providers
    {
      id: '22222222-2222-2222-2222-222222222221',
      country_id: '22222222-2222-2222-2222-222222222222', // Canada
      provider_name: 'Intact Insurance',
      display_name: 'Intact',
      logo_url: 'https://cdn.intact.ca/logo.png',
      contact_info: {
        phone: '+1-866-464-2667',
        email: 'support@intact.net',
        website: 'https://www.intact.ca',
        address: {
          street: '700 University Ave',
          city: 'Toronto',
          province: 'ON',
          postal: 'M5G 0A1',
          country: 'Canada'
        }
      },
      supported_categories: ['22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'], // Vehicles, Sports
      api_endpoint: 'https://api.intact.ca/v1',
      api_credentials: {
        client_id: 'encrypted_intact_id',
        client_secret: 'encrypted_intact_secret'
      },
      is_active: true,
      provider_type: 'TRADITIONAL',
      license_number: 'ON-INS-2023-012',
      rating: 4.0,
      coverage_types: ['AUTO', 'LIABILITY', 'COMPREHENSIVE', 'COLLISION'],
      min_coverage_amount: 50000.00,
      max_coverage_amount: 1000000.00,
      deductible_options: [500, 1000, 2500, 5000],
      processing_time_days: 5,
      languages_supported: ['en', 'fr'],
      commission_rate: 0.0750,
      integration_status: 'LIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // UK providers
    {
      id: '33333333-3333-3333-3333-333333333331',
      country_id: '33333333-3333-3333-3333-333333333333', // UK
      provider_name: 'Aviva Insurance',
      display_name: 'Aviva',
      logo_url: 'https://cdn.aviva.co.uk/logo.png',
      contact_info: {
        phone: '+44-800-092-9002',
        email: 'customer.services@aviva.co.uk',
        website: 'https://www.aviva.co.uk',
        address: {
          street: 'Aviva House, St Helens',
          city: 'Norwich',
          county: 'Norfolk',
          postcode: 'NR1 3NG',
          country: 'United Kingdom'
        }
      },
      supported_categories: ['22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555'], // Vehicles, Home
      api_endpoint: 'https://api.aviva.co.uk/v1',
      api_credentials: {
        client_id: 'encrypted_aviva_id',
        api_key: 'encrypted_aviva_key'
      },
      is_active: true,
      provider_type: 'TRADITIONAL',
      license_number: 'UK-FCA-2023-789',
      rating: 4.1,
      coverage_types: ['MOTOR', 'HOME', 'LIABILITY', 'CONTENTS'],
      min_coverage_amount: 10000.00,
      max_coverage_amount: 2000000.00,
      deductible_options: [100, 250, 500, 1000],
      processing_time_days: 7,
      languages_supported: ['en'],
      commission_rate: 0.0650,
      integration_status: 'LIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // Germany providers
    {
      id: '44444444-4444-4444-4444-444444444441',
      country_id: '44444444-4444-4444-4444-444444444444', // Germany
      provider_name: 'Allianz Versicherung',
      display_name: 'Allianz',
      logo_url: 'https://cdn.allianz.de/logo.png',
      contact_info: {
        phone: '+49-89-3800-0',
        email: 'service@allianz.de',
        website: 'https://www.allianz.de',
        address: {
          street: 'Königinstraße 28',
          city: 'München',
          state: 'Bayern',
          postcode: '80802',
          country: 'Deutschland'
        }
      },
      supported_categories: ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'], // Vehicles, Electronics
      api_endpoint: 'https://api.allianz.de/v1',
      api_credentials: {
        client_id: 'encrypted_allianz_id',
        client_secret: 'encrypted_allianz_secret'
      },
      is_active: true,
      provider_type: 'TRADITIONAL',
      license_number: 'DE-BaFin-2023-456',
      rating: 4.3,
      coverage_types: ['KFZ', 'HAFTPFLICHT', 'KASKO', 'RECHTSSCHUTZ'],
      min_coverage_amount: 20000.00,
      max_coverage_amount: 5000000.00,
      deductible_options: [150, 300, 500, 1000],
      processing_time_days: 4,
      languages_supported: ['de', 'en'],
      commission_rate: 0.0700,
      integration_status: 'LIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },

    // Australia providers
    {
      id: '55555555-5555-5555-5555-555555555551',
      country_id: '55555555-5555-5555-5555-555555555555', // Australia
      provider_name: 'IAG Insurance',
      display_name: 'IAG',
      logo_url: 'https://cdn.iag.com.au/logo.png',
      contact_info: {
        phone: '+61-13-15-51',
        email: 'support@iag.com.au',
        website: 'https://www.iag.com.au',
        address: {
          street: '388 George St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia'
        }
      },
      supported_categories: ['22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'], // Vehicles, Sports
      api_endpoint: 'https://api.iag.com.au/v1',
      api_credentials: {
        client_id: 'encrypted_iag_id',
        api_key: 'encrypted_iag_key'
      },
      is_active: true,
      provider_type: 'TRADITIONAL',
      license_number: 'AU-APRA-2023-234',
      rating: 3.9,
      coverage_types: ['MOTOR', 'COMPREHENSIVE', 'THIRD_PARTY', 'SPORTS'],
      min_coverage_amount: 15000.00,
      max_coverage_amount: 3000000.00,
      deductible_options: [400, 600, 1000, 2000],
      processing_time_days: 6,
      languages_supported: ['en'],
      commission_rate: 0.0800,
      integration_status: 'TESTING',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('insurance_providers');
};
