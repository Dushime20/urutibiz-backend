import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add missing columns to user_verifications table
  await knex.schema.alterTable('user_verifications', (table) => {
    // Change id to UUID if it's not already
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()')).alter();
    
    // Change user_id to UUID if it's not already
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').alter();
    
    // Add missing columns
    table.string('document_number').nullable();
    table.string('document_image_url').nullable();
    table.string('address_line').nullable();
    table.string('city').nullable();
    table.string('district').nullable();
    table.string('country').nullable();
    table.string('selfie_image_url').nullable();
    table.jsonb('ocr_data').nullable();
    table.decimal('liveness_score', 5, 2).nullable();
    table.decimal('ai_profile_score', 5, 2).nullable();
    table.string('verification_status', 50).defaultTo('pending');
    table.uuid('verified_by').nullable().references('id').inTable('users');
    table.timestamp('verified_at').nullable();
    table.text('notes').nullable();
    table.string('ai_processing_status', 50).defaultTo('pending');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Add indexes
    table.index(['user_id']);
    table.index(['verification_type']);
    table.index(['verification_status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_verifications', (table) => {
    // Remove added columns
    table.dropColumn('document_number');
    table.dropColumn('document_image_url');
    table.dropColumn('address_line');
    table.dropColumn('city');
    table.dropColumn('district');
    table.dropColumn('country');
    table.dropColumn('selfie_image_url');
    table.dropColumn('ocr_data');
    table.dropColumn('liveness_score');
    table.dropColumn('ai_profile_score');
    table.dropColumn('verification_status');
    table.dropColumn('verified_by');
    table.dropColumn('verified_at');
    table.dropColumn('notes');
    table.dropColumn('ai_processing_status');
    table.dropColumn('updated_at');
  });
} 