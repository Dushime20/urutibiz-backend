import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('bookings', 'specifications');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.jsonb('specifications').defaultTo('{}');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_specifications ON bookings USING GIN(specifications)`);
    console.log('✅ Added bookings.specifications jsonb DEFAULT {}');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_specifications`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'specifications');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('specifications');
    });
  }
}
