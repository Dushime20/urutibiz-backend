import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create country_business_rules table
  await knex.schema.createTable('country_business_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('country_id').notNullable().references('id').inTable('countries');
    
    // Platform rules
    table.integer('min_user_age').defaultTo(18);
    table.boolean('kyc_required').defaultTo(true);
    table.decimal('max_booking_value', 10, 2).nullable(); // Maximum booking value without additional verification
    
    // Business hours (in country timezone)
    table.time('support_hours_start').defaultTo('08:00:00');
    table.time('support_hours_end').defaultTo('18:00:00');
    table.specificType('support_days', 'INTEGER[]').defaultTo(knex.raw('ARRAY[1,2,3,4,5]')); // Monday=1, Sunday=7
    
    // Legal requirements
    table.text('terms_of_service_url').nullable();
    table.text('privacy_policy_url').nullable();
    table.string('local_registration_number', 100).nullable();
    table.string('tax_registration_number', 100).nullable();
    
    // Platform fees
    table.decimal('service_fee_percentage', 4, 2).defaultTo(5.0);
    table.decimal('payment_processing_fee', 4, 2).defaultTo(2.9);
    table.decimal('min_payout_amount', 10, 2).defaultTo(10);
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Unique constraint
    table.unique(['country_id']);
    
    // Create indexes
    table.index(['country_id']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE country_business_rules IS 'Country-specific business rules and settings';
    COMMENT ON COLUMN country_business_rules.support_days IS 'Array of support days (1=Monday, 7=Sunday)';
    COMMENT ON COLUMN country_business_rules.max_booking_value IS 'Maximum booking value without additional verification';
  `);

  console.log('✅ Country business rules table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('country_business_rules');
  console.log('✅ Country business rules table dropped successfully');
}
