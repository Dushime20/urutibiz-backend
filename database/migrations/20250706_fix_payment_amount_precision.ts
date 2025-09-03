import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Fixing payment_transactions amount field precision...');

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

  console.log('✅ Payment amount precision increased successfully');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Reverting payment_transactions amount field precision...');

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

  console.log('✅ Payment amount precision reverted');
}
