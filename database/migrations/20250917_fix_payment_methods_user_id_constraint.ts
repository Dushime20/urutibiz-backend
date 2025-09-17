import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop the problematic unique constraint on user_id
  // This constraint prevents users from having multiple payment methods
  await knex.schema.raw(`
    ALTER TABLE payment_methods
    DROP CONSTRAINT IF EXISTS payment_methods_user_id_unique;
  `);

  // The partial unique index for default payment method per user already exists
  // and handles the "one default per user" requirement correctly
  console.log('✅ Removed user_id unique constraint - users can now have multiple payment methods');
}

export async function down(knex: Knex): Promise<void> {
  // Re-add the unique constraint if needed (but this would break the multi-payment-method functionality)
  await knex.schema.raw(`
    ALTER TABLE payment_methods
    ADD CONSTRAINT payment_methods_user_id_unique
    UNIQUE (user_id);
  `);
}
