import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table exists before creating it
  const hasTable = await knex.schema.hasTable('product_inspections');
  
  if (!hasTable) {
    await knex.schema.createTable('product_inspections', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign keys (deferred to avoid ordering issues on fresh DBs)
      table.uuid('product_id').notNullable();
      table.uuid('booking_id').notNullable();
      table.uuid('inspector_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('renter_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Inspection details
      table.enum('inspection_type', ['pre_rental', 'post_return']).notNullable();
      table.enum('status', ['pending', 'in_progress', 'completed', 'disputed', 'resolved']).defaultTo('pending');
      
      // Timestamps
      table.timestamp('scheduled_at').notNullable();
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Location and notes
      table.string('inspection_location', 255);
      table.text('general_notes');
      table.text('owner_notes');
      table.text('renter_notes');
      table.text('inspector_notes');
      
      // Dispute handling
      table.boolean('has_dispute').defaultTo(false);
      table.text('dispute_reason');
      table.timestamp('dispute_resolved_at');
      table.uuid('resolved_by');
      
      // Indexes for performance
      table.index(['product_id', 'inspection_type']);
      table.index(['booking_id']);
      table.index(['inspector_id']);
      table.index(['status']);
      table.index(['scheduled_at']);
    });

    // Add FKs only if referenced tables exist
    const hasProducts = await knex.schema.hasTable('products');
    if (hasProducts) {
      await knex.schema.alterTable('product_inspections', (table) => {
        table.foreign('product_id').references('products.id').onDelete('CASCADE');
      });
    }
    const hasBookings = await knex.schema.hasTable('bookings');
    if (hasBookings) {
      await knex.schema.alterTable('product_inspections', (table) => {
        table.foreign('booking_id').references('bookings.id').onDelete('CASCADE');
      });
    }
  }

  // Create inspection_items table for detailed inspection checklist
  const hasItemsTable = await knex.schema.hasTable('inspection_items');
  
  if (!hasItemsTable) {
    await knex.schema.createTable('inspection_items', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign key to inspection
      table.uuid('inspection_id').notNullable().references('id').inTable('product_inspections').onDelete('CASCADE');
      
      // Item details
      table.string('item_name', 100).notNullable();
      table.text('description');
      table.enum('condition', ['excellent', 'good', 'fair', 'poor', 'damaged']).notNullable();
      table.text('notes');
      
      // Photos and evidence
      table.jsonb('photos').comment('Array of photo URLs');
      table.jsonb('damage_evidence').comment('Damage documentation');
      
      // Cost implications
      table.decimal('repair_cost', 10, 2).defaultTo(0);
      table.decimal('replacement_cost', 10, 2).defaultTo(0);
      table.boolean('requires_repair').defaultTo(false);
      table.boolean('requires_replacement').defaultTo(false);
      
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['inspection_id']);
      table.index(['condition']);
    });
  }

  // Create inspection_photos table for photo management
  const hasPhotosTable = await knex.schema.hasTable('inspection_photos');
  
  if (!hasPhotosTable) {
    await knex.schema.createTable('inspection_photos', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign keys
      table.uuid('inspection_id').notNullable().references('id').inTable('product_inspections').onDelete('CASCADE');
      table.uuid('item_id').references('id').inTable('inspection_items').onDelete('CASCADE');
      
      // Photo details
      table.string('photo_url', 500).notNullable();
      table.string('cloudinary_public_id', 255);
      table.string('caption', 255);
      table.enum('photo_type', ['general', 'damage', 'condition', 'before', 'after']).defaultTo('general');
      
      // Metadata
      table.jsonb('metadata').comment('Photo metadata (size, dimensions, etc.)');
      table.timestamp('taken_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['inspection_id']);
      table.index(['item_id']);
      table.index(['photo_type']);
    });
  }

  // Create inspection_disputes table for handling disagreements
  const hasDisputesTable = await knex.schema.hasTable('inspection_disputes');
  
  if (!hasDisputesTable) {
    await knex.schema.createTable('inspection_disputes', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign keys
      table.uuid('inspection_id').notNullable().references('id').inTable('product_inspections').onDelete('CASCADE');
      table.uuid('raised_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Dispute details
      table.enum('dispute_type', ['damage_assessment', 'condition_disagreement', 'cost_dispute', 'other']).notNullable();
      table.text('reason').notNullable();
      table.text('evidence');
      table.enum('status', ['open', 'under_review', 'resolved', 'closed']).defaultTo('open');
      
      // Resolution
      table.text('resolution_notes');
      table.decimal('agreed_amount', 10, 2);
      table.uuid('resolved_by');
      table.timestamp('resolved_at');
      
      // Timestamps
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['inspection_id']);
      table.index(['raised_by']);
      table.index(['status']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('inspection_disputes');
  await knex.schema.dropTableIfExists('inspection_photos');
  await knex.schema.dropTableIfExists('inspection_items');
  await knex.schema.dropTableIfExists('product_inspections');
}
