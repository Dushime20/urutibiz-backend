import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('insurance_providers');
  
  if (!hasTable) {
    await knex.schema.createTable('insurance_providers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FK to avoid ordering issues
      table.uuid('country_id').notNullable();
      
      table.string('provider_name', 100).notNullable();
      table.string('display_name', 100);
      table.text('logo_url');
      table.jsonb('contact_info').defaultTo({});
      table.specificType('supported_categories', 'uuid[]').defaultTo(knex.raw("'{}'"));
      table.text('api_endpoint');
      table.jsonb('api_credentials').defaultTo({});
      table.boolean('is_active').defaultTo(true).notNullable();
    
    // Additional fields for enhanced functionality
      table.enum('provider_type', ['TRADITIONAL', 'DIGITAL', 'PEER_TO_PEER', 'GOVERNMENT', 'MUTUAL']).defaultTo('TRADITIONAL').notNullable();
      table.string('license_number', 50);
      table.decimal('rating', 2, 1);
      table.specificType('coverage_types', 'text[]').defaultTo(knex.raw("'{}'"));
      table.decimal('min_coverage_amount', 12, 2);
      table.decimal('max_coverage_amount', 12, 2);
      table.specificType('deductible_options', 'decimal[]').defaultTo(knex.raw("'{}'"));
      table.integer('processing_time_days');
      table.specificType('languages_supported', 'text[]').defaultTo(knex.raw("'{}'"));
      table.decimal('commission_rate', 5, 4);
      table.enum('integration_status', ['NOT_INTEGRATED', 'TESTING', 'LIVE', 'DEPRECATED']).defaultTo('NOT_INTEGRATED').notNullable();
    
    // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
      table.timestamp('deleted_at', { useTz: true });
      
      // Indexes
      table.index(['country_id']);
      table.index(['is_active']);
      table.index(['provider_type']);
      table.index(['integration_status']);
      table.index(['rating']);
      table.index(['country_id', 'is_active']);
      table.index(['country_id', 'provider_type']);
      table.index(['is_active', 'integration_status']);
    });

    // Conditionally add FK if referenced table exists
    const hasCountries = await knex.schema.hasTable('countries');
    if (hasCountries) {
      await knex.schema.alterTable('insurance_providers', (table) => {
        table.foreign('country_id').references('countries.id').onDelete('CASCADE');
      });
    }
  }

  // Skip sample data seeding for now - countries table may not have the referenced IDs yet
  console.log('✅ Insurance providers table created (sample data skipped - countries not yet seeded)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('insurance_providers');
}