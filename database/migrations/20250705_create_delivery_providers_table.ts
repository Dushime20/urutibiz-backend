import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create delivery_providers table
  await knex.schema.createTable('delivery_providers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('country_id').notNullable().references('id').inTable('countries');
    table.string('provider_name', 100).notNullable();
    table.string('display_name', 100).nullable();
    table.text('logo_url').nullable();
    
    // Service areas (administrative divisions they cover)
    table.specificType('service_areas', 'UUID[]').nullable(); // Array of administrative_division IDs
    
    // Pricing
    table.decimal('base_fee', 10, 2).notNullable();
    table.decimal('per_km_rate', 10, 2).nullable();
    table.string('currency', 3).notNullable();
    
    // Capabilities
    table.boolean('same_day_delivery').defaultTo(false);
    table.boolean('next_day_delivery').defaultTo(true);
    table.boolean('scheduled_delivery').defaultTo(true);
    table.boolean('pickup_service').defaultTo(true);
    
    // API integration
    table.text('api_endpoint').nullable();
    table.jsonb('api_credentials').nullable();
    table.text('tracking_url_template').nullable(); // URL template for tracking
    
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Create indexes
    table.index(['country_id', 'is_active']);
    table.index(['provider_name']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE delivery_providers IS 'Delivery providers by country';
    COMMENT ON COLUMN delivery_providers.service_areas IS 'Array of administrative division IDs they cover';
    COMMENT ON COLUMN delivery_providers.api_credentials IS 'API credentials stored as JSONB';
    COMMENT ON COLUMN delivery_providers.tracking_url_template IS 'URL template for package tracking';
  `);

  console.log('✅ Delivery providers table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('delivery_providers');
  console.log('✅ Delivery providers table dropped successfully');
}
