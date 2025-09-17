import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('product_prices');
  
  if (!hasTable) {
    await knex.schema.createTable('product_prices', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FKs to avoid ordering issues
      table.uuid('product_id').notNullable().comment('Reference to product');
      table.uuid('country_id').notNullable().comment('Reference to country');
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

    // Conditionally add FKs if referenced tables exist
    const hasProducts = await knex.schema.hasTable('products');
    const hasCountries = await knex.schema.hasTable('countries');
    
    await knex.schema.alterTable('product_prices', (table) => {
      if (hasProducts) {
        table.foreign('product_id').references('products.id').onDelete('CASCADE');
      }
      if (hasCountries) {
        table.foreign('country_id').references('countries.id').onDelete('RESTRICT');
      }
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
  }

  // Skip sample data seeding for now - referenced tables may not be seeded yet
  console.log('✅ Product prices table created (sample data skipped - referenced tables not yet seeded)');
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger and function
  await knex.raw('DROP TRIGGER IF EXISTS trigger_product_prices_updated_at ON product_prices');
  await knex.raw('DROP FUNCTION IF EXISTS update_product_prices_updated_at()');
  
  // Drop table
  await knex.schema.dropTableIfExists('product_prices');
  
  console.log('✅ Product prices table dropped successfully');
}
