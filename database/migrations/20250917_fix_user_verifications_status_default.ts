import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  if (!hasTable) return;

  const hasStatus = await knex.schema.hasColumn('user_verifications', 'status');
  if (hasStatus) {
    // Set a safe default and backfill nulls
    await knex.raw(`ALTER TABLE user_verifications ALTER COLUMN status SET DEFAULT 'queued'`);
    await knex.raw(`UPDATE user_verifications SET status = 'queued' WHERE status IS NULL OR status = ''`);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  if (!hasTable) return;
  const hasStatus = await knex.schema.hasColumn('user_verifications', 'status');
  if (hasStatus) {
    await knex.raw(`ALTER TABLE user_verifications ALTER COLUMN status DROP DEFAULT`);
  }
}


