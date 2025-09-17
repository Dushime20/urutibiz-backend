import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_notification_preferences');
  if (!hasTable) {
    console.log('⚠️ user_notification_preferences table missing; skipping');
    return;
  }

  // Ensure defaults on columns where applicable
  const hasPreferences = await knex.schema.hasColumn('user_notification_preferences', 'preferences');
  const hasEnabledChannels = await knex.schema.hasColumn('user_notification_preferences', 'enabled_channels');
  const hasCreatedAt = await knex.schema.hasColumn('user_notification_preferences', 'created_at');
  const hasUpdatedAt = await knex.schema.hasColumn('user_notification_preferences', 'updated_at');

  if (hasPreferences) {
    await knex.raw(`ALTER TABLE user_notification_preferences ALTER COLUMN preferences SET DEFAULT '{}'::jsonb`);
  }
  if (hasEnabledChannels) {
    // Normalize to varchar(20)[] and set default
    try {
      await knex.raw(`
        DO $$
        DECLARE v_type text;
        BEGIN
          SELECT atttypid::regtype::text INTO v_type
          FROM pg_attribute
          WHERE attrelid = 'user_notification_preferences'::regclass AND attname = 'enabled_channels' AND NOT attisdropped;
          IF v_type <> 'character varying[]' THEN
            ALTER TABLE user_notification_preferences ALTER COLUMN enabled_channels TYPE varchar(20)[] USING enabled_channels::varchar(20)[];
          END IF;
        END$$;
      `);
    } catch {}
    await knex.raw(`ALTER TABLE user_notification_preferences ALTER COLUMN enabled_channels SET DEFAULT ARRAY['email']::varchar(20)[]`);
  }
  if (hasCreatedAt) {
    await knex.raw(`ALTER TABLE user_notification_preferences ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP`);
  }
  if (hasUpdatedAt) {
    await knex.raw(`ALTER TABLE user_notification_preferences ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP`);
  }

  // Ensure uniqueness per user (optional name dimension ignored if not present)
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'uk_user_notification_preferences_user_id'
        ) THEN
          CREATE UNIQUE INDEX uk_user_notification_preferences_user_id ON user_notification_preferences(user_id);
        END IF;
      END$$;
    `);
  } catch {}

  // Seed missing preferences for existing users
  await knex.raw(`
    INSERT INTO user_notification_preferences (user_id, preferences, enabled_channels)
    SELECT u.id, '{}'::jsonb, ARRAY['email']::varchar(20)[]
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM user_notification_preferences p WHERE p.user_id = u.id
    );
  `);
  console.log('✅ Ensured default user notification preferences');
}

export async function down(knex: Knex): Promise<void> {
  // Down: try to drop the unique index; keep data
  try {
    await knex.raw(`DROP INDEX IF EXISTS uk_user_notification_preferences_user_id;`);
  } catch {}
}


