const { Client } = require('pg');
require('dotenv').config();

async function getUserIds() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const users = await client.query(`
      SELECT id, email, role FROM users ORDER BY created_at;
    `);

    console.log('\n👥 Available Users:');
    console.log('===================');
    users.rows.forEach(row => {
      console.log(`${row.id} - ${row.email} (${row.role})`);
    });

    return users.rows;

  } catch (error) {
    console.error('Error getting users:', error);
  } finally {
    await client.end();
  }
}

getUserIds();
