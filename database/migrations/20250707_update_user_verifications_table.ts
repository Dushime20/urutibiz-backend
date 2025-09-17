import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if user_verifications table exists
  const hasUserVerifications = await knex.schema.hasTable('user_verifications');
  if (!hasUserVerifications) {
    console.log('⚠️ user_verifications table does not exist, skipping...');
    return;
  }

  // Add missing columns to user_verifications table (only if they don't exist)
  const columnsToAdd = [
    { name: 'document_number', type: 'string', nullable: true },
    { name: 'document_image_url', type: 'string', nullable: true },
    { name: 'address_line', type: 'string', nullable: true },
    { name: 'city', type: 'string', nullable: true },
    { name: 'district', type: 'string', nullable: true },
    { name: 'country', type: 'string', nullable: true },
    { name: 'selfie_image_url', type: 'string', nullable: true },
    { name: 'ocr_data', type: 'jsonb', nullable: true },
    { name: 'liveness_score', type: 'decimal', nullable: true, precision: [5, 2] },
    { name: 'ai_profile_score', type: 'decimal', nullable: true, precision: [5, 2] },
    { name: 'verification_status', type: 'string', nullable: false, length: 50, default: 'pending' },
    { name: 'verified_by', type: 'uuid', nullable: true },
    { name: 'verified_at', type: 'timestamp', nullable: true },
    { name: 'notes', type: 'text', nullable: true },
    { name: 'ai_processing_status', type: 'string', nullable: false, length: 50, default: 'pending' },
    { name: 'updated_at', type: 'timestamp', nullable: false, default: knex.fn.now() }
  ];

  for (const column of columnsToAdd) {
    const hasColumn = await knex.schema.hasColumn('user_verifications', column.name);
    if (!hasColumn) {
      await knex.schema.alterTable('user_verifications', (table) => {
        switch (column.type) {
          case 'string':
            if (column.length) {
              const col = table.string(column.name, column.length);
              if (column.nullable) {
                col.nullable();
              }
              if (column.default) {
                col.defaultTo(column.default);
              }
            } else {
              const col = table.string(column.name);
              if (column.nullable) {
                col.nullable();
              }
              if (column.default) {
                col.defaultTo(column.default);
              }
            }
            break;
          case 'decimal':
            const decimalCol = table.decimal(column.name, column.precision![0], column.precision![1]);
            if (column.nullable) {
              decimalCol.nullable();
            }
            break;
          case 'uuid':
            const uuidCol = table.uuid(column.name);
            if (column.nullable) {
              uuidCol.nullable();
            }
            break;
          case 'timestamp':
            const timestampCol = table.timestamp(column.name);
            if (column.nullable) {
              timestampCol.nullable();
            }
            if (column.default) {
              timestampCol.defaultTo(column.default);
            }
            break;
          case 'text':
            const textCol = table.text(column.name);
            if (column.nullable) {
              textCol.nullable();
            }
            break;
          case 'jsonb':
            const jsonbCol = table.jsonb(column.name);
            if (column.nullable) {
              jsonbCol.nullable();
            }
            break;
        }
      });
      console.log(`✅ Added column: ${column.name}`);
    } else {
      console.log(`⚠️ Column ${column.name} already exists, skipping...`);
    }
  }

  // Add indexes (only if they don't exist)
  const indexesToAdd = [
    { columns: ['user_id'], name: 'idx_user_verifications_user_id' },
    { columns: ['verification_type'], name: 'idx_user_verifications_verification_type' },
    { columns: ['verification_status'], name: 'idx_user_verifications_verification_status' },
    { columns: ['created_at'], name: 'idx_user_verifications_created_at' }
  ];

  for (const index of indexesToAdd) {
    try {
      await knex.schema.alterTable('user_verifications', (table) => {
        table.index(index.columns, index.name);
      });
      console.log(`✅ Added index: ${index.name}`);
    } catch (error) {
      console.log(`⚠️ Index ${index.name} already exists or failed to add`);
    }
  }

  // Add foreign key for verified_by if users table exists
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    try {
      await knex.schema.alterTable('user_verifications', (table) => {
        table.foreign('verified_by').references('users.id').onDelete('SET NULL');
      });
      console.log('✅ Added foreign key for verified_by');
    } catch (error) {
      console.log('⚠️ Foreign key for verified_by already exists or failed to add');
    }
  }

  console.log('✅ User verifications table updated successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Check if user_verifications table exists
  const hasUserVerifications = await knex.schema.hasTable('user_verifications');
  if (!hasUserVerifications) {
    console.log('⚠️ user_verifications table does not exist, skipping...');
    return;
  }

  // Remove added columns (only if they exist)
  const columnsToRemove = [
    'document_number',
    'document_image_url',
    'address_line',
    'city',
    'district',
    'country',
    'selfie_image_url',
    'ocr_data',
    'liveness_score',
    'ai_profile_score',
    'verification_status',
    'verified_by',
    'verified_at',
    'notes',
    'ai_processing_status',
    'updated_at'
  ];

  for (const columnName of columnsToRemove) {
    const hasColumn = await knex.schema.hasColumn('user_verifications', columnName);
    if (hasColumn) {
      try {
        await knex.schema.alterTable('user_verifications', (table) => {
          table.dropColumn(columnName);
        });
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.log(`⚠️ Failed to remove column ${columnName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`⚠️ Column ${columnName} does not exist, skipping...`);
    }
  }

  console.log('✅ User verifications table reverted successfully');
}  