import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database';

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    await connectDatabase();
    console.log('✅ Database connected successfully!');

    const db = getDatabase();
    const result = await db.raw('SELECT NOW() as current_time, version() as pg_version');

    // Handle different result shapes
    let row;
    if (result && result.rows && result.rows[0]) {
      row = result.rows[0];
    } else if (Array.isArray(result) && result[0] && result[0].current_time) {
      row = result[0];
    } else if (result && result[0] && result[0].rows && result[0].rows[0]) {
      row = result[0].rows[0];
    } else {
      throw new Error('Unexpected result shape from db.raw');
    }

    console.log('📊 Database Info:');
    console.log(`   Time: ${row.current_time}`);
    console.log(`   Version: ${row.pg_version}`);

    const tablesResult = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    let tables = [];
    if (tablesResult && tablesResult.rows) {
      tables = tablesResult.rows.map((t: any) => t.table_name);
    } else if (Array.isArray(tablesResult) && tablesResult[0] && tablesResult[0].table_name) {
      tables = tablesResult.map((t: any) => t.table_name);
    } else if (tablesResult && tablesResult[0] && tablesResult[0].rows) {
      tables = tablesResult[0].rows.map((t: any) => t.table_name);
    }

    console.log(`📋 Existing tables: ${tables.length > 0 ? tables.join(', ') : 'None'}`);
    console.log('🎉 Database connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
    console.log('🔌 Database connection closed');
  }
}

testDatabaseConnection();
