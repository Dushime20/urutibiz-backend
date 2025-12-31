/**
 * Fix missing messaging tables and columns
 * Creates conversation_participants table and adds is_deleted column to messages
 * Run: node scripts/fix-messaging-tables.js
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

async function fixMessagingTables() {
  console.log('🔄 Connecting to database...');
  await connectDatabase();
  console.log('✅ Database connected!\n');
  
  const knex = getDatabase();
  
  try {
    console.log('🔍 Checking messaging tables and columns...\n');
    
    // Check if required tables exist
    const hasChatsTable = await knex.schema.hasTable('chats');
    const hasMessagesTable = await knex.schema.hasTable('messages');
    const hasUsersTable = await knex.schema.hasTable('users');
    const hasConversationParticipants = await knex.schema.hasTable('conversation_participants');
    
    console.log('Current state:');
    console.log(`  chats table: ${hasChatsTable ? '✅' : '❌'}`);
    console.log(`  messages table: ${hasMessagesTable ? '✅' : '❌'}`);
    console.log(`  users table: ${hasUsersTable ? '✅' : '❌'}`);
    console.log(`  conversation_participants table: ${hasConversationParticipants ? '✅' : '❌'}\n`);
    
    if (!hasChatsTable || !hasMessagesTable || !hasUsersTable) {
      console.log('❌ Required tables (chats, messages, users) must exist first!');
      console.log('   Please run the base migrations first.');
      process.exit(1);
    }
    
    // Fix 0: Add missing columns to chats table
    console.log('🔧 Checking chats table columns...');
    const hasChatsBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const hasChatsProductId = await knex.schema.hasColumn('chats', 'product_id');
    const hasChatsSubject = await knex.schema.hasColumn('chats', 'subject');
    const hasLastMessagePreview = await knex.schema.hasColumn('chats', 'last_message_preview');
    const hasLastMessageAt = await knex.schema.hasColumn('chats', 'last_message_at');
    const hasUnreadCountUser1 = await knex.schema.hasColumn('chats', 'unread_count_user_1');
    const hasUnreadCountUser2 = await knex.schema.hasColumn('chats', 'unread_count_user_2');
    const hasIsArchivedUser1 = await knex.schema.hasColumn('chats', 'is_archived_user_1');
    const hasIsArchivedUser2 = await knex.schema.hasColumn('chats', 'is_archived_user_2');
    const hasIsBlocked = await knex.schema.hasColumn('chats', 'is_blocked');
    const hasBlockedBy = await knex.schema.hasColumn('chats', 'blocked_by');
    const hasBlockedAt = await knex.schema.hasColumn('chats', 'blocked_at');
    
    const missingChatsColumns = [];
    if (!hasChatsProductId) missingChatsColumns.push('product_id');
    if (!hasChatsBookingId) missingChatsColumns.push('booking_id');
    if (!hasChatsSubject) missingChatsColumns.push('subject');
    if (!hasLastMessagePreview) missingChatsColumns.push('last_message_preview');
    if (!hasLastMessageAt) missingChatsColumns.push('last_message_at');
    if (!hasUnreadCountUser1) missingChatsColumns.push('unread_count_user_1');
    if (!hasUnreadCountUser2) missingChatsColumns.push('unread_count_user_2');
    if (!hasIsArchivedUser1) missingChatsColumns.push('is_archived_user_1');
    if (!hasIsArchivedUser2) missingChatsColumns.push('is_archived_user_2');
    if (!hasIsBlocked) missingChatsColumns.push('is_blocked');
    if (!hasBlockedBy) missingChatsColumns.push('blocked_by');
    if (!hasBlockedAt) missingChatsColumns.push('blocked_at');
    
    if (missingChatsColumns.length > 0) {
      console.log(`   Adding ${missingChatsColumns.length} missing columns to chats table...`);
      console.log(`   Missing: ${missingChatsColumns.join(', ')}\n`);
      const hasProductsTable = await knex.schema.hasTable('products');
      const hasBookingsTable = await knex.schema.hasTable('bookings');
      
      await knex.schema.alterTable('chats', (table) => {
        if (missingChatsColumns.includes('product_id')) {
          if (hasProductsTable) {
            table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
          } else {
            table.uuid('product_id');
          }
        }
        if (missingChatsColumns.includes('booking_id')) {
          if (hasBookingsTable) {
            table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
          } else {
            table.uuid('booking_id');
          }
        }
        if (missingChatsColumns.includes('subject')) {
          table.string('subject', 255);
        }
        if (missingChatsColumns.includes('last_message_preview')) {
          table.string('last_message_preview', 500);
        }
        if (missingChatsColumns.includes('last_message_at')) {
          table.timestamp('last_message_at', { useTz: true });
        }
        if (missingChatsColumns.includes('unread_count_user_1')) {
          table.integer('unread_count_user_1').defaultTo(0);
        }
        if (missingChatsColumns.includes('unread_count_user_2')) {
          table.integer('unread_count_user_2').defaultTo(0);
        }
        if (missingChatsColumns.includes('is_archived_user_1')) {
          table.boolean('is_archived_user_1').defaultTo(false);
        }
        if (missingChatsColumns.includes('is_archived_user_2')) {
          table.boolean('is_archived_user_2').defaultTo(false);
        }
        if (missingChatsColumns.includes('is_blocked')) {
          table.boolean('is_blocked').defaultTo(false);
        }
        if (missingChatsColumns.includes('blocked_by')) {
          if (hasUsersTable) {
            table.uuid('blocked_by').references('id').inTable('users').onDelete('SET NULL');
          } else {
            table.uuid('blocked_by');
          }
        }
        if (missingChatsColumns.includes('blocked_at')) {
          table.timestamp('blocked_at', { useTz: true });
        }
      });
      
      // Create indexes
      try {
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC)');
      } catch (e) {
        // Indexes may already exist
      }
      console.log('✅ Chats table columns added\n');
    } else {
      console.log('✅ Chats table columns already exist\n');
    }
    
    // Fix 1: Create conversation_participants table
    if (!hasConversationParticipants) {
      console.log('🔧 Creating conversation_participants table...');
      await knex.schema.createTable('conversation_participants', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('unread_count').defaultTo(0);
        table.timestamp('last_read_at', { useTz: true });
        table.boolean('is_archived').defaultTo(false);
        table.timestamp('archived_at', { useTz: true });
        table.boolean('is_muted').defaultTo(false);
        table.timestamp('muted_until', { useTz: true });
        table.timestamp('joined_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('left_at', { useTz: true });
        
        table.index(['chat_id']);
        table.index(['user_id']);
        table.index(['is_archived']);
        
        // Unique constraint: one participant record per user per chat
        table.unique(['chat_id', 'user_id']);
      });
      console.log('✅ conversation_participants table created\n');
    } else {
      console.log('✅ conversation_participants table already exists\n');
    }
    
    // Fix 2: Add is_deleted and other missing columns to messages table
    const hasIsDeleted = await knex.schema.hasColumn('messages', 'is_deleted');
    const hasMessageStatus = await knex.schema.hasColumn('messages', 'message_status');
    
    console.log('Checking messages table columns:');
    console.log(`  is_deleted: ${hasIsDeleted ? '✅' : '❌'}`);
    console.log(`  message_status: ${hasMessageStatus ? '✅' : '❌'}\n`);
    
    // Check all columns first
    const columnsToCheck = [
      'message_status', 'delivered_at', 'read_at', 'read_by',
      'attachments', 'reactions', 'edited_content', 'edited_at', 'is_edited',
      'is_deleted', 'deleted_at', 'deleted_by',
      'translations', 'original_language',
      'reply_to_message_id', 'is_forwarded', 'forwarded_from_chat_id', 'forwarded_from_message_id',
      'priority'
    ];
    
    const missingColumns = [];
    for (const col of columnsToCheck) {
      const exists = await knex.schema.hasColumn('messages', col);
      if (!exists) {
        missingColumns.push(col);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log(`🔧 Adding ${missingColumns.length} missing columns to messages table...`);
      console.log(`   Missing: ${missingColumns.join(', ')}\n`);
      
      await knex.schema.alterTable('messages', (table) => {
        if (missingColumns.includes('message_status')) {
          table.string('message_status', 20).defaultTo('sent').comment('sending, sent, delivered, read, failed');
        }
        if (missingColumns.includes('delivered_at')) {
          table.timestamp('delivered_at', { useTz: true });
        }
        if (missingColumns.includes('read_at')) {
          table.timestamp('read_at', { useTz: true });
        }
        if (missingColumns.includes('read_by')) {
          table.uuid('read_by');
        }
        if (missingColumns.includes('attachments')) {
          table.jsonb('attachments').comment('Array of file attachments: {url, type, name, size}');
        }
        if (missingColumns.includes('reactions')) {
          table.jsonb('reactions').comment('Array of reactions: {user_id, emoji, created_at}');
        }
        if (missingColumns.includes('edited_content')) {
          table.text('edited_content');
        }
        if (missingColumns.includes('edited_at')) {
          table.timestamp('edited_at', { useTz: true });
        }
        if (missingColumns.includes('is_edited')) {
          table.boolean('is_edited').defaultTo(false);
        }
        if (missingColumns.includes('is_deleted')) {
          table.boolean('is_deleted').defaultTo(false);
        }
        if (missingColumns.includes('deleted_at')) {
          table.timestamp('deleted_at', { useTz: true });
        }
        if (missingColumns.includes('deleted_by')) {
          table.uuid('deleted_by');
        }
        if (missingColumns.includes('translations')) {
          table.jsonb('translations').comment('Translations: {language_code: translated_content}');
        }
        if (missingColumns.includes('original_language')) {
          table.string('original_language', 10).defaultTo('en');
        }
        if (missingColumns.includes('reply_to_message_id')) {
          table.uuid('reply_to_message_id');
        }
        if (missingColumns.includes('is_forwarded')) {
          table.boolean('is_forwarded').defaultTo(false);
        }
        if (missingColumns.includes('forwarded_from_chat_id')) {
          table.uuid('forwarded_from_chat_id');
        }
        if (missingColumns.includes('forwarded_from_message_id')) {
          table.uuid('forwarded_from_message_id');
        }
        if (missingColumns.includes('priority')) {
          table.string('priority', 20).defaultTo('normal').comment('low, normal, high, urgent');
        }
      });
      
      // Create indexes
      console.log('🔧 Creating indexes...');
      try {
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_message_status ON messages(message_status)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at)');
        console.log('✅ Indexes created');
      } catch (e) {
        console.log('⚠️  Some indexes may already exist');
      }
      
      console.log('✅ Messages table columns added\n');
    } else {
      console.log('✅ All required columns already exist in messages table\n');
    }
    
    // Verify
    console.log('🔍 Verifying fixes...\n');
    const finalHasConversationParticipants = await knex.schema.hasTable('conversation_participants');
    const finalHasIsDeleted = await knex.schema.hasColumn('messages', 'is_deleted');
    const finalHasMessageStatus = await knex.schema.hasColumn('messages', 'message_status');
    const finalHasChatsBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const finalHasChatsProductId = await knex.schema.hasColumn('chats', 'product_id');
    const finalHasChatsSubject = await knex.schema.hasColumn('chats', 'subject');
    const finalHasLastMessagePreview = await knex.schema.hasColumn('chats', 'last_message_preview');
    const finalHasLastMessageAt = await knex.schema.hasColumn('chats', 'last_message_at');
    
    console.log('Final state:');
    console.log(`  conversation_participants table: ${finalHasConversationParticipants ? '✅ exists' : '❌ missing'}`);
    console.log(`  messages.is_deleted: ${finalHasIsDeleted ? '✅ exists' : '❌ missing'}`);
    console.log(`  messages.message_status: ${finalHasMessageStatus ? '✅ exists' : '❌ missing'}`);
    console.log(`  chats.booking_id: ${finalHasChatsBookingId ? '✅ exists' : '❌ missing'}`);
    console.log(`  chats.product_id: ${finalHasChatsProductId ? '✅ exists' : '❌ missing'}`);
    console.log(`  chats.subject: ${finalHasChatsSubject ? '✅ exists' : '❌ missing'}`);
    console.log(`  chats.last_message_preview: ${finalHasLastMessagePreview ? '✅ exists' : '❌ missing'}`);
    console.log(`  chats.last_message_at: ${finalHasLastMessageAt ? '✅ exists' : '❌ missing'}`);
    
    const allFixed = finalHasConversationParticipants && 
                     finalHasIsDeleted && 
                     finalHasMessageStatus &&
                     finalHasChatsBookingId &&
                     finalHasChatsProductId &&
                     finalHasChatsSubject &&
                     finalHasLastMessagePreview &&
                     finalHasLastMessageAt;
    
    if (allFixed) {
      console.log('\n✅ All messaging tables and columns successfully fixed!');
    } else {
      console.log('\n⚠️  Some items are still missing. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing messaging tables:', error.message);
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

fixMessagingTables();

