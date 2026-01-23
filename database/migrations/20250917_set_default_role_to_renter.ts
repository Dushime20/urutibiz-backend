import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  

  // Ensure the CHECK constraint includes 'renter' (idempotent; relies on previous migration)
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
  await knex.raw(`
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user','admin','renter','owner','inspector','moderator','provider'));
  `);

  // Set default role to 'renter'
  await knex.raw(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'renter';`);

  // Backfill nulls to renter
  await knex.raw(`UPDATE users SET role = 'renter' WHERE role IS NULL OR role = ''`);
}

export async function down(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  

  // Remove default; keep constraint
  await knex.raw(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT;`);
}


