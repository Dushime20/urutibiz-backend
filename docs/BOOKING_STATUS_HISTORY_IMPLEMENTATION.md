# Booking Status History Implementation Guide

## Overview

The Booking Status History system provides comprehensive audit trail functionality for tracking all status changes in bookings. This implementation follows the database schema:

```sql
CREATE TABLE booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status booking_status,
    new_status booking_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Components Implemented

### 1. Types (`src/types/bookingStatusHistory.types.ts`)

#### Core Interfaces:
- **`BookingStatusHistoryData`** - Complete status history record
- **`CreateBookingStatusHistoryData`** - Data for creating new history records
- **`BookingStatusHistoryFilters`** - Filtering options for queries
- **`BookingStatusHistorySearchParams`** - Search parameters

### 2. Repository (`src/repositories/BookingStatusHistoryRepository.ts`)

#### Key Methods:
- **`create(data)`** - Create new status history record
- **`findByBookingId(bookingId)`** - Get all status changes for a booking
- **`findPaginated(filters, page, limit)`** - Paginated search with filters
- **`getStatusChangeStats()`** - Statistical analysis of status changes

#### Features:
- **Immutable Records** - Status history cannot be updated or deleted (audit integrity)
- **Filtering Support** - By booking, user, status, date range
- **Statistical Analysis** - Change frequency, user activity, status distribution

### 3. Service (`src/services/BookingStatusHistoryService.ts`)

#### Core Methods:
- **`recordStatusChange()`** - Record a new status change
- **`getByBookingId()`** - Retrieve booking's status history
- **`getStatusAnalytics()`** - Generate analytics for a specific booking
- **`getGlobalStats()`** - System-wide status change statistics

#### Analytics Features:
- **Status Flow Tracking** - Visual representation of status transitions
- **Time Analysis** - Calculate time spent in each status
- **User Activity** - Track frequent status changers
- **Change Patterns** - Identify common status transition patterns

### 4. Controller Integration (`src/controllers/bookings.controller.ts`)

#### Automatic Status Tracking:
All status-changing operations now automatically record audit trail:

1. **Booking Creation** - Records initial 'pending' status
2. **Status Updates** - General update method tracks status changes
3. **Cancellation** - Records cancellation with reason
4. **Confirmation** - Records owner confirmation
5. **Check-in/Check-out** - Records progress transitions

#### New Endpoints:

##### GET `/api/v1/bookings/:id/status-history`
- **Purpose**: Retrieve complete status history for a booking
- **Access**: Booking participants or admin
- **Response**: Array of status change records

##### GET `/api/v1/bookings/:id/status-analytics`
- **Purpose**: Get detailed analytics for booking status changes
- **Access**: Booking participants or admin
- **Response**: Analytics data including time analysis and status flow

##### GET `/api/v1/bookings/status-stats`
- **Purpose**: Global status change statistics
- **Access**: Admin only
- **Response**: System-wide statistics and patterns

### 5. Routes (`src/routes/bookingStatusHistory.routes.ts`)

Status history routes are integrated into the booking routes system for logical organization.

## Usage Examples

### 1. Automatic Status Tracking

Status changes are automatically tracked when using controller methods:

```typescript
// This automatically records status change
await BookingsController.cancelBooking(req, res);

// Records: old_status -> 'cancelled', reason: "User cancellation"
```

### 2. Manual Status Recording

For custom status changes:

```typescript
await BookingStatusHistoryService.recordStatusChange(
  bookingId,
  'pending',
  'confirmed',
  userId,
  'Owner approval',
  'Additional notes'
);
```

### 3. Retrieving Status History

```typescript
// Get all status changes for a booking
const history = await BookingStatusHistoryService.getByBookingId(bookingId);

// Get analytics
const analytics = await BookingStatusHistoryService.getStatusAnalytics(bookingId);
```

### 4. Analytics Data Structure

```typescript
{
  totalChanges: 5,
  statusFlow: [
    {
      from: undefined,
      to: 'pending',
      timestamp: '2025-01-01T10:00:00Z',
      changedBy: 'user123',
      reason: null
    },
    {
      from: 'pending',
      to: 'confirmed',
      timestamp: '2025-01-01T12:00:00Z',
      changedBy: 'owner456',
      reason: 'Owner approval'
    }
  ],
  timeInStatus: {
    'pending': 7200000, // 2 hours in milliseconds
    'confirmed': 86400000 // 24 hours
  },
  frequentChangers: {
    'user123': 2,
    'owner456': 1
  }
}
```

## API Documentation

### Status History Endpoints

#### 1. Get Booking Status History
```
GET /api/v1/bookings/:id/status-history
```

**Response:**
```json
{
  "success": true,
  "message": "Booking status history retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "bookingId": "booking-uuid",
      "oldStatus": null,
      "newStatus": "pending",
      "changedBy": "user-uuid",
      "reason": null,
      "notes": "Booking created",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### 2. Get Status Analytics
```
GET /api/v1/bookings/:id/status-analytics
```

**Response:**
```json
{
  "success": true,
  "message": "Booking status analytics retrieved successfully",
  "data": {
    "totalChanges": 3,
    "statusFlow": [...],
    "timeInStatus": {...},
    "frequentChangers": {...}
  }
}
```

#### 3. Get Global Statistics
```
GET /api/v1/bookings/status-stats
```

**Response:**
```json
{
  "success": true,
  "message": "Global status statistics retrieved successfully",
  "data": {
    "totalChanges": 1250,
    "statusDistribution": {
      "pending": 45,
      "confirmed": 30,
      "completed": 20,
      "cancelled": 5
    },
    "frequentChangers": {...}
  }
}
```

## Database Considerations

### Indexes for Performance
```sql
-- Primary queries by booking
CREATE INDEX idx_booking_status_history_booking_id ON booking_status_history(booking_id);

-- Queries by user activity
CREATE INDEX idx_booking_status_history_changed_by ON booking_status_history(changed_by);

-- Time-based queries
CREATE INDEX idx_booking_status_history_created_at ON booking_status_history(created_at);

-- Status transition analysis
CREATE INDEX idx_booking_status_history_status_transition ON booking_status_history(old_status, new_status);
```

### Data Retention Policy
- Status history records are permanent for audit compliance
- Consider archiving old records (>2 years) to separate tables
- Implement data export functionality for compliance reporting

## Security & Compliance

### Audit Trail Integrity
- Records are immutable (no updates/deletes allowed)
- All changes include user identification
- Timestamps are automatically generated
- Reasons are recorded for major status changes

### Access Control
- Users can only view history for their own bookings
- Admins have access to all status history
- Analytics require appropriate permissions

### Data Privacy
- Personal information is not stored in status history
- Only user IDs are referenced (join with users table when needed)
- Complies with audit requirements while protecting privacy

## Testing

### Unit Tests
```typescript
describe('BookingStatusHistoryService', () => {
  test('should record status change', async () => {
    const result = await BookingStatusHistoryService.recordStatusChange(
      'booking-id',
      'pending',
      'confirmed',
      'user-id',
      'Test reason'
    );
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Status History Integration', () => {
  test('should automatically track booking cancellation', async () => {
    await BookingsController.cancelBooking(req, res);
    const history = await BookingStatusHistoryService.getByBookingId(bookingId);
    expect(history.data).toContainEqual(
      expect.objectContaining({
        newStatus: 'cancelled'
      })
    );
  });
});
```

## Production Considerations

### Performance
- Status history queries are optimized with proper indexing
- Pagination prevents large data loads
- Caching not recommended for audit data integrity

### Monitoring
- Track status change frequency for anomaly detection
- Monitor failed status recordings
- Alert on unusual status transition patterns

### Backup & Recovery
- Status history is critical audit data
- Implement regular backups with point-in-time recovery
- Test restoration procedures regularly

## Migration Strategy

### For Existing Bookings
1. Run one-time migration to create initial status records
2. Backfill status history for recent bookings
3. Mark historical records as "migrated" for identification

### Deployment
1. Deploy database schema changes first
2. Deploy application code with feature flags
3. Enable status tracking gradually
4. Monitor for any performance impact

This implementation provides comprehensive audit trail functionality while maintaining performance and security standards.
