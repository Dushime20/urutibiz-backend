import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create booking status history table for comprehensive audit trail
  const exists = await knex.schema.hasTable('booking_status_history');
  if (!exists) {
    await knex.schema.createTable('booking_status_history', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
      table.string('previous_status', 50);
      table.string('new_status', 50).notNullable();
      table.uuid('changed_by').notNullable().references('id').inTable('users');
      table.text('reason');
      table.jsonb('metadata'); // Additional context for the change
      table.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());
      // Indexes for performance
      table.index(['booking_id', 'changed_at']);
      table.index(['changed_by']);
      table.index(['new_status']);
      table.index(['changed_at']);
    });
    console.log('✅ Created booking_status_history table with audit trail functionality');
  } else {
    console.log('ℹ️ booking_status_history table already exists, skipping creation');
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking_status_history');
  console.log('❌ Dropped booking_status_history table');
}
