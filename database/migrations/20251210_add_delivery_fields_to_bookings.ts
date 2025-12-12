import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  // Add delivery_time_window column
  const hasDeliveryTimeWindow = await knex.schema.hasColumn('bookings', 'delivery_time_window');
  if (!hasDeliveryTimeWindow) {
    await knex.schema.alterTable('bookings', (table) => {
      table.string('delivery_time_window', 50); // morning, afternoon, evening, flexible
    });
    console.log('✅ Added bookings.delivery_time_window');
  }

  // Add meet_public_location column
  const hasMeetPublicLocation = await knex.schema.hasColumn('bookings', 'meet_public_location');
  if (!hasMeetPublicLocation) {
    await knex.schema.alterTable('bookings', (table) => {
      table.text('meet_public_location');
    });
    console.log('✅ Added bookings.meet_public_location');
  }

  // Add meet_public_coordinates column
  const hasMeetPublicCoordinates = await knex.schema.hasColumn('bookings', 'meet_public_coordinates');
  if (!hasMeetPublicCoordinates) {
    await knex.schema.alterTable('bookings', (table) => {
      table.jsonb('meet_public_coordinates'); // {lat, lng}
    });
    console.log('✅ Added bookings.meet_public_coordinates');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  if (!hasTable) return;

  const hasDeliveryTimeWindow = await knex.schema.hasColumn('bookings', 'delivery_time_window');
  if (hasDeliveryTimeWindow) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('delivery_time_window');
    });
  }

  const hasMeetPublicLocation = await knex.schema.hasColumn('bookings', 'meet_public_location');
  if (hasMeetPublicLocation) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('meet_public_location');
    });
  }

  const hasMeetPublicCoordinates = await knex.schema.hasColumn('bookings', 'meet_public_coordinates');
  if (hasMeetPublicCoordinates) {
    await knex.schema.alterTable('bookings', (table) => {
      table.dropColumn('meet_public_coordinates');
    });
  }
}

