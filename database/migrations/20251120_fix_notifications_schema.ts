import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) {
    
    return;
  }

  const ensureColumn = async (column: string, cb: (table: Knex.AlterTableBuilder) => void) => {
    const exists = await knex.schema.hasColumn('notifications', column);
    if (!exists) {
      await knex.schema.alterTable('notifications', cb);
      console.log(`✅ Added notifications.${column}`);
    }
  };

  await ensureColumn('recipient_id', (table) => table.uuid('recipient_id').index());
  await ensureColumn('notification_type', (table) => table.string('notification_type', 100).defaultTo('system'));
  await ensureColumn('data', (table) => table.jsonb('data').defaultTo('{}'));
  await ensureColumn('channel_results', (table) => table.jsonb('channel_results').defaultTo('{}'));
  await ensureColumn('scheduled_at', (table) => table.timestamp('scheduled_at', { useTz: true }).defaultTo(knex.fn.now()));
  await ensureColumn('delivered_at', (table) => table.timestamp('delivered_at', { useTz: true }));
  await ensureColumn('expires_at', (table) => table.timestamp('expires_at', { useTz: true }));
  await ensureColumn('priority', (table) => table.string('priority', 20).defaultTo('normal'));
  await ensureColumn('status', (table) => table.string('status', 30).defaultTo('pending'));
  await ensureColumn('updated_at', (table) => table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()));

  // Normalize existing rows to avoid null JSON fields
  await knex.raw(`
    UPDATE notifications
    SET data = COALESCE(data, '{}'::jsonb),
        metadata = COALESCE(metadata, '{}'::jsonb),
        channel_results = COALESCE(channel_results, '{}'::jsonb)
  `);

  const hasPreferences = await knex.schema.hasTable('notification_preferences');
  if (!hasPreferences) {
    await knex.schema.createTable('notification_preferences', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().unique();
      table.boolean('email').defaultTo(true);
      table.boolean('sms').defaultTo(false);
      table.boolean('push').defaultTo(true);
      table.boolean('webhook').defaultTo(false);
      table.boolean('in_app').defaultTo(true);
      table.boolean('quiet_hours_enabled').defaultTo(false);
      table.time('quiet_hours_start').defaultTo('22:00');
      table.time('quiet_hours_end').defaultTo('08:00');
      table.string('timezone', 50).defaultTo('UTC');
      table.jsonb('type_preferences').defaultTo('{}');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
    console.log('✅ Created notification_preferences table');
  }
}

export async function down(_knex: Knex): Promise<void> {
  // No-op: we only add columns if they were missing
}

