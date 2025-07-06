import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create exchange_rates table
  await knex.schema.createTable('exchange_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('from_currency', 3).notNullable();
    table.string('to_currency', 3).notNullable();
    table.decimal('rate', 12, 6).notNullable();
    table.date('rate_date').notNullable();
    table.string('source', 50).notNullable(); // 'central_bank', 'api_provider', 'manual'
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Unique constraint
    table.unique(['from_currency', 'to_currency', 'rate_date']);
    
    // Create indexes
    table.index(['from_currency', 'to_currency']);
    table.index(['rate_date']);
    table.index(['source']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE exchange_rates IS 'Real-time currency exchange rates';
    COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate from base currency to target currency';
    COMMENT ON COLUMN exchange_rates.source IS 'Source of the exchange rate (central_bank, api_provider, manual)';
  `);

  console.log('✅ Exchange rates table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exchange_rates');
  console.log('✅ Exchange rates table dropped successfully');
}
