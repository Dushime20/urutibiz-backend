import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) return;

  // Ensure required columns exist and have expected defaults/types
  const hasIsRead = await knex.schema.hasColumn('notifications', 'is_read');
  const hasCreatedAt = await knex.schema.hasColumn('notifications', 'created_at');
  const hasUserId = await knex.schema.hasColumn('notifications', 'user_id');
  const hasTemplateId = await knex.schema.hasColumn('notifications', 'template_id');
  const hasChannels = await knex.schema.hasColumn('notifications', 'channels');

  // 1) Set defaults where missing
  if (hasIsRead) {
    await knex.raw(`ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT false`);
  }
  if (hasCreatedAt) {
    await knex.raw(`ALTER TABLE notifications ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP`);
  }

  // 2) Normalize channels type to varchar(20)[] if possible
  if (hasChannels) {
    try {
      await knex.raw(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'varchar') THEN
            -- nothing; built-in
            NULL;
          END IF;
        END$$;
      `);
      // Only alter if it's not already varchar[]
      await knex.raw(`
        DO $$
        DECLARE
          v_type text;
        BEGIN
          SELECT atttypid::regtype::text INTO v_type
          FROM pg_attribute
          WHERE attrelid = 'notifications'::regclass AND attname = 'channels' AND NOT attisdropped;
          IF v_type <> 'character varying[]' THEN
            ALTER TABLE notifications ALTER COLUMN channels TYPE varchar(20)[] USING channels::varchar(20)[];
          END IF;
        END$$;
      `);
    } catch (e) {
      console.log('⚠️ Skipping channels type normalization');
    }
  }

  // 3) Ensure FKs
  if (hasUserId) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
          ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
  }
  if (hasTemplateId) {
    const hasTemplates = await knex.schema.hasTable('notification_templates');
    if (hasTemplates) {
      await knex.raw(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_template_id_fkey') THEN
            ALTER TABLE notifications ADD CONSTRAINT notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL;
          END IF;
        END$$;
      `);
    }
  }

  // 4) Indexes
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`);
}

export async function down(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) return;

  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_is_read;`); } catch {}
  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_created_at;`); } catch {}
  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_user_id;`); } catch {}

  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_template_id_fkey') THEN
          ALTER TABLE notifications DROP CONSTRAINT notifications_template_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
          ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
        END IF;
      END$$;
    `);
  } catch {}
}


