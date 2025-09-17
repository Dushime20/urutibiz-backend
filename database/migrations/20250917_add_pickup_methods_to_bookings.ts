import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('bookings', 'pickup_methods');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.jsonb('pickup_methods').defaultTo('[]');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_pickup_methods ON bookings USING GIN(pickup_methods)`);
    console.log('✅ Added bookings.pickup_methods jsonb DEFAULT []');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_pickup_methods`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'pickup_methods');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('pickup_methods');
    });
  }
}
