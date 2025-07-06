import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create translations table for dynamic content
  await knex.schema.createTable('translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('entity_type', 50).notNullable(); // 'category', 'product', 'notification_template'
    table.uuid('entity_id').notNullable();
    table.string('field_name', 50).notNullable(); // 'name', 'description', 'title'
    table.string('language_code', 10).notNullable(); // 'en', 'fr', 'rw', 'sw', etc.
    table.text('content').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Create unique constraint
    table.unique(['entity_type', 'entity_id', 'field_name', 'language_code']);
    
    // Create indexes for better performance
    table.index(['entity_type', 'entity_id']);
    table.index(['language_code']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE translations IS 'Dynamic content translations for entities';
    COMMENT ON COLUMN translations.entity_type IS 'Type of entity being translated (category, product, etc.)';
    COMMENT ON COLUMN translations.entity_id IS 'ID of the entity being translated';
    COMMENT ON COLUMN translations.field_name IS 'Field name being translated (name, description, etc.)';
    COMMENT ON COLUMN translations.language_code IS 'Language code (en, fr, rw, sw, etc.)';
  `);

  console.log('✅ Translations table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('translations');
  console.log('✅ Translations table dropped successfully');
}
