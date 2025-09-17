import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table already exists
  const hasTable = await knex.schema.hasTable('payment_methods');
  
  if (!hasTable) {
    await knex.schema.createTable('payment_methods', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FK to avoid ordering issues
      table.uuid('user_id').notNullable();
      table.enu('type', ['card', 'mobile_money', 'bank_transfer']).notNullable().comment('Type of payment method');
      table.enu('provider', ['stripe', 'mtn_momo', 'airtel_money', 'visa', 'mastercard', 'paypal', 'bank']).comment('Payment provider');
      
      // Card details (encrypted/tokenized)
      table.string('last_four', 4).comment('Last 4 digits of card number');
      table.enu('card_brand', ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay']).comment('Card brand/network');
      table.integer('exp_month').comment('Card expiration month (1-12)');
      table.integer('exp_year').comment('Card expiration year');
      
      // Mobile money details
      table.string('phone_number', 20).comment('Mobile money phone number');
      
      // Tokenization and provider integration
      table.text('provider_token').comment('Encrypted provider token (Stripe customer ID, etc.)');
      // Defer FK to avoid ordering issues
      table.uuid('payment_provider_id').comment('Reference to payment provider configuration');
    
    // Status and configuration
    table.boolean('is_default').defaultTo(false).comment('Whether this is the default payment method for the user');
    table.boolean('is_verified').defaultTo(false).comment('Whether the payment method is verified');
    table.string('currency', 3).defaultTo('RWF').comment('Currency code (ISO 4217)');
    
    // Audit fields
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Additional metadata
    table.jsonb('metadata').comment('Additional payment method metadata');

    // Indexes for performance
    table.index(['user_id']);
    table.index(['type']);
    table.index(['provider']);
    table.index(['is_default']);
    table.index(['is_verified']);
    table.index(['currency']);
    table.index(['payment_provider_id']);
    table.index(['user_id', 'type']);
    table.index(['user_id', 'is_default']);
    table.index(['user_id', 'is_verified']);
    table.index(['created_at']);
    
      // Ensure only one default payment method per user
      table.unique(['user_id'], { deferrable: 'deferred' });
    });

    // Conditionally add FKs if referenced tables exist
    const hasUsers = await knex.schema.hasTable('users');
    const hasPaymentProviders = await knex.schema.hasTable('payment_providers');
    
    await knex.schema.alterTable('payment_methods', (table) => {
      if (hasUsers) {
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
      }
      if (hasPaymentProviders) {
        table.foreign('payment_provider_id').references('payment_providers.id').onDelete('SET NULL');
      }
    });

    // Create partial unique index for default payment method per user
    await knex.raw(`
      CREATE UNIQUE INDEX payment_methods_user_default_idx 
      ON payment_methods (user_id) 
      WHERE is_default = true;
    `);

    // Add constraints for card expiration validation
    await knex.raw(`
      ALTER TABLE payment_methods 
      ADD CONSTRAINT check_card_exp_month 
      CHECK (exp_month IS NULL OR (exp_month >= 1 AND exp_month <= 12));
    `);

    await knex.raw(`
      ALTER TABLE payment_methods 
      ADD CONSTRAINT check_card_exp_year 
      CHECK (exp_year IS NULL OR exp_year >= EXTRACT(YEAR FROM CURRENT_DATE));
    `);

    // Add constraint to ensure card details are present for card type
    await knex.raw(`
      ALTER TABLE payment_methods 
      ADD CONSTRAINT check_card_details 
      CHECK (
        type != 'card' OR 
        (last_four IS NOT NULL AND card_brand IS NOT NULL AND exp_month IS NOT NULL AND exp_year IS NOT NULL)
      );
    `);

    // Add constraint to ensure phone number is present for mobile money
    await knex.raw(`
      ALTER TABLE payment_methods 
      ADD CONSTRAINT check_mobile_money_details 
      CHECK (
        type != 'mobile_money' OR 
        phone_number IS NOT NULL
      );
    `);
  }

  // Skip sample data seeding for now - users table may not be seeded yet
  console.log('✅ Payment methods table created (sample data skipped - users not yet seeded)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_methods');
}
