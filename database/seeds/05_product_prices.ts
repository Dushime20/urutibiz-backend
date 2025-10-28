import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('product_prices').del();

  // Get product IDs from database
  const products = await knex('products').select('id', 'name');
  const productIds = products.map(product => product.id);

  // Insert seed entries
  await knex('product_prices').insert([
    {
      id: uuidv4(),
      product_id: productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245', // Rwanda's UUID
      currency: 'RWF',
      price_per_day: 250000,
      price_per_week: 1500000,
      security_deposit: 500000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[1] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 45000,
      price_per_week: 250000,
      security_deposit: 100000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[2] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 150000,
      price_per_week: 800000,
      security_deposit: 300000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[3] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 180000,
      price_per_week: 1000000,
      security_deposit: 400000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[4] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 200000,
      price_per_week: 1200000,
      security_deposit: 500000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[5] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 80000,
      price_per_week: 400000,
      security_deposit: 200000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[6] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 120000,
      price_per_week: 600000,
      security_deposit: 300000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      product_id: productIds[7] || productIds[0],
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      currency: 'RWF',
      price_per_day: 60000,
      price_per_week: 300000,
      security_deposit: 150000,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Product prices seeded successfully');
}
