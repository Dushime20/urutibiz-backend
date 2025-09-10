import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if table exists before creating it
  const hasTable = await knex.schema.hasTable('violations');
  
  if (!hasTable) {
    await knex.schema.createTable('violations', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign keys
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
      table.uuid('reported_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
      
      // Violation details
      table.enum('violation_type', [
        'fraud', 
        'harassment', 
        'property_damage', 
        'payment_fraud', 
        'fake_listing', 
        'safety_violation', 
        'terms_violation', 
        'spam', 
        'inappropriate_content', 
        'unauthorized_use', 
        'other'
      ]).notNullable();
      
      table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
      
      table.enum('category', [
        'user_behavior', 
        'product_quality', 
        'payment_issues', 
        'safety_concerns', 
        'content_policy', 
        'fraud', 
        'technical', 
        'other'
      ]).notNullable();
      
      table.string('title', 255).notNullable();
      table.text('description').notNullable();
      
      // Location information
      table.string('location_address', 500);
      table.decimal('location_latitude', 10, 8);
      table.decimal('location_longitude', 11, 8);
      
      // Status and resolution
      table.enum('status', [
        'reported', 
        'under_review', 
        'investigating', 
        'resolved', 
        'dismissed', 
        'escalated', 
        'closed'
      ]).defaultTo('reported');
      
      // Resolution details
      table.enum('resolution_action', [
        'warning', 
        'fine', 
        'suspension', 
        'ban', 
        'restriction', 
        'dismiss', 
        'escalate', 
        'no_action'
      ]);
      
      table.text('resolution_reason');
      table.enum('penalty_type', ['warning', 'fine', 'suspension', 'ban', 'restriction']);
      table.decimal('penalty_amount', 10, 2);
      table.integer('penalty_duration_days');
      table.text('penalty_details');
      table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('resolved_at');
      table.text('resolution_notes');
      
      // Metadata
      table.jsonb('metadata');
      
      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index(['user_id']);
      table.index(['product_id']);
      table.index(['booking_id']);
      table.index(['reported_by']);
      table.index(['assigned_to']);
      table.index(['violation_type']);
      table.index(['severity']);
      table.index(['category']);
      table.index(['status']);
      table.index(['created_at']);
      table.index(['resolved_at']);
      
      // Composite indexes for common queries
      table.index(['status', 'severity']);
      table.index(['violation_type', 'status']);
      table.index(['user_id', 'status']);
      table.index(['assigned_to', 'status']);
    });
  }

  // Create violation_evidence table for storing evidence files
  const hasEvidenceTable = await knex.schema.hasTable('violation_evidence');
  
  if (!hasEvidenceTable) {
    await knex.schema.createTable('violation_evidence', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign key
      table.uuid('violation_id').notNullable().references('id').inTable('violations').onDelete('CASCADE');
      table.uuid('uploaded_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Evidence details
      table.enum('type', ['image', 'video', 'document', 'audio', 'text']).notNullable();
      table.string('filename', 255);
      table.string('url', 1000);
      table.text('description');
      table.integer('file_size_bytes');
      table.string('mime_type', 100);
      
      // Timestamps
      table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['violation_id']);
      table.index(['uploaded_by']);
      table.index(['type']);
      table.index(['uploaded_at']);
    });
  }

  // Create violation_comments table for tracking investigation progress
  const hasCommentsTable = await knex.schema.hasTable('violation_comments');
  
  if (!hasCommentsTable) {
    await knex.schema.createTable('violation_comments', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // Foreign keys
      table.uuid('violation_id').notNullable().references('id').inTable('violations').onDelete('CASCADE');
      table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Comment details
      table.text('content').notNullable();
      table.enum('type', ['investigation', 'resolution', 'escalation', 'general']).defaultTo('general');
      table.boolean('is_internal').defaultTo(false); // Internal notes vs public comments
      
      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['violation_id']);
      table.index(['author_id']);
      table.index(['type']);
      table.index(['created_at']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('violation_comments');
  await knex.schema.dropTableIfExists('violation_evidence');
  await knex.schema.dropTableIfExists('violations');
}
