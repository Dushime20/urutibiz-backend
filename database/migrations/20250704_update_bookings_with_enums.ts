import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Ensure enums exist without erroring on re-runs
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
      END IF;
    END$$;
  `);
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
      END IF;
    END$$;
  `);
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_type') THEN
        CREATE TYPE insurance_type AS ENUM ('basic', 'standard', 'premium', 'none');
      END IF;
    END$$;
  `);
  // Check if bookings table exists
  const tableExists = await knex.schema.hasTable('bookings');
  
  if (tableExists) {
    // Add insurance_type column to existing bookings table
    await knex.schema.alterTable('bookings', (table) => {
      table.specificType('insurance_type', 'insurance_type').defaultTo('none');
    });
    
    // Update existing status columns to use the new enum types if needed
    // Note: This would require careful data migration in a real scenario
  } else {
    // Create a comprehensive bookings table with all the enum types and fields
    await knex.schema.createTable('bookings', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('renter_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      
      // Core booking information
      table.string('booking_number', 50).unique(); // Unique booking reference number
      table.specificType('status', 'booking_status').defaultTo('pending');
      table.specificType('payment_status', 'payment_status').defaultTo('pending');
      table.specificType('insurance_type', 'insurance_type').defaultTo('none');
      
      // Booking dates and times
      table.timestamp('start_date', { useTz: true }).notNullable();
      table.timestamp('end_date', { useTz: true }).notNullable();
      table.timestamp('check_in_time', { useTz: true });
      table.timestamp('check_out_time', { useTz: true });
      
      // Pickup and delivery information
      table.string('pickup_method', 50).defaultTo('pickup');
      table.text('pickup_address');
      table.text('delivery_address');
      table.jsonb('pickup_coordinates'); // {lat, lng}
      table.jsonb('delivery_coordinates'); // {lat, lng}
      
      // Insurance and policy information
      table.string('insurance_policy_number', 100);
      table.decimal('insurance_premium', 10, 2);
      table.jsonb('insurance_details'); // Coverage details, terms, etc.
      
      // Pricing and financial information
      table.jsonb('pricing').notNullable(); // Complete pricing breakdown
      table.decimal('total_amount', 10, 2).notNullable();
      table.decimal('security_deposit', 10, 2);
      table.decimal('platform_fee', 10, 2);
      table.decimal('tax_amount', 10, 2);
      
      // AI and risk assessment
      table.decimal('ai_risk_score', 3, 2);
      table.jsonb('ai_assessment'); // Detailed AI analysis results
      
      // Notes and instructions
      table.text('special_instructions');
      table.text('renter_notes');
      table.text('owner_notes');
      table.text('admin_notes');
      
      // Condition and damage tracking
      table.string('initial_condition', 50);
      table.string('final_condition', 50);
      table.text('damage_report');
      table.jsonb('damage_photos'); // Array of photo URLs
      
      // Audit trail
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('last_modified_by').references('id').inTable('users');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      
      // Additional metadata
      table.jsonb('metadata'); // Flexible field for additional data
      table.boolean('is_repeat_booking').defaultTo(false);
      table.uuid('parent_booking_id').references('id').inTable('bookings'); // For rebookings
      
      // Indexes for performance
      table.index(['renter_id', 'status']);
      table.index(['owner_id', 'status']);
      table.index(['product_id', 'start_date', 'end_date']);
      table.index(['booking_number']);
      table.index(['status', 'payment_status']);
      table.index(['created_at']);
    });
    
    // Create booking status history table for audit trail (only if it doesn't exist)
    const hasBsh = await knex.schema.hasTable('booking_status_history');
    if (!hasBsh) {
      await knex.schema.createTable('booking_status_history', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
        table.string('previous_status', 50);
        table.string('new_status', 50).notNullable();
        table.uuid('changed_by').notNullable().references('id').inTable('users');
        table.text('reason');
        table.jsonb('metadata'); // Additional context for the change
        table.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());
        
        table.index(['booking_id', 'changed_at']);
        table.index(['changed_by']);
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop booking status history table
  await knex.schema.dropTableIfExists('booking_status_history');
  
  const tableExists = await knex.schema.hasTable('bookings');
  
  if (tableExists) {
    // Try to remove the insurance_type column if it was added
    const hasInsuranceColumn = await knex.schema.hasColumn('bookings', 'insurance_type');
    if (hasInsuranceColumn) {
      await knex.schema.alterTable('bookings', (table) => {
        table.dropColumn('insurance_type');
      });
    }
  }
  
  // Note: We don't drop the entire table here as it might have been pre-existing
}
