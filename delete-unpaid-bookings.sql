-- =====================================================
-- Delete Unpaid Bookings SQL Script
-- =====================================================
-- This script deletes all bookings with unpaid payment status
-- Run this directly in your PostgreSQL database
-- =====================================================

-- STEP 1: Preview what will be deleted (ALWAYS RUN THIS FIRST)
-- =====================================================

SELECT 
    b.id,
    b.booking_number,
    b.status as booking_status,
    b.payment_status,
    b.total_amount,
    b.currency,
    b.created_at,
    p.name as product_name,
    CONCAT(renter.first_name, ' ', renter.last_name) as renter_name,
    CONCAT(owner.first_name, ' ', owner.last_name) as owner_name,
    EXTRACT(DAY FROM (NOW() - b.created_at)) as days_old
FROM bookings b
LEFT JOIN products p ON b.product_id = p.id
LEFT JOIN users renter ON b.renter_id = renter.id
LEFT JOIN users owner ON b.owner_id = owner.id
WHERE b.payment_status IN ('pending', 'failed')
  AND b.status IN ('pending', 'cancelled')
ORDER BY b.created_at DESC;

-- STEP 2: Count bookings to be deleted
-- =====================================================

SELECT 
    COUNT(*) as total_bookings,
    SUM(total_amount) as total_amount,
    payment_status,
    status as booking_status
FROM bookings
WHERE payment_status IN ('pending', 'failed')
  AND status IN ('pending', 'cancelled')
GROUP BY payment_status, status;

-- STEP 3: Delete unpaid bookings (CAUTION: Cannot be undone!)
-- =====================================================
-- Uncomment the lines below to actually delete

BEGIN;

-- Delete related booking status history
DELETE FROM booking_status_history
WHERE booking_id IN (
    SELECT id FROM bookings
    WHERE payment_status IN ('pending', 'failed')
      AND status IN ('pending', 'cancelled')
);

-- Delete related booking messages (if table exists)
-- DELETE FROM booking_messages
-- WHERE booking_id IN (
--     SELECT id FROM bookings
--     WHERE payment_status IN ('pending', 'failed')
--       AND status IN ('pending', 'cancelled')
-- );

-- Delete related inspections (if table exists)
-- DELETE FROM inspections
-- WHERE booking_id IN (
--     SELECT id FROM bookings
--     WHERE payment_status IN ('pending', 'failed')
--       AND status IN ('pending', 'cancelled')
-- );

-- Delete the bookings
DELETE FROM bookings
WHERE payment_status IN ('pending', 'failed')
  AND status IN ('pending', 'cancelled');

-- Review what was deleted
SELECT 
    'Deleted unpaid bookings' as action,
    COUNT(*) as deleted_count
FROM bookings
WHERE payment_status IN ('pending', 'failed')
  AND status IN ('pending', 'cancelled');

-- COMMIT; -- Uncomment to commit the transaction
ROLLBACK; -- Comment this out when ready to commit

-- =====================================================
-- ALTERNATIVE: Delete bookings older than X days
-- =====================================================

-- Preview bookings older than 30 days
SELECT 
    b.id,
    b.status,
    b.payment_status,
    b.total_amount,
    b.created_at,
    EXTRACT(DAY FROM (NOW() - b.created_at)) as days_old
FROM bookings b
WHERE b.payment_status IN ('pending', 'failed')
  AND b.status IN ('pending', 'cancelled')
  AND b.created_at < NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC;

-- Delete bookings older than 30 days
-- BEGIN;
-- DELETE FROM booking_status_history
-- WHERE booking_id IN (
--     SELECT id FROM bookings
--     WHERE payment_status IN ('pending', 'failed')
--       AND status IN ('pending', 'cancelled')
--       AND created_at < NOW() - INTERVAL '30 days'
-- );
-- 
-- DELETE FROM bookings
-- WHERE payment_status IN ('pending', 'failed')
--   AND status IN ('pending', 'cancelled')
--   AND created_at < NOW() - INTERVAL '30 days';
-- COMMIT;

-- =====================================================
-- ALTERNATIVE: Delete only specific payment status
-- =====================================================

-- Delete only 'failed' payment bookings
-- BEGIN;
-- DELETE FROM booking_status_history
-- WHERE booking_id IN (
--     SELECT id FROM bookings
--     WHERE payment_status = 'failed'
--       AND status IN ('pending', 'cancelled')
-- );
-- 
-- DELETE FROM bookings
-- WHERE payment_status = 'failed'
--   AND status IN ('pending', 'cancelled');
-- COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run after deletion)
-- =====================================================

-- Verify no unpaid bookings remain
SELECT COUNT(*) as remaining_unpaid_bookings
FROM bookings
WHERE payment_status IN ('pending', 'failed')
  AND status IN ('pending', 'cancelled');

-- Check all payment statuses
SELECT 
    payment_status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM bookings
GROUP BY payment_status
ORDER BY count DESC;

-- Check all booking statuses
SELECT 
    status,
    COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- SAFETY NOTES
-- =====================================================
-- 1. ALWAYS run the preview queries first (STEP 1 & 2)
-- 2. NEVER delete bookings with payment_status = 'completed', 'refunded', or 'partially_refunded'
-- 3. Consider backing up your database before running DELETE operations
-- 4. Use ROLLBACK to undo changes if something goes wrong
-- 5. Only COMMIT when you're absolutely sure
-- 
-- BACKUP COMMAND (PostgreSQL):
-- pg_dump -U postgres -d urutibiz_dev > backup_before_delete_$(date +%Y%m%d_%H%M%S).sql
-- =====================================================
