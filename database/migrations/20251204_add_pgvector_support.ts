/**
 * Migration: Add pgvector extension and update image_embedding column
 * This enables efficient vector similarity search using PostgreSQL
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable pgvector extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector;');

  // Check if image_embedding column exists and its current type
  const columnInfo = await knex.raw(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'product_images' 
    AND column_name = 'image_embedding';
  `);

  if (columnInfo.rows.length === 0) {
    // Column doesn't exist, create it as vector type
    await knex.schema.alterTable('product_images', (table) => {
      table.specificType('image_embedding', 'vector(512)').nullable();
    });
  } else {
    // Column exists, check if it's already vector type
    const currentType = columnInfo.rows[0].data_type;
    
    if (currentType === 'jsonb' || currentType === 'text') {
      // Convert existing JSONB/text column to vector
      console.log('Converting image_embedding from JSONB/text to vector type...');
      
      // Check if temporary column already exists (migration partially completed)
      const tempColumnCheck = await knex.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_embedding_vector';
      `);
      
      // First, create a temporary column if it doesn't exist
      if (tempColumnCheck.rows.length === 0) {
        await knex.schema.alterTable('product_images', (table) => {
          table.specificType('image_embedding_vector', 'vector(512)').nullable();
        });
      } else {
        console.log('Temporary column image_embedding_vector already exists, continuing migration...');
      }

      // Migrate data from JSONB/text to vector
      // Handle both JSONB arrays and text arrays
      // Filter out null values and invalid arrays
      // Use a DO block with exception handling for safe conversion
      console.log('Migrating image embeddings to vector type (this may take a while for large datasets)...');
      
      const migrationResult = await knex.raw(`
        DO $$
        DECLARE
          rec RECORD;
          vector_str TEXT;
          processed_count INTEGER := 0;
          skipped_count INTEGER := 0;
        BEGIN
          FOR rec IN 
            SELECT id, image_embedding 
            FROM product_images 
            WHERE image_embedding IS NOT NULL
              AND image_embedding_vector IS NULL
          LOOP
            BEGIN
              -- Skip if null, empty, or invalid
              IF rec.image_embedding::text = 'null' 
                 OR rec.image_embedding::text = '[]'
                 OR rec.image_embedding::text = '""'
                 OR rec.image_embedding::text IS NULL THEN
                skipped_count := skipped_count + 1;
                CONTINUE;
              END IF;

              -- Handle JSONB array
              IF jsonb_typeof(rec.image_embedding) = 'array' THEN
                -- Check if array contains any null values or non-numeric values
                IF EXISTS (
                  SELECT 1 
                  FROM jsonb_array_elements(rec.image_embedding) AS elem
                  WHERE jsonb_typeof(elem) != 'number' OR elem IS NULL
                ) THEN
                  -- Skip rows with nulls or invalid values
                  skipped_count := skipped_count + 1;
                  CONTINUE;
                END IF;

                -- Convert JSONB array to vector format
                SELECT '[' || string_agg(elem::text, ',') || ']'
                INTO vector_str
                FROM jsonb_array_elements(rec.image_embedding) AS elem;

                -- Update with vector
                UPDATE product_images
                SET image_embedding_vector = vector_str::vector
                WHERE id = rec.id;
                
                processed_count := processed_count + 1;

              -- Handle text array format
              ELSIF rec.image_embedding::text LIKE '[%' THEN
                -- Check if text contains 'null' - skip if it does
                IF rec.image_embedding::text ~ 'null' THEN
                  skipped_count := skipped_count + 1;
                  CONTINUE;
                END IF;

                -- Try to convert text to vector
                BEGIN
                  UPDATE product_images
                  SET image_embedding_vector = rec.image_embedding::text::vector
                  WHERE id = rec.id;
                  
                  processed_count := processed_count + 1;
                EXCEPTION WHEN OTHERS THEN
                  -- Skip rows that fail conversion
                  skipped_count := skipped_count + 1;
                  CONTINUE;
                END;
              ELSE
                skipped_count := skipped_count + 1;
              END IF;

            EXCEPTION WHEN OTHERS THEN
              -- Skip rows that cause errors
              skipped_count := skipped_count + 1;
              CONTINUE;
            END;
          END LOOP;
          
          RAISE NOTICE 'Migration complete: % rows processed, % rows skipped', processed_count, skipped_count;
        END $$;
      `);
      
      console.log('✅ Data migration completed');

      // Check if migration was already completed (final column exists)
      const finalColumnCheck = await knex.raw(`
        SELECT column_name, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_embedding';
      `);
      
      if (finalColumnCheck.rows.length > 0 && finalColumnCheck.rows[0].udt_name === 'vector') {
        // Migration already completed, just drop temp column if it exists
        const tempColumnCheck = await knex.raw(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'product_images' 
          AND column_name = 'image_embedding_vector';
        `);
        
        if (tempColumnCheck.rows.length > 0) {
          await knex.schema.alterTable('product_images', (table) => {
            table.dropColumn('image_embedding_vector');
          });
        }
        console.log('✅ Column already converted to vector type');
      } else {
        // Drop old column and rename new one
        // Check if old column (non-vector type) still exists
        const oldColumnCheck = await knex.raw(`
          SELECT column_name, udt_name
          FROM information_schema.columns 
          WHERE table_name = 'product_images' 
          AND column_name = 'image_embedding'
          AND udt_name != 'vector';
        `);
        
        if (oldColumnCheck.rows.length > 0) {
          await knex.schema.alterTable('product_images', (table) => {
            table.dropColumn('image_embedding');
          });
        }
        
        // Rename temporary column to final name
        await knex.schema.alterTable('product_images', (table) => {
          table.renameColumn('image_embedding_vector', 'image_embedding');
        });
      }
      
      console.log('✅ Converted image_embedding to vector type');
    } else if (currentType === 'USER-DEFINED') {
      // Already vector type, check if it needs to be updated
      console.log('image_embedding is already vector type');
    }
  }

  // Create index for vector similarity search (using cosine distance)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS product_images_embedding_idx 
    ON product_images 
    USING ivfflat (image_embedding vector_cosine_ops)
    WITH (lists = 100);
  `);

  console.log('✅ pgvector extension enabled and image_embedding column updated');
}

export async function down(knex: Knex): Promise<void> {
  // Drop the vector index
  await knex.raw('DROP INDEX IF EXISTS product_images_embedding_idx;');

  // Convert vector column back to JSONB
  await knex.schema.alterTable('product_images', (table) => {
    table.jsonb('image_embedding_jsonb').nullable();
  });

  // Migrate data back to JSONB
  await knex.raw(`
    UPDATE product_images
    SET image_embedding_jsonb = (
      CASE 
        WHEN image_embedding IS NOT NULL
        THEN to_jsonb(image_embedding::text::float[])
        ELSE NULL
      END
    )
    WHERE image_embedding IS NOT NULL;
  `);

  // Drop vector column and rename JSONB
  await knex.schema.alterTable('product_images', (table) => {
    table.dropColumn('image_embedding');
  });

  await knex.schema.alterTable('product_images', (table) => {
    table.renameColumn('image_embedding_jsonb', 'image_embedding');
  });

  // Note: We don't drop the vector extension as it might be used by other tables
}

