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
    const hasLastMessagePreview = await knex.schema.hasColumn('chats', 'last_message_preview');
    const hasLastMessageAt = await knex.schema.hasColumn('chats', 'last_message_at');
    const hasUnreadCountUser1 = await knex.schema.hasColumn('chats', 'unread_count_user_1');
    const hasUnreadCountUser2 = await knex.schema.hasColumn('chats', 'unread_count_user_2');
    const hasIsArchivedUser1 = await knex.schema.hasColumn('chats', 'is_archived_user_1');
    const hasIsArchivedUser2 = await knex.schema.hasColumn('chats', 'is_archived_user_2');
    const hasIsBlocked = await knex.schema.hasColumn('chats', 'is_blocked');
    const hasBlockedBy = await knex.schema.hasColumn('chats', 'blocked_by');
    const hasBlockedAt = await knex.schema.hasColumn('chats', 'blocked_at');
    
    console.log('Current state:');
    console.log(`  booking_id: ${hasBookingId ? '✅ exists' : '❌ missing'}`);
    console.log(`  product_id: ${hasProductId ? '✅ exists' : '❌ missing'}`);
    console.log(`  subject: ${hasSubject ? '✅ exists' : '❌ missing'}`);
    console.log(`  last_message_preview: ${hasLastMessagePreview ? '✅ exists' : '❌ missing'}`);
    console.log(`  last_message_at: ${hasLastMessageAt ? '✅ exists' : '❌ missing'}\n`);
    
    const allExist = hasBookingId && hasProductId && hasSubject && hasLastMessagePreview && hasLastMessageAt;
    if (allExist) {
      console.log('✅ All required columns already exist! No action needed.');
      return;
    }
    
    console.log('🔧 Adding missing columns...\n');
    
    // Check if related tables exist for foreign keys
    const hasProductsTable = await knex.schema.hasTable('products');
    const hasBookingsTable = await knex.schema.hasTable('bookings');
    const hasUsersTable = await knex.schema.hasTable('users');
    
    // Add all missing columns in one alterTable call
    await knex.schema.alterTable('chats', (table) => {
      if (!hasProductId) {
        if (hasProductsTable) {
          table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
        } else {
          table.uuid('product_id');
        }
      }
      if (!hasBookingId) {
        if (hasBookingsTable) {
          table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
        } else {
          table.uuid('booking_id');
        }
      }
      if (!hasSubject) {
        table.string('subject', 255);
      }
      if (!hasLastMessagePreview) {
        table.string('last_message_preview', 500);
      }
      if (!hasLastMessageAt) {
        table.timestamp('last_message_at', { useTz: true });
      }
      if (!hasUnreadCountUser1) {
        table.integer('unread_count_user_1').defaultTo(0);
      }
      if (!hasUnreadCountUser2) {
        table.integer('unread_count_user_2').defaultTo(0);
      }
      if (!hasIsArchivedUser1) {
        table.boolean('is_archived_user_1').defaultTo(false);
      }
      if (!hasIsArchivedUser2) {
        table.boolean('is_archived_user_2').defaultTo(false);
      }
      if (!hasIsBlocked) {
        table.boolean('is_blocked').defaultTo(false);
      }
      if (!hasBlockedBy) {
        if (hasUsersTable) {
          table.uuid('blocked_by').references('id').inTable('users').onDelete('SET NULL');
        } else {
          table.uuid('blocked_by');
        }
      }
      if (!hasBlockedAt) {
        table.timestamp('blocked_at', { useTz: true });
      }
    });
    
    console.log('✅ All missing columns added');
    
    // Create indexes
    console.log('\n🔧 Creating indexes...');
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC)');
      console.log('✅ Indexes created');
    } catch (e) {
      console.log('⚠️  Some indexes may already exist');
    }
    
    // Verify
    console.log('\n🔍 Verifying columns...');
    const finalHasBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const finalHasProductId = await knex.schema.hasColumn('chats', 'product_id');
    const finalHasSubject = await knex.schema.hasColumn('chats', 'subject');
    const finalHasLastMessagePreview = await knex.schema.hasColumn('chats', 'last_message_preview');
    const finalHasLastMessageAt = await knex.schema.hasColumn('chats', 'last_message_at');
    
    console.log('\nFinal state:');
    console.log(`  booking_id: ${finalHasBookingId ? '✅ exists' : '❌ missing'}`);
    console.log(`  product_id: ${finalHasProductId ? '✅ exists' : '❌ missing'}`);
    console.log(`  subject: ${finalHasSubject ? '✅ exists' : '❌ missing'}`);
    console.log(`  last_message_preview: ${finalHasLastMessagePreview ? '✅ exists' : '❌ missing'}`);
    console.log(`  last_message_at: ${finalHasLastMessageAt ? '✅ exists' : '❌ missing'}`);
    
    if (finalHasBookingId && finalHasProductId && finalHasSubject && finalHasLastMessagePreview && finalHasLastMessageAt) {
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

