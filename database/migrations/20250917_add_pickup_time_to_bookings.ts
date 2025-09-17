import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('bookings', 'pickup_time');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('pickup_time');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_pickup_time ON bookings(pickup_time)`);
    console.log('✅ Added bookings.pickup_time timestamp');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_pickup_time`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'pickup_time');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('pickup_time');
    });
  }
}
