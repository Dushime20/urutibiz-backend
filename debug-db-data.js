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
        console.log('--- Checking Totals ---');
        const catCount = await db('categories').count('id as count').first();
        const prodCount = await db('products').count('id as count').first();

        console.log(`Total Categories: ${catCount.count}`);
        console.log(`Total Products: ${prodCount.count}`);

        if (prodCount.count > 0) {
            const sample = await db('products').select('title').limit(5);
            console.log('Sample Products:', sample);
        }

    } catch (err) {
        console.error(err);
    } finally {
        db.destroy();
    }
}

checkData();
