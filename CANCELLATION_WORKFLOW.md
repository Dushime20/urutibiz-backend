# Automatic Time-Based Cancellation Workflow

## Overview

This document describes the automatic time-based cancellation workflow system implemented for the URUTIBZ booking platform. The system provides instant cancellation with automatic refund calculation based on time until booking start, following international marketplace standards (similar to Kiku, Amazon, Airbnb, Turo).

## Why This System?

**Problem with Previous System:**
- Required owner approval for every cancellation
- Manual refund calculation and processing
- Inconsistent cancellation policies
- Delayed cancellations causing user frustration
- Poor user experience compared to industry standards

**Benefits of New System:**
- ✅ **Instant cancellation** - No waiting for owner approval
- ✅ **Automatic refund calculation** - Based on time until booking start
- ✅ **Automatic refund processing** - No manual intervention needed
- ✅ **Industry-standard policy** - Similar to Kiku, Amazon, Airbnb, Turo
- ✅ **Only confirmed bookings** - Pending bookings don't block availability
- ✅ **Complete audit trail** - All actions logged automatically
- ✅ **Better user experience** - Immediate feedback and processing

---

## Workflow Architecture

```
┌─────────────┐
│  CONFIRMED  │ ← Booking is confirmed and paid (availability blocked)
└──────┬──────┘
       │
       ↓ (Renter clicks "Cancel Booking" with reason)
┌─────────────────────────┐
│  Automatic Calculation  │ ← Calculate refund based on time until start
└──────┬──────────────────┘
       │
       ├────────────────────┬────────────────────┬────────────────────┐
       │                    │                    │                    │
       ↓ (7+ days)          ↓ (3-7 days)         ↓ (1-3 days)         ↓ (<24 hours)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  CANCELLED   │    │  CANCELLED   │    │  CANCELLED   │    │  CANCELLED   │
│ Full Refund  │    │ 50% Refund   │    │ No Refund    │    │ No Refund    │
│ -10% Fee     │    │ -10% Fee     │    │ +20% Fee     │    │ +100% Fee    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                    │                    │                    │
       └────────────────────┴────────────────────┴────────────────────┘
                             │
                             ↓ (Automatic Refund Processing)
                    ┌────────────────────┐
                    │  REFUNDED (if > 0) │
                    └────────────────────┘
```

---

## API Endpoints

### 1. Cancel Booking (Automatic Time-Based)

**Endpoint:** `POST /api/v1/bookings/:id/cancel`

**Authorization:** Renter or Owner (whoever created the booking)

**Request Body:**
```json
{
  "reason": "Change of plans, no longer need the item for this weekend trip"
}
```

**Validation:**
- Reason is required (mandatory)
- Minimum 10 characters
- Must be `confirmed` status only
- Pending bookings cannot be cancelled (they don't block availability)
- In-progress or completed bookings cannot be cancelled

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": "booking-uuid",
    "status": "cancelled",
    "refund_amount": 900,
    "cancellation_fee": 0,
    "platform_fee": 100,
    "reason": "Cancellation 7+ days before start - full refund minus platform fee",
    "message": "Refund of 900 will be processed automatically."
  }
}
```

**What Happens Automatically:**
1. ✅ **Status Check**: Only `confirmed` bookings can be cancelled
2. ✅ **Time Calculation**: Calculates hours/days until booking start
3. ✅ **Refund Calculation**: Automatically calculates refund based on time tier
4. ✅ **Booking Update**: Updates status to `cancelled` with fees and refund amount
5. ✅ **Refund Processing**: Automatically processes refund if `refundAmount > 0`
6. ✅ **Availability Clear**: Clears product availability for cancelled dates
7. ✅ **Audit Trail**: Records all actions in status history
8. ✅ **Cache Invalidation**: Invalidates related caches

**Important Notes:**
- ⚠️ **Pending bookings are rejected** - They don't block availability, so no cancellation needed
- ✅ **Automatic refund processing** - No manual intervention required
- ✅ **Instant cancellation** - No waiting for owner approval
- ✅ **Complete transparency** - User sees exact refund amount and fees upfront

---

## Database Schema

### Booking Status

```typescript
export type BookingStatus = 
  | 'pending'      // Payment not completed, doesn't block availability
  | 'confirmed'    // Payment completed, blocks availability (can be cancelled)
  | 'in_progress'  // Rental started, cannot cancel
  | 'completed'    // Rental finished, cannot cancel
  | 'cancelled'    // Cancelled by renter/owner
  | 'disputed'     // Dispute in progress
  | 'refunded';    // Refund processed
```

### Database Fields Used

The `bookings` table includes the following fields for cancellation:

```sql
-- Cancellation metadata
cancellation_reason VARCHAR(500),
cancellation_requested_at TIMESTAMP,
cancellation_fee DECIMAL(10, 2),

-- Refund metadata
refund_amount DECIMAL(10, 2),
refund_processed_at TIMESTAMP,

-- Payment status
payment_status VARCHAR(50), -- 'refund_pending', 'refunded', 'cancelled'
```

### Important Notes:
- **Only `confirmed` bookings can be cancelled** - Pending bookings don't block availability
- **In-progress/Completed bookings cannot be cancelled** - Only returns/disputes allowed
- **Refund processing is automatic** - No manual intervention needed
- **Platform fee is always 10%** - Non-refundable in all scenarios

---

## Status Flow Matrix

| Current Status | Allowed Actions | Next Status | Who Can Act |
|---------------|-----------------|-------------|-------------|
| `pending` | ❌ Cannot cancel | - | - |
| `confirmed` | ✅ Cancel (automatic) | `cancelled` | Renter/Owner |
| `in_progress` | ❌ Cannot cancel | - | - |
| `completed` | ❌ Cannot cancel | - | - |
| `cancelled` | ✅ Automatic refund | `refunded` (if refund > 0) | System |

### Cancellation Rules:
- ✅ **Only `confirmed` bookings** can be cancelled
- ❌ **Pending bookings** cannot be cancelled (they don't block availability)
- ❌ **In-progress/Completed** bookings cannot be cancelled (only returns/disputes)
- ✅ **Automatic refund processing** for cancelled bookings with refund > 0

---

## Error Handling

### Common Errors

| Status Code | Error | Description |
|------------|-------|-------------|
| 400 | Cancellation reason is required | Reason field is missing |
| 400 | Cancellation reason must be at least 10 characters | Reason too short |
| 400 | Only confirmed bookings can be cancelled. Pending bookings do not block availability. | Wrong status (pending/in_progress/completed) |
| 401 | Unauthorized | No authentication token |
| 403 | Not authorized to cancel this booking | User doesn't have access to this booking |
| 404 | Booking not found | Invalid booking ID |

### Error Response Example

```json
{
  "success": false,
  "message": "Only confirmed bookings can be cancelled. Pending bookings do not block availability.",
  "errors": []
}
```

---

## Cancellation Policy (Automatic Time-Based)

The system automatically calculates refunds based on **time until booking start**. All calculations are instant and transparent.

### Policy Tiers

| Time Until Start | Refund Amount | Cancellation Fee | Platform Fee | Reason |
|-----------------|---------------|------------------|--------------|--------|
| **7+ days** | Full amount minus 10% | 0% | 10% (non-refundable) | Full refund minus platform fee |
| **3-7 days** | 50% minus 10% | 0% | 10% (non-refundable) | 50% refund minus platform fee |
| **1-3 days** | 0% | 20% of booking | 10% (non-refundable) | No refund, 20% cancellation fee |
| **<24 hours** | 0% | 100% of booking | 10% (non-refundable) | No refund, full amount charged |
| **In-progress/Completed** | ❌ Cannot cancel | - | - | Only returns/disputes allowed |

### Examples

**Example 1: Cancelled 10 days before start**
```
Booking Amount: $1000
Platform Fee: $100 (10%, non-refundable)
Refund Amount: $900 (1000 - 100)
Cancellation Fee: $0
Result: Full refund minus platform fee
```

**Example 2: Cancelled 5 days before start**
```
Booking Amount: $1000
Platform Fee: $100 (10%, non-refundable)
Refund Amount: $400 (50% of 1000 = 500, minus 100)
Cancellation Fee: $0
Result: 50% refund minus platform fee
```

**Example 3: Cancelled 2 days before start**
```
Booking Amount: $1000
Platform Fee: $100 (10%, non-refundable)
Refund Amount: $0
Cancellation Fee: $200 (20% of 1000)
Result: No refund, 20% cancellation fee charged
```

**Example 4: Cancelled 12 hours before start**
```
Booking Amount: $1000
Platform Fee: $100 (10%, non-refundable)
Refund Amount: $0
Cancellation Fee: $1000 (100% of booking)
Result: No refund, full amount charged
```

### Implementation Details

- **Calculation**: Done automatically in `calculateCancellationRefund()` method
- **Time Calculation**: Uses `hoursUntilStart` and `daysUntilStart` from booking start date
- **Platform Fee**: Always 10% of total booking amount (non-refundable)
- **Refund Processing**: Automatic via `PaymentTransactionService.processRefund()`
- **Transparency**: User sees exact refund amount, fees, and reason before cancellation

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
   - Only confirmed bookings can be cancelled
   - Complete audit trail
   - Status history tracking

4. **Audit Trail:**
   - All actions logged
   - Timestamp tracking
   - User attribution
   - Reason capture

---

## Testing the API

### Cancel Booking (Automatic)

```bash
curl -X POST http://localhost:5000/api/v1/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Change of plans, no longer need the item for this weekend trip"
  }'
```

**Response (7+ days before start):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": "booking-uuid",
    "status": "cancelled",
    "refund_amount": 900,
    "cancellation_fee": 0,
    "platform_fee": 100,
    "reason": "Cancellation 7+ days before start - full refund minus platform fee",
    "message": "Refund of 900 will be processed automatically."
  }
}
```

**Response (3-7 days before start):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": "booking-uuid",
    "status": "cancelled",
    "refund_amount": 400,
    "cancellation_fee": 0,
    "platform_fee": 100,
    "reason": "Cancellation 3-7 days before start - 50% refund minus platform fee",
    "message": "Refund of 400 will be processed automatically."
  }
}
```

**Response (1-3 days before start):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": "booking-uuid",
    "status": "cancelled",
    "refund_amount": 0,
    "cancellation_fee": 200,
    "platform_fee": 100,
    "reason": "Cancellation 1-3 days before start - 20% cancellation fee",
    "message": "No refund applicable based on cancellation policy."
  }
}
```

**Response (<24 hours before start):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": "booking-uuid",
    "status": "cancelled",
    "refund_amount": 0,
    "cancellation_fee": 1000,
    "platform_fee": 100,
    "reason": "Cancellation within 24 hours - full amount charged",
    "message": "No refund applicable based on cancellation policy."
  }
}
```

**Error Response (Pending booking):**
```json
{
  "success": false,
  "message": "Only confirmed bookings can be cancelled. Pending bookings do not block availability.",
  "errors": []
}
```

---

## Frontend Integration

### For Renter/Owner:
- Show "Cancel Booking" button for **confirmed bookings only**
- Display modal to collect cancellation reason (minimum 10 characters)
- **Show refund preview** before cancellation (calculated based on time until start)
- Display cancellation details after cancellation:
  - Refund amount (if applicable)
  - Cancellation fee (if applicable)
  - Platform fee (always 10%)
  - Reason for the refund tier
- Show "Refund Processing" status if refund > 0
- Show "No Refund" message if refund = 0

### UI Flow Example:

1. **User clicks "Cancel Booking"**
   - Modal opens with reason input
   - **Preview shows**: "If you cancel now, you'll receive $900 refund (full amount minus $100 platform fee)"

2. **User enters reason and confirms**
   - API call to `/api/v1/bookings/:id/cancel`
   - **Instant response** with exact refund details

3. **Display Results**
   - Success message with refund amount
   - Booking status updated to "cancelled"
   - Refund processing notification (if applicable)

### Important Notes:
- ⚠️ **Pending bookings** - Don't show cancel button (they don't block availability)
- ⚠️ **In-progress/Completed** - Don't show cancel button (cannot cancel)
- ✅ **Confirmed bookings only** - Show cancel button with refund preview
- ✅ **Instant feedback** - No waiting for owner approval
- ✅ **Transparent pricing** - Show exact refund amount before cancellation

---

## Implementation Details

### Automatic Refund Calculation

The system uses the `calculateCancellationRefund()` method to automatically calculate refunds:

```typescript
private calculateCancellationRefund(booking: BookingData): {
  refundAmount: number;
  cancellationFee: number;
  platformFee: number;
  reason: string;
} {
  const now = new Date();
  const startDate = new Date(booking.start_date);
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilStart = hoursUntilStart / 24;
  
  const totalAmount = booking.total_amount || 0;
  const platformFee = totalAmount * 0.10; // 10% always non-refundable
  
  // Scenario 5: <24 hours - No refund, 100% cancellation fee
  if (hoursUntilStart < 24) {
    return {
      refundAmount: 0,
      cancellationFee: totalAmount, // 100%
      platformFee: platformFee,
      reason: 'Cancellation within 24 hours - full amount charged'
    };
  }
  
  // Scenario 4: 1-3 days - No refund, 20% cancellation fee
  if (daysUntilStart >= 1 && daysUntilStart < 3) {
    return {
      refundAmount: 0,
      cancellationFee: totalAmount * 0.20, // 20%
      platformFee: platformFee,
      reason: 'Cancellation 1-3 days before start - 20% cancellation fee'
    };
  }
  
  // Scenario 3: 3-7 days - 50% refund minus platform fee
  if (daysUntilStart >= 3 && daysUntilStart < 7) {
    return {
      refundAmount: (totalAmount * 0.50) - platformFee,
      cancellationFee: 0,
      platformFee: platformFee,
      reason: 'Cancellation 3-7 days before start - 50% refund minus platform fee'
    };
  }
  
  // Scenario 2: 7+ days - Full refund minus platform fee
  if (daysUntilStart >= 7) {
    return {
      refundAmount: totalAmount - platformFee,
      cancellationFee: 0,
      platformFee: platformFee,
      reason: 'Cancellation 7+ days before start - full refund minus platform fee'
    };
  }
}
```

### Automatic Refund Processing

When `refundAmount > 0`, the system automatically:
1. Finds the original payment transaction
2. Creates a refund transaction via `PaymentTransactionService.processRefund()`
3. Updates booking payment status to `refunded`
4. Records refund processing timestamp

### Database Updates

On cancellation, the following fields are updated:
- `status` → `cancelled`
- `cancellation_reason` → User-provided reason
- `cancellation_requested_at` → Current timestamp
- `cancellation_fee` → Calculated cancellation fee
- `refund_amount` → Calculated refund amount
- `payment_status` → `refund_pending` (if refund > 0) or `cancelled` (if refund = 0)
- `refund_processed_at` → Timestamp (if refund processed successfully)

## Future Enhancements

1. **Email Notifications:** Send automated emails with refund details
2. **Cancellation Policy Customization:** Allow owners to set custom policies per product
3. **Refund Tracking:** Add refund status tracking (pending, processing, completed)
4. **Partial Refunds:** Support partial refunds for multi-day bookings
5. **Dispute Escalation:** Allow renters to dispute cancellation fees
6. **Analytics Dashboard:** Track cancellation rates and refund amounts

---

## Migration Notes

**For Existing Bookings:**
- Old `cancelled` status bookings remain unchanged
- New cancellations use automatic time-based calculation
- Backward compatible with existing API

**Database Migration:**
- Existing cancellation fields are used
- No new columns needed (all fields already exist)

---

## Support

For questions or issues, please contact:
- Technical Lead: [Your Contact]
- Product Manager: [Your Contact]
- Documentation: See Swagger UI at `/api-docs`

---

**Last Updated:** January 2025
**Version:** 2.0.0 (Automatic Time-Based Cancellation)

---

## Summary

The new automatic time-based cancellation system provides:

✅ **Instant cancellation** - No owner approval needed  
✅ **Automatic refund calculation** - Based on time until booking start  
✅ **Automatic refund processing** - No manual intervention  
✅ **Industry-standard policy** - Similar to Kiku, Amazon, Airbnb, Turo  
✅ **Only confirmed bookings** - Pending bookings don't block availability  
✅ **Complete transparency** - User sees exact refund amount and fees upfront  
✅ **Better user experience** - Immediate feedback and processing

This implementation follows international marketplace standards and provides a seamless cancellation experience for users.
