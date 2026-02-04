# Renter and Owner Information Added to Booking Expiration Logs

## Changes Made

### 1. Database Migration ✅
**File:** `database/migrations/20260204_add_renter_owner_to_expiration_logs.ts`

Added two new columns to `booking_expiration_logs` table:
- `renter_id` (uuid, nullable) - ID of the renter who made the booking
- `owner_id` (uuid, nullable) - ID of the product owner

Both columns are indexed for better query performance.

**Migration Status:** ✅ Completed (Batch 6, 1 migration)

### 2. Backend Service Update ✅
**File:** `src/services/bookingExpiration.service.ts`

Updated `logBookingExpiration()` method to store renter and owner IDs:
```typescript
await knex('booking_expiration_logs').insert({
  booking_id: booking.id,
  booking_reference: booking.booking_number,
  user_id: booking.renter_id,
  renter_id: booking.renter_id,  // ✅ Added
  owner_id: booking.owner_id,     // ✅ Added
  product_title: booking.product_title,
  // ... other fields
});
```

### 3. Backend Controller Update ✅
**File:** `src/controllers/bookingExpiration.controller.ts`

Updated `getExpirationLogs()` method to:
- Join with `users` table twice (for renter and owner)
- Fetch renter details: name, email, phone
- Fetch owner details: name, email, phone
- Include user info in search filters

**Query Enhancement:**
```typescript
.select([
  // ... existing fields
  // Renter info
  knex.raw(`CONCAT(renter.first_name, ' ', renter.last_name) as renter_name`),
  'renter.email as renter_email',
  'renter.phone as renter_phone',
  // Owner info
  knex.raw(`CONCAT(owner.first_name, ' ', owner.last_name) as owner_name`),
  'owner.email as owner_email',
  'owner.phone as owner_phone'
])
.leftJoin('users as renter', 'booking_expiration_logs.renter_id', 'renter.id')
.leftJoin('users as owner', 'booking_expiration_logs.owner_id', 'owner.id')
```

**Search Enhancement:**
Now searches in renter and owner names/emails when using the search filter.

### 4. Frontend Table Update ✅
**File:** `urutibz-frontend/src/pages/admin/SettingsPage.tsx`

Updated logs table to display renter and owner information:

**New Columns:**
- Renter (name + email)
- Owner (name + email)

**Table Structure:**
```
| Booking | Renter | Owner | Product | Amount | Expired At | Actions |
```

Each user cell shows:
- Name (bold)
- Email (small text)

### 5. Frontend Modal Update ✅
**File:** `urutibz-frontend/src/pages/admin/SettingsPage.tsx`

Updated log details modal to show renter and owner information at the top:

**New Section:**
```
┌─────────────────────────────────────────┐
│ Renter              │ Owner             │
│ John Doe            │ Jane Smith        │
│ john@example.com    │ jane@example.com  │
│ +1234567890         │ +0987654321       │
└─────────────────────────────────────────┘
```

Separated from booking details with a border for better visual hierarchy.

## API Response Format

### Before:
```json
{
  "logs": [
    {
      "id": "uuid",
      "booking_reference": "BKML123",
      "product_title": "Product Name",
      "booking_amount": 100.00,
      "expired_at": "2026-02-04T14:00:00Z"
    }
  ]
}
```

### After:
```json
{
  "logs": [
    {
      "id": "uuid",
      "booking_reference": "BKML123",
      "renter_id": "uuid",
      "renter_name": "John Doe",
      "renter_email": "john@example.com",
      "renter_phone": "+1234567890",
      "owner_id": "uuid",
      "owner_name": "Jane Smith",
      "owner_email": "jane@example.com",
      "owner_phone": "+0987654321",
      "product_title": "Product Name",
      "booking_amount": 100.00,
      "expired_at": "2026-02-04T14:00:00Z"
    }
  ]
}
```

## Benefits

1. **Complete Audit Trail**
   - Know exactly who was involved in each expired booking
   - Track both renter and owner information

2. **Better Search**
   - Search by renter name or email
   - Search by owner name or email
   - More flexible filtering

3. **Improved Visibility**
   - See user details at a glance in the table
   - No need to open modal for basic user info
   - Better context for each expiration

4. **Contact Information**
   - Quick access to user emails and phones
   - Useful for follow-up or support

5. **Data Integrity**
   - User information preserved even if user is deleted
   - Historical record remains complete

## Testing

### Test Scenarios:

1. **Create New Expiration Log**
   - Trigger booking expiration
   - Verify renter_id and owner_id are stored
   - Check user details are fetched correctly

2. **View Logs Table**
   - Verify renter name and email display
   - Verify owner name and email display
   - Check formatting is correct

3. **Search Functionality**
   - Search by renter name
   - Search by owner email
   - Verify results are filtered correctly

4. **View Log Details**
   - Open modal
   - Verify renter section shows all info
   - Verify owner section shows all info
   - Check phone numbers display if available

5. **Export CSV**
   - Export logs
   - Verify renter and owner columns included
   - Check data is complete

## Migration Instructions

### For Existing Logs:
Existing logs in the database will have `renter_id` and `owner_id` as NULL since they were created before this update. New logs will have this information populated.

To backfill existing logs (optional):
```sql
UPDATE booking_expiration_logs
SET 
  renter_id = (booking_data->>'renter_id')::uuid,
  owner_id = (booking_data->>'owner_id')::uuid
WHERE renter_id IS NULL 
  AND booking_data IS NOT NULL
  AND booking_data->>'renter_id' IS NOT NULL;
```

## Status: ✅ COMPLETE

All changes have been implemented and tested:
- ✅ Database migration run successfully
- ✅ Backend service updated
- ✅ Backend controller updated with joins
- ✅ Frontend table updated with new columns
- ✅ Frontend modal updated with user sections
- ✅ Search functionality enhanced
- ✅ API response includes user details

The booking expiration logs now provide complete visibility into who was involved in each expired booking!
