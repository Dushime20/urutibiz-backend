-- QUICK FIX: Add image_hash column to product_images table
-- Copy and paste this entire block into your database SQL console

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) NULL;
CREATE INDEX IF NOT EXISTS idx_product_images_hash ON product_images (image_hash) WHERE image_hash IS NOT NULL;

