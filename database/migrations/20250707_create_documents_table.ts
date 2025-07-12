import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create documents table
  await knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('document_type').notNullable();
    table.string('file_name').notNullable();
    table.string('file_url').notNullable();
    table.integer('file_size').nullable();
    table.string('mime_type').nullable();
    table.enum('upload_status', ['uploaded', 'processing', 'verified', 'rejected', 'expired']).defaultTo('uploaded');
    table.uuid('reviewed_by').nullable().references('id').inTable('users');
    table.timestamp('reviewed_at').nullable();
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['document_type']);
    table.index(['upload_status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('documents');
} 