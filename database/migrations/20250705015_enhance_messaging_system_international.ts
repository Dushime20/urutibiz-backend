import { Knex } from 'knex';

/**
 * Migration: Enhance messaging system to international e-commerce standards
 * 
 * Adds features found in platforms like Airbnb, Booking.com, Amazon:
 * - Message status tracking (sending, sent, delivered, read, failed)
 * - Read receipts with timestamps
 * - Typing indicators
 * - File attachments
 * - Message reactions
 * - Conversation context (product_id, booking_id)
 * - Blocked users
 * - Message search capabilities
 * - Message translations
 * - Delivery receipts
 */
export async function up(knex: Knex): Promise<void> {
  // Enhance chats table
  const hasChatsTable = await knex.schema.hasTable('chats');
  if (hasChatsTable) {
    // Add conversation context fields
    const hasProductId = await knex.schema.hasColumn('chats', 'product_id');
    if (!hasProductId) {
      const hasProductsTable = await knex.schema.hasTable('products');
      const hasBookingsTable = await knex.schema.hasTable('bookings');
      const hasUsersTable = await knex.schema.hasTable('users');
      
      await knex.schema.alterTable('chats', (table) => {
        if (hasProductsTable) {
          table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
        } else {
          table.uuid('product_id');
        }
        if (hasBookingsTable) {
          table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
        } else {
          table.uuid('booking_id');
        }
        table.string('subject', 255);
        table.string('last_message_preview', 500);
        table.timestamp('last_message_at', { useTz: true });
        table.integer('unread_count_user_1').defaultTo(0);
        table.integer('unread_count_user_2').defaultTo(0);
        table.boolean('is_archived_user_1').defaultTo(false);
        table.boolean('is_archived_user_2').defaultTo(false);
        table.boolean('is_blocked').defaultTo(false);
        if (hasUsersTable) {
          table.uuid('blocked_by').references('id').inTable('users').onDelete('SET NULL');
        } else {
          table.uuid('blocked_by');
        }
        table.timestamp('blocked_at', { useTz: true });
      });
      
      // Add indexes
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC)`);
      console.log('✅ Enhanced chats table with conversation context');
    }
  }

  // Enhance messages table
  const hasMessagesTable = await knex.schema.hasTable('messages');
  if (hasMessagesTable) {
    // Check if columns already exist
    const hasMessageStatus = await knex.schema.hasColumn('messages', 'message_status');
    
    if (!hasMessageStatus) {
      await knex.schema.alterTable('messages', (table) => {
        // Message status: sending, sent, delivered, read, failed
        table.string('message_status', 20).defaultTo('sent').comment('sending, sent, delivered, read, failed');
        
        // Read receipts
        table.timestamp('delivered_at', { useTz: true });
        table.timestamp('read_at', { useTz: true });
        table.uuid('read_by');
        
        // File attachments
        table.jsonb('attachments').comment('Array of file attachments: {url, type, name, size}');
        
        // Message reactions
        table.jsonb('reactions').comment('Array of reactions: {user_id, emoji, created_at}');
        
        // Message editing
        table.text('edited_content');
        table.timestamp('edited_at', { useTz: true });
        table.boolean('is_edited').defaultTo(false);
        
        // Message deletion
        table.boolean('is_deleted').defaultTo(false);
        table.timestamp('deleted_at', { useTz: true });
        table.uuid('deleted_by');
        
        // Message translation
        table.jsonb('translations').comment('Translations: {language_code: translated_content}');
        table.string('original_language', 10).defaultTo('en');
        
        // Reply to message (will add FK later if messages table exists)
        table.uuid('reply_to_message_id');
        
        // Forwarded message
        table.boolean('is_forwarded').defaultTo(false);
        table.uuid('forwarded_from_chat_id');
        table.uuid('forwarded_from_message_id');
        
        // Message priority
        table.string('priority', 20).defaultTo('normal').comment('low, normal, high, urgent');
        
        // Full-text search
        table.specificType('search_vector', 'tsvector');
      });
      
      // Add indexes
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(message_status)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted)`);
      await knex.raw(`CREATE INDEX IF NOT EXISTS idx_messages_search_vector ON messages USING gin(search_vector)`);
      
      // Create trigger for search vector update
      await knex.raw(`
        CREATE OR REPLACE FUNCTION messages_search_vector_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.edited_content, '')), 'B');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      await knex.raw(`
        DROP TRIGGER IF EXISTS messages_search_vector_trigger ON messages;
        CREATE TRIGGER messages_search_vector_trigger
        BEFORE INSERT OR UPDATE ON messages
        FOR EACH ROW EXECUTE FUNCTION messages_search_vector_update();
      `);
      
      console.log('✅ Enhanced messages table with international features');
    }
  }

  // Create typing_indicators table
  const hasTypingIndicators = await knex.schema.hasTable('typing_indicators');
  const hasUsersTableForTyping = await knex.schema.hasTable('users');
  
  if (!hasTypingIndicators && hasChatsTable && hasUsersTableForTyping) {
    await knex.schema.createTable('typing_indicators', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('started_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('expires_at', { useTz: true }).notNullable();
      
      table.index(['chat_id', 'user_id']);
      table.index(['expires_at']);
      
      // Unique constraint: one typing indicator per user per chat
      table.unique(['chat_id', 'user_id']);
    });
    console.log('✅ Created typing_indicators table');
  } else if (!hasChatsTable || !hasUsersTableForTyping) {
    
  }

  // Create message_attachments table for better file management
  const hasMessageAttachments = await knex.schema.hasTable('message_attachments');
  
  if (!hasMessageAttachments && hasMessagesTable) {
    await knex.schema.createTable('message_attachments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
      table.string('file_name', 255).notNullable();
      table.string('file_type', 100).notNullable();
      table.string('mime_type', 100);
      table.bigInteger('file_size').notNullable().comment('Size in bytes');
      table.text('file_url').notNullable();
      table.text('thumbnail_url');
      table.string('storage_provider', 50).defaultTo('local').comment('local, s3, cloudinary, etc.');
      table.jsonb('metadata').comment('Additional file metadata');
      table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
      
      table.index(['message_id']);
      table.index(['file_type']);
    });
    console.log('✅ Created message_attachments table');
  } else if (!hasMessagesTable) {
    
  }

  // Create blocked_users table
  const hasBlockedUsers = await knex.schema.hasTable('blocked_users');
  const hasUsersTableForBlocked = await knex.schema.hasTable('users');
  
  if (!hasBlockedUsers && hasUsersTableForBlocked) {
    await knex.schema.createTable('blocked_users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('blocker_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('blocked_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('reason');
      table.timestamp('blocked_at', { useTz: true }).defaultTo(knex.fn.now());
      
      table.index(['blocker_id']);
      table.index(['blocked_id']);
      
      // Unique constraint: prevent duplicate blocks
      table.unique(['blocker_id', 'blocked_id']);
    });
    console.log('✅ Created blocked_users table');
  } else if (!hasUsersTableForBlocked) {
    
  }

  // Create conversation_participants table for better participant management
  const hasConversationParticipants = await knex.schema.hasTable('conversation_participants');
  const hasChatsTableForParticipants = await knex.schema.hasTable('chats');
  const hasUsersTableForParticipants = await knex.schema.hasTable('users');
  
  if (!hasConversationParticipants && hasChatsTableForParticipants && hasUsersTableForParticipants) {
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
    console.log('✅ Created conversation_participants table');
  } else if (!hasChatsTableForParticipants || !hasUsersTableForParticipants) {
    
  }

  console.log('✅ International messaging system enhancement completed');
}

export async function down(knex: Knex): Promise<void> {
  // Drop new tables
  await knex.schema.dropTableIfExists('conversation_participants');
  await knex.schema.dropTableIfExists('blocked_users');
  await knex.schema.dropTableIfExists('message_attachments');
  await knex.schema.dropTableIfExists('typing_indicators');
  
  // Drop trigger and function
  await knex.raw(`DROP TRIGGER IF EXISTS messages_search_vector_trigger ON messages`);
  await knex.raw(`DROP FUNCTION IF EXISTS messages_search_vector_update()`);
  
  // Remove columns from messages table (if exists)
  const hasMessagesTable = await knex.schema.hasTable('messages');
  if (hasMessagesTable) {
    const columnsToRemove = [
      'priority', 'is_forwarded', 'forwarded_from_message_id', 'forwarded_from_chat_id',
      'reply_to_message_id', 'original_language', 'translations', 'deleted_by',
      'deleted_at', 'is_deleted', 'edited_at', 'is_edited', 'edited_content',
      'reactions', 'attachments', 'read_by', 'read_at', 'delivered_at', 'message_status',
      'search_vector'
    ];
    
    for (const column of columnsToRemove) {
      const hasColumn = await knex.schema.hasColumn('messages', column);
      if (hasColumn) {
        await knex.schema.alterTable('messages', (table) => {
          table.dropColumn(column);
        });
      }
    }
  }
  
  // Remove columns from chats table (if exists)
  const hasChatsTable = await knex.schema.hasTable('chats');
  if (hasChatsTable) {
    const columnsToRemove = [
      'blocked_at', 'blocked_by', 'is_blocked', 'is_archived_user_2', 'is_archived_user_1',
      'unread_count_user_2', 'unread_count_user_1', 'last_message_at', 'last_message_preview',
      'subject', 'booking_id', 'product_id'
    ];
    
    for (const column of columnsToRemove) {
      const hasColumn = await knex.schema.hasColumn('chats', column);
      if (hasColumn) {
        await knex.schema.alterTable('chats', (table) => {
          table.dropColumn(column);
        });
      }
    }
  }
  
  console.log('✅ Rolled back international messaging system enhancements');
}

