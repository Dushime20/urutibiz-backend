import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Fixing inspection_type check constraint...');

  // Drop the existing check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_inspection_type_check;
  `);

  // Create a new check constraint with all valid inspection types
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_inspection_type_check 
    CHECK (inspection_type IN ('pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification'));
  `);

  console.log('✅ Inspection type check constraint updated successfully');
  console.log('   - Added support for all 5 inspection types');
  console.log('   - Removed old constraint that only allowed 2 types');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Reverting inspection type check constraint...');
  
  // Drop the new check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_inspection_type_check;
  `);

  // Recreate the original check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_inspection_type_check 
    CHECK (inspection_type IN ('pre_rental', 'post_return'));
  `);

  console.log('✅ Reverted to original inspection type constraint');
}
