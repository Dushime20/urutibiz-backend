
const knex = require('knex');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const config = {
    client: 'postgresql',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'urutibiz_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    }
};

const db = knex(config);

async function insertData() {
    try {
        console.log('--- Inserting Test Data ---');

        // Get Accommodation category
        const cat = await db('categories').where('slug', 'accommodation').first();
        if (!cat) {
            console.error('Accommodation category not found!');
            return;
        }

        // Get an owner user
        let user = await db('users').where('role', 'owner').first();
        if (!user) {
            // Try any user if no owner exists
            user = await db('users').first();
            if (!user) {
                console.error('No users found to own the product!');
                return;
            }
        }

        const countryId = 'ba50a11b-f408-404f-88a9-9d975052c245'; // Rwanda from my seed

        const productId = uuidv4();
        await db('products').insert({
            id: productId,
            name: 'Modern House in Kigali',
            title: 'Modern House in Kigali',
            slug: 'modern-house-kigali-' + Date.now(),
            description: 'Beautiful 3 bedroom house for rent in the heart of Kigali. Good for families.',
            category_id: cat.id,
            condition: 'good',
            pickup_methods: JSON.stringify(['pickup']),
            country_id: countryId,
            owner_id: user.id,
            status: 'active',
            price: 500000,
            is_active: true,
            stock: 1,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log(`Product inserted with ID: ${productId}`);

    } catch (err) {
        console.error(err);
    } finally {
        db.destroy();
    }
}

insertData();
