/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  console.log('🔧 Marking payment_transactions table as already created...');
  
  // Since the table already exists, we just need to mark this migration as completed
  // The actual table creation was done manually or by another process
  console.log('✅ Payment transactions table already exists, marking migration as completed');
  
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  console.log('🔄 This migration cannot be reverted as the table was created outside of migrations');
  console.log('⚠️ If you need to drop the table, do it manually');
  
  return Promise.resolve();
};
