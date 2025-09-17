import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create the new enum type with the requested values (no error if exists)
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_type') THEN
        CREATE TYPE availability_type AS ENUM ('available', 'booked', 'maintenance', 'unavailable');
      END IF;
    END$$;
  `);
  
  // If the table already exists, we need to update it
  // First check if the table exists
  const tableExists = await knex.schema.hasTable('product_availability');
  
  if (tableExists) {
    // Drop the existing enum column temporarily
    await knex.schema.raw(`
      ALTER TABLE product_availability 
      DROP COLUMN IF EXISTS availability_type
    `);
    
    // Add the column back referencing the existing enum type directly
    await knex.schema.alterTable('product_availability', (table) => {
      table.specificType('availability_type', 'availability_type').defaultTo('available');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert to the old enum values
  const tableExists = await knex.schema.hasTable('product_availability');
  
  if (tableExists) {
    // Drop the current enum column
    await knex.schema.raw(`
      ALTER TABLE product_availability 
      DROP COLUMN IF EXISTS availability_type
    `);
  }
  
  // Drop the enum type
  await knex.schema.raw(`DROP TYPE IF EXISTS availability_type`);
  
  if (tableExists) {
    // Recreate with old values if needed
    await knex.schema.raw(`
      CREATE TYPE availability_type AS ENUM ('available', 'unavailable', 'reserved', 'maintenance')
    `);
    
    await knex.schema.alterTable('product_availability', (table) => {
      table.enu('availability_type', ['available', 'unavailable', 'reserved', 'maintenance'], { 
        useNative: true, 
        enumName: 'availability_type' 
      }).defaultTo('available');
    });
  }
}
