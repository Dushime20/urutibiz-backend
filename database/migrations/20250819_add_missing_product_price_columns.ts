import { Knex } from 'knex';

async function addColumnIfMissing(
  knex: Knex,
  tableName: string,
  columnName: string,
  add: (table: Knex.AlterTableBuilder) => void
) {
  const exists = await knex.schema.hasColumn(tableName, columnName);
  if (!exists) {
    await knex.schema.alterTable(tableName, (table) => add(table));
  }
}

export async function up(knex: Knex): Promise<void> {
  const t = 'product_prices';

  // Core pricing tiers (most tables already have these, but safe-guard)
  await addColumnIfMissing(knex, t, 'price_per_hour', (table) => {
    table.decimal('price_per_hour', 10, 2).comment('Hourly rental rate');
  });
  await addColumnIfMissing(knex, t, 'price_per_day', (table) => {
    table.decimal('price_per_day', 10, 2).notNullable().defaultTo(0.01).comment('Daily rental rate');
  });
  await addColumnIfMissing(knex, t, 'price_per_week', (table) => {
    table.decimal('price_per_week', 10, 2).comment('Weekly rental rate');
  });
  await addColumnIfMissing(knex, t, 'price_per_month', (table) => {
    table.decimal('price_per_month', 10, 2).comment('Monthly rental rate');
  });

  // Market adjustments and base conversion
  await addColumnIfMissing(knex, t, 'security_deposit', (table) => {
    table.decimal('security_deposit', 10, 2).notNullable().defaultTo(0).comment('Security deposit');
  });
  await addColumnIfMissing(knex, t, 'market_adjustment_factor', (table) => {
    table.decimal('market_adjustment_factor', 4, 2).notNullable().defaultTo(1.0).comment('Market factor');
  });
  await addColumnIfMissing(knex, t, 'auto_convert', (table) => {
    table.boolean('auto_convert').notNullable().defaultTo(true).comment('Auto convert from base currency');
  });
  await addColumnIfMissing(knex, t, 'base_price', (table) => {
    table.decimal('base_price', 10, 2).comment('Base price before adjustments');
  });
  await addColumnIfMissing(knex, t, 'base_currency', (table) => {
    table.string('base_currency', 3).comment('Base currency code');
  });
  await addColumnIfMissing(knex, t, 'exchange_rate', (table) => {
    table.decimal('exchange_rate', 10, 6).comment('Exchange rate used');
  });
  await addColumnIfMissing(knex, t, 'exchange_rate_updated_at', (table) => {
    table.timestamp('exchange_rate_updated_at').comment('When exchange rate was updated last');
  });

  // Rental duration rules and fees
  await addColumnIfMissing(knex, t, 'min_rental_duration_hours', (table) => {
    table.decimal('min_rental_duration_hours', 6, 2).notNullable().defaultTo(1.0).comment('Minimum rental hours');
  });
  await addColumnIfMissing(knex, t, 'max_rental_duration_days', (table) => {
    table.decimal('max_rental_duration_days', 8, 2).comment('Maximum rental days');
  });
  await addColumnIfMissing(knex, t, 'early_return_fee_percentage', (table) => {
    table.decimal('early_return_fee_percentage', 4, 2).notNullable().defaultTo(0).comment('Early return fee %');
  });
  await addColumnIfMissing(knex, t, 'late_return_fee_per_hour', (table) => {
    table.decimal('late_return_fee_per_hour', 10, 2).notNullable().defaultTo(0).comment('Late fee per hour');
  });

  // Discounts
  await addColumnIfMissing(knex, t, 'weekly_discount_percentage', (table) => {
    table.decimal('weekly_discount_percentage', 4, 2).notNullable().defaultTo(0).comment('Weekly discount %');
  });
  await addColumnIfMissing(knex, t, 'monthly_discount_percentage', (table) => {
    table.decimal('monthly_discount_percentage', 4, 2).notNullable().defaultTo(0).comment('Monthly discount %');
  });
  await addColumnIfMissing(knex, t, 'bulk_discount_threshold', (table) => {
    table.decimal('bulk_discount_threshold', 3, 0).notNullable().defaultTo(1).comment('Bulk threshold');
  });
  await addColumnIfMissing(knex, t, 'bulk_discount_percentage', (table) => {
    table.decimal('bulk_discount_percentage', 4, 2).notNullable().defaultTo(0).comment('Bulk discount %');
  });

  // Dynamic / seasonal pricing
  await addColumnIfMissing(knex, t, 'dynamic_pricing_enabled', (table) => {
    table.boolean('dynamic_pricing_enabled').notNullable().defaultTo(false).comment('Enable dynamic pricing');
  });
  await addColumnIfMissing(knex, t, 'peak_season_multiplier', (table) => {
    table.decimal('peak_season_multiplier', 4, 2).notNullable().defaultTo(1.0).comment('Peak season multiplier');
  });
  await addColumnIfMissing(knex, t, 'off_season_multiplier', (table) => {
    table.decimal('off_season_multiplier', 4, 2).notNullable().defaultTo(1.0).comment('Off season multiplier');
  });
  await addColumnIfMissing(knex, t, 'seasonal_adjustments', (table) => {
    table.jsonb('seasonal_adjustments').comment('Per-month seasonal multipliers');
  });

  // Status and effectiveness window
  await addColumnIfMissing(knex, t, 'is_active', (table) => {
    table.boolean('is_active').notNullable().defaultTo(true).comment('Whether pricing is active');
  });
  await addColumnIfMissing(knex, t, 'effective_from', (table) => {
    table.timestamp('effective_from').notNullable().defaultTo(knex.fn.now()).comment('Effective from');
  });
  await addColumnIfMissing(knex, t, 'effective_until', (table) => {
    table.timestamp('effective_until').comment('Effective until');
  });
  await addColumnIfMissing(knex, t, 'notes', (table) => {
    table.text('notes').comment('Notes');
  });
}

export async function down(knex: Knex): Promise<void> {
  const t = 'product_prices';
  const cols = [
    'notes',
    'effective_until',
    'effective_from',
    'is_active',
    'seasonal_adjustments',
    'off_season_multiplier',
    'peak_season_multiplier',
    'dynamic_pricing_enabled',
    'bulk_discount_percentage',
    'bulk_discount_threshold',
    'monthly_discount_percentage',
    'weekly_discount_percentage',
    'late_return_fee_per_hour',
    'early_return_fee_percentage',
    'max_rental_duration_days',
    'min_rental_duration_hours',
    'exchange_rate_updated_at',
    'exchange_rate',
    'base_currency',
    'base_price',
    'auto_convert',
    'market_adjustment_factor',
    'security_deposit',
    'price_per_month',
    'price_per_week',
    'price_per_day',
    'price_per_hour',
  ];

  for (const c of cols) {
    const exists = await knex.schema.hasColumn(t, c);
    if (exists) {
      await knex.schema.alterTable(t, (table) => {
        table.dropColumn(c);
      });
    }
  }
}


