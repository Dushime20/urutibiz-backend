import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import {
  InsuranceProviderData,
  CreateInsuranceProviderData,
  ProviderType,
  IntegrationStatus,
  CoverageType,
  ContactInfo,
  ApiCredentials,
} from '../types/insuranceProvider.types';

export class InsuranceProvider extends Model<InsuranceProviderData, CreateInsuranceProviderData> implements InsuranceProviderData {
  public id!: string;
  public country_id!: string;
  public provider_name!: string;
  public display_name?: string;
  public logo_url?: string;
  public contact_info?: ContactInfo;
  public supported_categories?: string[];
  public api_endpoint?: string;
  public api_credentials?: ApiCredentials;
  public is_active!: boolean;
  
  // Enhanced fields
  public provider_type!: ProviderType;
  public license_number?: string;
  public rating?: number;
  public coverage_types?: CoverageType[];
  public min_coverage_amount?: number;
  public max_coverage_amount?: number;
  public deductible_options?: number[];
  public processing_time_days?: number;
  public languages_supported?: string[];
  public commission_rate?: number;
  public integration_status!: IntegrationStatus;
  
  // Timestamps
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at?: Date;
  
  // Virtual fields and methods
  public getDisplayName(): string {
    return this.display_name || this.provider_name;
  }
  
  public hasApiIntegration(): boolean {
    return !!(this.api_endpoint && this.api_credentials);
  }
  
  public isLive(): boolean {
    return this.integration_status === 'LIVE';
  }
  
  public supportsCategory(categoryId: string): boolean {
    return !!(this.supported_categories && this.supported_categories.includes(categoryId));
  }
  
  public supportsCoverage(coverageType: CoverageType): boolean {
    return !!(this.coverage_types && this.coverage_types.includes(coverageType));
  }
  
  public supportsLanguage(language: string): boolean {
    return !!(this.languages_supported && this.languages_supported.includes(language));
  }
  
  public getCoverageRange(): { min: number; max: number } {
    return {
      min: this.min_coverage_amount || 0,
      max: this.max_coverage_amount || 0,
    };
  }
  
  public getProcessingTime(): number {
    return this.processing_time_days || 0;
  }
  
  public getCommissionRate(): number {
    return this.commission_rate || 0;
  }
  
  public getRating(): number {
    return this.rating || 0;
  }
  
  public hasValidLicense(): boolean {
    return !!(this.license_number && this.license_number.trim().length > 0);
  }
  
  public getDeductibleOptions(): number[] {
    return this.deductible_options || [];
  }
  
  public getContactInfo(): ContactInfo {
    return this.contact_info || {};
  }
  
  public isDigitalProvider(): boolean {
    return this.provider_type === 'DIGITAL';
  }
  
  public isPeerToPeerProvider(): boolean {
    return this.provider_type === 'PEER_TO_PEER';
  }
  
  public isTraditionalProvider(): boolean {
    return this.provider_type === 'TRADITIONAL';
  }
  
  public canHandleCoverageAmount(amount: number): boolean {
    const min = this.min_coverage_amount || 0;
    const max = this.max_coverage_amount || Number.MAX_SAFE_INTEGER;
    return amount >= min && amount <= max;
  }
  
  public getAvailableDeductibles(coverageAmount: number): number[] {
    return this.getDeductibleOptions().filter(deductible => 
      deductible <= (coverageAmount * 0.1) // Deductible shouldn't exceed 10% of coverage
    );
  }
  
  public estimateProcessingTime(isComplexCase: boolean = false): number {
    const baseTime = this.getProcessingTime();
    return isComplexCase ? Math.ceil(baseTime * 1.5) : baseTime;
  }
  
  public getMarketPosition(): 'PREMIUM' | 'STANDARD' | 'ECONOMY' {
    const rating = this.getRating();
    const commission = this.getCommissionRate();
    
    if (rating >= 4.5 && commission >= 0.08) {
      return 'PREMIUM';
    } else if (rating >= 3.5 && commission >= 0.05) {
      return 'STANDARD';
    } else {
      return 'ECONOMY';
    }
  }
  
  public getCompetitiveScore(): number {
    let score = 0;
    
    // Rating contribution (0-30 points)
    score += (this.getRating() / 5) * 30;
    
    // Processing time contribution (0-20 points) - faster is better
    const maxProcessingDays = 30;
    const processingScore = Math.max(0, (maxProcessingDays - this.getProcessingTime()) / maxProcessingDays) * 20;
    score += processingScore;
    
    // Coverage range contribution (0-15 points)
    const coverageRange = this.max_coverage_amount || 0;
    score += Math.min(coverageRange / 100000, 1) * 15;
    
    // Integration status contribution (0-15 points)
    const integrationScores = {
      'LIVE': 15,
      'TESTING': 10,
      'NOT_INTEGRATED': 5,
      'DEPRECATED': 0,
    };
    score += integrationScores[this.integration_status];
    
    // Language support contribution (0-10 points)
    const languageCount = this.languages_supported?.length || 0;
    score += Math.min(languageCount * 2, 10);
    
    // Coverage types contribution (0-10 points)
    const coverageCount = this.coverage_types?.length || 0;
    score += Math.min(coverageCount, 10);
    
    return Math.round(score);
  }
  
  public static async findByCountry(countryId: string, options: any = {}): Promise<InsuranceProvider[]> {
    return await this.findAll({
      where: {
        country_id: countryId,
        is_active: true,
        ...options.where,
      },
      ...options,
    });
  }
  
  public static async findByCategory(categoryId: string, options: any = {}): Promise<InsuranceProvider[]> {
    return await this.findAll({
      where: {
        supported_categories: {
          [Op.contains]: [categoryId],
        },
        is_active: true,
        ...options.where,
      },
      ...options,
    });
  }
  
  public static async findByCoverage(coverageType: CoverageType, options: any = {}): Promise<InsuranceProvider[]> {
    return await this.findAll({
      where: {
        coverage_types: {
          [Op.contains]: [coverageType],
        },
        is_active: true,
        ...options.where,
      },
      ...options,
    });
  }
  
  public static async findLiveProviders(options: any = {}): Promise<InsuranceProvider[]> {
    return await this.findAll({
      where: {
        integration_status: 'LIVE',
        is_active: true,
        ...options.where,
      },
      ...options,
    });
  }
}

export const initInsuranceProviderModel = (sequelize: Sequelize): typeof InsuranceProvider => {
  InsuranceProvider.init(
    {
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
    },
    {
      sequelize,
      modelName: 'InsuranceProvider',
      tableName: 'insurance_providers',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_insurance_providers_country_id',
          fields: ['country_id'],
        },
        {
          name: 'idx_insurance_providers_is_active',
          fields: ['is_active'],
        },
        {
          name: 'idx_insurance_providers_provider_type',
          fields: ['provider_type'],
        },
        {
          name: 'idx_insurance_providers_integration_status',
          fields: ['integration_status'],
        },
        {
          name: 'idx_insurance_providers_rating',
          fields: ['rating'],
        },
        {
          name: 'idx_insurance_providers_supported_categories',
          fields: ['supported_categories'],
          using: 'gin',
        },
        {
          name: 'idx_insurance_providers_coverage_types',
          fields: ['coverage_types'],
          using: 'gin',
        },
        {
          name: 'idx_insurance_providers_languages_supported',
          fields: ['languages_supported'],
          using: 'gin',
        },
        {
          name: 'idx_insurance_providers_country_active',
          fields: ['country_id', 'is_active'],
        },
        {
          name: 'idx_insurance_providers_country_type',
          fields: ['country_id', 'provider_type'],
        },
        {
          name: 'idx_insurance_providers_active_status',
          fields: ['is_active', 'integration_status'],
        },
      ],
      hooks: {
        beforeValidate: (provider: InsuranceProvider) => {
          // Ensure display_name defaults to provider_name if not provided
          if (!provider.display_name) {
            provider.display_name = provider.provider_name;
          }
          
          // Normalize provider_name
          if (provider.provider_name) {
            provider.provider_name = provider.provider_name.trim();
          }
          
          // Validate coverage amounts
          if (provider.min_coverage_amount && provider.max_coverage_amount) {
            if (provider.min_coverage_amount > provider.max_coverage_amount) {
              throw new Error('Minimum coverage amount cannot be greater than maximum coverage amount');
            }
          }
          
          // Validate commission rate
          if (provider.commission_rate && (provider.commission_rate < 0 || provider.commission_rate > 1)) {
            throw new Error('Commission rate must be between 0 and 1');
          }
        },
        
        beforeCreate: (provider: InsuranceProvider) => {
          // Set default values
          if (!provider.supported_categories) {
            provider.supported_categories = [];
          }
          if (!provider.coverage_types) {
            provider.coverage_types = [];
          }
          if (!provider.languages_supported) {
            provider.languages_supported = [];
          }
          if (!provider.deductible_options) {
            provider.deductible_options = [];
          }
        },
        
        beforeUpdate: (provider: InsuranceProvider) => {
          // Update timestamps
          provider.updated_at = new Date();
        },
        
        beforeDestroy: (provider: InsuranceProvider) => {
          // Soft delete
          provider.deleted_at = new Date();
          provider.is_active = false;
        },
      },
    }
  );

  // Define associations
  (InsuranceProvider as any).associate = (models: any) => {
    // Association with Country
    InsuranceProvider.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    
    // Association with Categories (many-to-many through supported_categories array)
    // This would be implemented when Category model is available
    
    // Association with Insurance Claims or Policies if needed
    // InsuranceProvider.hasMany(models.InsuranceClaim, {
    //   foreignKey: 'provider_id',
    //   as: 'claims',
    // });
  };

  return InsuranceProvider;
};
