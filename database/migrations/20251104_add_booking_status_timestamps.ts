import { Knex } from 'knex';

/**
 * Migration: Add status timestamp columns to bookings table
 * 
 * Adds the following timestamp columns for tracking booking status transitions:
 * - confirmed_at: When the booking was confirmed (after payment completion)
 * - started_at: When the rental period started (auto-started by scheduler)
 * - completed_at: When the rental period completed (auto-completed by scheduler)
 * - cancelled_at: When the booking was cancelled
 * 
 * These columns are used by:
 * - PaymentTransactionService: Sets confirmed_at when payment completes
 * - BookingSchedulerService: Sets started_at and completed_at for automated transitions
 * - Booking cancellation logic: Sets cancelled_at when booking is cancelled
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  // Add confirmed_at column
  const hasConfirmedAt = await knex.schema.hasColumn('bookings', 'confirmed_at');
  if (!hasConfirmedAt) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('confirmed_at', { useTz: true }).nullable().comment('When the booking was confirmed (after payment completion)');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_at ON bookings(confirmed_at)`);
    console.log('✅ Added confirmed_at column to bookings table');
  } else {
    
  }

  // Add started_at column
  const hasStartedAt = await knex.schema.hasColumn('bookings', 'started_at');
  if (!hasStartedAt) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('started_at', { useTz: true }).nullable().comment('When the rental period started (auto-started by scheduler)');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_started_at ON bookings(started_at)`);
    console.log('✅ Added started_at column to bookings table');
  } else {
    
  }

  // Add completed_at column
  const hasCompletedAt = await knex.schema.hasColumn('bookings', 'completed_at');
  if (!hasCompletedAt) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('completed_at', { useTz: true }).nullable().comment('When the rental period completed (auto-completed by scheduler)');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_completed_at ON bookings(completed_at)`);
    console.log('✅ Added completed_at column to bookings table');
  } else {
    
  }

  // Add cancelled_at column
  const hasCancelledAt = await knex.schema.hasColumn('bookings', 'cancelled_at');
  if (!hasCancelledAt) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('cancelled_at', { useTz: true }).nullable().comment('When the booking was cancelled');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at)`);
    console.log('✅ Added cancelled_at column to bookings table');
  } else {
    
  }

  console.log('✅ Booking status timestamps migration completed');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  // Drop indexes first
  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_bookings_confirmed_at`);
  } catch (error) {
    console.log('⚠️ Could not drop idx_bookings_confirmed_at:', error);
  }

  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_bookings_started_at`);
  } catch (error) {
    console.log('⚠️ Could not drop idx_bookings_started_at:', error);
  }

  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_bookings_completed_at`);
  } catch (error) {
    console.log('⚠️ Could not drop idx_bookings_completed_at:', error);
  }

  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_bookings_cancelled_at`);
  } catch (error) {
    console.log('⚠️ Could not drop idx_bookings_cancelled_at:', error);
  }

  // Drop columns
  const columnsToDrop = ['confirmed_at', 'started_at', 'completed_at', 'cancelled_at'];
  
  for (const columnName of columnsToDrop) {
    const hasColumn = await knex.schema.hasColumn('bookings', columnName);
    if (hasColumn) {
      await knex.schema.alterTable('bookings', (table) => {
        table.dropColumn(columnName);
      });
      console.log(`✅ Dropped ${columnName} column from bookings table`);
    }
  }

  console.log('✅ Reverted booking status timestamps migration');
}

