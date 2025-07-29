import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add review_count column to products table
  await knex.schema.alterTable('products', (table) => {
    table.integer('review_count').defaultTo(0).comment('Number of reviews for this product');
    table.decimal('average_rating', 3, 2).defaultTo(0).comment('Average rating from reviews (1-5)');
  });

  // Update existing products with actual review counts
  await knex.raw(`
    UPDATE products 
    SET review_count = (
      SELECT COUNT(*) 
      FROM reviews r 
      JOIN bookings b ON r.booking_id = b.id 
      WHERE b.product_id = products.id
    )
  `);

  // Update average ratings
  await knex.raw(`
    UPDATE products 
    SET average_rating = (
      SELECT AVG(r.overall_rating)::decimal(3,2)
      FROM reviews r 
      JOIN bookings b ON r.booking_id = b.id 
      WHERE b.product_id = products.id
    )
    WHERE review_count > 0
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('review_count');
    table.dropColumn('average_rating');
  });
} 