import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add phone_number column to user_verifications table
  await knex.schema.alterTable('user_verifications', (table) => {
    table.string('phone_number', 32).nullable().comment('Phone number associated with this verification');
  });

  // Add index for better performance
  await knex.schema.alterTable('user_verifications', (table) => {
    table.index(['phone_number'], 'idx_user_verifications_phone_number');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove index first
  await knex.schema.alterTable('user_verifications', (table) => {
    table.dropIndex(['phone_number'], 'idx_user_verifications_phone_number');
  });

  // Remove column
  await knex.schema.alterTable('user_verifications', (table) => {
    table.dropColumn('phone_number');
  });
} 