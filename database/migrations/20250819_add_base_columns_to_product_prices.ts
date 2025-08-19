import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add base currency-related columns to product_prices if missing
  const hasBasePrice = await knex.schema.hasColumn('product_prices', 'base_price');
  if (!hasBasePrice) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.decimal('base_price', 10, 2).comment('Base price in original currency before adjustments');
    });
  }

  const hasBaseCurrency = await knex.schema.hasColumn('product_prices', 'base_currency');
  if (!hasBaseCurrency) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.string('base_currency', 3).comment('Original currency for base price');
    });
  }

  const hasExchangeRate = await knex.schema.hasColumn('product_prices', 'exchange_rate');
  if (!hasExchangeRate) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.decimal('exchange_rate', 10, 6).comment('Exchange rate used for conversion');
    });
  }

  const hasExchangeRateUpdatedAt = await knex.schema.hasColumn('product_prices', 'exchange_rate_updated_at');
  if (!hasExchangeRateUpdatedAt) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.timestamp('exchange_rate_updated_at').comment('When exchange rate was last updated');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop columns if they exist (safe rollback)
  const hasExchangeRateUpdatedAt = await knex.schema.hasColumn('product_prices', 'exchange_rate_updated_at');
  if (hasExchangeRateUpdatedAt) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.dropColumn('exchange_rate_updated_at');
    });
  }

  const hasExchangeRate = await knex.schema.hasColumn('product_prices', 'exchange_rate');
  if (hasExchangeRate) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.dropColumn('exchange_rate');
    });
  }

  const hasBaseCurrency = await knex.schema.hasColumn('product_prices', 'base_currency');
  if (hasBaseCurrency) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.dropColumn('base_currency');
    });
  }

  const hasBasePrice = await knex.schema.hasColumn('product_prices', 'base_price');
  if (hasBasePrice) {
    await knex.schema.alterTable('product_prices', (table) => {
      table.dropColumn('base_price');
    });
  }
}


