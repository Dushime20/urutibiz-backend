import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  // Drop existing role check constraint if present, then add the requested one
  await knex.raw(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user','admin','renter','owner','inspector','moderator'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  // Revert by dropping the constraint; (no prior definition to restore reliably)
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
}


