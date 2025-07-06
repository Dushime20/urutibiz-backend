/**
 * Database Setup Script
 * Sets up PostgreSQL database for UrutiBiz Backend
 */

import { connectDatabase, getDatabase } from '../src/config/database';
import { getConfig } from '../src/config/config';

const config = getConfig();

async function setupDatabase() {
  console.log('🚀 Starting UrutiBiz Database Setup...\n');
  
  try {
    console.log('📋 Database Configuration:');
    console.log(`   Host: ${config.database.host}`);
    console.log(`   Port: ${config.database.port}`);
    console.log(`   Database: ${config.database.name}`);
    console.log(`   User: ${config.database.user}`);
    console.log(`   SSL: ${config.database.ssl ? 'Enabled' : 'Disabled'}\n`);

    console.log('🔄 Attempting to connect to database...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully!\n');
    
    // Test basic query
    const db = getDatabase();
    const result = await db.raw('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('📊 Database Information:');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].pg_version}\n`);
    
    // Check existing tables
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 Existing Tables (${tables.rows.length}):`);
    if (tables.rows.length > 0) {
      tables.rows.forEach((table: any, index: number) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('   No tables found - database is empty');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run migrations: npm run db:migrate');
    console.log('   2. Seed data: npm run db:seed');
    console.log('   3. Start development server: npm run dev');
    
  } catch (error: any) {
    console.error('\n❌ Database setup failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Connection Refused - Possible Solutions:');
      console.error('   1. PostgreSQL is not running');
      console.error('   2. Check host/port configuration');
      console.error('   3. Verify firewall settings');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔧 Host Not Found - Possible Solutions:');
      console.error('   1. Check DB_HOST in .env file');
      console.error('   2. Verify network connectivity');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔧 Authentication Failed - Possible Solutions:');
      console.error('   1. Check DB_USER and DB_PASSWORD in .env');
      console.error('   2. Verify user exists in PostgreSQL');
      console.error('   3. Check user permissions');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n🔧 Database Does Not Exist - Solutions:');
      console.error('   1. Create database manually');
      console.error('   2. Use existing database name in .env');
    }
    
    console.error('\n📚 Setup Instructions:');
    console.error('   See SETUP_DATABASE.md for detailed instructions');
    
    process.exit(1);
  } finally {
    // Close database connection
    const db = getDatabase();
    if (db) {
      await db.destroy();
    }
    console.log('\n🔌 Database connection closed');
  }
}

// Run the setup
setupDatabase();
