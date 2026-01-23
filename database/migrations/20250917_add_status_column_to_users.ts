import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  

  const hasStatus = await knex.schema.hasColumn('users', 'status');
  if (!hasStatus) {
    await knex.schema.alterTable('users', (table) => {
      table.string('status', 20).defaultTo('active');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
    console.log('✅ Added users.status with default and index');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_users_status`); } catch {}
  const hasStatus = await knex.schema.hasColumn('users', 'status');
  if (hasStatus) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('status');
    });
  }
}


