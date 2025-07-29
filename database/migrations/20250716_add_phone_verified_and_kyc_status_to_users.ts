import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add missing columns to users table
  await knex.schema.alterTable('users', (table) => {
    // Add phone_verified column
    table.boolean('phone_verified').defaultTo(false).comment('Whether user phone number is verified');
    
    // Add kyc_status column
    table.enu('kyc_status', ['unverified', 'basic', 'pending_review', 'verified', 'rejected', 'suspended', 'expired'])
      .defaultTo('unverified')
      .comment('KYC verification status');
    
    // Add id_verification_status column for backward compatibility
    table.enu('id_verification_status', ['unverified', 'pending', 'verified', 'rejected'])
      .defaultTo('unverified')
      .comment('ID verification status (legacy field)');
  });

  // Add indexes for better performance
  await knex.schema.alterTable('users', (table) => {
    table.index(['phone_verified'], 'idx_users_phone_verified');
    table.index(['kyc_status'], 'idx_users_kyc_status');
    table.index(['id_verification_status'], 'idx_users_id_verification_status');
    table.index(['phone_verified', 'kyc_status'], 'idx_users_verification_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove indexes first
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex(['phone_verified'], 'idx_users_phone_verified');
    table.dropIndex(['kyc_status'], 'idx_users_kyc_status');
    table.dropIndex(['id_verification_status'], 'idx_users_id_verification_status');
    table.dropIndex(['phone_verified', 'kyc_status'], 'idx_users_verification_status');
  });

  // Remove columns
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('phone_verified');
    table.dropColumn('kyc_status');
    table.dropColumn('id_verification_status');
  });
} 