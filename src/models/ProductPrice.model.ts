// =====================================================
// PRODUCT PRICE MODEL
// =====================================================

import { DataTypes, Model, Sequelize } from 'sequelize';
import { ProductPrice } from '../types/productPrice.types';

/**
 * ProductPrice Model Class
 */
export class ProductPriceModel extends Model<ProductPrice> implements ProductPrice {
  public id!: string;
  public product_id!: string;
  public country_id!: string;
  public currency!: string;
  
  // Pricing tiers
  public price_per_hour?: number;
  public price_per_day!: number;
  public price_per_week?: number;
  public price_per_month?: number;
  public security_deposit!: number;
  
  // Market-specific adjustments
  public market_adjustment_factor!: number;
  public auto_convert!: boolean;
  public base_price?: number;
  public base_currency?: string;
  public exchange_rate?: number;
  public exchange_rate_updated_at?: Date;
  
  // Pricing rules and duration limits
  public min_rental_duration_hours!: number;
  public max_rental_duration_days?: number;
  public early_return_fee_percentage!: number;
  public late_return_fee_per_hour!: number;
  
  // Discount settings
  public weekly_discount_percentage!: number;
  public monthly_discount_percentage!: number;
  public bulk_discount_threshold!: number;
  public bulk_discount_percentage!: number;
  
  // Seasonal and dynamic pricing
  public dynamic_pricing_enabled!: boolean;
  public peak_season_multiplier!: number;
  public off_season_multiplier!: number;
  public seasonal_adjustments?: Record<string, number>;
  
  // Availability and status
  public is_active!: boolean;
  public effective_from!: Date;
  public effective_until?: Date;
  public notes?: string;
  
  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

/**
 * Initialize ProductPrice Model
 */
export const initProductPriceModel = (sequelize: Sequelize): typeof ProductPriceModel => {
  ProductPriceModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
        },
      },
      country_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        validate: {
          len: [3, 3],
          isAlpha: true,
          isUppercase: true,
        },
      },
      
      // Pricing tiers
      price_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      price_per_day: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.01,
        },
      },
      price_per_week: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      price_per_month: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      security_deposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      
      // Market-specific adjustments
      market_adjustment_factor: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.0,
        validate: {
          min: 0.01,
          max: 10.0,
        },
      },
      auto_convert: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      base_currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        validate: {
          len: [3, 3],
          isAlpha: true,
          isUppercase: true,
        },
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
        validate: {
          min: 0.000001,
        },
      },
      exchange_rate_updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      
      // Pricing rules and duration limits
      min_rental_duration_hours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 1.0,
        validate: {
          min: 0.25, // 15 minutes minimum
          max: 8760, // 1 year maximum
        },
      },
      max_rental_duration_days: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          min: 0.01,
          max: 3650, // 10 years maximum
          isGreaterThanMin(value: any) {
            if (value !== null && value !== undefined) {
              const minHours = Number(this.min_rental_duration_hours);
              const maxHours = Number(value) * 24;
              if (maxHours <= minHours) {
                throw new Error('Maximum rental duration must be greater than minimum rental duration');
              }
            }
          },
        },
      },
      early_return_fee_percentage: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      late_return_fee_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      
      // Discount settings
      weekly_discount_percentage: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      monthly_discount_percentage: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      bulk_discount_threshold: {
        type: DataTypes.DECIMAL(3, 0),
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 999,
        },
      },
      bulk_discount_percentage: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      
      // Seasonal and dynamic pricing
      dynamic_pricing_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      peak_season_multiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.0,
        validate: {
          min: 0.1,
          max: 10.0,
        },
      },
      off_season_multiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.0,
        validate: {
          min: 0.1,
          max: 10.0,
        },
      },
      seasonal_adjustments: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidSeasonalAdjustments(value: any) {
            if (value !== null && value !== undefined) {
              if (typeof value !== 'object') {
                throw new Error('Seasonal adjustments must be an object');
              }
              for (const [month, multiplier] of Object.entries(value)) {
                const monthNum = parseInt(month, 10);
                if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                  throw new Error('Seasonal adjustment keys must be month numbers (1-12)');
                }
                if (typeof multiplier !== 'number' || multiplier < 0.1 || multiplier > 10) {
                  throw new Error('Seasonal adjustment values must be numbers between 0.1 and 10');
                }
              }
            }
          },
        },
      },
      
      // Availability and status
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      effective_until: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isAfterEffectiveFrom(value: any) {
            if (value !== null && value !== undefined) {
              const effectiveFromValue = (this as any).effective_from;
              if (effectiveFromValue) {
                const effectiveUntilDate = new Date(value);
                const effectiveFromDate = new Date(effectiveFromValue);
                if (effectiveUntilDate <= effectiveFromDate) {
                  throw new Error('Effective until date must be after effective from date');
                }
              }
            }
          },
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    },
    {
      sequelize,
      tableName: 'product_prices',
      modelName: 'ProductPrice',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['product_id'],
          name: 'idx_product_prices_product',
        },
        {
          fields: ['country_id'],
          name: 'idx_product_prices_country',
        },
        {
          fields: ['currency'],
          name: 'idx_product_prices_currency',
        },
        {
          fields: ['product_id', 'country_id'],
          name: 'idx_product_prices_product_country',
        },
        {
          fields: ['country_id', 'currency'],
          name: 'idx_product_prices_country_currency',
        },
        {
          fields: ['is_active'],
          name: 'idx_product_prices_active',
        },
        {
          fields: ['effective_from', 'effective_until'],
          name: 'idx_product_prices_effective_period',
        },
        {
          fields: ['created_at'],
          name: 'idx_product_prices_created',
        },
        {
          fields: ['product_id', 'country_id', 'currency'],
          unique: true,
          name: 'uk_product_prices_product_country_currency',
        },
      ],
      hooks: {
        beforeValidate: (price: ProductPriceModel) => {
          // Normalize currency codes to uppercase
          if (price.currency) {
            price.currency = price.currency.toUpperCase().trim();
          }
          if (price.base_currency) {
            price.base_currency = price.base_currency.toUpperCase().trim();
          }
          
          // Ensure decimal precision
          if (price.market_adjustment_factor) {
            price.market_adjustment_factor = Math.round(price.market_adjustment_factor * 100) / 100;
          }
        },
        beforeCreate: (price: ProductPriceModel) => {
          // Set exchange rate updated timestamp if exchange rate is provided
          if (price.exchange_rate && !price.exchange_rate_updated_at) {
            price.exchange_rate_updated_at = new Date();
          }
          
          // Calculate derived prices if not provided
          if (price.price_per_day && !price.price_per_week) {
            price.price_per_week = price.price_per_day * 7 * (1 - price.weekly_discount_percentage);
          }
          if (price.price_per_day && !price.price_per_month) {
            price.price_per_month = price.price_per_day * 30 * (1 - price.monthly_discount_percentage);
          }
        },
        beforeUpdate: (price: ProductPriceModel) => {
          // Update exchange rate timestamp if exchange rate changed
          if (price.changed('exchange_rate') && price.exchange_rate) {
            price.exchange_rate_updated_at = new Date();
          }
          
          // Recalculate derived prices if daily price or discounts changed
          if (price.changed('price_per_day') || price.changed('weekly_discount_percentage')) {
            if (price.price_per_day && price.weekly_discount_percentage !== undefined) {
              price.price_per_week = price.price_per_day * 7 * (1 - price.weekly_discount_percentage);
            }
          }
          if (price.changed('price_per_day') || price.changed('monthly_discount_percentage')) {
            if (price.price_per_day && price.monthly_discount_percentage !== undefined) {
              price.price_per_month = price.price_per_day * 30 * (1 - price.monthly_discount_percentage);
            }
          }
        },
      },
    }
  );

  return ProductPriceModel;
};

/**
 * Define model associations
 */
export const associateProductPriceModel = (_models: any): void => {
  // Define associations here when other models are available
  // Example: ProductPriceModel.belongsTo(models.Product, { foreignKey: 'product_id' });
  // Example: ProductPriceModel.belongsTo(models.Country, { foreignKey: 'country_id' });
};

export default ProductPriceModel;
