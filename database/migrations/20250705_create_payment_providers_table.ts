import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payment_providers table
  await knex.schema.createTable('payment_providers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('country_id').notNullable().references('id').inTable('countries').onDelete('CASCADE');
    table.string('provider_name', 100).notNullable().comment('stripe, paypal, mtn_momo, mpesa, wave, airtel_money, orange_money');
    table.string('provider_type', 50).notNullable().comment('card, mobile_money, bank_transfer, digital_wallet');
    table.string('display_name', 100).comment('User-friendly name for display');
    table.text('logo_url').comment('URL to provider logo image');
    table.boolean('is_active').defaultTo(true);
    table.specificType('supported_currencies', 'VARCHAR(3)[]').comment('Array of supported currency codes like [RWF, USD, EUR]');
    table.decimal('min_amount', 10, 2).defaultTo(0).comment('Minimum transaction amount');
    table.decimal('max_amount', 10, 2).comment('Maximum transaction amount');
    table.decimal('fee_percentage', 4, 2).defaultTo(0).comment('Fee percentage (e.g., 2.5 for 2.5%)');
    table.decimal('fee_fixed', 10, 2).defaultTo(0).comment('Fixed fee amount');
    table.jsonb('settings').comment('Provider-specific configuration settings');
    table.text('description').comment('Provider description and details');
    table.string('api_endpoint').comment('Provider API endpoint URL');
    table.boolean('supports_refunds').defaultTo(false).comment('Whether provider supports refunds');
    table.boolean('supports_recurring').defaultTo(false).comment('Whether provider supports recurring payments');
    table.integer('processing_time_minutes').comment('Average processing time in minutes');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Indexes for better performance
    table.index(['country_id']);
    table.index(['provider_name']);
    table.index(['provider_type']);
    table.index(['is_active']);
    table.index(['country_id', 'is_active']);
    table.index(['country_id', 'provider_type']);
    table.index(['provider_type', 'is_active']);
    
    // Unique constraint for provider within country
    table.unique(['country_id', 'provider_name']);
  });

  // Insert sample payment providers for different countries
  // Get country IDs first
  const countries = await knex('countries').select('id', 'code').whereIn('code', ['RW', 'KE', 'UG', 'TZ', 'BI']);
  
  if (countries.length > 0) {
    const paymentProviders: any[] = [];
    
    // Rwanda payment providers
    const rwanda = countries.find(c => c.code === 'RW');
    if (rwanda) {
      paymentProviders.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          provider_name: 'mtn_momo',
          provider_type: 'mobile_money',
          display_name: 'MTN Mobile Money',
          logo_url: 'https://example.com/logos/mtn_momo.png',
          is_active: true,
          supported_currencies: ['RWF'],
          min_amount: 100,
          max_amount: 2000000,
          fee_percentage: 1.5,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 2,
          description: 'MTN Mobile Money - Rwanda\'s leading mobile payment solution',
          settings: JSON.stringify({
            merchant_code_required: true,
            callback_url_required: true,
            encryption: 'AES256'
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          provider_name: 'airtel_money',
          provider_type: 'mobile_money',
          display_name: 'Airtel Money',
          logo_url: 'https://example.com/logos/airtel_money.png',
          is_active: true,
          supported_currencies: ['RWF'],
          min_amount: 50,
          max_amount: 1500000,
          fee_percentage: 1.0,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 3,
          description: 'Airtel Money mobile payment service in Rwanda',
          settings: JSON.stringify({
            api_version: 'v2',
            timeout_seconds: 30
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          provider_name: 'stripe',
          provider_type: 'card',
          display_name: 'Stripe',
          logo_url: 'https://example.com/logos/stripe.png',
          is_active: true,
          supported_currencies: ['USD', 'EUR', 'RWF'],
          min_amount: 50,
          max_amount: 999999,
          fee_percentage: 2.9,
          fee_fixed: 30,
          supports_refunds: true,
          supports_recurring: true,
          processing_time_minutes: 1,
          description: 'International card payments via Stripe',
          settings: JSON.stringify({
            webhook_secret_required: true,
            '3d_secure': true,
            capture_method: 'automatic'
          })
        }
      );
    }

    // Kenya payment providers
    const kenya = countries.find(c => c.code === 'KE');
    if (kenya) {
      paymentProviders.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          provider_name: 'mpesa',
          provider_type: 'mobile_money',
          display_name: 'M-Pesa',
          logo_url: 'https://example.com/logos/mpesa.png',
          is_active: true,
          supported_currencies: ['KES'],
          min_amount: 10,
          max_amount: 300000,
          fee_percentage: 0.0,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 1,
          description: 'M-Pesa - Kenya\'s leading mobile money service',
          settings: JSON.stringify({
            business_shortcode: true,
            passkey_required: true,
            callback_url: true
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          provider_name: 'airtel_money',
          provider_type: 'mobile_money',
          display_name: 'Airtel Money Kenya',
          logo_url: 'https://example.com/logos/airtel_money.png',
          is_active: true,
          supported_currencies: ['KES'],
          min_amount: 10,
          max_amount: 250000,
          fee_percentage: 0.5,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 2,
          description: 'Airtel Money mobile payment service in Kenya',
          settings: JSON.stringify({
            api_version: 'v1',
            encryption: 'RSA'
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          provider_name: 'stripe',
          provider_type: 'card',
          display_name: 'Stripe',
          logo_url: 'https://example.com/logos/stripe.png',
          is_active: true,
          supported_currencies: ['USD', 'EUR', 'KES'],
          min_amount: 50,
          max_amount: 999999,
          fee_percentage: 3.4,
          fee_fixed: 20,
          supports_refunds: true,
          supports_recurring: true,
          processing_time_minutes: 1,
          description: 'International card payments via Stripe',
          settings: JSON.stringify({
            local_payment_methods: ['card', 'mobile_money'],
            webhook_secret_required: true
          })
        }
      );
    }

    // Uganda payment providers
    const uganda = countries.find(c => c.code === 'UG');
    if (uganda) {
      paymentProviders.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: uganda.id,
          provider_name: 'mtn_momo',
          provider_type: 'mobile_money',
          display_name: 'MTN Mobile Money Uganda',
          logo_url: 'https://example.com/logos/mtn_momo.png',
          is_active: true,
          supported_currencies: ['UGX'],
          min_amount: 500,
          max_amount: 4000000,
          fee_percentage: 1.0,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 2,
          description: 'MTN Mobile Money service in Uganda',
          settings: JSON.stringify({
            collection_api: true,
            disbursement_api: true
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: uganda.id,
          provider_name: 'airtel_money',
          provider_type: 'mobile_money',
          display_name: 'Airtel Money Uganda',
          logo_url: 'https://example.com/logos/airtel_money.png',
          is_active: true,
          supported_currencies: ['UGX'],
          min_amount: 500,
          max_amount: 3000000,
          fee_percentage: 1.2,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 3,
          description: 'Airtel Money mobile payment service in Uganda',
          settings: JSON.stringify({
            api_version: 'v1.1',
            ssl_required: true
          })
        }
      );
    }

    // Tanzania payment providers
    const tanzania = countries.find(c => c.code === 'TZ');
    if (tanzania) {
      paymentProviders.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: tanzania.id,
          provider_name: 'mpesa',
          provider_type: 'mobile_money',
          display_name: 'M-Pesa Tanzania',
          logo_url: 'https://example.com/logos/mpesa.png',
          is_active: true,
          supported_currencies: ['TZS'],
          min_amount: 1000,
          max_amount: 3000000,
          fee_percentage: 0.0,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 2,
          description: 'M-Pesa mobile money service in Tanzania',
          settings: JSON.stringify({
            operator_code: 'vodacom',
            api_version: 'v1'
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: tanzania.id,
          provider_name: 'airtel_money',
          provider_type: 'mobile_money',
          display_name: 'Airtel Money Tanzania',
          logo_url: 'https://example.com/logos/airtel_money.png',
          is_active: true,
          supported_currencies: ['TZS'],
          min_amount: 1000,
          max_amount: 2500000,
          fee_percentage: 0.8,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 3,
          description: 'Airtel Money mobile payment service in Tanzania',
          settings: JSON.stringify({
            country_code: 'TZ',
            language: 'sw'
          })
        }
      );
    }

    // Burundi payment providers
    const burundi = countries.find(c => c.code === 'BI');
    if (burundi) {
      paymentProviders.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: burundi.id,
          provider_name: 'wave',
          provider_type: 'mobile_money',
          display_name: 'Wave Money',
          logo_url: 'https://example.com/logos/wave.png',
          is_active: true,
          supported_currencies: ['BIF'],
          min_amount: 100,
          max_amount: 1000000,
          fee_percentage: 1.0,
          fee_fixed: 0,
          supports_refunds: true,
          supports_recurring: false,
          processing_time_minutes: 2,
          description: 'Wave mobile money service in Burundi',
          settings: JSON.stringify({
            api_version: 'v2',
            authentication: 'bearer_token'
          })
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: burundi.id,
          provider_name: 'orange_money',
          provider_type: 'mobile_money',
          display_name: 'Orange Money',
          logo_url: 'https://example.com/logos/orange_money.png',
          is_active: true,
          supported_currencies: ['BIF'],
          min_amount: 100,
          max_amount: 800000,
          fee_percentage: 1.5,
          fee_fixed: 0,
          supports_refunds: false,
          supports_recurring: false,
          processing_time_minutes: 4,
          description: 'Orange Money mobile payment service in Burundi',
          settings: JSON.stringify({
            merchant_id_required: true,
            notification_url: true
          })
        }
      );
    }

    // Insert all payment providers
    if (paymentProviders.length > 0) {
      await knex('payment_providers').insert(paymentProviders);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_providers');
}
