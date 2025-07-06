import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payment_status enum if it doesn't exist
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create payment_transactions table
  await knex.schema.createTable('payment_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL').comment('Reference to booking if transaction is booking-related');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').comment('User who initiated the transaction');
    table.uuid('payment_method_id').references('id').inTable('payment_methods').onDelete('SET NULL').comment('Payment method used for transaction');
    
    // Transaction details
    table.enu('transaction_type', ['booking_payment', 'security_deposit', 'refund', 'partial_refund', 'platform_fee', 'insurance_payment', 'delivery_fee']).notNullable().comment('Type of transaction');
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
  await knex.raw(`
    ALTER TABLE payment_transactions 
    ADD CONSTRAINT check_processed_at_for_final_status 
    CHECK (
      (status IN ('completed', 'failed', 'refunded', 'partially_refunded', 'cancelled') AND processed_at IS NOT NULL) OR 
      (status IN ('pending', 'processing'))
    );
  `);

  // Insert sample payment transactions for testing
  const users = await knex('users').select('id').limit(3);
  const bookings = await knex('bookings').select('id').limit(2);
  const paymentMethods = await knex('payment_methods').select('id').limit(2);
  
  if (users.length > 0) {
    const sampleTransactions = [
      {
        booking_id: bookings.length > 0 ? bookings[0].id : null,
        user_id: users[0].id,
        payment_method_id: paymentMethods.length > 0 ? paymentMethods[0].id : null,
        transaction_type: 'booking_payment',
        amount: 25000.00,
        currency: 'RWF',
        provider: 'mtn_momo',
        provider_transaction_id: 'MTN_TXN_123456789',
        provider_fee: 500.00,
        status: 'completed',
        processed_at: knex.fn.now(),
        created_by: 'system',
        metadata: {
          booking_reference: 'BK123456',
          payment_description: 'Equipment rental payment',
          user_ip: '192.168.1.1'
        }
      },
      {
        booking_id: bookings.length > 1 ? bookings[1].id : null,
        user_id: users.length > 1 ? users[1].id : users[0].id,
        payment_method_id: paymentMethods.length > 1 ? paymentMethods[1].id : null,
        transaction_type: 'security_deposit',
        amount: 50000.00,
        currency: 'RWF',
        provider: 'stripe',
        provider_transaction_id: 'pi_1234567890abcdef',
        provider_fee: 1500.00,
        status: 'completed',
        processed_at: knex.fn.now(),
        created_by: 'system',
        metadata: {
          hold_until: '2025-08-05',
          auto_release: true
        }
      },
      {
        user_id: users.length > 2 ? users[2].id : users[0].id,
        transaction_type: 'refund',
        amount: 15000.00,
        currency: 'RWF',
        original_currency: 'USD',
        original_amount: 15.00,
        exchange_rate: 1000.00,
        exchange_rate_date: '2025-07-05',
        provider: 'airtel_money',
        provider_transaction_id: 'AIRTEL_REF_987654321',
        provider_fee: 300.00,
        status: 'completed',
        processed_at: knex.fn.now(),
        created_by: 'admin_user',
        metadata: {
          refund_reason: 'Cancelled booking',
          original_transaction_id: 'MTN_TXN_123456789',
          processed_by: 'admin'
        }
      },
      {
        user_id: users[0].id,
        transaction_type: 'platform_fee',
        amount: 2500.00,
        currency: 'RWF',
        provider: 'internal',
        status: 'pending',
        expires_at: knex.raw("CURRENT_TIMESTAMP + INTERVAL '24 hours'"),
        created_by: 'system',
        metadata: {
          fee_type: 'service_fee',
          percentage: 10.0,
          base_amount: 25000.00
        }
      }
    ];

    await knex('payment_transactions').insert(sampleTransactions);
  }

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

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS transaction_summaries;');
  await knex.schema.dropTableIfExists('payment_transactions');
  await knex.raw('DROP TYPE IF EXISTS payment_status;');
}
