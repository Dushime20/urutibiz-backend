import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  

  // Ensure extensions for UUID
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // If id is not uuid, convert it safely
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_verifications'
          AND column_name = 'id'
          AND data_type <> 'uuid'
      ) THEN
        -- Drop default to allow type change
        ALTER TABLE user_verifications ALTER COLUMN id DROP DEFAULT;
        -- Assign UUIDs for existing rows into a temp column, then swap
        ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS id_uuid uuid;
        UPDATE user_verifications SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;
        ALTER TABLE user_verifications DROP CONSTRAINT IF EXISTS user_verifications_pkey;
        ALTER TABLE user_verifications DROP COLUMN id;
        ALTER TABLE user_verifications RENAME COLUMN id_uuid TO id;
        ALTER TABLE user_verifications ADD PRIMARY KEY (id);
        ALTER TABLE user_verifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
      END IF;
    END$$;
  `);
}

export async function down(_knex: Knex): Promise<void> {
  // No safe down migration (cannot convert UUIDs back to integers reliably)
}


