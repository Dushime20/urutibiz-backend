import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Adding third_party_professional to inspection_type check constraint...');

  // Drop the existing check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_inspection_type_check;
  `);

  // Create a new check constraint with all valid inspection types including third_party_professional
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_inspection_type_check 
    CHECK (inspection_type IN ('pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification', 'third_party_professional'));
  `);

  console.log('✅ Inspection type check constraint updated successfully');
  console.log('   - Added support for third_party_professional inspection type');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🔄 Reverting inspection type check constraint...');
  
  // Drop the new check constraint
  await knex.raw(`
    ALTER TABLE product_inspections 
    DROP CONSTRAINT IF EXISTS product_inspections_inspection_type_check;
  `);

  // Recreate the previous check constraint without third_party_professional
  await knex.raw(`
    ALTER TABLE product_inspections 
    ADD CONSTRAINT product_inspections_inspection_type_check 
    CHECK (inspection_type IN ('pre_rental', 'post_return', 'damage_assessment', 'post_rental_maintenance_check', 'quality_verification'));
  `);

  console.log('✅ Reverted to previous inspection type constraint');
}

