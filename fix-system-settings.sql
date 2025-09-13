-- Fix system_settings table schema
-- Run this in your PostgreSQL database

-- First, check if the table exists and what columns it has
\d system_settings;

-- Add missing columns if they don't exist
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'string';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS sensitive BOOLEAN DEFAULT FALSE;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'system_settings_key_category_unique'
    ) THEN
        ALTER TABLE system_settings ADD CONSTRAINT system_settings_key_category_unique UNIQUE (key, category);
    END IF;
END $$;

-- Check the table structure again
\d system_settings;

-- Insert default theme settings (only if they don't exist)
INSERT INTO system_settings (key, value, type, category, description) VALUES
('mode', 'light', 'select', 'theme', 'Theme mode (light/dark/auto)'),
('primaryColor', '#0ea5e9', 'color', 'theme', 'Primary brand color'),
('secondaryColor', '#64748b', 'color', 'theme', 'Secondary color'),
('accentColor', '#10b981', 'color', 'theme', 'Accent color'),
('borderRadius', '8px', 'text', 'theme', 'Border radius'),
('fontSize', '14px', 'select', 'theme', 'Base font size'),
('fontFamily', 'Inter', 'select', 'theme', 'Font family')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('appName', 'UrutiBiz', 'string', 'system', 'Application name'),
('appVersion', '1.0.0', 'string', 'system', 'Application version'),
('maintenanceMode', 'false', 'boolean', 'system', 'Maintenance mode'),
('debugMode', 'false', 'boolean', 'system', 'Debug mode')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default security settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('sessionTimeout', '3600', 'number', 'security', 'Session timeout in seconds'),
('maxLoginAttempts', '5', 'number', 'security', 'Maximum login attempts before lockout'),
('twoFactorRequired', 'false', 'boolean', 'security', 'Require 2FA for admin accounts'),
('auditLogRetention', '90', 'number', 'security', 'Audit log retention in days')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default business settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('commissionRate', '0.05', 'number', 'business', 'Platform commission rate (5%)'),
('minBookingDuration', '1', 'number', 'business', 'Minimum booking duration in hours'),
('maxBookingDuration', '168', 'number', 'business', 'Maximum booking duration in hours'),
('cancellationPolicy', 'flexible', 'select', 'business', 'Default cancellation policy'),
('autoApproval', 'false', 'boolean', 'business', 'Auto-approve bookings'),
('currency', 'USD', 'select', 'business', 'Default currency'),
('timezone', 'UTC', 'select', 'business', 'Default timezone')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default notification settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('emailEnabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
('smsEnabled', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),
('pushEnabled', 'true', 'boolean', 'notifications', 'Enable push notifications'),
('adminAlerts', 'true', 'boolean', 'notifications', 'Send alerts to admins')
ON CONFLICT (key, category) DO NOTHING;

-- Check the final result
SELECT 'system_settings table fixed successfully!' as message;
SELECT COUNT(*) as total_records FROM system_settings;
SELECT category, COUNT(*) as count FROM system_settings GROUP BY category;
