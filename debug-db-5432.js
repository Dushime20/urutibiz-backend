const knex = require('knex');
require('dotenv').config();

// Force port 5432
const config = {
    client: 'postgresql',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: 5432, // FORCE DEFAULT PORT
        database: process.env.DB_NAME || 'urutibiz_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD // uses 12345 from env
    }
};

const db = knex(config);

async function checkData() {
    try {
        console.log('--- Testing Connection on Port 5432 ---');
        const result = await db.raw('SELECT 1+1 as result');
        console.log('✅ Connection Successful on Port 5432!');
        console.log(result.rows);
    } catch (err) {
        console.error('❌ Connection Failed on Port 5432:', err.message);
    } finally {
        db.destroy();
    }
}

checkData();
