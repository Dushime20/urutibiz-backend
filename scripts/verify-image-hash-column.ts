#!/usr/bin/env ts-node

import { connectDatabase, getDatabase } from '../src/config/database';

/**
 * Script to verify image_hash column exists in product_images table
 */
async function verifyImageHashColumn() {
  try {
    console.log('🔍 Verifying image_hash column in product_images table...\n');
    
    // Connect to database
    await connectDatabase();
    const db = getDatabase();
    
    // Check if product_images table exists
    const tableExists = await db.schema.hasTable('product_images');
    if (!tableExists) {
      console.log('❌ product_images table does not exist!');
      process.exit(1);
    }
    
    console.log('✅ product_images table exists');
    
    // Check if column exists
    const columnExists = await db.schema.hasColumn('product_images', 'image_hash');
    console.log(`\n📊 Column check: image_hash ${columnExists ? '✅ EXISTS' : '❌ DOES NOT EXIST'}`);
    
    if (columnExists) {
      // Get column details
      const columnInfo = await db.raw(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_hash'
      `);
      
      if (columnInfo.rows && columnInfo.rows.length > 0) {
        const col = columnInfo.rows[0];
        console.log('\n📋 Column details:');
        console.log(`   - Name: ${col.column_name}`);
        console.log(`   - Type: ${col.data_type}(${col.character_maximum_length || 'N/A'})`);
        console.log(`   - Nullable: ${col.is_nullable === 'YES' ? 'YES' : 'NO'}`);
      }
      
      // Check for index
      const indexExists = await db.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'product_images' 
        AND indexname = 'idx_product_images_hash'
      `);
      
      if (indexExists.rows && indexExists.rows.length > 0) {
        console.log('\n✅ Index idx_product_images_hash exists');
      } else {
        console.log('\n⚠️  Index idx_product_images_hash does not exist');
      }
    } else {
      console.log('\n❌ The image_hash column is missing!');
      console.log('💡 Run: npx ts-node -r tsconfig-paths/register scripts/add-image-hash-column.ts');
      process.exit(1);
    }
    
    // Get all columns in the table for reference
    console.log('\n📋 All columns in product_images table:');
    const allColumns = await db('product_images').columnInfo();
    Object.keys(allColumns).forEach(colName => {
      const col = allColumns[colName];
      const marker = colName === 'image_hash' ? ' ⭐' : '';
      console.log(`   - ${colName}: ${col.type}${marker}`);
    });
    
    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying column:', error);
    process.exit(1);
  }
}

verifyImageHashColumn();

