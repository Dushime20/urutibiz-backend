import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if payment_transactions table exists
  const tableExists = await knex.schema.hasTable('payment_transactions');
  
  if (!tableExists) {
    
    return;
  }

  // Drop the existing check constraint if it exists
  await knex.raw(`
    ALTER TABLE payment_transactions 
    DROP CONSTRAINT IF EXISTS payment_transactions_transaction_type_check;
  `);

  // Recreate the constraint with 'inspection_fee' added
  await knex.raw(`
    ALTER TABLE payment_transactions 
    ADD CONSTRAINT payment_transactions_transaction_type_check 
    CHECK (transaction_type IN (
      'booking_payment', 
      'security_deposit', 
      'refund', 
      'partial_refund', 
      'platform_fee', 
      'insurance_payment', 
      'delivery_fee',
      'inspection_fee'
    ));
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Check if payment_transactions table exists
  const tableExists = await knex.schema.hasTable('payment_transactions');
  
  if (!tableExists) {
    
    return;
  }

  // Drop the constraint
  await knex.raw(`
    ALTER TABLE payment_transactions 
    DROP CONSTRAINT IF EXISTS payment_transactions_transaction_type_check;
  `);

  // Recreate the original constraint without 'inspection_fee'
  await knex.raw(`
    ALTER TABLE payment_transactions 
    ADD CONSTRAINT payment_transactions_transaction_type_check 
    CHECK (transaction_type IN (
      'booking_payment', 
      'security_deposit', 
      'refund', 
      'partial_refund', 
      'platform_fee', 
      'insurance_payment', 
      'delivery_fee'
    ));
  `);
}

