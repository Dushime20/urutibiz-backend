/**
 * Check which migrations have been run
 * Run: node scripts/check-migration-status.js
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

async function checkMigrationStatus() {
  console.log('🔄 Connecting to database...');
  await connectDatabase();
  console.log('✅ Database connected!\n');
  
  const knex = getDatabase();
  
  try {
    // Check if migrations table exists
    const hasMigrationsTable = await knex.schema.hasTable('knex_migrations');
    if (!hasMigrationsTable) {
      console.log('❌ knex_migrations table does not exist!');
      console.log('   This means no migrations have been run yet.');
      process.exit(1);
    }
    
    console.log('📋 Checking migration status...\n');
    
    // Get all migrations
    const migrations = await knex('knex_migrations')
      .orderBy('id', 'asc')
      .select('*');
    
    console.log(`Found ${migrations.length} migrations in database:\n`);
    
    migrations.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.name}`);
      console.log(`   Batch: ${migration.batch}`);
      console.log(`   Run at: ${migration.migration_time || 'N/A'}\n`);
    });
    
    // Check for the specific migration
    const messagingMigration = migrations.find(m => 
      m.name.includes('enhance_messaging_system_international') ||
      m.name.includes('20250125')
    );
    
    if (messagingMigration) {
      console.log('✅ Migration "20250125_enhance_messaging_system_international" has been run');
      console.log(`   Batch: ${messagingMigration.batch}`);
      console.log(`   But columns are missing! This means the migration failed or was incomplete.\n`);
      console.log('💡 Solution: Run the SQL fix script:');
      console.log('   psql -U postgres -d urutibiz_db -f scripts/fix-chats-booking-id.sql');
    } else {
      console.log('❌ Migration "20250125_enhance_messaging_system_international" has NOT been run');
      console.log('💡 Solution: Run the migration:');
      console.log('   npm run db:migrate');
    }
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
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

checkMigrationStatus();

