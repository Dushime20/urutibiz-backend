import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable common extensions needed by later migrations
  // UUID generation (uuid_generate_v4)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  // UUID generation (gen_random_uuid)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  // PostGIS for geometry columns used by products
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
}

export async function down(_knex: Knex): Promise<void> {
  // Do not drop extensions in down; other objects may depend on them
}


