/**
 * Manually create missing messaging tables
 */

require('dotenv').config();
const { getDatabase, connectDatabase } = require('./dist/config/database');

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing messaging tables...\n');
    
    await connectDatabase();
    const db = getDatabase();
    
    // Create conversation_participants table
    const hasConversationParticipants = await db.schema.hasTable('conversation_participants');
    
    if (!hasConversationParticipants) {
      console.log('📝 Creating conversation_participants table...');
      
      await db.schema.createTable('conversation_participants', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
        table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('unread_count').defaultTo(0);
        table.timestamp('last_read_at', { useTz: true });
        table.boolean('is_archived').defaultTo(false);
        table.timestamp('archived_at', { useTz: true });
        table.boolean('is_muted').defaultTo(false);
        table.timestamp('muted_until', { useTz: true });
        table.timestamp('joined_at', { useTz: true }).defaultTo(db.fn.now());
        table.timestamp('left_at', { useTz: true });
        
        table.index(['chat_id']);
        table.index(['user_id']);
        table.index(['is_archived']);
        
        // Unique constraint: one participant record per user per chat
        table.unique(['chat_id', 'user_id']);
      });
      
      console.log('   ✅ Created conversation_participants table');
    } else {
      console.log('   ⏭️  conversation_participants table already exists');
    }
    
    // Create message_attachments table
    const hasMessageAttachments = await db.schema.hasTable('message_attachments');
    
    if (!hasMessageAttachments) {
      console.log('📝 Creating message_attachments table...');
      
      await db.schema.createTable('message_attachments', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
        table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
        table.string('file_url').notNullable();
        table.string('file_name');
        table.string('file_type');
        table.integer('file_size');
        table.string('mime_type');
        table.timestamp('created_at', { useTz: true }).defaultTo(db.fn.now());
        
        table.index(['message_id']);
      });
      
      console.log('   ✅ Created message_attachments table');
    } else {
      console.log('   ⏭️  message_attachments table already exists');
    }
    
    console.log('\n✅ Missing messaging tables created successfully!');
    console.log('\n💡 You can now use the messaging system.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createMissingTables();
