import { Knex } from 'knex';

/**
 * Migration to update user_verifications table with global address fields
 * Adds international standard address fields alongside existing ones
 */

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  if (!hasTable) {
    console.log('⚠️ user_verifications table does not exist, skipping migration');
    return;
  }

  // Check existing columns
  const hasStreetAddress = await knex.schema.hasColumn('user_verifications', 'street_address');
  const hasStateProvince = await knex.schema.hasColumn('user_verifications', 'state_province');
  const hasPostalCode = await knex.schema.hasColumn('user_verifications', 'postal_code');

  await knex.schema.alterTable('user_verifications', (table) => {
    // Add new global address fields (city and country already exist)
    if (!hasStreetAddress) table.string('street_address', 255).comment('Street address line');
    if (!hasStateProvince) table.string('state_province', 100).comment('State or Province');
    if (!hasPostalCode) table.string('postal_code', 20).comment('Postal or ZIP code');
  });

  // Migrate data from address_line to street_address if needed
  const hasAddressLine = await knex.schema.hasColumn('user_verifications', 'address_line');
  if (hasAddressLine && hasStreetAddress) {
    await knex.raw(`
      UPDATE user_verifications 
      SET street_address = address_line 
      WHERE address_line IS NOT NULL AND street_address IS NULL
    `);
    console.log('✅ Migrated address_line data to street_address in user_verifications');
  }

  console.log('✅ Added global address fields to user_verifications table');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  if (!hasTable) {
    console.log('⚠️ user_verifications table does not exist, skipping rollback');
    return;
  }

  // Check which columns exist before dropping
  const hasStreetAddress = await knex.schema.hasColumn('user_verifications', 'street_address');
  const hasStateProvince = await knex.schema.hasColumn('user_verifications', 'state_province');
  const hasPostalCode = await knex.schema.hasColumn('user_verifications', 'postal_code');

  await knex.schema.alterTable('user_verifications', (table) => {
    // Remove global address fields
    if (hasStreetAddress) table.dropColumn('street_address');
    if (hasStateProvince) table.dropColumn('state_province');
    if (hasPostalCode) table.dropColumn('postal_code');
  });

  console.log('✅ Removed global address fields from user_verifications table');
}