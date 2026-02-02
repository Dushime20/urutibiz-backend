const { getDatabase } = require('./dist/config/database');

async function updateExpirationHours() {
  try {
    console.log('🔄 Updating booking expiration hours from 4 to 2...');
    
    const knex = getDatabase();
    
    // Update the setting
    const result = await knex('system_settings')
      .where('key', 'booking_expiration_hours')
      .where('category', 'booking')
      .update({
        value: '2',
        updated_at: knex.fn.now()
      });
    
    if (result > 0) {
      console.log('✅ Successfully updated booking expiration to 2 hours');
      
      // Verify the update
      const setting = await knex('system_settings')
        .select('key', 'value', 'category', 'description', 'updated_at')
        .where('key', 'booking_expiration_hours')
        .where('category', 'booking')
        .first();
      
      console.log('\n📋 Current setting:');
      console.log(JSON.stringify(setting, null, 2));
    } else {
      console.log('⚠️  No rows updated. Setting might not exist yet.');
      console.log('💡 This is normal if you haven\'t run migrations yet.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating expiration hours:', error.message);
    process.exit(1);
  }
}

updateExpirationHours();
