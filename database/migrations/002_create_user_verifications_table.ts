import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create user_verifications table
  await knex.schema.createTable('user_verifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('verification_type', [
      'national_id',
      'passport', 
      'drivers_license',
      'address',
      'selfie',
      'bank_statement',
      'utility_bill'
    ]).notNullable();
    table.enum('status', ['pending', 'verified', 'rejected', 'expired']).defaultTo('pending');
    
    // Document fields
    table.string('document_number');
    table.text('document_image_url');
    
    // Address fields
    table.text('address_line');
    table.string('city');
    table.string('district');
    table.string('country');
    
    // Selfie fields
    table.text('selfie_image_url');
    
    // Admin review fields
    table.text('admin_notes');
    table.uuid('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reviewed_at');
    
    // Verification expiry
    table.timestamp('expiry_date');
    
    // AI scoring (will be added by separate migration)
    // table.decimal('ai_profile_score', 5, 2);
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('verification_type');
    table.index('status');
    table.index(['user_id', 'verification_type']);
    table.index('reviewed_by');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_verifications');
}
