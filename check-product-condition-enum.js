const { Client } = require('pg');
require('dotenv').config();

async function checkProductConditionEnum() {
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

    const enumValues = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'product_condition')
      ORDER BY enumsortorder;
    `);

    console.log('\n📋 Product Condition Enum Values:');
    console.log('==================================');
    enumValues.rows.forEach(row => {
      console.log(`- ${row.enumlabel}`);
    });

  } catch (error) {
    console.error('Error checking enum values:', error);
  } finally {
    await client.end();
  }
}

checkProductConditionEnum();
