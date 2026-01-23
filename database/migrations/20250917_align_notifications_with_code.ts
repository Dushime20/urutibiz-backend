import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  

  // Add columns only if they don't exist
  const needsUserId = !(await knex.schema.hasColumn('notifications', 'user_id'));
  const needsIsRead = !(await knex.schema.hasColumn('notifications', 'is_read'));
  const needsReadAt = !(await knex.schema.hasColumn('notifications', 'read_at'));

  if (needsUserId || needsIsRead || needsReadAt) {
    await knex.schema.alterTable('notifications', (table) => {
      if (needsUserId) table.uuid('user_id');
      if (needsIsRead) table.boolean('is_read').defaultTo(false);
      if (needsReadAt) table.timestamp('read_at', { useTz: true });
    });
    console.log('✅ Added missing notification columns');
  } else {
    
  }

  // Add FK to users if not present and table exists
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey'
        ) THEN
          ALTER TABLE notifications
            ADD CONSTRAINT notifications_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
    console.log('✅ Ensured FK notifications.user_id -> users.id');
  } else {
    
  }

  // Indexes
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`);
  console.log('✅ Ensured notification indexes');
}

export async function down(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  

  // Drop FK if exists
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey'
        ) THEN
          ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
        END IF;
      END$$;
    `);
  } catch {}

  // Drop indexes if exist
  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_user_id;`); } catch {}
  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_is_read;`); } catch {}
  try { await knex.raw(`DROP INDEX IF EXISTS idx_notifications_created_at;`); } catch {}

  // Drop columns if exist
  const hasUserId = await knex.schema.hasColumn('notifications', 'user_id');
  const hasIsRead = await knex.schema.hasColumn('notifications', 'is_read');
  const hasReadAt = await knex.schema.hasColumn('notifications', 'read_at');
  if (hasUserId || hasIsRead || hasReadAt) {
    await knex.schema.alterTable('notifications', (table) => {
      if (hasUserId) table.dropColumn('user_id');
      if (hasIsRead) table.dropColumn('is_read');
      if (hasReadAt) table.dropColumn('read_at');
    });
  }
}


