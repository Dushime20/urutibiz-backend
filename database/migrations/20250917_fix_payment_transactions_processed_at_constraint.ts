import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  

  // Drop the problematic constraint
  try {
    await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_processed_at_for_final_status;`);
    console.log('✅ Dropped check_processed_at_for_final_status constraint');
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }

  // Add a more flexible constraint that allows NULL processed_at for pending/processing statuses
  // Use a constraint that doesn't hardcode enum values to avoid "unsafe use of new value" error
  try {
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_processed_at_for_final_status 
      CHECK (
        status::text IN ('pending', 'processing') OR 
        (status::text NOT IN ('pending', 'processing') AND processed_at IS NOT NULL)
      );
    `);
    console.log('✅ Added flexible check_processed_at_for_final_status constraint');
  } catch (error: any) {
    // If constraint already exists, that's okay
    if (error.message?.includes('already exists')) {
      
    } else {
      console.warn('Could not add new constraint:', error);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  

  try {
    await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_processed_at_for_final_status;`);
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }
}
