
const { Client } = require('pg');

async function test() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'urutibiz_db',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL');
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

test();
