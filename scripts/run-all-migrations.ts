#!/usr/bin/env ts-node
/**
 * Run All Migrations Script
 * 
 * This script:
 * 1. Checks current migration status
 * 2. Runs all pending migrations
 * 3. Verifies critical columns exist (especially for bookings table)
 * 4. Provides detailed output about what was done
 * 
 * Usage:
 *   npm run migrate:all
 *   OR
 *   ts-node -r tsconfig-paths/register scripts/run-all-migrations.ts
 */

import { connectDatabase, getDatabase } from '../src/config/database';
import * as path from 'path';
import { execSync } from 'child_process';

// Required columns for bookings table (from migrations)
const REQUIRED_BOOKINGS_COLUMNS = [
  'owner_confirmed',
  'owner_confirmation_status',
  'owner_confirmed_at',
  'owner_rejection_reason',
  'owner_confirmation_notes',
  'base_amount',
  'specifications',
  'location',
  'features',
  'pickup_time',
  'return_time',
  'delivery_address',
  'delivery_coordinates',
  'pickup_methods'
];

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.raw(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = ? AND column_name = ?
  `, [tableName, columnName]);
  return result.rows.length > 0;
}

async function verifyBookingsTable() {
  const db = getDatabase();
  console.log('\n📋 Verifying bookings table structure...\n');
  
  const tableExists = await db.schema.hasTable('bookings');
  if (!tableExists) {
    console.log('⚠️  bookings table does not exist!');
    return { missing: REQUIRED_BOOKINGS_COLUMNS, exists: false };
  }
  
  const missingColumns: string[] = [];
  const existingColumns: string[] = [];
  
  for (const column of REQUIRED_BOOKINGS_COLUMNS) {
    const exists = await checkColumnExists('bookings', column);
    if (exists) {
      existingColumns.push(column);
      console.log(`   ✅ ${column}`);
    } else {
      missingColumns.push(column);
      console.log(`   ❌ ${column} - MISSING`);
    }
  }
  
  return { missing: missingColumns, exists: true, existing: existingColumns };
}

async function checkMigrationStatus() {
  const db = getDatabase();
  
  // Check if knex_migrations table exists
  const migrationsTableExists = await db.schema.hasTable('knex_migrations');
  
  if (!migrationsTableExists) {
    console.log('⚠️  knex_migrations table does not exist - this is a fresh database');
    return { tableExists: false, migrations: [] };
  }
  
  // Get all migrations
  const migrations = await db('knex_migrations')
    .orderBy('id', 'asc')
    .select('*');
  
  return { tableExists: true, migrations };
}

async function runMigrations() {
  console.log('\n🚀 Running all pending migrations...\n');
  
  try {
    // Use knex CLI to run migrations
    execSync('npx knex migrate:latest', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: process.env
    });
    
    console.log('\n✅ Migrations completed successfully!\n');
    return true;
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     UrutiBiz - Complete Migration & Verification Script    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Connect to database
    console.log('📡 Step 1: Connecting to database...');
    await connectDatabase();
    const db = getDatabase();
    console.log('✅ Database connected\n');
    
    // Step 2: Check migration status
    console.log('📊 Step 2: Checking migration status...');
    const migrationStatus = await checkMigrationStatus();
    
    if (migrationStatus.tableExists) {
      console.log(`   Found ${migrationStatus.migrations.length} completed migrations`);
      if (migrationStatus.migrations.length > 0) {
        console.log('   Last migration:', migrationStatus.migrations[migrationStatus.migrations.length - 1].name);
      }
    } else {
      console.log('   No migration history found');
    }
    
    // Step 3: Verify bookings table structure (before migrations)
    console.log('\n🔍 Step 3: Checking bookings table structure (before migrations)...');
    const beforeStatus = await verifyBookingsTable();
    
    if (beforeStatus.missing.length > 0) {
      console.log(`\n⚠️  Found ${beforeStatus.missing.length} missing columns in bookings table`);
    }
    
    // Step 4: Run migrations
    console.log('\n🔄 Step 4: Running all pending migrations...');
    const migrationSuccess = await runMigrations();
    
    if (!migrationSuccess) {
      console.error('\n❌ Migrations failed! Please check the error messages above.');
      process.exit(1);
    }
    
    // Step 5: Verify bookings table structure (after migrations)
    console.log('\n🔍 Step 5: Verifying bookings table structure (after migrations)...');
    const afterStatus = await verifyBookingsTable();
    
    // Step 6: Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    MIGRATION SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    if (afterStatus.missing.length === 0) {
      console.log('✅ All required columns exist in bookings table!');
      console.log(`   Total columns verified: ${afterStatus.existing.length}`);
    } else {
      console.log('⚠️  Some columns are still missing:');
      afterStatus.missing.forEach(col => {
        console.log(`   ❌ ${col}`);
      });
      console.log('\n💡 If columns are still missing, the migration may have failed.');
      console.log('   Check the migration output above for errors.');
    }
    
    // Check for critical owner_confirmation columns
    const criticalColumns = ['owner_confirmed', 'owner_confirmation_status'];
    const missingCritical = criticalColumns.filter(col => 
      afterStatus.missing.includes(col)
    );
    
    if (missingCritical.length > 0) {
      console.log('\n❌ CRITICAL: Missing owner confirmation columns!');
      console.log('   These are required for booking creation to work.');
      console.log('   Missing:', missingCritical.join(', '));
      console.log('\n💡 Solution:');
      console.log('   1. Check if migration 20250125_add_owner_confirmation_to_bookings.ts exists');
      console.log('   2. Manually run: npx knex migrate:up 20250125_add_owner_confirmation_to_bookings.ts');
      console.log('   3. Or check database permissions');
      process.exit(1);
    } else {
      console.log('\n✅ All critical columns (owner_confirmed, owner_confirmation_status) exist!');
    }
    
    console.log('\n🎉 Migration process completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test booking creation');
    console.log('   2. Verify all features work as expected');
    console.log('   3. Check application logs for any issues\n');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error during migration process:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Close database connection
    const db = getDatabase();
    if (db) {
      await db.destroy();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runAllMigrations };

