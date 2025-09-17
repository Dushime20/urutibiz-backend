import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Fixing payment_transactions amount field precision...');

  // Check if payment_transactions table exists
  const hasPaymentTransactions = await knex.schema.hasTable('payment_transactions');
  if (!hasPaymentTransactions) {
    console.log('⚠️ payment_transactions table does not exist, skipping...');
    return;
  }

  // Drop the view that depends on the amount column
  await knex.raw('DROP VIEW IF EXISTS transaction_summaries;');

  // Increase precision for amount fields to handle larger currencies like RWF
  // Change from decimal(12,2) to decimal(15,2) to support amounts up to 999,999,999,999.99
  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN amount TYPE DECIMAL(15,2);
  `);

  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN original_amount TYPE DECIMAL(15,2);
  `);

  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN provider_fee TYPE DECIMAL(12,2);
  `);

  // Recreate the view
  await knex.raw(`
    CREATE VIEW transaction_summaries AS
    SELECT 
      user_id,
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
      SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed_amount,
      MAX(created_at) as last_transaction_date,
      COUNT(DISTINCT provider) as unique_providers_used
    FROM payment_transactions
    GROUP BY user_id;
  `);

  console.log('✅ Payment amount precision increased successfully');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Reverting payment_transactions amount field precision...');

  // Check if payment_transactions table exists
  const hasPaymentTransactions = await knex.schema.hasTable('payment_transactions');
  if (!hasPaymentTransactions) {
    console.log('⚠️ payment_transactions table does not exist, skipping...');
    return;
  }

  // Drop the view that depends on the amount column
  await knex.raw('DROP VIEW IF EXISTS transaction_summaries;');

  // Revert back to original precision
  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN amount TYPE DECIMAL(12,2);
  `);

  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN original_amount TYPE DECIMAL(12,2);
  `);

  await knex.raw(`
    ALTER TABLE payment_transactions 
    ALTER COLUMN provider_fee TYPE DECIMAL(10,2);
  `);

  // Recreate the view
  await knex.raw(`
    CREATE VIEW transaction_summaries AS
    SELECT 
      user_id,
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
      SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed_amount,
      MAX(created_at) as last_transaction_date,
      COUNT(DISTINCT provider) as unique_providers_used
    FROM payment_transactions
    GROUP BY user_id;
  `);

  console.log('✅ Payment amount precision reverted');
}
