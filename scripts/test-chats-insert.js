/**
 * Test script to verify chats insert works with or without booking_id column
 * Run: node scripts/test-chats-insert.js
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

async function testChatsInsert() {
  // Initialize database connection first
  console.log('🔄 Connecting to database...');
  await connectDatabase();
  console.log('✅ Database connected!\n');
  
  const knex = getDatabase();
  
  try {
    console.log('🧪 Testing chats insert functionality...\n');
    
    // Check if table exists
    const tableExists = await knex.schema.hasTable('chats');
    if (!tableExists) {
      console.log('❌ Table "chats" does not exist!');
      process.exit(1);
    }
    
    // Check column existence
    const hasBookingId = await knex.schema.hasColumn('chats', 'booking_id');
    const hasProductId = await knex.schema.hasColumn('chats', 'product_id');
    const hasSubject = await knex.schema.hasColumn('chats', 'subject');
    
    console.log('📊 Column Status:');
    console.log(`  booking_id: ${hasBookingId ? '✅' : '❌'}`);
    console.log(`  product_id: ${hasProductId ? '✅' : '❌'}`);
    console.log(`  subject: ${hasSubject ? '✅' : '❌'}\n`);
    
    // Test insert without optional columns
    console.log('🔹 Test 1: Insert without optional columns...');
    const testParticipants = ['test-user-1', 'test-user-2'];
    const participantIdsJson = JSON.stringify(testParticipants);
    
    const insertData = {
      participant_ids: knex.raw('?::jsonb', [participantIdsJson]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Conditionally add columns if they exist
    if (hasProductId) {
      insertData.product_id = null;
    }
    if (hasBookingId) {
      insertData.booking_id = null;
    }
    if (hasSubject) {
      insertData.subject = null;
    }
    
    try {
      const [result] = await knex('chats')
        .insert(insertData)
        .returning('*');
      
      console.log('✅ Insert successful!');
      console.log(`   Chat ID: ${result.id}`);
      
      // Clean up test data
      await knex('chats').where('id', result.id).delete();
      console.log('   Test data cleaned up\n');
    } catch (error) {
      console.error('❌ Insert failed:', error.message);
      if (error.message.includes('booking_id')) {
        console.error('\n💡 Solution: Run the migration or SQL fix script:');
        console.error('   npm run migrate:latest');
        console.error('   or');
        console.error('   psql -f scripts/fix-chats-booking-id.sql');
      }
      throw error;
    }
    
    // Test insert with optional columns (if they exist)
    if (hasBookingId || hasProductId || hasSubject) {
      console.log('🔹 Test 2: Insert with optional columns...');
      const insertDataWithOptions = {
        participant_ids: knex.raw('?::jsonb', [participantIdsJson]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      if (hasProductId) {
        insertDataWithOptions.product_id = null;
      }
      if (hasBookingId) {
        insertDataWithOptions.booking_id = null;
      }
      if (hasSubject) {
        insertDataWithOptions.subject = 'Test Subject';
      }
      
      try {
        const [result2] = await knex('chats')
          .insert(insertDataWithOptions)
          .returning('*');
        
        console.log('✅ Insert with options successful!');
        console.log(`   Chat ID: ${result2.id}`);
        
        // Clean up
        await knex('chats').where('id', result2.id).delete();
        console.log('   Test data cleaned up\n');
      } catch (error) {
        console.error('❌ Insert with options failed:', error.message);
        throw error;
      }
    }
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
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

testChatsInsert();

