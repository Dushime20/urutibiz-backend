-- Update existing booking expiration setting from 4 hours to 2 hours
-- Run this if your database is already set up with the old 4-hour default

UPDATE system_settings 
SET value = '2', 
    updated_at = NOW()
WHERE key = 'booking_expiration_hours' 
  AND category = 'booking';

-- Verify the update
SELECT key, value, category, description, updated_at 
FROM system_settings 
WHERE key = 'booking_expiration_hours' 
  AND category = 'booking';
