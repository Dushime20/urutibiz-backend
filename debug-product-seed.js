
const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.demo); // Use demo config as per package.json

async function runSeed() {
    try {
        const { seed } = require('./database/seeds/04_products');
        await seed(db);
        console.log('Seed successful');
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        db.destroy();
    }
}

runSeed();
