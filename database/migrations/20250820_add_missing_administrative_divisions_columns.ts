import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table exists
  const tableExists = await knex.schema.hasTable('administrative_divisions');
  if (!tableExists) {
    
    return;
  }

  // Add missing updated_at column if it doesn't exist
  if (!(await knex.schema.hasColumn('administrative_divisions', 'updated_at'))) {
    await knex.schema.alterTable('administrative_divisions', (table) => {
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
    console.log('✅ Added updated_at column to administrative_divisions table');
  } else {
    console.log('Column updated_at already exists in administrative_divisions table');
  }

  // Add missing deleted_at column if it doesn't exist (for soft deletes)
  if (!(await knex.schema.hasColumn('administrative_divisions', 'deleted_at'))) {
    await knex.schema.alterTable('administrative_divisions', (table) => {
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
    console.log('✅ Added deleted_at column to administrative_divisions table');
  } else {
    console.log('Column deleted_at already exists in administrative_divisions table');
  }

  // Add trigger to automatically update updated_at column
  try {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await knex.raw(`
      DROP TRIGGER IF EXISTS update_administrative_divisions_updated_at ON administrative_divisions;
      CREATE TRIGGER update_administrative_divisions_updated_at
        BEFORE UPDATE ON administrative_divisions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Added trigger to automatically update updated_at column');
  } catch (error) {
    console.log('Trigger creation failed (may already exist):', error);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove trigger
  try {
    await knex.raw('DROP TRIGGER IF EXISTS update_administrative_divisions_updated_at ON administrative_divisions');
    console.log('✅ Removed trigger from administrative_divisions table');
  } catch (error) {
    console.log('Trigger removal failed:', error);
  }

  // Remove columns if they exist
  if (await knex.schema.hasColumn('administrative_divisions', 'deleted_at')) {
    await knex.schema.alterTable('administrative_divisions', (table) => {
      table.dropColumn('deleted_at');
    });
    console.log('✅ Removed deleted_at column from administrative_divisions table');
  }

  if (await knex.schema.hasColumn('administrative_divisions', 'updated_at')) {
    await knex.schema.alterTable('administrative_divisions', (table) => {
      table.dropColumn('updated_at');
    });
    console.log('✅ Removed updated_at column from administrative_divisions table');
  }
}
