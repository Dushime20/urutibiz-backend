import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  if (!hasTable) return;

  // Drop the problematic constraint
  try {
    await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_processed_at_for_final_status;`);
    console.log('✅ Dropped check_processed_at_for_final_status constraint');
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }

  // Add a more flexible constraint that allows NULL processed_at for pending/processing statuses
  try {
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_processed_at_for_final_status 
      CHECK (
        status IN ('pending', 'processing') OR 
        (status IN ('completed', 'failed', 'refunded', 'partially_refunded', 'cancelled') AND processed_at IS NOT NULL)
      );
    `);
    console.log('✅ Added flexible check_processed_at_for_final_status constraint');
  } catch (error) {
    console.warn('Could not add new constraint:', error);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_processed_at_for_final_status;`);
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }
}
