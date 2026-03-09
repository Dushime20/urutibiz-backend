import { Knex } from 'knex';

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
    // Check if native enum is used and add 'expired' status
    await knex.schema.raw(`ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'expired'`);
}

export async function down(knex: Knex): Promise<void> {
    // PostgreSQL does not support removing values from an ENUM
    // This is usually handled by recreating the type, but it's risky for a migration down
    console.warn('PostgreSQL does not support removing values from an ENUM. "expired" will remain.');
}
