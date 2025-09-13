-- Simple fix for system_settings table
-- This version avoids ON CONFLICT issues

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

-- Clear existing data to avoid conflicts
DELETE FROM system_settings;

-- Insert default theme settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('mode', 'light', 'select', 'theme', 'Theme mode (light/dark/auto)'),
('primaryColor', '#0ea5e9', 'color', 'theme', 'Primary brand color'),
('secondaryColor', '#64748b', 'color', 'theme', 'Secondary color'),
('accentColor', '#10b981', 'color', 'theme', 'Accent color'),
('borderRadius', '8px', 'text', 'theme', 'Border radius'),
('fontSize', '14px', 'select', 'theme', 'Base font size'),
('fontFamily', 'Inter', 'select', 'theme', 'Font family');

-- Insert default system settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('appName', 'UrutiBiz', 'string', 'system', 'Application name'),
('appVersion', '1.0.0', 'string', 'system', 'Application version'),
('maintenanceMode', 'false', 'boolean', 'system', 'Maintenance mode'),
('debugMode', 'false', 'boolean', 'system', 'Debug mode');

-- Insert default security settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('sessionTimeout', '3600', 'number', 'security', 'Session timeout in seconds'),
('maxLoginAttempts', '5', 'number', 'security', 'Maximum login attempts before lockout'),
('twoFactorRequired', 'false', 'boolean', 'security', 'Require 2FA for admin accounts'),
('auditLogRetention', '90', 'number', 'security', 'Audit log retention in days');

-- Insert default business settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('commissionRate', '0.05', 'number', 'business', 'Platform commission rate (5%)'),
('minBookingDuration', '1', 'number', 'business', 'Minimum booking duration in hours'),
('maxBookingDuration', '168', 'number', 'business', 'Maximum booking duration in hours'),
('cancellationPolicy', 'flexible', 'select', 'business', 'Default cancellation policy'),
('autoApproval', 'false', 'boolean', 'business', 'Auto-approve bookings'),
('currency', 'USD', 'select', 'business', 'Default currency'),
('timezone', 'UTC', 'select', 'business', 'Default timezone');

-- Insert default notification settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('emailEnabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
('smsEnabled', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),
('pushEnabled', 'true', 'boolean', 'notifications', 'Enable push notifications'),
('adminAlerts', 'true', 'boolean', 'notifications', 'Send alerts to admins');

-- Show results
SELECT 'system_settings table fixed successfully!' as message;
SELECT COUNT(*) as total_records FROM system_settings;
SELECT category, COUNT(*) as count FROM system_settings GROUP BY category ORDER BY category;
