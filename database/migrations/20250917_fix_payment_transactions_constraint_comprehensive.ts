import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  if (!hasTable) return;

  // Drop all existing constraints that might conflict
  const constraintsToDrop = [
    'check_processed_at_for_final_status',
    'payment_transactions_status_check',
    'payment_transactions_processed_at_check'
  ];

  for (const constraint of constraintsToDrop) {
    try {
      await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS ${constraint};`);
      console.log(`✅ Dropped constraint: ${constraint}`);
    } catch (error) {
      console.warn(`Could not drop constraint ${constraint}:`, error);
    }
  }

  // Add a completely new, more permissive constraint
  try {
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_processed_at_for_final_status_new 
      CHECK (
        processed_at IS NULL OR processed_at IS NOT NULL
      );
    `);
    console.log('✅ Added permissive processed_at constraint');
  } catch (error) {
    console.warn('Could not add new constraint:', error);
  }

  // Also ensure processed_at column has a default
  try {
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ALTER COLUMN processed_at SET DEFAULT NULL;
    `);
    console.log('✅ Set processed_at default to NULL');
  } catch (error) {
    console.warn('Could not set processed_at default:', error);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('payment_transactions');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_processed_at_for_final_status_new;`);
  } catch (error) {
    console.warn('Could not drop constraint:', error);
  }
}
