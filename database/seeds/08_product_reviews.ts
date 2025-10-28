import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('product_reviews').del();

  // Insert seed entries
  await knex('product_reviews').insert([
    {
      id: 'review-1',
      product_id: 'product-1',
      user_id: 'user-1',
      rating: 5,
      title: 'Amazing villa experience!',
      comment: 'The villa was absolutely perfect for our family vacation. Clean, spacious, and the pool was fantastic. The owner was very responsive and helpful.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-2',
      product_id: 'product-2',
      user_id: 'user-6',
      rating: 4,
      title: 'Great car rental service',
      comment: 'The car was clean and well-maintained. Easy pickup process and good communication with the owner. Would rent again.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-3',
      product_id: 'product-3',
      user_id: 'user-1',
      rating: 5,
      title: 'Professional camera kit',
      comment: 'Excellent equipment for our wedding photography. Everything worked perfectly and the owner provided great support.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-4',
      product_id: 'product-4',
      user_id: 'user-8',
      rating: 3,
      title: 'Good tools, minor issues',
      comment: 'The tools were mostly in good condition, but one battery was not holding charge well. Overall decent rental.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-5',
      product_id: 'product-5',
      user_id: 'user-1',
      rating: 5,
      title: 'Perfect sound system',
      comment: 'The sound system was exactly what we needed for our event. Great quality and the owner was very professional.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-6',
      product_id: 'product-6',
      user_id: 'user-6',
      rating: 4,
      title: 'Fun mountain biking',
      comment: 'Great bike for exploring the trails. Well-maintained and comfortable to ride. The helmet included was a nice touch.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-7',
      product_id: 'product-7',
      user_id: 'user-1',
      rating: 5,
      title: 'Beautiful handbags',
      comment: 'The handbags were in excellent condition and perfect for our special event. Authentic and well-cared for.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 'review-8',
      product_id: 'product-8',
      user_id: 'user-6',
      rating: 4,
      title: 'Complete garden tools',
      comment: 'All the tools I needed for my garden project. Good quality and the storage box kept everything organized.',
      is_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Product reviews seeded successfully');
}
