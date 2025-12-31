-- Script to add booking_id column to chats table if it doesn't exist
-- Run this on your server if the column is missing
-- Usage: psql -U your_user -d your_database -f scripts/fix-chats-booking-id.sql

-- Check and add booking_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE chats ADD COLUMN booking_id UUID;
        
        -- Add foreign key if bookings table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
            ALTER TABLE chats 
            ADD CONSTRAINT fk_chats_booking_id 
            FOREIGN KEY (booking_id) 
            REFERENCES bookings(id) 
            ON DELETE SET NULL;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_chats_booking_id ON chats(booking_id);
        
        RAISE NOTICE 'Column booking_id added to chats table';
    ELSE
        RAISE NOTICE 'Column booking_id already exists in chats table';
    END IF;
END $$;

-- Check and add product_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE chats ADD COLUMN product_id UUID;
        
        -- Add foreign key if products table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
            ALTER TABLE chats 
            ADD CONSTRAINT fk_chats_product_id 
            FOREIGN KEY (product_id) 
            REFERENCES products(id) 
            ON DELETE SET NULL;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
        
        RAISE NOTICE 'Column product_id added to chats table';
    ELSE
        RAISE NOTICE 'Column product_id already exists in chats table';
    END IF;
END $$;

-- Check and add subject column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE chats ADD COLUMN subject VARCHAR(255);
        
        RAISE NOTICE 'Column subject added to chats table';
    ELSE
        RAISE NOTICE 'Column subject already exists in chats table';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'chats'
AND column_name IN ('booking_id', 'product_id', 'subject')
ORDER BY column_name;

