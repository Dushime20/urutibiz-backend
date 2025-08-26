import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if columns exist before adding them
  const hasDistrict = await knex.schema.hasColumn('users', 'district');
  const hasSector = await knex.schema.hasColumn('users', 'sector');
  const hasCell = await knex.schema.hasColumn('users', 'cell');
  const hasVillage = await knex.schema.hasColumn('users', 'village');
  
  // Add location fields to users table if they don't exist
  if (!hasDistrict) {
    await knex.schema.alterTable('users', (table) => {
      table.string('district', 100).comment('District name (e.g., Kigali, Northern Province)');
    });
  }
  
  if (!hasSector) {
    await knex.schema.alterTable('users', (table) => {
      table.string('sector', 100).comment('Sector name within district');
    });
  }
  
  if (!hasCell) {
    await knex.schema.alterTable('users', (table) => {
      table.string('cell', 100).comment('Cell name within sector');
    });
  }
  
  if (!hasVillage) {
    await knex.schema.alterTable('users', (table) => {
      table.string('village', 100).comment('Village name within cell');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove columns
  const hasVillage = await knex.schema.hasColumn('users', 'village');
  if (hasVillage) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('village');
    });
  }
  
  const hasCell = await knex.schema.hasColumn('users', 'cell');
  if (hasCell) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('cell');
    });
  }
  
  const hasSector = await knex.schema.hasColumn('users', 'sector');
  if (hasSector) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('sector');
    });
  }
  
  const hasDistrict = await knex.schema.hasColumn('users', 'district');
  if (hasDistrict) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('district');
    });
  }
}
