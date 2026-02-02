require('dotenv').config();
const { Client } = require('pg');

async function fixProductLocation() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node fix-product-location.js <product_id> <latitude> <longitude>');
    console.log('\nExample (Mbarara, Uganda):');
    console.log('  node fix-product-location.js abc-123 -0.6069 30.6583');
    console.log('\nExample (Kampala, Uganda):');
    console.log('  node fix-product-location.js abc-123 0.3476 32.5825');
    process.exit(1);
  }
  
  const productId = args[0];
  const latitude = parseFloat(args[1]);
  const longitude = parseFloat(args[2]);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    console.error('❌ Invalid coordinates. Latitude and longitude must be numbers.');
    process.exit(1);
  }
  
  // Validate coordinates are reasonable
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.error('❌ Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
    process.exit(1);
  }

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
    
    // Check if product exists
    const checkResult = await client.query(
      'SELECT id, title, address_line FROM products WHERE id = $1',
      [productId]
    );
    
    if (checkResult.rows.length === 0) {
      console.error(`❌ Product with ID "${productId}" not found.`);
      process.exit(1);
    }
    
    const product = checkResult.rows[0];
    console.log(`📦 Product: ${product.title || 'Untitled'}`);
    console.log(`   Address: ${product.address_line || 'N/A'}`);
    console.log('');
    
    // Update location
    console.log(`🔄 Updating location to: ${latitude}, ${longitude}`);
    
    await client.query(`
      UPDATE products 
      SET 
        location = ST_SetSRID(ST_MakePoint($2, $1), 4326),
        updated_at = NOW()
      WHERE id = $3
    `, [latitude, longitude, productId]);
    
    console.log('✅ Location updated successfully!');
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM products
      WHERE id = $1
    `, [productId]);
    
    if (verifyResult.rows.length > 0) {
      const updated = verifyResult.rows[0];
      console.log('\n📍 Verified new coordinates:');
      console.log(`   Latitude: ${updated.latitude}`);
      console.log(`   Longitude: ${updated.longitude}`);
    }
    
    console.log('\n💡 The product will now appear at the correct location on the map!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done');
    process.exit(0);
  }
}

fixProductLocation();
