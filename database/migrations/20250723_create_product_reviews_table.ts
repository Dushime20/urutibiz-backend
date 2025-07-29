import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create product_reviews table
  await knex.schema.createTable('product_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable().comment('Rating from 1-5');
    table.text('comment').comment('Review comment');
    table.string('title', 255).comment('Review title');
    table.boolean('is_verified').defaultTo(false).comment('Whether this is from a verified booking');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['product_id']);
    table.index(['user_id']);
    table.index(['rating']);
    table.index(['created_at']);
    table.index(['product_id', 'created_at']);
    
    // Check constraint for rating
    table.check('rating >= 1 AND rating <= 5', [], 'chk_product_reviews_rating_range');
  });

  // Insert sample product reviews for testing
  const products = await knex('products').select('id').limit(3);
  const users = await knex('users').select('id').limit(5);
  
  if (products.length > 0 && users.length > 0) {
    const sampleReviews = [
      {
        product_id: products[0].id,
        user_id: users[0].id,
        rating: 5,
        title: 'Excellent product!',
        comment: 'This product exceeded my expectations. Great quality and exactly as described.',
        is_verified: true,
        created_at: knex.fn.now()
      },
      {
        product_id: products[0].id,
        user_id: users[1]?.id || users[0].id,
        rating: 4,
        title: 'Very good product',
        comment: 'Good quality product, would recommend to others.',
        is_verified: true,
        created_at: knex.fn.now()
      }
    ];

    // Add more reviews if we have more products and users
    if (products.length > 1 && users.length > 2) {
      sampleReviews.push({
        product_id: products[1].id,
        user_id: users[2].id,
        rating: 5,
        title: 'Amazing experience!',
        comment: 'Perfect product and excellent service. Will definitely use again.',
        is_verified: true,
        created_at: knex.fn.now()
      });
    }

    await knex('product_reviews').insert(sampleReviews);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_reviews');
} 