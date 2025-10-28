#!/usr/bin/env ts-node

import { connectDatabase, getDatabase } from '../src/config/database';

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Connect to database first
    await connectDatabase();
    const db = getDatabase();
    
    // Check if users table exists
    const tableExists = await db.schema.hasTable('users');
    console.log(`📋 Users table exists: ${tableExists ? '✅ YES' : '❌ NO'}`);
    
    if (!tableExists) {
      console.log('\n❌ Users table does not exist! This is why the email column error occurs.');
      console.log('💡 Solution: Run migrations to create the users table');
      return;
    }
    
    // Get table structure
    console.log('\n📊 Users table structure:');
    const columns = await db('users').columnInfo();
    
    console.log('\nColumns found:');
    Object.keys(columns).forEach(columnName => {
      const column = columns[columnName];
      console.log(`  - ${columnName}: ${column.type} ${column.nullable ? '(nullable)' : '(not null)'}`);
    });
    
    // Check specifically for email column
    const hasEmail = await db.schema.hasColumn('users', 'email');
    console.log(`\n📧 Email column exists: ${hasEmail ? '✅ YES' : '❌ NO'}`);
    
    // Check for other important columns
    const importantColumns = ['id', 'first_name', 'last_name', 'phone_number', 'role', 'email_verified'];
    console.log('\n🔍 Checking important columns:');
    for (const col of importantColumns) {
      const exists = await db.schema.hasColumn('users', col);
      console.log(`  - ${col}: ${exists ? '✅' : '❌'}`);
    }
    
    // Try to get a sample record to see actual data structure
    console.log('\n📝 Sample data structure:');
    try {
      const sampleUser = await db('users').first();
      if (sampleUser) {
        console.log('Sample user record keys:', Object.keys(sampleUser));
        console.log('Sample user data:', JSON.stringify(sampleUser, null, 2));
      } else {
        console.log('No users found in table');
      }
    } catch (error: any) {
      console.log('Error fetching sample data:', error.message);
    }
    
    // Check migration status
    console.log('\n🔄 Migration status:');
    try {
      const migrations = await db('knex_migrations').select('*').orderBy('batch', 'desc').orderBy('migration_time', 'desc');
      console.log(`Total migrations run: ${migrations.length}`);
      console.log('Recent migrations:');
      migrations.slice(0, 5).forEach(migration => {
        console.log(`  - ${migration.name} (batch ${migration.batch})`);
      });
    } catch (error: any) {
      console.log('Error checking migrations:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkUsersTable();
