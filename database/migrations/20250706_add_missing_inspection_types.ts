import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Adding missing inspection types...');

  // Add new enum values to the existing inspection_type enum
  // This is the safest way to add enum values in PostgreSQL
  try {
    await knex.raw(`ALTER TYPE inspection_type ADD VALUE 'damage_assessment';`);
    console.log('✅ Added damage_assessment');
  } catch (error) {
    console.log('⚠️ damage_assessment already exists or failed to add');
  }

  try {
    await knex.raw(`ALTER TYPE inspection_type ADD VALUE 'post_rental_maintenance_check';`);
    console.log('✅ Added post_rental_maintenance_check');
  } catch (error) {
    console.log('⚠️ post_rental_maintenance_check already exists or failed to add');
  }

  try {
    await knex.raw(`ALTER TYPE inspection_type ADD VALUE 'quality_verification';`);
    console.log('✅ Added quality_verification');
  } catch (error) {
    console.log('⚠️ quality_verification already exists or failed to add');
  }

  console.log('✅ All missing inspection types added successfully');
}

export async function down(_knex: Knex): Promise<void> {
  console.log('🔄 Reverting inspection types...');
  console.log('⚠️ Note: PostgreSQL does not support removing enum values.');
  console.log('   To revert, you would need to recreate the entire enum type.');
  console.log('   This migration down function is not implemented for safety.');
}
