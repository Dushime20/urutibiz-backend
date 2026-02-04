-- =====================================================
-- GET UNPAID BOOKINGS - SQL QUERIES
-- =====================================================
-- 
-- This file contains SQL queries to identify and analyze unpaid bookings
-- Run these queries directly in your PostgreSQL database
--

-- =====================================================
-- 1. BASIC UNPAID BOOKINGS QUERY
-- =====================================================
-- Get all bookings with unpaid status (pending, processing, failed)
-- Excludes cancelled bookings

SELECT 
    b.id,
    b.booking_number,
    b.status as booking_status,
    b.payment_status,
    b.total_amount,
    b.platform_fee,
    b.tax_amount,
    b.security_deposit,
    b.start_date,
    b.end_date,
    b.created_at,
    EXTRACT(EPOCH FROM (NOW() - b.created_at))/3600 as hours_since_created,
    EXTRACT(EPOCH FROM (NOW() - b.created_at))/86400 as days_since_created,
    -- Renter information
    r.email as renter_email,
    r.first_name as renter_first_name,
    r.last_name as renter_last_name,
    r.phone as renter_phone,
    -- Owner information  
    o.email as owner_email,
    o.first_name as owner_first_name,
    o.last_name as owner_last_name,
    -- Product information
    p.title as product_title,
    p.price_per_day as product_price_per_day
FROM bookings b
LEFT JOIN users r ON b.renter_id = r.id
LEFT JOIN users o ON b.owner_id = o.id  
LEFT JOIN products p ON b.product_id = p.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
ORDER BY b.created_at DESC;

-- =====================================================
-- 2. UNPAID BOOKINGS OLDER THAN 24 HOURS
-- =====================================================
-- Focus on bookings that are likely abandoned

SELECT 
    b.id,
    b.booking_number,
    b.payment_status,
    b.total_amount,
    b.platform_fee,
    ROUND(EXTRACT(EPOCH FROM (NOW() - b.created_at))/86400, 1) as days_old,
    r.email as renter_email,
    CONCAT(r.first_name, ' ', r.last_name) as renter_name,
    p.title as product_title
FROM bookings b
LEFT JOIN users r ON b.renter_id = r.id
LEFT JOIN products p ON b.product_id = p.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
  AND b.created_at < NOW() - INTERVAL '24 hours'
ORDER BY b.created_at ASC;

-- =====================================================
-- 3. UNPAID BOOKINGS SUMMARY STATISTICS
-- =====================================================
-- Get counts and totals by payment status

SELECT 
    payment_status,
    COUNT(*) as booking_count,
    SUM(total_amount) as total_amount,
    SUM(platform_fee) as total_platform_fees,
    AVG(total_amount) as avg_amount,
    MIN(created_at) as oldest_booking,
    MAX(created_at) as newest_booking
FROM bookings 
WHERE payment_status IN ('pending', 'processing', 'failed')
  AND status != 'cancelled'
GROUP BY payment_status
ORDER BY booking_count DESC;

-- =====================================================
-- 4. UNPAID BOOKINGS WITH PAYMENT TRANSACTION DETAILS
-- =====================================================
-- Show booking and related payment transaction information

SELECT 
    b.id as booking_id,
    b.booking_number,
    b.payment_status as booking_payment_status,
    b.total_amount as booking_amount,
    b.created_at as booking_created,
    -- Payment transaction details
    pt.id as transaction_id,
    pt.transaction_type,
    pt.amount as transaction_amount,
    pt.status as transaction_status,
    pt.provider,
    pt.failure_reason,
    pt.created_at as transaction_created,
    -- User details
    CONCAT(r.first_name, ' ', r.last_name) as renter_name,
    r.email as renter_email
FROM bookings b
LEFT JOIN payment_transactions pt ON b.id = pt.booking_id
LEFT JOIN users r ON b.renter_id = r.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
ORDER BY b.created_at DESC, pt.created_at DESC;

-- =====================================================
-- 5. UNPAID BOOKINGS BY AGE GROUPS
-- =====================================================
-- Categorize unpaid bookings by how old they are

SELECT 
    CASE 
        WHEN b.created_at > NOW() - INTERVAL '1 day' THEN '< 1 day'
        WHEN b.created_at > NOW() - INTERVAL '7 days' THEN '1-7 days'
        WHEN b.created_at > NOW() - INTERVAL '30 days' THEN '1-4 weeks'
        ELSE '> 1 month'
    END as age_group,
    COUNT(*) as booking_count,
    SUM(b.total_amount) as total_amount,
    SUM(b.platform_fee) as total_platform_fees
FROM bookings b
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
GROUP BY 
    CASE 
        WHEN b.created_at > NOW() - INTERVAL '1 day' THEN '< 1 day'
        WHEN b.created_at > NOW() - INTERVAL '7 days' THEN '1-7 days'
        WHEN b.created_at > NOW() - INTERVAL '30 days' THEN '1-4 weeks'
        ELSE '> 1 month'
    END
ORDER BY 
    CASE 
        WHEN age_group = '< 1 day' THEN 1
        WHEN age_group = '1-7 days' THEN 2
        WHEN age_group = '1-4 weeks' THEN 3
        ELSE 4
    END;

-- =====================================================
-- 6. UNPAID BOOKINGS WITH HIGHEST AMOUNTS
-- =====================================================
-- Focus on high-value unpaid bookings

SELECT 
    b.id,
    b.booking_number,
    b.payment_status,
    b.total_amount,
    b.platform_fee,
    ROUND(EXTRACT(EPOCH FROM (NOW() - b.created_at))/86400, 1) as days_old,
    CONCAT(r.first_name, ' ', r.last_name) as renter_name,
    r.email as renter_email,
    p.title as product_title
FROM bookings b
LEFT JOIN users r ON b.renter_id = r.id
LEFT JOIN products p ON b.product_id = p.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
  AND b.total_amount > 100  -- Adjust threshold as needed
ORDER BY b.total_amount DESC
LIMIT 20;

-- =====================================================
-- 7. FAILED PAYMENT ATTEMPTS
-- =====================================================
-- Focus specifically on failed payments with reasons

SELECT 
    b.id as booking_id,
    b.booking_number,
    b.total_amount,
    pt.id as transaction_id,
    pt.provider,
    pt.failure_reason,
    pt.created_at as failed_at,
    CONCAT(r.first_name, ' ', r.last_name) as renter_name,
    r.email as renter_email
FROM bookings b
JOIN payment_transactions pt ON b.id = pt.booking_id
LEFT JOIN users r ON b.renter_id = r.id
WHERE pt.status = 'failed'
  AND b.status != 'cancelled'
  AND pt.failure_reason IS NOT NULL
ORDER BY pt.created_at DESC;

-- =====================================================
-- 8. UNPAID BOOKINGS BY PRODUCT CATEGORY
-- =====================================================
-- Analyze which product categories have most unpaid bookings

SELECT 
    c.name as category_name,
    COUNT(b.id) as unpaid_bookings,
    SUM(b.total_amount) as total_unpaid_amount,
    AVG(b.total_amount) as avg_unpaid_amount
FROM bookings b
LEFT JOIN products p ON b.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
GROUP BY c.id, c.name
HAVING COUNT(b.id) > 0
ORDER BY unpaid_bookings DESC;

-- =====================================================
-- 9. USERS WITH MULTIPLE UNPAID BOOKINGS
-- =====================================================
-- Identify users who have multiple unpaid bookings

SELECT 
    r.id as user_id,
    CONCAT(r.first_name, ' ', r.last_name) as user_name,
    r.email,
    COUNT(b.id) as unpaid_bookings_count,
    SUM(b.total_amount) as total_unpaid_amount,
    MIN(b.created_at) as first_unpaid_booking,
    MAX(b.created_at) as latest_unpaid_booking
FROM bookings b
LEFT JOIN users r ON b.renter_id = r.id
WHERE b.payment_status IN ('pending', 'processing', 'failed')
  AND b.status != 'cancelled'
GROUP BY r.id, r.first_name, r.last_name, r.email
HAVING COUNT(b.id) > 1
ORDER BY unpaid_bookings_count DESC, total_unpaid_amount DESC;

-- =====================================================
-- 10. CLEANUP QUERY (USE WITH EXTREME CAUTION)
-- =====================================================
-- Query to identify bookings that could be safely deleted
-- DO NOT RUN DELETE without careful review!

-- First, see what would be deleted:
SELECT 
    b.id,
    b.booking_number,
    b.payment_status,
    b.total_amount,
    ROUND(EXTRACT(EPOCH FROM (NOW() - b.created_at))/86400, 1) as days_old,
    r.email as renter_email
FROM bookings b
LEFT JOIN users r ON b.renter_id = r.id
WHERE b.payment_status IN ('pending', 'failed')  -- Exclude 'processing' to be safe
  AND b.status != 'cancelled'
  AND b.created_at < NOW() - INTERVAL '7 days'  -- Older than 7 days
  AND NOT EXISTS (
    -- Don't delete if there are any completed transactions
    SELECT 1 FROM payment_transactions pt 
    WHERE pt.booking_id = b.id 
    AND pt.status = 'completed'
  )
ORDER BY b.created_at ASC;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- =====================================================
-- 
-- 1. Connect to your PostgreSQL database
-- 2. Run individual queries as needed
-- 3. For cleanup operations, always run SELECT first to review
-- 4. Adjust time intervals and thresholds based on your business rules
-- 5. Consider your payment processing timeframes before cleanup
--
-- SAFETY NOTES:
-- - Always backup your database before running cleanup operations
-- - Test queries on a staging environment first
-- - Review business rules for payment processing timeframes
-- - Consider customer communication before deleting bookings
-- =====================================================