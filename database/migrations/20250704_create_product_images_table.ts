import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('product_images');
  
  if (!hasTable) {
    await knex.schema.createTable('product_images', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FK to avoid ordering issues on fresh DBs
      table.uuid('product_id').notNullable();
      table.text('image_url').notNullable();
      table.text('thumbnail_url');
      table.string('alt_text', 255);
      table.integer('sort_order').defaultTo(0);
      table.boolean('is_primary').defaultTo(false);
      table.jsonb('ai_analysis');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
    
    // Add FK only if products table exists
    const hasProducts = await knex.schema.hasTable('products');
    if (hasProducts) {
      await knex.schema.alterTable('product_images', (table) => {
        table.foreign('product_id').references('products.id').onDelete('CASCADE');
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_images');
}
