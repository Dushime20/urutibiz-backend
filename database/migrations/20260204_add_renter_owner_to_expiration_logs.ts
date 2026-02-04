import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add renter_id and owner_id columns to booking_expiration_logs
  await knex.schema.alterTable('booking_expiration_logs', (table) => {
    table.uuid('renter_id').nullable().comment('Renter who made the booking');
    table.uuid('owner_id').nullable().comment('Owner of the product');
    
    table.index(['renter_id']);
    table.index(['owner_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('booking_expiration_logs', (table) => {
    table.dropColumn('renter_id');
    table.dropColumn('owner_id');
  });
}
