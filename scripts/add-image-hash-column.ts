#!/usr/bin/env ts-node

import { connectDatabase, getDatabase } from '../src/config/database';

/**
 * Script to add image_hash column to product_images table
 * This script can be run independently to fix the missing column issue
 */
async function addImageHashColumn() {
  try {
    console.log('🔧 Adding image_hash column to product_images table...\n');
    
    // Connect to database first
    await connectDatabase();
    const db = getDatabase();
    
    // Check if product_images table exists
    const tableExists = await db.schema.hasTable('product_images');
    if (!tableExists) {
      console.log('❌ product_images table does not exist!');
      console.log('💡 Solution: Run migrations to create the product_images table first');
      process.exit(1);
    }
    
    console.log('✅ product_images table exists');
    
    // Check if column already exists
    const columnExists = await db.schema.hasColumn('product_images', 'image_hash');
    if (columnExists) {
      console.log('✅ image_hash column already exists, nothing to do!');
      process.exit(0);
    }
    
    console.log('📝 Adding image_hash column...');
    
    // Add the column
    await db.schema.alterTable('product_images', (table) => {
      table.string('image_hash', 64).nullable(); // SHA-256 hash = 64 hex characters
    });
    
    console.log('✅ Added image_hash column to product_images table');
    
    // Add index for fast hash lookups
    try {
      await db.raw(`
        CREATE INDEX IF NOT EXISTS idx_product_images_hash 
        ON product_images (image_hash)
        WHERE image_hash IS NOT NULL
      `);
      console.log('✅ Created index on image_hash');
    } catch (error) {
      console.warn('⚠️ Failed to create index (non-critical):', error);
    }
    
    // Verify the column was added
    const verifyColumn = await db.schema.hasColumn('product_images', 'image_hash');
    if (verifyColumn) {
      console.log('\n✅ Verification: image_hash column successfully added!');
    } else {
      console.log('\n❌ Verification failed: column was not added');
      process.exit(1);
    }
    
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding image_hash column:', error);
    process.exit(1);
  }
}

// Run the script
addImageHashColumn();

