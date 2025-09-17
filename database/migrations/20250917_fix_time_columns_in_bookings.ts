import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  // Change pickup_time and return_time from timestamp to time
  const hasPickupTime = await knex.schema.hasColumn('bookings', 'pickup_time');
  const hasReturnTime = await knex.schema.hasColumn('bookings', 'return_time');

  if (hasPickupTime || hasReturnTime) {
    await knex.schema.alterTable('bookings', (table) => {
      if (hasPickupTime) {
        table.dropColumn('pickup_time');
      }
      if (hasReturnTime) {
        table.dropColumn('return_time');
      }
    });

    await knex.schema.alterTable('bookings', (table) => {
      if (hasPickupTime) {
        table.time('pickup_time');
      }
      if (hasReturnTime) {
        table.time('return_time');
      }
    });

    console.log('✅ Changed bookings.pickup_time and return_time to time type');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  const hasPickupTime = await knex.schema.hasColumn('bookings', 'pickup_time');
  const hasReturnTime = await knex.schema.hasColumn('bookings', 'return_time');

  if (hasPickupTime || hasReturnTime) {
    await knex.schema.alterTable('bookings', (table) => {
      if (hasPickupTime) {
        table.dropColumn('pickup_time');
      }
      if (hasReturnTime) {
        table.dropColumn('return_time');
      }
    });

    await knex.schema.alterTable('bookings', (table) => {
      if (hasPickupTime) {
        table.timestamp('pickup_time');
      }
      if (hasReturnTime) {
        table.timestamp('return_time');
      }
    });
  }
}
