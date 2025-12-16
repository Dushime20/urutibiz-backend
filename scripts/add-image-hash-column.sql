-- SQL Script to add image_hash column to product_images table
-- Run this in your PostgreSQL database if the TypeScript script doesn't work
-- Usage: psql -U your_user -d your_database -f add-image-hash-column.sql

-- Check if column already exists and add it if it doesn't
DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'image_hash'
    ) THEN
        -- Add the column
        ALTER TABLE product_images 
        ADD COLUMN image_hash VARCHAR(64) NULL;
        
        RAISE NOTICE '✅ Added image_hash column to product_images table';
    ELSE
        RAISE NOTICE '✅ image_hash column already exists, skipping';
    END IF;
END $$;

-- Add index for fast hash lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_product_images_hash 
ON product_images (image_hash)
WHERE image_hash IS NOT NULL;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_images' 
AND column_name = 'image_hash';

