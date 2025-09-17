import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('email_verification_otps');
  if (!exists) {
    await knex.schema.createTable('email_verification_otps', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.string('email', 255).notNullable();
      table.string('otp_code', 10).notNullable();
      table.boolean('verified').notNullable().defaultTo(false);
      table.timestamp('expires_at', { useTz: true }).notNullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

      table.index(['user_id'], 'idx_email_otps_user_id');
      table.index(['email'], 'idx_email_otps_email');
      table.index(['created_at'], 'idx_email_otps_created_at');
      table.index(['verified'], 'idx_email_otps_verified');
    });

    const hasUsers = await knex.schema.hasTable('users');
    if (hasUsers) {
      await knex.schema.alterTable('email_verification_otps', (table) => {
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
      });
    }
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_email_otps_active_lookup ON email_verification_otps(email, otp_code) WHERE verified = false`);
  }
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('email_verification_otps');
  if (exists) {
    await knex.schema.dropTable('email_verification_otps');
  }
}


