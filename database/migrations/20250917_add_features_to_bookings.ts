import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  const hasColumn = await knex.schema.hasColumn('bookings', 'features');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.jsonb('features').defaultTo('{}');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_features ON bookings USING GIN(features)`);
    console.log('✅ Added bookings.features jsonb DEFAULT {}');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_features`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'features');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('features');
    });
  }
}
