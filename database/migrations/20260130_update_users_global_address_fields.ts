import { Knex } from 'knex';

/**
 * Migration to update users table with global address fields
 * Replaces Rwanda-specific fields with international standard address fields
 * 
 * Old fields: province, address_line
 * New fields: street_address, city, state_province, postal_code, country
 */

export async function up(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    console.log('⚠️ Users table does not exist, skipping migration');
    return;
  }

  // Check existing columns
  const hasProvince = await knex.schema.hasColumn('users', 'province');
  const hasAddressLine = await knex.schema.hasColumn('users', 'address_line');
  const hasStreetAddress = await knex.schema.hasColumn('users', 'street_address');
  const hasCity = await knex.schema.hasColumn('users', 'city');
  const hasStateProvince = await knex.schema.hasColumn('users', 'state_province');
  const hasPostalCode = await knex.schema.hasColumn('users', 'postal_code');
  const hasCountry = await knex.schema.hasColumn('users', 'country');

  await knex.schema.alterTable('users', (table) => {
    // Add new global address fields
    if (!hasStreetAddress) table.string('street_address', 255).comment('Street address line');
    if (!hasCity) table.string('city', 100).comment('City name');
    if (!hasStateProvince) table.string('state_province', 100).comment('State or Province');
    if (!hasPostalCode) table.string('postal_code', 20).comment('Postal or ZIP code');
    if (!hasCountry) table.string('country', 100).comment('Country name');
  });

  // Migrate data from old fields to new fields if they exist
  if (hasAddressLine && hasStreetAddress) {
    await knex.raw(`
      UPDATE users 
      SET street_address = address_line 
      WHERE address_line IS NOT NULL AND street_address IS NULL
    `);
    console.log('✅ Migrated address_line data to street_address');
  }

  if (hasProvince && hasStateProvince) {
    await knex.raw(`
      UPDATE users 
      SET state_province = province 
      WHERE province IS NOT NULL AND state_province IS NULL
    `);
    console.log('✅ Migrated province data to state_province');
  }

  console.log('✅ Added global address fields to users table');
}

export async function down(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    console.log('⚠️ Users table does not exist, skipping rollback');
    return;
  }

  // Check which columns exist before dropping
  const hasStreetAddress = await knex.schema.hasColumn('users', 'street_address');
  const hasCity = await knex.schema.hasColumn('users', 'city');
  const hasStateProvince = await knex.schema.hasColumn('users', 'state_province');
  const hasPostalCode = await knex.schema.hasColumn('users', 'postal_code');
  const hasCountry = await knex.schema.hasColumn('users', 'country');

  await knex.schema.alterTable('users', (table) => {
    // Remove global address fields
    if (hasStreetAddress) table.dropColumn('street_address');
    if (hasCity) table.dropColumn('city');
    if (hasStateProvince) table.dropColumn('state_province');
    if (hasPostalCode) table.dropColumn('postal_code');
    if (hasCountry) table.dropColumn('country');
  });

  console.log('✅ Removed global address fields from users table');
}