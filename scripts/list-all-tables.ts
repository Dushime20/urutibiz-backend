import { getDatabase } from '../src/config/database';

async function listAllTables() {
  try {
    const db = getDatabase();
    
    console.log('🔍 Fetching all tables from rent_db...\n');
    
    // Get all tables
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📊 Found ${tables.rows.length} tables:\n`);
    
    tables.rows.forEach((table: any, index: number) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    console.log(`\n✅ Total tables: ${tables.rows.length}`);
    
    // Also check if there are any missing core tables
    const coreTables = [
      'users', 'products', 'bookings', 'categories', 'countries',
      'product_images', 'product_prices', 'reviews', 'user_verifications'
    ];
    
    console.log('\n🔍 Checking core tables:');
    const existingTableNames = tables.rows.map((t: any) => t.table_name);
    
    coreTables.forEach(tableName => {
      const exists = existingTableNames.includes(tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing tables:', error);
    process.exit(1);
  }
}

listAllTables();
