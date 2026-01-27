#!/usr/bin/env ts-node
/**
 * Repair Migration Names Script
 * 
 * This script fixes "The migration directory is corrupt" errors caused by renamed migration files.
 * It maps old migration filenames in the database to the current filenames on disk by matching their suffixes.
 * 
 * Usage:
 *   ts-node -r tsconfig-paths/register scripts/repair-migrations.ts
 */

import { connectDatabase, getDatabase } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function repairMigrations() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           Repair Migration Names Script                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // 1. Connect to database
        console.log('📡 Connecting to database...');
        await connectDatabase();
        const db = getDatabase();
        console.log('✅ Database connected\n');

        // 2. Get migrations from database
        const dbMigrations = await db('knex_migrations').select('name').orderBy('id', 'asc');
        const dbMigrationNames = dbMigrations.map(m => m.name);
        console.log(`📊 Found ${dbMigrationNames.length} migrations in database.`);

        // 3. Get migrations from disk
        const migrationsDir = path.join(__dirname, '../database/migrations');
        const diskMigrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        console.log(`📂 Found ${diskMigrationFiles.length} migration files on disk.`);

        // 4. Identify missing migrations and try to map them
        const missingInDisk = dbMigrationNames.filter(name => !diskMigrationFiles.includes(name));

        if (missingInDisk.length === 0) {
            console.log('✅ No missing migrations found. Your directory is already synchronized.');
            return;
        }

        console.log(`\n⚠️  Found ${missingInDisk.length} missing migrations. Attempting to repair...\n`);

        let repairedCount = 0;
        for (const oldName of missingInDisk) {
            // Find suffix after the first underscore (e.g., "create_users_table.ts")
            const suffixMatch = oldName.match(/^\d+_(.+)$/);
            if (!suffixMatch) {
                console.log(`   ❌ Could not parse name format for: ${oldName}`);
                continue;
            }

            const suffix = suffixMatch[1];

            // Look for a file on disk with the same suffix but different timestamp
            const newName = diskMigrationFiles.find(f => f.endsWith(`_${suffix}`));

            if (newName) {
                console.log(`   🔄 Mapping: ${oldName} -> ${newName}`);

                // Update the database record
                await db('knex_migrations')
                    .where({ name: oldName })
                    .update({ name: newName });

                repairedCount++;
            } else {
                console.log(`   ❌ Could not find replacement for: ${oldName}`);
            }
        }

        console.log(`\n✅ Successfully repaired ${repairedCount} migration records!`);
        console.log('\n📝 Next steps:');
        console.log('   1. Run migrations again: npm run db:migrate');
        console.log('   2. Restart your application.\n');

    } catch (error: any) {
        console.error('\n❌ Error repairing migrations:');
        console.error(`   ${error.message}`);
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
    repairMigrations().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
