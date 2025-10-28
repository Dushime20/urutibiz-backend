import { getDatabase, connectDatabase } from './src/config/database';

async function checkSchema() {
  try {
    // Initialize database connection first
    await connectDatabase();
    
    const db = getDatabase();
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Check if email column exists
    const emailColumn = result.rows.find((row: any) => row.column_name === 'email');
    if (emailColumn) {
      console.log('\n✅ Email column exists:', emailColumn);
    } else {
      console.log('\n❌ Email column does NOT exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
