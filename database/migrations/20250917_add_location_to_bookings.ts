import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  const hasColumn = await knex.schema.hasColumn('bookings', 'location');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.specificType('location', 'geometry(POINT, 4326)');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings USING GIST(location)`);
    console.log('✅ Added bookings.location geometry(POINT, 4326)');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_location`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'location');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('location');
    });
  }
}
