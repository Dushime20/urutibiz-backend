-- Fix missing columns in system_settings table
-- Run this in your PostgreSQL database

-- Add missing columns that the admin settings controller needs
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Check the table structure
\d system_settings;

-- Show current records
SELECT key, value, type, category, created_at, updated_at FROM system_settings ORDER BY category, key;
