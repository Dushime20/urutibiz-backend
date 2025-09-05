import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Adding provider_response column to payment_transactions table...');
  
  // Check if the column already exists
  const hasColumn = await knex.schema.hasColumn('payment_transactions', 'provider_response');
  
  if (!hasColumn) {
    await knex.schema.alterTable('payment_transactions', (table) => {
      table.text('provider_response').comment('Raw response from payment provider');
    });
    console.log('✅ provider_response column added successfully');
  } else {
    console.log('⚠️ provider_response column already exists');
  }
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Removing provider_response column from payment_transactions table...');
  
  const hasColumn = await knex.schema.hasColumn('payment_transactions', 'provider_response');
  
  if (hasColumn) {
    await knex.schema.alterTable('payment_transactions', (table) => {
      table.dropColumn('provider_response');
    });
    console.log('✅ provider_response column removed successfully');
  } else {
    console.log('⚠️ provider_response column does not exist');
  }
}
