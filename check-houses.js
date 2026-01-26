
const knex = require('knex');
require('dotenv').config();

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

async function checkData() {
    try {
        console.log('--- Products containing "house" ---');
        const houses = await db('products')
            .where('title', 'ILIKE', '%house%')
            .orWhere('description', 'ILIKE', '%house%')
            .select('id', 'title', 'status');
        console.log('Houses found:', houses);

        console.log('--- Products containing "rent" ---');
        const rent = await db('products')
            .where('title', 'ILIKE', '%rent%')
            .orWhere('description', 'ILIKE', '%rent%')
            .select('id', 'title', 'status');
        console.log('Rent found:', rent);

    } catch (err) {
        console.error(err);
    } finally {
        db.destroy();
    }
}

checkData();
