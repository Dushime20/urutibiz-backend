require('dotenv').config();
const { Client } = require('pg');

async function checkProductLocations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'urutibiz_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');
    
    // Check products with location data
    console.log('📍 Checking product locations...\n');
    const result = await client.query(`
      SELECT 
        id,
        title,
        address_line,
        ST_AsText(location) as location_text,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM products
      WHERE location IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  No products with location data found.');
      return;
    }
    
    console.log(`Found ${result.rows.length} products with location data:\n`);
    
    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title || 'Untitled'}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Address: ${product.address_line || 'N/A'}`);
      
      if (product.latitude && product.longitude) {
        console.log(`   📍 Coordinates: ${product.latitude}, ${product.longitude}`);
        
        // Check if coordinates match the address
        const lat = parseFloat(product.latitude);
        const lng = parseFloat(product.longitude);
        
        // Kigali, Rwanda is around: -1.9441, 30.0619
        // Mbarara, Uganda is around: -0.6069, 30.6583
        
        const isInKigali = (lat >= -2.0 && lat <= -1.9 && lng >= 29.9 && lng <= 30.2);
        const isInMbarara = (lat >= -0.7 && lat <= -0.5 && lng >= 30.5 && lng <= 30.8);
        
        if (isInKigali) {
          console.log(`   ⚠️  WARNING: Coordinates point to Kigali, Rwanda`);
        } else if (isInMbarara) {
          console.log(`   ✅ Coordinates point to Mbarara, Uganda`);
        } else {
          console.log(`   ℹ️  Coordinates point to another location`);
        }
        
        // Check if address mentions Mbarara but coordinates are in Kigali
        const addressText = `${product.address_line || ''}`.toLowerCase();
        if (addressText.includes('mbarara') && isInKigali) {
          console.log(`   🔴 MISMATCH: Address says Mbarara but coordinates are in Kigali!`);
        }
      }
      
      console.log('');
    });
    
    // Provide fix suggestions
    console.log('\n💡 To fix incorrect coordinates:');
    console.log('   1. Update the product location in the admin panel');
    console.log('   2. Or run: node fix-product-location.js <product_id> <latitude> <longitude>');
    console.log('\n   Example for Mbarara, Uganda:');
    console.log('   node fix-product-location.js <product_id> -0.6069 30.6583');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done');
    process.exit(0);
  }
}

checkProductLocations();
