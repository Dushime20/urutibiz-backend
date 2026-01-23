import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  const hasColumn = await knex.schema.hasColumn('bookings', 'return_time');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('return_time');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_return_time ON bookings(return_time)`);
    console.log('✅ Added bookings.return_time timestamp');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_return_time`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'return_time');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('return_time');
    });
  }
}
