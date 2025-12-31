/**
 * TypeScript version - check if booking_id and product_id columns exist in chats table
 * Run: npx ts-node scripts/check-chats-columns.ts
 */

import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database';

async function checkChatsColumns() {
  // Initialize database connection first
  console.log('🔄 Connecting to database...');
  await connectDatabase();
  console.log('✅ Database connected!\n');
  
  const knex = getDatabase();
  
  try {
    console.log('🔍 Checking chats table structure...\n');
    
    // Check if table exists
    const tableExists = await knex.schema.hasTable('chats');
    if (!tableExists) {
      console.log('❌ Table "chats" does not exist!');
      process.exit(1);
    }
    console.log('✅ Table "chats" exists');
    
    // Check for booking_id column
    const hasBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    console.log(hasBookingId ? '✅ Column "booking_id" exists' : '❌ Column "booking_id" does NOT exist');
    
    // Check for product_id column
    const hasProductId = await knex.schema.hasColumn('chats', 'product_id');
    console.log(hasProductId ? '✅ Column "product_id" exists' : '❌ Column "product_id" does NOT exist');
    
    // Check for subject column
    const hasSubject = await knex.schema.hasColumn('chats', 'subject');
    console.log(hasSubject ? '✅ Column "subject" exists' : '❌ Column "subject" does NOT exist');
    
    // Get all columns in chats table
    console.log('\n📋 All columns in chats table:');
    const columns = await knex('chats').columnInfo();
    Object.keys(columns).forEach(col => {
      console.log(`  - ${col} (${columns[col].type})`);
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (!hasBookingId || !hasProductId || !hasSubject) {
      console.log('⚠️  Missing columns detected. Run the migration:');
      console.log('   npm run db:migrate');
      console.log('   or');
      console.log('   npx knex migrate:latest');
      console.log('\n   Or run the SQL fix script:');
      console.log('   psql -U your_user -d your_database -f scripts/fix-chats-booking-id.sql');
    } else {
      console.log('✅ All required columns exist. No action needed.');
    }
    
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

checkChatsColumns();

