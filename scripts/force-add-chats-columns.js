/**
 * Force add missing columns to chats table (even if migration says it's done)
 * Run: node scripts/force-add-chats-columns.js
 */

let getDatabase, connectDatabase, closeDatabase;
try {
  const dbModule = require('../dist/config/database');
  getDatabase = dbModule.getDatabase;
  connectDatabase = dbModule.connectDatabase;
  closeDatabase = dbModule.closeDatabase;
} catch (e) {
  try {
    const dbModule = require('../src/config/database');
    getDatabase = dbModule.getDatabase;
    connectDatabase = dbModule.connectDatabase;
    closeDatabase = dbModule.closeDatabase;
  } catch (e2) {
    console.error('❌ Could not load database module.');
    process.exit(1);
  }
}

async function forceAddColumns() {
  console.log('🔄 Connecting to database...');
  await connectDatabase();
  console.log('✅ Database connected!\n');
  
  const knex = getDatabase();
  
  try {
    console.log('🔍 Checking current state...\n');
    
    // Check if table exists
    const tableExists = await knex.schema.hasTable('chats');
    if (!tableExists) {
      console.log('❌ Table "chats" does not exist!');
      process.exit(1);
    }
    
    // Check current columns
    const hasBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const hasProductId = await knex.schema.hasColumn('chats', 'product_id');
    const hasSubject = await knex.schema.hasColumn('chats', 'subject');
    
    console.log('Current state:');
    console.log(`  booking_id: ${hasBookingId ? '✅ exists' : '❌ missing'}`);
    console.log(`  product_id: ${hasProductId ? '✅ exists' : '❌ missing'}`);
    console.log(`  subject: ${hasSubject ? '✅ exists' : '❌ missing'}\n`);
    
    if (hasBookingId && hasProductId && hasSubject) {
      console.log('✅ All columns already exist! No action needed.');
      return;
    }
    
    console.log('🔧 Adding missing columns...\n');
    
    // Check if related tables exist for foreign keys
    const hasProductsTable = await knex.schema.hasTable('products');
    const hasBookingsTable = await knex.schema.hasTable('bookings');
    
    // Add columns one by one
    if (!hasProductId) {
      console.log('Adding product_id column...');
      await knex.schema.alterTable('chats', (table) => {
        if (hasProductsTable) {
          table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
        } else {
          table.uuid('product_id');
        }
      });
      console.log('✅ product_id added');
    }
    
    if (!hasBookingId) {
      console.log('Adding booking_id column...');
      await knex.schema.alterTable('chats', (table) => {
        if (hasBookingsTable) {
          table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
        } else {
          table.uuid('booking_id');
        }
      });
      console.log('✅ booking_id added');
    }
    
    if (!hasSubject) {
      console.log('Adding subject column...');
      await knex.schema.alterTable('chats', (table) => {
        table.string('subject', 255);
      });
      console.log('✅ subject added');
    }
    
    // Create indexes
    console.log('\n🔧 Creating indexes...');
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id)');
      console.log('✅ Index on product_id created');
    } catch (e) {
      console.log('⚠️  Index on product_id already exists or failed');
    }
    
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id)');
      console.log('✅ Index on booking_id created');
    } catch (e) {
      console.log('⚠️  Index on booking_id already exists or failed');
    }
    
    // Verify
    console.log('\n🔍 Verifying columns...');
    const finalHasBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const finalHasProductId = await knex.schema.hasColumn('chats', 'product_id');
    const finalHasSubject = await knex.schema.hasColumn('chats', 'subject');
    
    console.log('\nFinal state:');
    console.log(`  booking_id: ${finalHasBookingId ? '✅ exists' : '❌ missing'}`);
    console.log(`  product_id: ${finalHasProductId ? '✅ exists' : '❌ missing'}`);
    console.log(`  subject: ${finalHasSubject ? '✅ exists' : '❌ missing'}`);
    
    if (finalHasBookingId && finalHasProductId && finalHasSubject) {
      console.log('\n✅ All columns successfully added!');
    } else {
      console.log('\n⚠️  Some columns are still missing. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (closeDatabase) {
      await closeDatabase();
    } else {
      await knex.destroy();
    }
  }
}

forceAddColumns();

