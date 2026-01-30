/**
 * Test if messaging tables exist
 */

require('dotenv').config();
const { getDatabase, connectDatabase } = require('./dist/config/database');

async function testMessagingTables() {
  try {
    console.log('🔍 Checking messaging tables...\n');
    
    await connectDatabase();
    const db = getDatabase();
    
    const tables = [
      'chats',
      'messages',
      'conversation_participants',
      'blocked_users',
      'message_attachments'
    ];
    
    console.log('📋 Checking tables:\n');
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        const count = await db(table).count('* as count').first();
        console.log(`   ✅ ${table} - exists (${count.count} records)`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
      }
    }
    
    console.log('\n✅ Messaging tables check complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMessagingTables();
