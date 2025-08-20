// =====================================================
// PAYMENT PROVIDER MODEL
// =====================================================

import { DataTypes, Model, Sequelize } from 'sequelize';
import { PaymentProvider } from '../types/paymentProvider.types';

/**
 * PaymentProvider Model Class
 */
export class PaymentProviderModel extends Model<PaymentProvider> implements PaymentProvider {
  public id!: string;
  public country_id!: string;
  public provider_name!: string;
  public provider_type!: string;
  public display_name?: string;
  public logo_url?: string;
  public is_active!: boolean;
  public supported_currencies!: string[];
  public min_amount!: number;
  public max_amount?: number;
  public fee_percentage!: number;
  public fee_fixed!: number;
  public settings?: Record<string, any>;
  public description?: string;
  public api_endpoint?: string;
  public supports_refunds!: boolean;
  public supports_recurring!: boolean;
  public processing_time_minutes?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

/**
 * Initialize PaymentProvider Model
 */
export const initPaymentProviderModel = (sequelize: Sequelize): typeof PaymentProviderModel => {
  PaymentProviderModel.init(
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
        validate: {
          isUUID: 4,
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
      provider_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['card', 'mobile_money', 'bank_transfer', 'digital_wallet']],
        },
      },
      display_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        validate: {
          len: [2, 200],
        },
      },
      logo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      supported_currencies: {
        type: DataTypes.ARRAY(DataTypes.STRING(3)),
        allowNull: false,
        validate: {
          isValidArray(value: any) {
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error('Supported currencies must be a non-empty array');
            }
            for (const currency of value) {
              if (typeof currency !== 'string' || currency.length !== 3) {
                throw new Error('Currency codes must be 3-letter strings');
              }
            }
          },
        },
      },
      min_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.01,
        validate: {
          min: 0,
        },
      },
      max_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
          min: 0,
          isGreaterThanMin(value: any) {
            if (value !== null && value !== undefined && Number(value) <= Number(this.min_amount)) {
              throw new Error('Maximum amount must be greater than minimum amount');
            }
          },
        },
      },
      fee_percentage: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      fee_fixed: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
        },
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      api_endpoint: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'API endpoint must be a valid URL',
          },
        },
      },
      supports_refunds: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      supports_recurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      processing_time_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 10080, // 1 week in minutes
        },
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
    },
    {
      sequelize,
      tableName: 'payment_providers',
      modelName: 'PaymentProvider',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['country_id'],
          name: 'idx_payment_providers_country',
        },
        {
          fields: ['provider_name'],
          name: 'idx_payment_providers_name',
        },
        {
          fields: ['provider_type'],
          name: 'idx_payment_providers_type',
        },
        {
          fields: ['is_active'],
          name: 'idx_payment_providers_active',
        },
        {
          fields: ['country_id', 'provider_name'],
          unique: true,
          name: 'uk_payment_providers_country_name',
        },
        {
          fields: ['country_id', 'is_active'],
          name: 'idx_payment_providers_country_active',
        },
        {
          fields: ['provider_type', 'is_active'],
          name: 'idx_payment_providers_type_active',
        },
      ],
      hooks: {
        beforeValidate: (provider: PaymentProviderModel) => {
          // Ensure provider_name is lowercase
          if (provider.provider_name) {
            provider.provider_name = provider.provider_name.toLowerCase().trim();
          }
          
          // country_id is a UUID; no normalization required
          
          // Ensure provider_type is lowercase
          if (provider.provider_type) {
            provider.provider_type = provider.provider_type.toLowerCase().trim();
          }
          
          // Normalize currency codes to uppercase
          if (provider.supported_currencies) {
            provider.supported_currencies = provider.supported_currencies.map(
              (currency: string) => currency.toUpperCase().trim()
            );
          }
        },
        beforeCreate: (provider: PaymentProviderModel) => {
          // Set display_name if not provided
          if (!provider.display_name && provider.provider_name) {
            provider.display_name = provider.provider_name
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
        },
        beforeUpdate: (provider: PaymentProviderModel) => {
          // Update display_name if provider_name changed and display_name is still default
          if (provider.changed('provider_name') && provider.provider_name) {
            const defaultDisplayName = provider.provider_name
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            if (!provider.display_name || provider.display_name === defaultDisplayName) {
              provider.display_name = defaultDisplayName;
            }
          }
        },
      },
    }
  );

  return PaymentProviderModel;
};

/**
 * Define model associations
 */
export const associatePaymentProviderModel = (_models: any): void => {
  // Define associations here when other models are available
  // Example: PaymentProviderModel.belongsTo(models.Country, { foreignKey: 'country_id' });
};

export default PaymentProviderModel;
