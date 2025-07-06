import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import {
  CategoryRegulationData,
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  ComplianceLevel,
  SeasonalRestrictions,
  DocumentationType,
} from '../types/categoryRegulation.types';

export class CategoryRegulation extends Model<CategoryRegulationData, CreateCategoryRegulationData> implements CategoryRegulationData {
  public id!: string;
  public category_id!: string;
  public country_id!: string;
  
  // Basic regulations
  public is_allowed!: boolean;
  public requires_license!: boolean;
  public license_type?: string;
  public min_age_requirement?: number;
  public max_rental_days?: number;
  public special_requirements?: string;
  
  // Insurance requirements
  public mandatory_insurance!: boolean;
  public min_coverage_amount?: number;
  
  // Additional regulations
  public max_liability_amount?: number;
  public requires_background_check!: boolean;
  public prohibited_activities?: string;
  public seasonal_restrictions?: SeasonalRestrictions;
  public documentation_required?: DocumentationType[];
  public compliance_level!: ComplianceLevel;
  
  // Timestamps
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at?: Date;
  
  // Virtual fields and methods
  public getComplianceScore(): number {
    let score = 0;
    
    if (!this.is_allowed) return 0;
    
    // Base score
    score += 10;
    
    // Licensing requirements
    if (this.requires_license) score += 15;
    
    // Age requirements
    if (this.min_age_requirement) {
      score += Math.min(this.min_age_requirement / 2, 15);
    }
    
    // Insurance requirements
    if (this.mandatory_insurance) score += 20;
    if (this.min_coverage_amount && this.min_coverage_amount > 0) {
      score += Math.min(this.min_coverage_amount / 10000, 10);
    }
    
    // Background check
    if (this.requires_background_check) score += 10;
    
    // Compliance level multiplier
    const multipliers = {
      LOW: 0.8,
      MEDIUM: 1.0,
      HIGH: 1.3,
      CRITICAL: 1.6,
    };
    score *= multipliers[this.compliance_level];
    
    return Math.round(score);
  }
  
  public hasSeasonalRestrictions(): boolean {
    return !!(this.seasonal_restrictions && Object.keys(this.seasonal_restrictions).length > 0);
  }
  
  public getRequiredDocuments(): DocumentationType[] {
    return this.documentation_required || [];
  }
  
  public isRentalDurationAllowed(days: number): boolean {
    if (!this.max_rental_days) return true;
    return days <= this.max_rental_days;
  }
  
  public isAgeCompliant(age: number): boolean {
    if (!this.min_age_requirement) return true;
    return age >= this.min_age_requirement;
  }
  
  public hasLicenseRequirement(): boolean {
    return this.requires_license;
  }
  
  public getSeasonalRestriction(season: string): any {
    if (!this.seasonal_restrictions) return null;
    return this.seasonal_restrictions[season] || null;
  }
  
  // Static methods for querying
  static async findByCategory(categoryId: string, options: any = {}) {
    return this.findAll({
      where: {
        category_id: categoryId,
        ...options.where,
      },
      ...options,
    });
  }
  
  static async findByCountry(countryId: string, options: any = {}) {
    return this.findAll({
      where: {
        country_id: countryId,
        ...options.where,
      },
      ...options,
    });
  }
  
  static async findByCategoryAndCountry(categoryId: string, countryId: string) {
    return this.findOne({
      where: {
        category_id: categoryId,
        country_id: countryId,
      },
    });
  }
  
  static async findByComplianceLevel(level: ComplianceLevel, options: any = {}) {
    return this.findAll({
      where: {
        compliance_level: level,
        ...options.where,
      },
      ...options,
    });
  }
  
  static async findRequiringLicense(options: any = {}) {
    return this.findAll({
      where: {
        requires_license: true,
        ...options.where,
      },
      ...options,
    });
  }
  
  static async findRequiringInsurance(options: any = {}) {
    return this.findAll({
      where: {
        mandatory_insurance: true,
        ...options.where,
      },
      ...options,
    });
  }
}

export const initializeCategoryRegulationModel = (sequelize: Sequelize): typeof CategoryRegulation => {
  CategoryRegulation.init(
    {
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
        validate: {
          notEmpty: {
            msg: 'Category ID is required',
          },
          isUUID: {
            args: 4,
            msg: 'Category ID must be a valid UUID',
          },
        },
      },
      country_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'countries',
          key: 'id',
        },
        validate: {
          notEmpty: {
            msg: 'Country ID is required',
          },
          isUUID: {
            args: 4,
            msg: 'Country ID must be a valid UUID',
          },
        },
      },
      
      // Basic regulations
      is_allowed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Is allowed flag is required',
          },
        },
      },
      requires_license: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Requires license flag is required',
          },
        },
      },
      license_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'License type must be 100 characters or less',
          },
          customLicenseValidation(value: string | null) {
            if (this.requires_license && !value) {
              throw new Error('License type is required when license is required');
            }
          },
        },
      },
      min_age_requirement: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: 'Minimum age requirement must be 0 or greater',
          },
          max: {
            args: [100],
            msg: 'Minimum age requirement must be 100 or less',
          },
        },
      },
      max_rental_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: [1],
            msg: 'Maximum rental days must be 1 or greater',
          },
          max: {
            args: [365],
            msg: 'Maximum rental days must be 365 or less',
          },
        },
      },
      special_requirements: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Special requirements must be 2000 characters or less',
          },
        },
      },
      
      // Insurance requirements
      mandatory_insurance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Mandatory insurance flag is required',
          },
        },
      },
      min_coverage_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: 'Minimum coverage amount must be 0 or greater',
          },
          customCoverageValidation(value: number | null) {
            if (this.mandatory_insurance && (value === null || value <= 0)) {
              throw new Error('Minimum coverage amount is required when insurance is mandatory');
            }
          },
        },
      },
      
      // Additional regulations
      max_liability_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: 'Maximum liability amount must be 0 or greater',
          },
        },
      },
      requires_background_check: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Requires background check flag is required',
          },
        },
      },
      prohibited_activities: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Prohibited activities must be 2000 characters or less',
          },
        },
      },
      seasonal_restrictions: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isValidJSON(value: any) {
            if (value && typeof value !== 'object') {
              throw new Error('Seasonal restrictions must be a valid JSON object');
            }
          },
        },
      },
      documentation_required: {
        type: DataTypes.JSONB,
        allowNull: true,
        validate: {
          isValidDocumentationArray(value: any) {
            if (value && !Array.isArray(value)) {
              throw new Error('Documentation required must be an array');
            }
            if (value && value.some((doc: any) => typeof doc !== 'string')) {
              throw new Error('All documentation items must be strings');
            }
          },
        },
      },
      compliance_level: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        defaultValue: 'MEDIUM',
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Compliance level is required',
          },
          isIn: {
            args: [['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']],
            msg: 'Compliance level must be LOW, MEDIUM, HIGH, or CRITICAL',
          },
        },
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'CategoryRegulation',
      tableName: 'category_regulations',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      indexes: [
        {
          fields: ['category_id'],
          name: 'idx_category_regulations_category_id',
        },
        {
          fields: ['country_id'],
          name: 'idx_category_regulations_country_id',
        },
        {
          fields: ['is_allowed'],
          name: 'idx_category_regulations_is_allowed',
        },
        {
          fields: ['requires_license'],
          name: 'idx_category_regulations_requires_license',
        },
        {
          fields: ['compliance_level'],
          name: 'idx_category_regulations_compliance_level',
        },
        {
          fields: ['mandatory_insurance'],
          name: 'idx_category_regulations_mandatory_insurance',
        },
        {
          fields: ['category_id', 'country_id'],
          unique: true,
          name: 'unique_category_country_regulation',
        },
      ],
      hooks: {
        beforeCreate: async (regulation: CategoryRegulation) => {
          // Validate consistency between requires_license and license_type
          if (regulation.requires_license && !regulation.license_type) {
            throw new Error('License type is required when license is required');
          }
          
          // Validate insurance requirements
          if (regulation.mandatory_insurance && (!regulation.min_coverage_amount || regulation.min_coverage_amount <= 0)) {
            throw new Error('Minimum coverage amount is required when insurance is mandatory');
          }
          
          // Auto-adjust compliance level based on requirements
          if (regulation.requires_background_check || regulation.mandatory_insurance || regulation.requires_license) {
            if (regulation.compliance_level === 'LOW') {
              regulation.compliance_level = 'MEDIUM';
            }
          }
        },
        
        beforeUpdate: async (regulation: CategoryRegulation) => {
          // Same validations as beforeCreate
          if (regulation.requires_license && !regulation.license_type) {
            throw new Error('License type is required when license is required');
          }
          
          if (regulation.mandatory_insurance && (!regulation.min_coverage_amount || regulation.min_coverage_amount <= 0)) {
            throw new Error('Minimum coverage amount is required when insurance is mandatory');
          }
          
          // Auto-adjust compliance level
          if (regulation.requires_background_check || regulation.mandatory_insurance || regulation.requires_license) {
            if (regulation.compliance_level === 'LOW') {
              regulation.compliance_level = 'MEDIUM';
            }
          }
        },
        
        afterCreate: async (regulation: CategoryRegulation) => {
          console.log(`Category regulation created: ${regulation.id} for category ${regulation.category_id} in country ${regulation.country_id}`);
        },
        
        afterUpdate: async (regulation: CategoryRegulation) => {
          console.log(`Category regulation updated: ${regulation.id}`);
        },
        
        afterDestroy: async (regulation: CategoryRegulation) => {
          console.log(`Category regulation deleted: ${regulation.id}`);
        },
      },
    }
  );

  return CategoryRegulation;
};

export default CategoryRegulation;
