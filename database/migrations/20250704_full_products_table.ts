import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enums only if they don't exist (use DO blocks to avoid transaction aborts)
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
        CREATE TYPE product_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
      END IF;
    END$$;
  `);

  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'suspended', 'deleted');
      END IF;
    END$$;
  `);
  
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('products');
  
  if (!hasTable) {
    await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('owner_id').notNullable().references('id').inTable('users');
    table.uuid('category_id').notNullable().references('id').inTable('categories');
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description').notNullable();
    table.string('brand', 100);
    table.string('model', 100);
    table.string('serial_number', 100);
    table.integer('year_manufactured');
    table.enu('condition', ['new', 'like_new', 'good', 'fair', 'poor'], { useNative: true, enumName: 'product_condition' }).notNullable();
    table.decimal('base_price_per_day', 10, 2).notNullable();
    table.decimal('base_price_per_week', 10, 2);
    table.decimal('base_price_per_month', 10, 2);
    table.decimal('security_deposit', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('RWF');
    table.specificType('location', 'geometry(POINT,4326)');
    table.text('address_line');
    table.string('district', 50);
    table.string('sector', 50);
    table.boolean('pickup_available').defaultTo(true);
    table.boolean('delivery_available').defaultTo(false);
    table.integer('delivery_radius_km').defaultTo(0);
    table.decimal('delivery_fee', 10, 2).defaultTo(0);
    table.jsonb('specifications');
    table.specificType('features', 'text[]');
    table.specificType('included_accessories', 'text[]');
    table.enu('status', ['draft', 'active', 'inactive', 'suspended', 'deleted'], { useNative: true, enumName: 'product_status' }).defaultTo('draft');
    table.boolean('is_featured').defaultTo(false);
    table.integer('view_count').defaultTo(0);
    table.specificType('tags', 'varchar(50)[]');
    table.specificType('search_vector', 'tsvector');
    table.decimal('ai_category_confidence', 3, 2);
    table.decimal('quality_score', 3, 2);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('published_at', { useTz: true });
    table.timestamp('last_booked_at', { useTz: true });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
  await knex.schema.raw('DROP TYPE IF EXISTS product_condition');
  await knex.schema.raw('DROP TYPE IF EXISTS product_status');
}
