/**
 * Fix migration table to remove references to non-existent migration files
 */

require('dotenv').config();
const { getDatabase, connectDatabase } = require('./dist/config/database');

async function fixMigrations() {
  try {
    console.log('🔧 Fixing migrations table...\n');
    
    await connectDatabase();
    const db = getDatabase();
    
    // Check current migrations
    const migrations = await db('knex_migrations').select('*').orderBy('id', 'desc');
    
    console.log(`📊 Found ${migrations.length} migration records\n`);
    
    // Find problematic migrations
    const problematic = migrations.filter(m => 
      m.name.includes('20250129_update_users_global_address_fields') ||
      m.name.includes('20250129_update_user_verifications_global_address_fields')
    );
    
    if (problematic.length === 0) {
      console.log('✅ No problematic migrations found!');
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${problematic.length} problematic migration(s):\n`);
    problematic.forEach(m => {
      console.log(`   - ${m.name}`);
    });
    
    console.log('\n🗑️  Removing problematic migration records...\n');
    
    for (const m of problematic) {
      await db('knex_migrations').where('id', m.id).del();
      console.log(`   ✅ Removed: ${m.name}`);
    }
    
    console.log('\n✅ Migration table fixed!');
    console.log('\n💡 Now run: npm run db:migrate');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMigrations();
