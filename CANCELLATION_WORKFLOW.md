# Enhanced Cancellation Workflow

## Overview

This document describes the enhanced cancellation workflow system implemented for the URUTIBZ booking platform. The new system provides a controlled, multi-party approval process for booking cancellations with fraud prevention and automated refund handling.

## Why This System?

**Problem with Previous System:**
- Immediate cancellation upon request
- No owner involvement
- No fraud protection
- Manual refund process appeals
- Poor audit trail

**Benefits of New System:**
- ✅ Controlled approval workflow
- ✅ Owner review and decision
- ✅ Admin override for fraud prevention
- ✅ Automated refund processing
- ✅ Complete audit trail
- ✅ Better dispute resolution

---

## Workflow Architecture

```
┌─────────────┐
│  CONFIRMED  │ ← Booking is confirmed and paid
└──────┬──────┘
       │
       ↓ (Renter clicks "Request Cancellation")
┌─────────────────────────┐
│ CANCELLATION_REQUESTED  │ ← Awaiting owner decision
└──────┬──────────────────┘
       │
       ├────────────────────┬────────────────────┐
       │                    │                    │
       ↓ (Approve)          ↓ (Reject)           ↓ (Timeout/Auto-reject)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  CANCELLED   │    │   CONFIRMED  │    │   CONFIRMED  │
│              │    │  (rejected)  │    │ (auto-reject)│
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       ↓ (Admin processes refund)
┌──────────────┐
│   REFUNDED   │
└──────────────┘
```

---

## API Endpoints

### 1. Request Cancellation (Renter)

**Endpoint:** `POST /api/v1/bookings/:id/request-cancellation`

**Authorization:** Renter only

**Request Body:**
```json
{
  "reason": "Change of plans, no longer need the item for this weekend trip"
}
```

**Validation:**
- Reason is required (mandatory)
- Minimum 10 characters
- Must be confirmed status
- Only renter can request

**Response:**
```json
{
  "success": true,
  "message": "Cancellation request submitted successfully. Waiting for owner approval.",
  "data": {
    "id": "booking-uuid",
    "status": "cancellation_requested",
    "cancellation_reason": "Change of plans...",
    "cancellation_requested_at": "2024-01-15T10:30:00Z"
  }
}
```

**What Happens:**
1. Booking status changes to `cancellation_requested`
2. Product availability remains blocked (still showing as booked)
3. Owner receives notification
4. No refund processed yet

---

### 2. Review Cancellation (Owner)

**Endpoint:** `POST /api/v1/bookings/:id/review-cancellation`

**Authorization:** Owner only

**Request Body:**
```json
{
  "action": "approve",  // or "reject"
  "notes": "Agreed to cancel. Will process refund."
}
```

**For Rejection:**
```json
{
  "action": "reject",
  "notes": "Too close to rental date, can't find replacement"
}
```

**Validation:**
- Must be `cancellation_requested` status
- Only owner can review
- Action must be 'approve' or 'reject'

**Approve Response:**
```json
{
  "success": true,
  "message": "Cancellation approved successfully. Refund processing will be initiated.",
  "data": {
    "id": "booking-uuid",
    "status": "cancelled",
    "owner_decision": "approved",
    "cancellation_approved_at": "2024-01-15T11:00:00Z"
  }
}
```

**Reject Response:**
```json
{
  "success": true,
  "message": "Cancellation rejected. Booking remains confirmed.",
  "data": {
    "id": "booking-uuid",
    "status": "confirmed",
    "owner_decision": "rejected",
    "cancellation_rejected_reason": "Too close to rental date..."
  }
}
```

**What Happens:**

**On Approve:**
- Booking status → `cancelled`
- Product availability → Cleared (dates become available)
- Refund process → Triggered
- Audit trail → Recorded

**On Reject:**
- Booking status → `confirmed` (reverted)
- Product availability → Still blocked
- No refund
- Renter notified with owner's reason

---

### 3. Admin Force Cancel (Admin Only)

**Endpoint:** `POST /api/v1/bookings/:id/admin-cancel`

**Authorization:** Admin/Super Admin only

**Request Body:**
```json
{
  "reason": "Fraudulent booking detected, multiple fake accounts",
  "admin_notes": "Renter has multiple suspicious accounts with no payment history",
  "force_refund": true
}
```

**Validation:**
- Admin role required
- Reason must be at least 10 characters
- Can cancel any status

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled by admin. Refund processing will be initiated if applicable.",
  "data": {
    "id": "booking-uuid",
    "status": "cancelled",
    "admin_override": true,
    "admin_notes": "Renter has multiple suspicious accounts..."
  }
}
```

**What Happens:**
- Force cancels booking (bypasses owner)
- Clears product availability
- Processes refund if applicable
- Records admin override in audit trail
- Prevents fraud and abuse

---

### 4. Process Refund (Admin Only)

**Endpoint:** `POST /api/v1/bookings/:id/process-refund`

**Authorization:** Admin/Super Admin only

**Request Body:**
```json
{
  "refund_amount": 950,
  "cancellation_fee": 50,
  "reason": "Cancelled 10 days before rental date"
}
```

**Validation:**
- Must be cancelled status
- Admin role required

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "booking_id": "booking-uuid",
    "refund_amount": 950,
    "cancellation_fee": 50,
    "message": "Refund transaction has been initiated"
  }
}
```

**What Happens:**
- Calculates refund amount
- Applies cancellation fees
- Creates refund transaction
- Updates payment status to `refunded`
- Booking status → `refunded`
- Sends notification to renter

---

## Database Schema Changes

### New Booking Status

```typescript
export type BookingStatus = 
  | 'pending' 
  | Powered 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed'
  | 'cancellation_requested'  // 🆕 NEW
  | 'refunded';                // Already existed
```

### New Database Fields

Added to `bookings` table:

```sql
-- Cancellation metadata
cancellation_reason VARCHAR(500),
cancellation_requested_at TIMESTAMP,
cancellation_approved_at TIMESTAMP,
cancellation_rejected_at TIMESTAMP,
cancellation_rejected_reason VARCHAR(500),
owner_decision VARCHAR(20) CHECK (owner_decision IN ('approved', 'rejected')),
admin_override BOOLEAN DEFAULT false,

-- Refund metadata
refund_amount DECIMAL(10, 2),
cancellation_fee DECIMAL(10, 2)
```

---

## Status Flow Matrix

| Current Status | Allowed Actions | Next Status | Who Can Act |
|---------------|-----------------|-------------|-------------|
| `confirmed` | Request cancellation | `cancellation_requested` | Renter |
| `cancellation_requested` | Approve | `cancelled` | Owner |
| `cancellation_requested` | Reject | `confirmed` | Owner |
| `cancellation_requested` | Admin override | `cancelled` | Admin |
 coercion* | Cancel | `cancelled` | Any (admin override) |
| `cancelled` | Process refund | `refunded` | Admin |

---

## Error Handling

### Common Errors

| Status Code | Error | Description |
|------------|-------|-------------|
| 400 | Cancellation reason is required | Reason field is missing |
| 400 | Cancellation reason must be at least 10 characters | Reason too short |
| 400 | Only confirmed bookings can be cancelled | Wrong status |
| 401 | Unauthorized | No authentication token |
| 403 | Only the renter can request cancellation | Wrong user role |
| 403 | Only the owner can review cancellation requests | Wrong user role |
| 403 | Admin access required | Not an admin |
| 404 | Booking not found | Invalid booking ID |

---

## Cancellation Policy (Example)

```
Full Refund (minus 5% fee):
- Cancelled more than 7 days before start date

Partial Refund (50%):
- Cancelled 3-7 days before start date

No Refund:
- Cancelled less than 3 days before start date
```

**Implementation:**
Calculated in the `processRefund` endpoint based on cancellation date vs booking start date.

---

## Security Features

1. **Authorization Checks:**
   - Role-based access control
   - User ID verification
   - Action-specific permissions

2. **Data Validation:**
   - Mandatory cancellation reasons
   - Minimum character requirements
   - Status transition validation

3. **Fraud Prevention:**
   - Admin override capability
   - Complete audit trail
   - Status history tracking

4. **Audit Trail:**
   - All actions logged
   - Timestamp tracking
   - User attribution
   - Reason capture

---

## Testing the API

### 1. Request Cancellation (as Renter)

```bash
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/request-cancellation \
  -H "Authorization: Bearer RENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Change of plans, no longer need the item"
  }'
```

### 2. Review Cancellation (as Owner)

**Approve:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/review-cancellation \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "Agreed to cancel"
  }'
```

**Reject:**
```bash
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/review-cancellation \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "notes": "Too close to rental date"
  }'
```

### 3. Admin Force Cancel

```bash
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/admin-cancel \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Fraudulent booking detected",
    "admin_notes": "Multiple suspicious accounts",
    "force_refund": true
  }'
```

### 4. Process Refund

```bash
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/process-refund \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refund_amount": 950,
    "cancellation_fee": 50,
    "reason": "Cancelled 10 days before rental"
  } TRANSFORM
```

---

## Frontend Integration

### For Renter:
- Show "Request Cancellation" button for confirmed bookings
- Display modal to collect cancellation reason
- Show "Awaiting Owner Approval" status for pending cancellations

### For Owner:
- Show pending cancellation requests
- Display renter's reason
- Show Approve/Reject buttons
- Add notes when reviewing

### For Admin:
- View all cancellation requests
- Force cancel any booking
- Process refunds
- View complete audit trail

---

## Future Enhancements

1. **Auto-reject Timer:** Auto-reject after 7 days if owner doesn't respond
2. **Refund Automation:** Automatic refund processing after approval
3. **Email Notifications:** Send emails at each stage
4. **Cancellation Policy API:** Dynamic policy based on product/owner settings
5. **Dispute Escalation:** Allow renters to dispute rejected cancellations
6. **Batch Operations:** Process multiple cancellations at once

---

## Migration Notes

**For Existing Bookings:**
- Old `cancelled` status bookings remain unchanged
- New cancellations use the approval workflow
- Backward compatible with existing API

**Database Migration:**
- Add new columns to `bookings` table
- No data migration needed (optional fields)

---

## Support

For questions or issues, please contact:
- Technical Lead: [Your Contact]
- Product Manager: [Your Contact]
- Documentation: See Swagger UI at `/api-docs`

---

**Last Updated:** January 2024
**Version:** 1.0.0
