import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('products').del();

  // Get category IDs from database
  const categories = await knex('categories').select('id', 'slug');
  const categoryMap: { [key: string]: string } = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });

  // Get owner user IDs
  const owners = await knex('users').whereIn('role', ['owner']).select('id', 'email');
  const ownerIds = owners.map(owner => owner.id);

  // Insert seed entries
  await knex('products').insert([
    {
      id: uuidv4(),
      name: 'Luxury Beach Villa in Miami',
      title: 'Luxury Beach Villa in Miami',
      slug: 'luxury-beach-villa-miami',
      description: 'Beautiful oceanfront villa with 4 bedrooms, private pool, and stunning views. Perfect for family vacations or group getaways.',
      category_id: categoryMap['accommodation'],
      condition: 'like_new',
      pickup_methods: JSON.stringify(['pickup', 'delivery']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        bedrooms: 4,
        bathrooms: 3,
        pool: true,
        wifi: true,
        parking: true,
        air_conditioning: true,
        max_guests: 8
      }),
      location: null,
      owner_id: ownerIds[0],
      status: 'active',
      brand: 'Premium Villas',
      model: 'Oceanfront Villa',
      year_manufactured: 2020,
      address_line: 'KG 123 St, Kacyiru',
      delivery_fee: 50000,
      price: 250000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Sports Car Rental - Toyota Camry',
      title: 'Sports Car Rental - Toyota Camry',
      slug: 'sports-car-rental-toyota-camry',
      description: 'Experience comfort and reliability with our Toyota Camry. Perfect for business trips or city exploration.',
      category_id: categoryMap['transportation'],
      condition: 'new',
      pickup_methods: JSON.stringify(['pickup']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        seats: 5,
        color: 'white',
        transmission: 'automatic',
        fuel_type: 'petrol',
        engine_size: '2.5L',
        year: 2022
      }),
      location: null,
      owner_id: ownerIds[1] || ownerIds[0],
      status: 'active',
      brand: 'Toyota',
      model: 'Camry',
      year_manufactured: 2022,
      address_line: 'KG 456 St, Kimisagara',
      delivery_fee: 0,
      price: 45000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Professional Camera Kit',
      title: 'Professional Camera Kit',
      slug: 'professional-camera-kit',
      description: 'Complete photography kit with DSLR camera, lenses, and accessories. Perfect for events and professional photography.',
      category_id: categoryMap['electronics'],
      condition: 'new',
      pickup_methods: JSON.stringify(['pickup', 'delivery']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        camera_model: 'Canon EOS R6',
        lens_count: 3,
        memory_cards: 2,
        tripod: true,
        flash: true,
        bag: true
      }),
      location: null,
      owner_id: ownerIds[0],
      status: 'active',
      brand: 'Canon',
      model: 'EOS R6',
      year_manufactured: 2021,
      address_line: 'KN 789 St, Huye',
      delivery_fee: 25000,
      price: 150000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Power Tools Set',
      title: 'Power Tools Set',
      slug: 'power-tools-set',
      description: 'Complete set of professional power tools for construction and DIY projects. Includes drill, saw, and various accessories.',
      category_id: categoryMap['tools-equipment'],
      condition: 'good',
      pickup_methods: JSON.stringify(['pickup']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        drill: true,
        circular_saw: true,
        angle_grinder: true,
        jigsaw: true,
        battery_pack: 2,
        charger: true,
        case: true
      }),
      location: null,
      owner_id: ownerIds[1] || ownerIds[0],
      status: 'active',
      brand: 'DeWalt',
      model: '20V Max',
      year_manufactured: 2020,
      address_line: 'KG 321 St, Rubavu',
      delivery_fee: 30000,
      price: 180000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Event Sound System',
      title: 'Event Sound System',
      slug: 'event-sound-system',
      description: 'Professional sound system for events, parties, and gatherings. Includes speakers, mixer, microphones, and cables.',
      category_id: categoryMap['events-entertainment'],
      condition: 'new',
      pickup_methods: JSON.stringify(['pickup', 'delivery']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        speakers: 4,
        mixer: true,
        microphones: 2,
        cables: 'complete_set',
        amplifier: true,
        stands: 2
      }),
      location: null,
      owner_id: ownerIds[0],
      status: 'active',
      brand: 'JBL',
      model: 'Professional Series',
      year_manufactured: 2021,
      address_line: 'KG 654 St, Kacyiru',
      delivery_fee: 40000,
      price: 200000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Mountain Bike',
      title: 'Mountain Bike',
      slug: 'mountain-bike',
      description: 'High-quality mountain bike perfect for outdoor adventures and fitness. Well-maintained and ready for trails.',
      category_id: categoryMap['sports-recreation'],
      condition: 'good',
      pickup_methods: JSON.stringify(['pickup']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        frame_size: 'Large',
        gears: 21,
        suspension: 'front',
        brakes: 'disc',
        wheels: 26,
        helmet: true
      }),
      location: null,
      owner_id: ownerIds[1] || ownerIds[0],
      status: 'active',
      brand: 'Trek',
      model: 'Mountain Bike',
      year_manufactured: 2019,
      address_line: 'KG 147 St, Musanze',
      delivery_fee: 20000,
      price: 80000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Designer Handbag Collection',
      title: 'Designer Handbag Collection',
      slug: 'designer-handbag-collection',
      description: 'Collection of premium designer handbags perfect for special occasions. Various styles and colors available.',
      category_id: categoryMap['fashion-accessories'],
      condition: 'like_new',
      pickup_methods: JSON.stringify(['pickup', 'delivery']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        material: 'leather',
        colors: ['black', 'brown', 'red'],
        sizes: ['small', 'medium', 'large'],
        authenticity: 'verified',
        original_box: true
      }),
      location: null,
      owner_id: ownerIds[0],
      status: 'active',
      brand: 'Louis Vuitton',
      model: 'Handbag Collection',
      year_manufactured: 2022,
      address_line: 'KG 258 St, Kimisagara',
      delivery_fee: 15000,
      price: 120000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      name: 'Garden Tools Set',
      title: 'Garden Tools Set',
      slug: 'garden-tools-set',
      description: 'Complete set of garden tools for landscaping and gardening projects. Includes shovels, rakes, pruners, and more.',
      category_id: categoryMap['home-garden'],
      condition: 'good',
      pickup_methods: JSON.stringify(['pickup']),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      specifications: JSON.stringify({
        shovel: true,
        rake: true,
        pruners: true,
        hoe: true,
        watering_can: true,
        gloves: true,
        storage_box: true
      }),
      location: null,
      owner_id: ownerIds[1] || ownerIds[0],
      status: 'active',
      brand: 'Fiskars',
      model: 'Garden Tools',
      year_manufactured: 2020,
      address_line: 'KN 369 St, Huye',
      delivery_fee: 20000,
      price: 60000,
      is_active: true,
      stock: 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Products seeded successfully');
}