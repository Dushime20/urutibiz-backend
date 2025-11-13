-- Script to update product inspection status from pending to in_progress
-- 
-- Usage:
--   psql -U your_user -d your_database -f scripts/update-inspection-status.sql
-- 
-- Or run directly in psql:
--   \i scripts/update-inspection-status.sql

-- Set the inspection ID
\set inspection_id 'ac5993bc-dd99-42f8-b017-b926ad405ea1'

-- Start transaction
BEGIN;

-- Check if inspection exists and show current status
DO $$
DECLARE
    v_inspection_id UUID := 'ac5993bc-dd99-42f8-b017-b926ad405ea1';
    v_current_status TEXT;
    v_inspection_type TEXT;
    v_booking_id UUID;
BEGIN
    -- Check if inspection exists
    SELECT status, inspection_type, booking_id
    INTO v_current_status, v_inspection_type, v_booking_id
    FROM product_inspections
    WHERE id = v_inspection_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inspection with ID % not found', v_inspection_id;
    END IF;
    
    -- Log current status
    RAISE NOTICE 'Current inspection status: %', v_current_status;
    RAISE NOTICE 'Inspection type: %', v_inspection_type;
    RAISE NOTICE 'Booking ID: %', v_booking_id;
    
    -- Check if already in_progress
    IF v_current_status = 'in_progress' THEN
        RAISE NOTICE 'Inspection status is already in_progress. No update needed.';
        RETURN;
    END IF;
    
    -- Check if status is pending
    IF v_current_status != 'pending' THEN
        RAISE WARNING 'Inspection status is %, not pending. Proceeding anyway...', v_current_status;
    END IF;
END $$;

-- Update inspection status
UPDATE product_inspections
SET 
    status = 'in_progress',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1'
RETURNING 
    id,
    status,
    inspection_type,
    booking_id,
    updated_at;

-- Show related data
SELECT 
    'Inspection Items' as table_name,
    COUNT(*) as count
FROM inspection_items
WHERE inspection_id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1'
UNION ALL
SELECT 
    'Inspection Photos' as table_name,
    COUNT(*) as count
FROM inspection_photos
WHERE inspection_id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1'
UNION ALL
SELECT 
    'Inspection Disputes' as table_name,
    COUNT(*) as count
FROM inspection_disputes
WHERE inspection_id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1';

-- Show related booking info
SELECT 
    b.id,
    b.booking_number,
    b.status as booking_status,
    b.start_date,
    b.end_date
FROM bookings b
INNER JOIN product_inspections pi ON b.id = pi.booking_id
WHERE pi.id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1';

-- Commit transaction
COMMIT;

-- Show final status
SELECT 
    id,
    status,
    inspection_type,
    booking_id,
    updated_at
FROM product_inspections
WHERE id = 'ac5993bc-dd99-42f8-b017-b926ad405ea1';

