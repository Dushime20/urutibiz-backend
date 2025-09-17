import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;

  const hasPhone = await knex.schema.hasColumn('users', 'phone');
  if (!hasPhone) {
    await knex.schema.alterTable('users', (table) => {
      table.string('phone', 30).nullable();
    });
    // Backfill from phone_number if present
    const hasPhoneNumber = await knex.schema.hasColumn('users', 'phone_number');
    if (hasPhoneNumber) {
      await knex.raw(`UPDATE users SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL`);
    }
    // Optional index for lookup
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    console.log('✅ Added users.phone and backfilled from phone_number');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) return;
  const hasPhone = await knex.schema.hasColumn('users', 'phone');
  if (hasPhone) {
    try { await knex.raw(`DROP INDEX IF EXISTS idx_users_phone`); } catch {}
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('phone');
    });
  }
}


