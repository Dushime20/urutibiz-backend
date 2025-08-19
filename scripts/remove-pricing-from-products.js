#!/usr/bin/env node

/**
 * 🏷️ Remove Pricing Fields from Products Table
 * 
 * This script runs the migration to remove redundant pricing fields
 * from the products table since we now have a dedicated product_prices table.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Starting migration to remove pricing fields from products table...\n');

try {
  // Run the migration
  console.log('📦 Running migration...');
  execSync('npx knex migrate:up 20250730_remove_pricing_fields_from_products.ts', {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  console.log('\n✅ Migration completed successfully!');
  console.log('\n📋 Changes made:');
  console.log('   - Removed base_price_per_day from products table');
  console.log('   - Removed base_price_per_week from products table');
  console.log('   - Removed base_price_per_month from products table');
  console.log('   - Removed security_deposit from products table');
  console.log('   - Removed currency from products table');
  console.log('\n💡 All pricing is now handled by the dedicated product_prices table');
  console.log('   - Better data normalization');
  console.log('   - Support for multi-currency pricing');
  console.log('   - Advanced pricing features (discounts, seasonal adjustments)');
  console.log('   - Country-specific pricing');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure the database is running');
  console.log('   2. Check that knex is installed: npm install knex');
  console.log('   3. Verify the migration file exists');
  console.log('   4. Check database connection settings');
  process.exit(1);
} 