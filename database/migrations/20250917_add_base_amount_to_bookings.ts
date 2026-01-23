import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  const hasColumn = await knex.schema.hasColumn('bookings', 'base_amount');
  if (!hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.decimal('base_amount', 12, 2).notNullable().defaultTo(0);
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_base_amount ON bookings(base_amount)`);
    console.log('✅ Added bookings.base_amount decimal(12,2) DEFAULT 0 NOT NULL');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  
  try { await knex.raw(`DROP INDEX IF EXISTS idx_bookings_base_amount`); } catch {}
  const hasColumn = await knex.schema.hasColumn('bookings', 'base_amount');
  if (hasColumn) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('base_amount');
    });
  }
}


