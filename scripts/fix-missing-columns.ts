#!/usr/bin/env ts-node
/**
 * Fix Missing Columns Script
 * 
 * This script manually adds missing columns that should exist but don't.
 * Use this when migrations show as "run" but columns are missing.
 * 
 * Usage:
 *   ts-node -r tsconfig-paths/register scripts/fix-missing-columns.ts
 */

import { connectDatabase, getDatabase } from '../src/config/database';

async function fixMissingColumns() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Fix Missing Database Columns Script               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDatabase();
    const db = getDatabase();
    console.log('✅ Database connected\n');
    
    // Fix products table - view_count
    console.log('📦 Fixing products table...');
    const hasProducts = await db.schema.hasTable('products');
    if (hasProducts) {
      const hasViewCount = await db.schema.hasColumn('products', 'view_count');
      if (!hasViewCount) {
        console.log('   Adding view_count column...');
        await db.schema.alterTable('products', (table) => {
          table.integer('view_count').defaultTo(0).comment('Number of views for this product');
        });
        console.log('   ✅ Added view_count column to products table');
      } else {
        console.log('   ✅ view_count column already exists');
      }
    } else {
      console.log('   ⚠️  products table does not exist');
    }
    
    // Fix bookings table - owner confirmation columns
    console.log('\n📦 Fixing bookings table...');
    const hasBookings = await db.schema.hasTable('bookings');
    if (hasBookings) {
      // owner_confirmed
      const hasOwnerConfirmed = await db.schema.hasColumn('bookings', 'owner_confirmed');
      if (!hasOwnerConfirmed) {
        console.log('   Adding owner_confirmed column...');
        await db.schema.alterTable('bookings', (table) => {
          table.boolean('owner_confirmed').defaultTo(false).comment('Whether product owner has confirmed the booking');
        });
        await db.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmed ON bookings(owner_confirmed)`);
        console.log('   ✅ Added owner_confirmed column');
      } else {
        console.log('   ✅ owner_confirmed column already exists');
      }
      
      // owner_confirmation_status
      const hasOwnerConfirmationStatus = await db.schema.hasColumn('bookings', 'owner_confirmation_status');
      if (!hasOwnerConfirmationStatus) {
        console.log('   Adding owner_confirmation_status column...');
        await db.schema.alterTable('bookings', (table) => {
          table.string('owner_confirmation_status', 50).defaultTo('pending').comment('Status: pending, confirmed, rejected');
        });
        await db.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmation_status ON bookings(owner_confirmation_status)`);
        console.log('   ✅ Added owner_confirmation_status column');
      } else {
        console.log('   ✅ owner_confirmation_status column already exists');
      }
      
      // owner_confirmed_at
      const hasOwnerConfirmedAt = await db.schema.hasColumn('bookings', 'owner_confirmed_at');
      if (!hasOwnerConfirmedAt) {
        console.log('   Adding owner_confirmed_at column...');
        await db.schema.alterTable('bookings', (table) => {
          table.timestamp('owner_confirmed_at', { useTz: true }).nullable().comment('When the owner confirmed the booking');
        });
        await db.raw(`CREATE INDEX IF NOT EXISTS idx_bookings_owner_confirmed_at ON bookings(owner_confirmed_at)`);
        console.log('   ✅ Added owner_confirmed_at column');
      } else {
        console.log('   ✅ owner_confirmed_at column already exists');
      }
      
      // owner_rejection_reason
      const hasOwnerRejectionReason = await db.schema.hasColumn('bookings', 'owner_rejection_reason');
      if (!hasOwnerRejectionReason) {
        console.log('   Adding owner_rejection_reason column...');
        await db.schema.alterTable('bookings', (table) => {
          table.text('owner_rejection_reason').nullable().comment('Reason provided by owner for rejecting the booking');
        });
        console.log('   ✅ Added owner_rejection_reason column');
      } else {
        console.log('   ✅ owner_rejection_reason column already exists');
      }
      
      // owner_confirmation_notes
      const hasOwnerConfirmationNotes = await db.schema.hasColumn('bookings', 'owner_confirmation_notes');
      if (!hasOwnerConfirmationNotes) {
        console.log('   Adding owner_confirmation_notes column...');
        await db.schema.alterTable('bookings', (table) => {
          table.text('owner_confirmation_notes').nullable().comment('Additional notes from owner during confirmation');
        });
        console.log('   ✅ Added owner_confirmation_notes column');
      } else {
        console.log('   ✅ owner_confirmation_notes column already exists');
      }
    } else {
      console.log('   ⚠️  bookings table does not exist');
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY                                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('✅ All missing columns have been added!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your application: pm2 restart urutibiz-backend');
    console.log('   2. Test product fetching - view_count error should be resolved');
    console.log('   3. Test booking creation - owner confirmation should work\n');
    
  } catch (error: any) {
    console.error('\n❌ Error fixing columns:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    const db = getDatabase();
    if (db) {
      await db.destroy();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run the script
if (require.main === module) {
  fixMissingColumns().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { fixMissingColumns };

