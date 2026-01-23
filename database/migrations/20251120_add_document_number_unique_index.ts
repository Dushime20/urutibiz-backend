import { Knex } from 'knex';

/**
 * Migration: Add index on document_number and verification_type
 * This improves performance for duplicate document number checks
 * 
 * Note: We don't add a unique constraint because:
 * 1. Same document can be resubmitted by same user (rejected -> pending)
 * 2. We check duplicates in application logic with user exclusion
 * 3. Different verification types can have same document number format
 */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  
  

  const hasIndex = await knex.schema.hasTable('user_verifications')
    .then(() => {
      return knex.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'user_verifications' 
        AND indexname = 'idx_user_verifications_document_number_type'
      `);
    })
    .then((result: any) => result.rows.length > 0);

  if (!hasIndex) {
    // Create composite index for faster lookups
    await knex.raw(`
      CREATE INDEX idx_user_verifications_document_number_type 
      ON user_verifications(verification_type, UPPER(TRIM(document_number)))
      WHERE document_number IS NOT NULL 
      AND verification_type IN ('national_id', 'passport', 'driving_license')
      AND verification_status IN ('pending', 'verified')
    `);
    
    console.log('✅ Created index on document_number and verification_type');
  } else {
    console.log('ℹ️ Index idx_user_verifications_document_number_type already exists');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('user_verifications');
  
  if (!hasTable) {
    return;
  }

  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_user_verifications_document_number_type`);
    console.log('✅ Dropped index idx_user_verifications_document_number_type');
  } catch (error) {
    console.log('⚠️ Error dropping index (may not exist):', error);
  }
}

