import { Knex } from 'knex';

/**
 * Migration: Add owner confirmation system to bookings
 * 
 * Adds fields to track product owner confirmation before payment:
 * - owner_confirmed: Boolean flag indicating if owner has confirmed the booking
 * - owner_confirmation_status: Status of owner confirmation (pending, confirmed, rejected)
 * - owner_confirmed_at: Timestamp when owner confirmed
 * - owner_rejection_reason: Reason if owner rejected the booking
 * - owner_confirmation_notes: Additional notes from owner during confirmation
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  // Add owner_confirmed boolean column
  const hasOwnerConfirmed = await knex.schema.hasColumn('bookings', 'owner_confirmed');
  if (!hasOwnerConfirmed) {
    await knex.schema.alterTable('bookings', (table) => {
      table.boolean('owner_confirmed').defaultTo(false).comment('Whether product owner has confirmed the booking');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmed ON bookings(owner_confirmed)`);
    console.log('✅ Added owner_confirmed column to bookings table');
  } else {
    
  }

  // Add owner_confirmation_status column
  const hasOwnerConfirmationStatus = await knex.schema.hasColumn('bookings', 'owner_confirmation_status');
  if (!hasOwnerConfirmationStatus) {
    await knex.schema.alterTable('bookings', (table) => {
      table.string('owner_confirmation_status', 50).defaultTo('pending').comment('Status: pending, confirmed, rejected');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmation_status ON bookings(owner_confirmation_status)`);
    console.log('✅ Added owner_confirmation_status column to bookings table');
  } else {
    
  }

  // Add owner_confirmed_at timestamp
  const hasOwnerConfirmedAt = await knex.schema.hasColumn('bookings', 'owner_confirmed_at');
  if (!hasOwnerConfirmedAt) {
    await knex.schema.alterTable('bookings', (table) => {
      table.timestamp('owner_confirmed_at', { useTz: true }).nullable().comment('When the owner confirmed the booking');
    });
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmed_at ON bookings(owner_confirmed_at)`);
    console.log('✅ Added owner_confirmed_at column to bookings table');
  } else {
    
  }

  // Add owner_rejection_reason text field
  const hasOwnerRejectionReason = await knex.schema.hasColumn('bookings', 'owner_rejection_reason');
  if (!hasOwnerRejectionReason) {
    await knex.schema.alterTable('bookings', (table) => {
      table.text('owner_rejection_reason').nullable().comment('Reason provided by owner for rejecting the booking');
    });
    console.log('✅ Added owner_rejection_reason column to bookings table');
  } else {
    
  }

  // Add owner_confirmation_notes text field
  const hasOwnerConfirmationNotes = await knex.schema.hasColumn('bookings', 'owner_confirmation_notes');
  if (!hasOwnerConfirmationNotes) {
    await knex.schema.alterTable('bookings', (table) => {
      table.text('owner_confirmation_notes').nullable().comment('Additional notes from owner during confirmation');
    });
    console.log('✅ Added owner_confirmation_notes column to bookings table');
  } else {
    
  }

  console.log('✅ Owner confirmation migration completed');
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('bookings');
  

  // Remove columns in reverse order
  const columnsToRemove = [
    'owner_confirmation_notes',
    'owner_rejection_reason',
    'owner_confirmed_at',
    'owner_confirmation_status',
    'owner_confirmed'
  ];

  for (const column of columnsToRemove) {
    const hasColumn = await knex.schema.hasColumn('bookings', column);
    if (hasColumn) {
      await knex.schema.alterTable('bookings', (table) => {
        table.dropColumn(column);
      });
      console.log(`✅ Removed ${column} column from bookings table`);
    }
  }

  // Drop indexes
  await knex.raw(`DROP INDEX IF EXISTS idx_bookings_owner_confirmed_at`);
  await knex.raw(`DROP INDEX IF EXISTS idx_bookings_owner_confirmation_status`);
  await knex.raw(`DROP INDEX IF EXISTS idx_bookings_owner_confirmed`);

  console.log('✅ Owner confirmation rollback completed');
}

