import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create tax_rates table
  await knex.schema.createTable('tax_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('country_id').notNullable().references('id').inTable('countries');
    table.uuid('category_id').nullable().references('id').inTable('categories'); // NULL = applies to all categories
    
    // Tax details
    table.string('tax_name', 100).notNullable(); // 'VAT', 'GST', 'Sales Tax'
    table.string('tax_type', 50).notNullable(); // 'percentage', 'fixed', 'progressive'
    table.decimal('rate_percentage', 5, 2).nullable(); // 18.00 for 18%
    table.decimal('fixed_amount', 10, 2).nullable();
    
    // Applicability
    table.string('applies_to', 50).defaultTo('total'); // 'total', 'service_fee', 'product_only'
    table.decimal('min_amount_threshold', 10, 2).defaultTo(0);
    
    // Validity
    table.date('effective_from').notNullable();
    table.date('effective_until').nullable();
    table.boolean('is_active').defaultTo(true);
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Create indexes
    table.index(['country_id', 'is_active']);
    table.index(['category_id']);
    table.index(['effective_from', 'effective_until']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE tax_rates IS 'Tax rates by country and category';
    COMMENT ON COLUMN tax_rates.country_id IS 'Country where this tax rate applies';
    COMMENT ON COLUMN tax_rates.category_id IS 'Category this tax applies to (NULL = all categories)';
    COMMENT ON COLUMN tax_rates.tax_type IS 'Type of tax calculation (percentage, fixed, progressive)';
    COMMENT ON COLUMN tax_rates.applies_to IS 'What the tax applies to (total, service_fee, product_only)';
  `);

  console.log('✅ Tax rates table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tax_rates');
  console.log('✅ Tax rates table dropped successfully');
}
