import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create product_views table for tracking individual product views
  await knex.schema.createTable('product_views', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address', 45).nullable(); // IPv4 or IPv6
    table.text('user_agent').nullable();
    table.timestamp('viewed_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Create indexes for better performance
    table.index(['product_id']);
    table.index(['user_id']);
    table.index(['viewed_at']);
    table.index(['product_id', 'viewed_at']);
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE product_views IS 'Individual product view tracking for analytics';
    COMMENT ON COLUMN product_views.product_id IS 'ID of the product being viewed';
    COMMENT ON COLUMN product_views.user_id IS 'ID of the user viewing (nullable for anonymous users)';
    COMMENT ON COLUMN product_views.ip_address IS 'IP address of the viewer';
    COMMENT ON COLUMN product_views.user_agent IS 'User agent string of the viewer';
    COMMENT ON COLUMN product_views.viewed_at IS 'Timestamp when the view occurred';
  `);

  console.log('✅ Product views table created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_views');
  console.log('✅ Product views table dropped successfully');
}
