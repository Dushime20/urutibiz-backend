/**
 * Test script to verify connection to Ubuntu PostgreSQL with pgvector
 * 
 * Usage:
 *   node scripts/test-ubuntu-pgvector-connection.js
 * 
 * Make sure your .env file has the correct Ubuntu PostgreSQL connection details
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// We need to use TypeScript compilation or ts-node for this
// For now, let's use a direct connection approach
const knex = require('knex');

async function testConnection() {
  console.log('\n🔍 Testing Ubuntu PostgreSQL Connection with pgvector...\n');
  
  // Display connection details (mask password)
  console.log('📊 Connection Details:');
  console.log(`   Host: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`   Port: ${process.env.DB_PORT || 'NOT SET'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`   User: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);
  console.log(`   SSL: ${process.env.DB_SSL || 'false'}\n`);

  let db = null;
  let exitCode = 0;
  try {
    // Create database connection
    db = knex({
      client: 'postgresql',
      connection: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    });
    
    // Test 1: Basic connection
    console.log('✅ Test 1: Basic Connection...');
    const result = await db.raw('SELECT version(), NOW() as current_time');
    console.log(`   ✓ Connected successfully!`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(',')[0]}`);
    console.log(`   Server Time: ${result.rows[0].current_time}\n`);

    // Test 2: Check pgvector extension
    console.log('✅ Test 2: pgvector Extension...');
    const vectorCheck = await db.raw(`
      SELECT 
        extname, 
        extversion,
        CASE 
          WHEN extname = 'vector' THEN '✓ pgvector is installed'
          ELSE '✗ pgvector not found'
        END as status
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    
    if (vectorCheck.rows.length > 0) {
      console.log(`   ✓ pgvector extension found!`);
      console.log(`   Version: ${vectorCheck.rows[0].extversion}`);
    } else {
      console.log(`   ⚠️  pgvector extension NOT found`);
      console.log(`   Run: CREATE EXTENSION vector; in your database\n`);
    }

    // Test 3: Test vector operations
    if (vectorCheck.rows.length > 0) {
      console.log('✅ Test 3: Vector Operations...');
      try {
        const vectorTest = await db.raw("SELECT '[1,2,3]'::vector as test_vector");
        console.log(`   ✓ Vector operations working!`);
        console.log(`   Test vector: ${vectorTest.rows[0].test_vector}\n`);
      } catch (vectorError) {
        console.log(`   ✗ Vector operations failed: ${vectorError.message}\n`);
      }
    }

    // Test 4: Check product_images table and image_embedding column
    console.log('✅ Test 4: Database Schema (product_images table)...');
    try {
      const tableCheck = await db.raw(`
        SELECT 
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_embedding'
      `);
      
      if (tableCheck.rows.length > 0) {
        const col = tableCheck.rows[0];
        console.log(`   ✓ product_images.image_embedding column found`);
        console.log(`   Data Type: ${col.data_type}`);
        console.log(`   UDT Name: ${col.udt_name}`);
        
        if (col.udt_name === 'vector') {
          console.log(`   ✓ Column is vector type (pgvector ready!)\n`);
        } else {
          console.log(`   ⚠️  Column is ${col.udt_name}, not vector type`);
          console.log(`   Run migrations: npm run db:migrate\n`);
        }
      } else {
        console.log(`   ⚠️  product_images table or image_embedding column not found`);
        console.log(`   Run migrations: npm run db:migrate\n`);
      }
    } catch (schemaError) {
      console.log(`   ⚠️  Could not check schema: ${schemaError.message}\n`);
    }

    // Test 5: Check for vector index
    console.log('✅ Test 5: Vector Index...');
    try {
      const indexCheck = await db.raw(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'product_images' 
        AND indexname LIKE '%embedding%'
      `);
      
      if (indexCheck.rows.length > 0) {
        console.log(`   ✓ Vector index found: ${indexCheck.rows[0].indexname}`);
        console.log(`   This will speed up image similarity searches!\n`);
      } else {
        console.log(`   ⚠️  No vector index found on image_embedding`);
        console.log(`   Run migrations: npm run db:migrate\n`);
      }
    } catch (indexError) {
      console.log(`   ⚠️  Could not check indexes: ${indexError.message}\n`);
    }

    // Test 6: Count images with embeddings
    console.log('✅ Test 6: Image Embeddings Count...');
    try {
      const countResult = await db.raw(`
        SELECT 
          COUNT(*) as total_images,
          COUNT(image_embedding) as images_with_embeddings
        FROM product_images
      `);
      
      const stats = countResult.rows[0];
      console.log(`   Total images: ${stats.total_images}`);
      console.log(`   Images with embeddings: ${stats.images_with_embeddings}`);
      
      if (stats.images_with_embeddings > 0) {
        console.log(`   ✓ You have ${stats.images_with_embeddings} images ready for vector search!\n`);
      } else {
        console.log(`   ⚠️  No images have embeddings yet`);
        console.log(`   Embeddings will be generated when you upload/search images\n`);
      }
    } catch (countError) {
      console.log(`   ⚠️  Could not count images: ${countError.message}\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Connection Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 Next Steps:');
    console.log('   1. If pgvector is not installed, enable it: CREATE EXTENSION vector;');
    console.log('   2. Run migrations: npm run db:migrate');
    console.log('   3. Start your server: npm run dev');
    console.log('   4. Test image search functionality\n');
  } catch (error) {
    console.error('\n❌ Connection Test Failed!\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check if PostgreSQL is running on Ubuntu');
      console.error('   2. Verify DB_HOST and DB_PORT in .env file');
      console.error('   3. Check Ubuntu firewall: sudo ufw allow 5432/tcp');
      console.error('   4. Verify pg_hba.conf allows your IP address');
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify DB_USER and DB_PASSWORD in .env file');
      console.error('   2. Check pg_hba.conf authentication method');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify DB_NAME in .env file');
      console.error('   2. Create database if it does not exist');
    }
    
    console.error('\n📖 See docs/UBUNTU_PGVECTOR_CONNECTION_SETUP.md for detailed setup guide\n');
    exitCode = 1;
  } finally {
    // Ensure connection is closed
    if (db) {
      try {
        await db.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    process.exit(exitCode);
  }
}

// Run the test
testConnection().catch(console.error);

