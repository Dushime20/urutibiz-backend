import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) {
    
    return;
  }

  const columns = await knex('notifications').columnInfo().catch(() => ({}));

  const needsRecipientId = !('recipient_id' in columns);
  const needsNotificationType = !('notification_type' in columns);
  const needsData = !('data' in columns);
  const needsChannelResults = !('channel_results' in columns);
  const needsScheduledAt = !('scheduled_at' in columns);
  const needsDeliveredAt = !('delivered_at' in columns);
  const needsExpiresAt = !('expires_at' in columns);
  const needsPriority = !('priority' in columns);
  const needsStatus = !('status' in columns);

  if (
    needsRecipientId ||
    needsNotificationType ||
    needsData ||
    needsChannelResults ||
    needsScheduledAt ||
    needsDeliveredAt ||
    needsExpiresAt ||
    needsPriority ||
    needsStatus
  ) {
    await knex.schema.alterTable('notifications', (table) => {
      if (needsRecipientId) table.uuid('recipient_id').index();
      if (needsNotificationType) table.string('notification_type', 100).defaultTo('system');
      if (needsData) table.jsonb('data').defaultTo('{}');
      if (needsChannelResults) table.jsonb('channel_results').defaultTo('{}');
      if (needsScheduledAt) table.timestamp('scheduled_at', { useTz: true }).defaultTo(knex.fn.now());
      if (needsDeliveredAt) table.timestamp('delivered_at', { useTz: true });
      if (needsExpiresAt) table.timestamp('expires_at', { useTz: true });
      if (needsPriority) table.string('priority', 20).defaultTo('normal');
      if (needsStatus) table.string('status', 30).defaultTo('pending');
    });
    console.log('✅ Added missing notification columns');
  } else {
    console.log('ℹ️ Notification columns already aligned');
  }

  // Ensure JSON defaults are objects/arrays for existing rows
  await knex.raw(`
    UPDATE notifications
    SET data = COALESCE(data, '{}'::jsonb),
        metadata = COALESCE(metadata, '{}'::jsonb),
        channel_results = COALESCE(channel_results, '{}'::jsonb)
  `);
}

export async function down(knex: Knex): Promise<void> {
  const hasNotifications = await knex.schema.hasTable('notifications');
  

  const dropColumn = async (column: string) => {
    const exists = await knex.schema.hasColumn('notifications', column);
    if (exists) {
      await knex.schema.alterTable('notifications', (table) => {
        table.dropColumn(column);
      });
    }
  };

  await dropColumn('channel_results');
  await dropColumn('notification_type');
  await dropColumn('data');
  await dropColumn('scheduled_at');
  await dropColumn('delivered_at');
  await dropColumn('expires_at');
  await dropColumn('priority');
  await dropColumn('status');
  await dropColumn('recipient_id');
}

