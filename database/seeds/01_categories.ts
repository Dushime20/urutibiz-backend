import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('categories').del();

  // Insert seed entries
  await knex('categories').insert([
    {
      id: uuidv4(),
      name: 'Accommodation',
      slug: 'accommodation',
      description: 'Hotels, vacation rentals, apartments, and other lodging options',
      icon_name: 'home',
      is_active: true,
      parent_id: null,
      sort_order: 1,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Transportation',
      slug: 'transportation',
      description: 'Cars, motorcycles, bicycles, and other vehicles for rent',
      icon_name: 'car',
      is_active: true,
      parent_id: null,
      sort_order: 2,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Electronics',
      slug: 'electronics',
      description: 'Laptops, cameras, phones, and other electronic devices',
      icon_name: 'laptop',
      is_active: true,
      parent_id: null,
      sort_order: 3,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Tools & Equipment',
      slug: 'tools-equipment',
      description: 'Power tools, construction equipment, and other tools',
      icon_name: 'wrench',
      is_active: true,
      parent_id: null,
      sort_order: 4,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Events & Entertainment',
      slug: 'events-entertainment',
      description: 'Party supplies, event equipment, and entertainment items',
      icon_name: 'party',
      is_active: true,
      parent_id: null,
      sort_order: 5,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Sports & Recreation',
      slug: 'sports-recreation',
      description: 'Sports equipment, outdoor gear, and recreational items',
      icon_name: 'sports',
      is_active: true,
      parent_id: null,
      sort_order: 6,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Fashion & Accessories',
      slug: 'fashion-accessories',
      description: 'Clothing, jewelry, bags, and fashion accessories',
      icon_name: 'shirt',
      is_active: true,
      parent_id: null,
      sort_order: 7,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Furniture, appliances, garden tools, and home items',
      icon_name: 'home',
      is_active: true,
      parent_id: null,
      sort_order: 8,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Categories seeded successfully');
}
