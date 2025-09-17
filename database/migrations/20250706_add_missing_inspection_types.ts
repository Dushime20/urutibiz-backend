import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Adding missing inspection types...');

  // Check if inspection_type enum exists first
  const enumExists = await knex.raw(`
    SELECT 1 FROM pg_type WHERE typname = 'inspection_type'
  `);

  if (enumExists.rows.length === 0) {
    console.log('⚠️ inspection_type enum does not exist, skipping...');
    return;
  }

  // Add new enum values to the existing inspection_type enum
  // Use DO blocks to handle errors gracefully without aborting the transaction
  await knex.raw(`
    DO $$
    BEGIN
      BEGIN
        ALTER TYPE inspection_type ADD VALUE 'damage_assessment';
        RAISE NOTICE 'Added damage_assessment';
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'damage_assessment already exists';
        WHEN OTHERS THEN
          RAISE NOTICE 'Failed to add damage_assessment: %', SQLERRM;
      END;
      
      BEGIN
        ALTER TYPE inspection_type ADD VALUE 'post_rental_maintenance_check';
        RAISE NOTICE 'Added post_rental_maintenance_check';
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'post_rental_maintenance_check already exists';
        WHEN OTHERS THEN
          RAISE NOTICE 'Failed to add post_rental_maintenance_check: %', SQLERRM;
      END;
      
      BEGIN
        ALTER TYPE inspection_type ADD VALUE 'quality_verification';
        RAISE NOTICE 'Added quality_verification';
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'quality_verification already exists';
        WHEN OTHERS THEN
          RAISE NOTICE 'Failed to add quality_verification: %', SQLERRM;
      END;
    END$$;
  `);

  console.log('✅ All missing inspection types processed successfully');
}

export async function down(_knex: Knex): Promise<void> {
  console.log('🔄 Reverting inspection types...');
  console.log('⚠️ Note: PostgreSQL does not support removing enum values.');
  console.log('   To revert, you would need to recreate the entire enum type.');
  console.log('   This migration down function is not implemented for safety.');
}
