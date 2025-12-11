import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Ensure payment_status enum exists with all required values
  // First check if enum exists
  const enumExists = await knex.raw(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) as exists;
  `);
  
  const hasEnum = enumExists.rows[0]?.exists || false;
  
  if (!hasEnum) {
    // Create enum with all values including 'cancelled'
    await knex.raw(`
      CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled');
    `);
  } else {
    // Enum exists, check if 'cancelled' needs to be added
    const cancelledExists = await knex.raw(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status') 
        AND enumlabel = 'cancelled'
      ) as exists;
    `);
    
    const hasCancelledValue = cancelledExists.rows[0]?.exists || false;
    
    if (!hasCancelledValue) {
      // Add 'cancelled' value - this must be in a separate statement
      // Note: PostgreSQL requires a commit after adding enum values before they can be used
      // We'll handle this by checking if it exists first, then adding if needed
      try {
        await knex.raw(`
          ALTER TYPE payment_status ADD VALUE 'cancelled';
        `);
      } catch (error: any) {
        // Ignore error if value already exists (race condition)
        if (!error.message?.includes('already exists')) {
          throw error;
        }
      }
    }
  }

  // Check if table already exists
  const hasTable = await knex.schema.hasTable('payment_transactions');
  
  if (!hasTable) {
    await knex.schema.createTable('payment_transactions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FKs to avoid ordering issues
      table.uuid('booking_id').comment('Reference to booking if transaction is booking-related');
      table.uuid('user_id').notNullable().comment('User who initiated the transaction');
      table.uuid('payment_method_id').comment('Payment method used for transaction');
    
    // Transaction details
    table.enu('transaction_type', ['booking_payment', 'security_deposit', 'refund', 'partial_refund', 'platform_fee', 'insurance_payment', 'delivery_fee', 'inspection_fee']).notNullable().comment('Type of transaction');
    table.decimal('amount', 12, 2).notNullable().comment('Transaction amount in the specified currency');
    table.string('currency', 3).defaultTo('RWF').comment('Currency code (ISO 4217)');
    
    // External provider details
    table.string('provider', 50).notNullable().comment('Payment provider (stripe, mtn_momo, airtel_money, etc.)');
    table.string('provider_transaction_id', 255).comment('External provider transaction ID');
    table.decimal('provider_fee', 10, 2).defaultTo(0).comment('Fee charged by payment provider');
    
    // Status and processing
    table.specificType('status', 'payment_status').defaultTo('pending').comment('Current transaction status');
    table.timestamp('processed_at', { useTz: true }).comment('When the transaction was processed');
    table.timestamp('expires_at', { useTz: true }).comment('When the transaction expires (for pending transactions)');
    
    // Multi-currency support
    table.string('original_currency', 3).comment('Original currency if conversion occurred');
    table.decimal('original_amount', 12, 2).comment('Original amount before currency conversion');
    table.decimal('exchange_rate', 10, 6).comment('Exchange rate used for conversion');
    table.date('exchange_rate_date').comment('Date of exchange rate');
    
    // Additional data and error handling
    table.jsonb('metadata').comment('Additional transaction metadata');
    table.text('failure_reason').comment('Reason for transaction failure');
    table.text('provider_response').comment('Raw response from payment provider');
    
    // Audit fields
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.string('created_by').comment('User or system that created the transaction');
    table.string('updated_by').comment('User or system that last updated the transaction');

    // Indexes for performance
    table.index(['user_id']);
    table.index(['booking_id']);
    table.index(['payment_method_id']);
    table.index(['transaction_type']);
    table.index(['status']);
    table.index(['provider']);
    table.index(['provider_transaction_id']);
    table.index(['currency']);
    table.index(['created_at']);
    table.index(['processed_at']);
    table.index(['user_id', 'status']);
    table.index(['booking_id', 'transaction_type']);
    table.index(['provider', 'provider_transaction_id']);
    
      // Unique constraint for provider transaction ID per provider
      table.unique(['provider', 'provider_transaction_id']);
    });

    // Conditionally add FKs if referenced tables exist
    const hasUsers = await knex.schema.hasTable('users');
    const hasBookings = await knex.schema.hasTable('bookings');
    const hasPaymentMethods = await knex.schema.hasTable('payment_methods');
    
    await knex.schema.alterTable('payment_transactions', (table) => {
      if (hasBookings) {
        table.foreign('booking_id').references('bookings.id').onDelete('SET NULL');
      }
      if (hasUsers) {
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
      }
      if (hasPaymentMethods) {
        table.foreign('payment_method_id').references('payment_methods.id').onDelete('SET NULL');
      }
    });

    // Add constraints
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_positive_amount 
      CHECK (amount > 0);
    `);

    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_positive_original_amount 
      CHECK (original_amount IS NULL OR original_amount > 0);
    `);

    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_positive_exchange_rate 
      CHECK (exchange_rate IS NULL OR exchange_rate > 0);
    `);

    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_provider_fee_non_negative 
      CHECK (provider_fee >= 0);
    `);

    // Add constraint to ensure processed_at is set when status is completed/failed
    // Use a more flexible constraint that doesn't hardcode enum values
    // This avoids issues with newly added enum values in the same transaction
    await knex.raw(`
      ALTER TABLE payment_transactions 
      ADD CONSTRAINT check_processed_at_for_final_status 
      CHECK (
        (status::text NOT IN ('pending', 'processing') AND processed_at IS NOT NULL) OR 
        (status::text IN ('pending', 'processing'))
      );
    `);

    // Create a view for transaction summaries
    await knex.raw(`
      CREATE VIEW transaction_summaries AS
      SELECT 
        user_id,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
        SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed_amount,
        MAX(created_at) as last_transaction_date,
        COUNT(DISTINCT provider) as unique_providers_used
      FROM payment_transactions
      GROUP BY user_id;
    `);
  }

  // Skip sample data seeding for now - referenced tables may not be seeded yet
  console.log('✅ Payment transactions table created (sample data skipped - referenced tables not yet seeded)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS transaction_summaries;');
  await knex.schema.dropTableIfExists('payment_transactions');
  await knex.raw('DROP TYPE IF EXISTS payment_status;');
}
