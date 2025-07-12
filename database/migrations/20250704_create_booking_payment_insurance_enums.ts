import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create booking_status enum if not exists
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
      END IF;
    END
    $$;
  `);
  
  // Create payment_status enum if not exists
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
      END IF;
    END
    $$;
  `);
  
  // Create insurance_type enum if not exists
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_type') THEN
        CREATE TYPE insurance_type AS ENUM ('basic', 'standard', 'premium', 'none');
      END IF;
    END
    $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop enum types in reverse order
  await knex.schema.raw(`DROP TYPE IF EXISTS insurance_type CASCADE`);
  await knex.schema.raw(`DROP TYPE IF EXISTS payment_status CASCADE`);
  await knex.schema.raw(`DROP TYPE IF EXISTS booking_status CASCADE`);
}
