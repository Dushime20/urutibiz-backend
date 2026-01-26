
import knex from 'knex';
import config from './knexfile';
const db = knex(config);

async function runSeed() {
    try {
        const { seed } = require('./database/seeds/04_products');
        await seed(db);
        console.log('Seed successful');
    } catch (err: any) {
        console.error('Seed failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.hint) console.error('Hint:', err.hint);
    } finally {
        await db.destroy();
    }
}

runSeed();
