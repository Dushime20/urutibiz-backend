import { connectDatabase, getDatabase } from '../src/config/database';

async function checkProductsColumns() {
  try {
    await connectDatabase();
    const db = getDatabase();
    
    console.log('🔍 Checking products table columns...\n');
    
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Products table columns:');
    result.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const columnNames = result.rows.map((col: any) => col.column_name);
    console.log('\n✅ Column names array:');
    console.log(JSON.stringify(columnNames, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductsColumns();



