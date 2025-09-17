import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop the problematic constraint
  await knex.schema.raw(`
    ALTER TABLE payment_methods
    DROP CONSTRAINT IF EXISTS payment_methods_provider_check;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Re-add a basic constraint if needed
  await knex.schema.raw(`
    ALTER TABLE payment_methods
    ADD CONSTRAINT payment_methods_provider_check
    CHECK (provider IS NOT NULL OR type = 'bank_transfer');
  `);
}
