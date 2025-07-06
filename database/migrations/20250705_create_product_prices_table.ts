import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create product_prices table
  await knex.schema.createTable('product_prices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('country_id').notNullable().references('id').inTable('countries').onDelete('RESTRICT');
    table.string('currency', 3).notNullable().comment('ISO 4217 currency code');
    
    // Pricing tiers
    table.decimal('price_per_hour', 10, 2).comment('Hourly rental rate');
    table.decimal('price_per_day', 10, 2).notNullable().comment('Daily rental rate');
    table.decimal('price_per_week', 10, 2).comment('Weekly rental rate');
    table.decimal('price_per_month', 10, 2).comment('Monthly rental rate');
    table.decimal('security_deposit', 10, 2).defaultTo(0).comment('Security deposit amount');
    
    // Market-specific adjustments
    table.decimal('market_adjustment_factor', 4, 2).defaultTo(1.0).comment('Price adjustment for local market (0.5 = 50% of base, 1.5 = 150% of base)');
    table.boolean('auto_convert').defaultTo(true).comment('Auto-convert from base currency using exchange rates');
    
    // Additional pricing fields
    table.decimal('base_price', 10, 2).comment('Base price in original currency before adjustments');
    table.string('base_currency', 3).comment('Original currency for base price');
    table.decimal('exchange_rate', 10, 6).comment('Exchange rate used for conversion');
    table.timestamp('exchange_rate_updated_at').comment('When exchange rate was last updated');
    
    // Pricing rules and discounts
    table.decimal('min_rental_duration_hours', 6, 2).defaultTo(1).comment('Minimum rental duration in hours');
    table.decimal('max_rental_duration_days', 8, 2).comment('Maximum rental duration in days');
    table.decimal('early_return_fee_percentage', 4, 2).defaultTo(0).comment('Fee for early returns as percentage');
    table.decimal('late_return_fee_per_hour', 10, 2).defaultTo(0).comment('Fee per hour for late returns');
    
    // Discount settings
    table.decimal('weekly_discount_percentage', 4, 2).defaultTo(0).comment('Discount for weekly rentals');
    table.decimal('monthly_discount_percentage', 4, 2).defaultTo(0).comment('Discount for monthly rentals');
    table.decimal('bulk_discount_threshold', 3, 0).defaultTo(1).comment('Minimum quantity for bulk discount');
    table.decimal('bulk_discount_percentage', 4, 2).defaultTo(0).comment('Discount for bulk rentals');
    
    // Seasonal and dynamic pricing
    table.boolean('dynamic_pricing_enabled').defaultTo(false).comment('Enable dynamic pricing based on demand');
    table.decimal('peak_season_multiplier', 4, 2).defaultTo(1.0).comment('Price multiplier for peak season');
    table.decimal('off_season_multiplier', 4, 2).defaultTo(1.0).comment('Price multiplier for off season');
    table.jsonb('seasonal_adjustments').comment('JSON object with month-based pricing adjustments');
    
    // Availability and status
    table.boolean('is_active').defaultTo(true).comment('Whether this pricing is currently active');
    table.timestamp('effective_from').defaultTo(knex.fn.now()).comment('When this pricing becomes effective');
    table.timestamp('effective_until').comment('When this pricing expires');
    table.text('notes').comment('Additional notes about this pricing');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['product_id'], 'idx_product_prices_product');
    table.index(['country_id'], 'idx_product_prices_country');
    table.index(['currency'], 'idx_product_prices_currency');
    table.index(['product_id', 'country_id'], 'idx_product_prices_product_country');
    table.index(['country_id', 'currency'], 'idx_product_prices_country_currency');
    table.index(['is_active'], 'idx_product_prices_active');
    table.index(['effective_from', 'effective_until'], 'idx_product_prices_effective_period');
    table.index(['created_at'], 'idx_product_prices_created');
    
    // Unique constraint
    table.unique(['product_id', 'country_id', 'currency'], 'uk_product_prices_product_country_currency');
    
    // Check constraints
    table.check('price_per_day > 0', [], 'chk_product_prices_daily_price_positive');
    table.check('security_deposit >= 0', [], 'chk_product_prices_security_deposit_non_negative');
    table.check('market_adjustment_factor > 0', [], 'chk_product_prices_market_factor_positive');
    table.check('exchange_rate > 0 OR exchange_rate IS NULL', [], 'chk_product_prices_exchange_rate_positive');
    table.check('min_rental_duration_hours > 0', [], 'chk_product_prices_min_duration_positive');
    table.check('early_return_fee_percentage >= 0 AND early_return_fee_percentage <= 1', [], 'chk_product_prices_early_return_fee_valid');
    table.check('late_return_fee_per_hour >= 0', [], 'chk_product_prices_late_return_fee_non_negative');
    table.check('weekly_discount_percentage >= 0 AND weekly_discount_percentage <= 1', [], 'chk_product_prices_weekly_discount_valid');
    table.check('monthly_discount_percentage >= 0 AND monthly_discount_percentage <= 1', [], 'chk_product_prices_monthly_discount_valid');
    table.check('bulk_discount_percentage >= 0 AND bulk_discount_percentage <= 1', [], 'chk_product_prices_bulk_discount_valid');
    table.check('peak_season_multiplier > 0', [], 'chk_product_prices_peak_multiplier_positive');
    table.check('off_season_multiplier > 0', [], 'chk_product_prices_off_season_multiplier_positive');
    table.check('effective_until IS NULL OR effective_until > effective_from', [], 'chk_product_prices_effective_period_valid');
  });

  // Create trigger for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_product_prices_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_product_prices_updated_at
      BEFORE UPDATE ON product_prices
      FOR EACH ROW
      EXECUTE FUNCTION update_product_prices_updated_at();
  `);

  // Insert sample product prices data
  await knex('product_prices').insert([
    // Uganda (UGX) - Photography Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%Canon%\' OR name LIKE \'%photography%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'UG\' LIMIT 1)'),
      currency: 'UGX',
      price_per_hour: 50000.00,
      price_per_day: 300000.00,
      price_per_week: 1800000.00,
      price_per_month: 6000000.00,
      security_deposit: 1000000.00,
      market_adjustment_factor: 0.85,
      auto_convert: true,
      base_price: 85.00,
      base_currency: 'USD',
      exchange_rate: 3529.41,
      min_rental_duration_hours: 4.0,
      max_rental_duration_days: 30.0,
      weekly_discount_percentage: 0.10,
      monthly_discount_percentage: 0.20,
      dynamic_pricing_enabled: true,
      peak_season_multiplier: 1.25,
      off_season_multiplier: 0.90,
      seasonal_adjustments: '{"12": 1.3, "1": 1.3, "7": 1.2, "8": 1.2}',
      is_active: true,
      notes: 'Professional photography equipment pricing for Uganda market'
    },
    // Kenya (KES) - Construction Tools
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%drill%\' OR name LIKE \'%construction%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'KE\' LIMIT 1)'),
      currency: 'KES',
      price_per_hour: 800.00,
      price_per_day: 5000.00,
      price_per_week: 28000.00,
      price_per_month: 90000.00,
      security_deposit: 15000.00,
      market_adjustment_factor: 1.10,
      auto_convert: true,
      base_price: 35.00,
      base_currency: 'USD',
      exchange_rate: 142.86,
      min_rental_duration_hours: 2.0,
      max_rental_duration_days: 60.0,
      weekly_discount_percentage: 0.15,
      monthly_discount_percentage: 0.25,
      bulk_discount_threshold: 3,
      bulk_discount_percentage: 0.10,
      dynamic_pricing_enabled: false,
      peak_season_multiplier: 1.15,
      off_season_multiplier: 0.95,
      is_active: true,
      notes: 'Construction tools pricing optimized for Kenyan construction market'
    },
    // Rwanda (RWF) - Event Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%sound%\' OR name LIKE \'%speaker%\' OR name LIKE \'%event%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'RW\' LIMIT 1)'),
      currency: 'RWF',
      price_per_hour: 8000.00,
      price_per_day: 45000.00,
      price_per_week: 250000.00,
      price_per_month: 800000.00,
      security_deposit: 100000.00,
      market_adjustment_factor: 0.90,
      auto_convert: true,
      base_price: 40.00,
      base_currency: 'USD',
      exchange_rate: 1125.00,
      min_rental_duration_hours: 6.0,
      max_rental_duration_days: 14.0,
      early_return_fee_percentage: 0.25,
      late_return_fee_per_hour: 5000.00,
      weekly_discount_percentage: 0.12,
      monthly_discount_percentage: 0.22,
      dynamic_pricing_enabled: true,
      peak_season_multiplier: 1.40,
      off_season_multiplier: 0.85,
      seasonal_adjustments: '{"12": 1.5, "6": 1.3, "7": 1.3, "8": 1.2}',
      is_active: true,
      notes: 'Event equipment pricing for Rwanda with peak season adjustments'
    },
    // Tanzania (TZS) - Agricultural Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%tractor%\' OR name LIKE \'%farm%\' OR name LIKE \'%agricultural%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'TZ\' LIMIT 1)'),
      currency: 'TZS',
      price_per_day: 120000.00,
      price_per_week: 700000.00,
      price_per_month: 2500000.00,
      security_deposit: 500000.00,
      market_adjustment_factor: 0.75,
      auto_convert: true,
      base_price: 50.00,
      base_currency: 'USD',
      exchange_rate: 2400.00,
      min_rental_duration_hours: 8.0,
      max_rental_duration_days: 90.0,
      weekly_discount_percentage: 0.18,
      monthly_discount_percentage: 0.30,
      dynamic_pricing_enabled: false,
      peak_season_multiplier: 1.20,
      off_season_multiplier: 0.80,
      seasonal_adjustments: '{"3": 1.3, "4": 1.4, "10": 1.2, "11": 1.2}',
      is_active: true,
      notes: 'Agricultural equipment pricing for Tanzania farming seasons'
    },
    // Nigeria (NGN) - Technology Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%laptop%\' OR name LIKE \'%computer%\' OR name LIKE \'%tech%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'NG\' LIMIT 1)'),
      currency: 'NGN',
      price_per_hour: 5000.00,
      price_per_day: 35000.00,
      price_per_week: 200000.00,
      price_per_month: 650000.00,
      security_deposit: 150000.00,
      market_adjustment_factor: 1.25,
      auto_convert: true,
      base_price: 45.00,
      base_currency: 'USD',
      exchange_rate: 777.78,
      min_rental_duration_hours: 1.0,
      max_rental_duration_days: 45.0,
      early_return_fee_percentage: 0.15,
      late_return_fee_per_hour: 2500.00,
      weekly_discount_percentage: 0.08,
      monthly_discount_percentage: 0.18,
      bulk_discount_threshold: 5,
      bulk_discount_percentage: 0.12,
      dynamic_pricing_enabled: true,
      peak_season_multiplier: 1.30,
      off_season_multiplier: 0.90,
      is_active: true,
      notes: 'Technology equipment pricing for Nigerian tech market'
    },
    // South Africa (ZAR) - Automotive Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%car%\' OR name LIKE \'%vehicle%\' OR name LIKE \'%auto%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'ZA\' LIMIT 1)'),
      currency: 'ZAR',
      price_per_hour: 150.00,
      price_per_day: 950.00,
      price_per_week: 5500.00,
      price_per_month: 18000.00,
      security_deposit: 5000.00,
      market_adjustment_factor: 1.15,
      auto_convert: true,
      base_price: 55.00,
      base_currency: 'USD',
      exchange_rate: 17.27,
      min_rental_duration_hours: 3.0,
      max_rental_duration_days: 30.0,
      early_return_fee_percentage: 0.20,
      late_return_fee_per_hour: 100.00,
      weekly_discount_percentage: 0.12,
      monthly_discount_percentage: 0.25,
      dynamic_pricing_enabled: true,
      peak_season_multiplier: 1.35,
      off_season_multiplier: 0.85,
      seasonal_adjustments: '{"12": 1.4, "1": 1.4, "7": 1.2, "4": 1.1}',
      is_active: true,
      notes: 'Automotive equipment pricing for South African market'
    },
    // Ghana (GHS) - Medical Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%medical%\' OR name LIKE \'%health%\' OR name LIKE \'%hospital%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'GH\' LIMIT 1)'),
      currency: 'GHS',
      price_per_hour: 80.00,
      price_per_day: 500.00,
      price_per_week: 3000.00,
      price_per_month: 10000.00,
      security_deposit: 2000.00,
      market_adjustment_factor: 0.95,
      auto_convert: true,
      base_price: 75.00,
      base_currency: 'USD',
      exchange_rate: 6.67,
      min_rental_duration_hours: 12.0,
      max_rental_duration_days: 60.0,
      weekly_discount_percentage: 0.10,
      monthly_discount_percentage: 0.20,
      dynamic_pricing_enabled: false,
      peak_season_multiplier: 1.10,
      off_season_multiplier: 0.95,
      is_active: true,
      notes: 'Medical equipment pricing for Ghana healthcare market'
    },
    // Egypt (EGP) - Industrial Equipment
    {
      id: knex.raw('uuid_generate_v4()'),
      product_id: knex.raw('(SELECT id FROM products WHERE name LIKE \'%industrial%\' OR name LIKE \'%factory%\' OR name LIKE \'%machine%\' LIMIT 1)'),
      country_id: knex.raw('(SELECT id FROM countries WHERE code = \'EG\' LIMIT 1)'),
      currency: 'EGP',
      price_per_hour: 400.00,
      price_per_day: 2500.00,
      price_per_week: 15000.00,
      price_per_month: 50000.00,
      security_deposit: 10000.00,
      market_adjustment_factor: 0.80,
      auto_convert: true,
      base_price: 80.00,
      base_currency: 'USD',
      exchange_rate: 31.25,
      min_rental_duration_hours: 8.0,
      max_rental_duration_days: 120.0,
      weekly_discount_percentage: 0.15,
      monthly_discount_percentage: 0.28,
      bulk_discount_threshold: 2,
      bulk_discount_percentage: 0.08,
      dynamic_pricing_enabled: false,
      peak_season_multiplier: 1.12,
      off_season_multiplier: 0.92,
      is_active: true,
      notes: 'Industrial equipment pricing for Egyptian manufacturing sector'
    }
  ]);

  console.log('✅ Product prices table created successfully with sample data');
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger and function
  await knex.raw('DROP TRIGGER IF EXISTS trigger_product_prices_updated_at ON product_prices');
  await knex.raw('DROP FUNCTION IF EXISTS update_product_prices_updated_at()');
  
  // Drop table
  await knex.schema.dropTableIfExists('product_prices');
  
  console.log('✅ Product prices table dropped successfully');
}
