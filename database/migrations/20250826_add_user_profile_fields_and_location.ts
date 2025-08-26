import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasGender = await knex.schema.hasColumn('users', 'gender');
  const hasProvince = await knex.schema.hasColumn('users', 'province');
  const hasAddress = await knex.schema.hasColumn('users', 'address_line');
  const hasDob = await knex.schema.hasColumn('users', 'date_of_birth');
  const hasLocation = await knex.schema.hasColumn('users', 'location');

  await knex.schema.alterTable('users', (table) => {
    if (!hasGender) table.string('gender', 30);
    if (!hasProvince) table.string('province', 100);
    if (!hasAddress) table.string('address_line', 255);
    if (!hasDob) table.date('date_of_birth');
    if (!hasLocation) table.specificType('location', 'geometry(Point, 4326)');
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasGender = await knex.schema.hasColumn('users', 'gender');
  const hasProvince = await knex.schema.hasColumn('users', 'province');
  const hasAddress = await knex.schema.hasColumn('users', 'address_line');
  const hasDob = await knex.schema.hasColumn('users', 'date_of_birth');
  const hasLocation = await knex.schema.hasColumn('users', 'location');

  await knex.schema.alterTable('users', (table) => {
    if (hasLocation) table.dropColumn('location');
    if (hasDob) table.dropColumn('date_of_birth');
    if (hasAddress) table.dropColumn('address_line');
    if (hasProvince) table.dropColumn('province');
    if (hasGender) table.dropColumn('gender');
  });
}


