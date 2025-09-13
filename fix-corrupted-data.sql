-- Fix corrupted JSON-encoded data in system_settings table
-- Run this in your PostgreSQL database

-- Clear existing corrupted data
DELETE FROM system_settings WHERE category = 'theme';

-- Insert clean theme settings
INSERT INTO system_settings (key, value, type, category, description) VALUES
('mode', 'dark', 'select', 'theme', 'Theme mode (light/dark/auto)'),
('primaryColor', '#f60100', 'color', 'theme', 'Primary brand color'),
('secondaryColor', '#64748b', 'color', 'theme', 'Secondary color'),
('accentColor', '#10b981', 'color', 'theme', 'Accent color'),
('borderRadius', '12px', 'text', 'theme', 'Border radius'),
('fontSize', '16px', 'select', 'theme', 'Font size'),
('fontFamily', 'Inter', 'select', 'theme', 'Font family'),
('spacing', 'comfortable', 'select', 'theme', 'Spacing');

-- Check the results
SELECT key, value, type, category FROM system_settings WHERE category = 'theme' ORDER BY key;
