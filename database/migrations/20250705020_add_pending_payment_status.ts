import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Adding pending_payment to status check constraint...');

  // Drop the existing check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_status_check;
  `);

  // Create a new check constraint with all valid statuses including pending_payment
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_status_check 
    CHECK (status IN ('pending', 'pending_payment', 'in_progress', 'completed', 'disputed', 'resolved'));
  `);

  console.log('✅ Status check constraint updated successfully');
  console.log('   - Added support for pending_payment status');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Reverting status check constraint...');
  
  // Drop the new check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_status_check;
  `);

  // Recreate the previous check constraint without pending_payment
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed', 'resolved'));
  `);

  console.log('✅ Reverted to previous status constraint');
}

