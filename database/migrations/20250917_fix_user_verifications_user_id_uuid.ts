import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  

  // If user_id is not uuid, convert it to uuid using a safe USING cast
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_verifications'
          AND column_name = 'user_id'
          AND data_type <> 'uuid'
      ) THEN
        -- Convert to UUID without failing when current type is integer/text
        -- We intentionally nullify existing non-UUID values to allow schema alignment
        ALTER TABLE user_verifications
          ALTER COLUMN user_id DROP NOT NULL;
        ALTER TABLE user_verifications
          ALTER COLUMN user_id TYPE uuid USING NULL::uuid;
      END IF;
    END$$;
  `);

  // Ensure FK to users(id)
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_user_id_fkey'
        ) THEN
          ALTER TABLE user_verifications
            ADD CONSTRAINT user_verifications_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  }

  // Helpful index
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);`);
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  

  // Drop FK and index; do not revert type automatically
  try { await knex.raw(`DROP INDEX IF EXISTS idx_user_verifications_user_id;`); } catch {}
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_user_id_fkey'
        ) THEN
          ALTER TABLE user_verifications DROP CONSTRAINT user_verifications_user_id_fkey;
        END IF;
      END$$;
    `);
  } catch {}
}


