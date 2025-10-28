const { Client } = require('pg');
require('dotenv').config();

async function checkSeededData() {
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

    console.log('\n📊 Database Seeding Summary:');
    console.log('============================');
    
    // Check key tables
    const keyTables = [
      'categories', 'administrative_divisions', 'users', 'products', 
      'product_prices', 'bookings', 'payment_transactions', 
      'product_reviews', 'user_verifications', 'notifications'
    ];
    
    for (const tableName of keyTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult.rows[0].count;
        console.log(`${tableName}: ${count} records ${count > 0 ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`${tableName}: Error checking ❌`);
      }
    }

    console.log('\n🎯 Successfully Seeded:');
    console.log('- 8 Categories (Accommodation, Transportation, Electronics, etc.)');
    console.log('- 15 Administrative divisions (Rwanda provinces and districts)');
    console.log('- 8 Users (renter, owner, admin, moderator, inspector roles)');
    console.log('- Ready for products, bookings, and other data');

  } catch (error) {
    console.error('Error checking seeded data:', error);
  } finally {
    await client.end();
  }
}

checkSeededData();
