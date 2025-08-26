import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if columns exist before adding them
  const hasTwoFactorEnabled = await knex.schema.hasColumn('users', 'two_factor_enabled');
  const hasTwoFactorSecret = await knex.schema.hasColumn('users', 'two_factor_secret');
  const hasTwoFactorBackupCodes = await knex.schema.hasColumn('users', 'two_factor_backup_codes');
  const hasTwoFactorVerified = await knex.schema.hasColumn('users', 'two_factor_verified');

  if (!hasTwoFactorEnabled) {
    await knex.schema.alterTable('users', (table) => {
      table.boolean('two_factor_enabled').defaultTo(false).comment('Whether 2FA is enabled for this user');
    });
  }

  if (!hasTwoFactorSecret) {
    await knex.schema.alterTable('users', (table) => {
      table.string('two_factor_secret', 255).comment('TOTP secret key for 2FA');
    });
  }

  if (!hasTwoFactorBackupCodes) {
    await knex.schema.alterTable('users', (table) => {
      table.jsonb('two_factor_backup_codes').comment('Backup codes for 2FA recovery');
    });
  }

  if (!hasTwoFactorVerified) {
    await knex.schema.alterTable('users', (table) => {
      table.boolean('two_factor_verified').defaultTo(false).comment('Whether 2FA setup has been verified');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTwoFactorEnabled = await knex.schema.hasColumn('users', 'two_factor_enabled');
  const hasTwoFactorSecret = await knex.schema.hasColumn('users', 'two_factor_secret');
  const hasTwoFactorBackupCodes = await knex.schema.hasColumn('users', 'two_factor_backup_codes');
  const hasTwoFactorVerified = await knex.schema.hasColumn('users', 'two_factor_verified');

  if (hasTwoFactorEnabled) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('two_factor_enabled');
    });
  }

  if (hasTwoFactorSecret) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('two_factor_secret');
    });
  }

  if (hasTwoFactorBackupCodes) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('two_factor_backup_codes');
    });
  }

  if (hasTwoFactorVerified) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('two_factor_verified');
    });
  }
}
