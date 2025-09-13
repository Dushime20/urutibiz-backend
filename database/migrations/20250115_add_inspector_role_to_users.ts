import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First, check if the role column uses an enum or varchar
  const result = await knex.raw(`
    SELECT data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  `);
  
  if (result.rows.length > 0) {
    const { data_type, udt_name } = result.rows[0];
    console.log(`Role column type: ${data_type}, UDT: ${udt_name}`);
    
    if (data_type === 'USER-DEFINED' && udt_name) {
      // It's an enum, try to add the inspector value
      try {
        await knex.raw(`
          ALTER TYPE "${udt_name}" ADD VALUE IF NOT EXISTS 'inspector';
        `);
        console.log('Successfully added inspector to role enum');
      } catch (error) {
        console.log('Could not add to enum, role column might be varchar:', error);
      }
    } else {
      // It's probably a varchar, no need to modify
      console.log('Role column is varchar, inspector role can be used directly');
    }
  } else {
    console.log('Users table or role column not found');
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum type, which is complex
  // For now, we'll leave the inspector role in place
  console.log('Warning: Cannot remove inspector role from enum. Manual cleanup may be required.');
}
